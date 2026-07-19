import type { Request } from "express";
import { APPLICATION_STATUSES } from "../lib/applicationStatus.js";
import { badRequest, forbidden, notFound } from "../lib/httpError.js";
import { buildPaginated, parsePagination, type Paginated } from "../lib/pagination.js";
import { requireRole } from "../middleware/requireRole.js";
import * as jobsRepo from "../repositories/jobsRepository.js";
import { createJobSchema, listJobsQuerySchema, updateApplicantSchema, updateJobSchema } from "../schemas/jobSchemas.js";

// Random 6-digit reference code for a new posting, retried on the rare
// collision instead of relying on a DB-level unique constraint.
async function generateJobCode(): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = String(Math.floor(100000 + Math.random() * 900000));
    if (!(await jobsRepo.jobCodeExists(code))) return code;
  }
  throw new Error("Couldn't generate a unique job code.");
}

function parseId(rawId: string, label = "job id"): number {
  const id = Number(rawId);
  if (!Number.isInteger(id)) throw badRequest(`Invalid ${label}.`);
  return id;
}

// Search + filters all happen server-side rather than over an
// already-fetched list, so this stays correct as the number of postings
// grows instead of only ever searching whatever page happened to load.
export async function list(req: Request): Promise<Paginated<unknown>> {
  const query = listJobsQuerySchema.parse(req.query);
  const { page, pageSize, limit, offset } = parsePagination(req.query);

  const filters = {
    q: query.q,
    jobType: query.jobType || undefined,
    workMode: query.workMode || undefined,
    experience: query.experience || undefined,
    location: query.location,
    minSalary: query.minSalary,
    maxSalary: query.maxSalary,
  };

  const [items, total] = await Promise.all([
    jobsRepo.findJobs(filters, limit, offset),
    jobsRepo.countJobs(filters),
  ]);
  return buildPaginated(items, total, page, pageSize);
}

export async function trendingCompanies(req: Request): Promise<unknown[]> {
  const rawLimit = Number(req.query.limit);
  const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(12, Math.floor(rawLimit)) : 4;
  return jobsRepo.findTrendingCompanies(limit);
}

export async function listMine(req: Request): Promise<Paginated<unknown>> {
  const user = await requireRole(req, "recruiter");
  const { page, pageSize, limit, offset } = parsePagination(req.query);
  const q = typeof req.query.q === "string" ? req.query.q.trim() || undefined : undefined;

  const [items, total] = await Promise.all([
    jobsRepo.findJobsByRecruiter(user.sub, q, limit, offset),
    jobsRepo.countJobsByRecruiter(user.sub, q),
  ]);
  return buildPaginated(items, total, page, pageSize);
}

export async function getById(rawId: string) {
  const id = parseId(rawId);
  const job = await jobsRepo.findJobById(id);
  if (!job) throw notFound("Job not found.");
  return job;
}

async function requireOwnedJob(rawId: string, sub: string): Promise<number> {
  const id = parseId(rawId);
  const postedBy = await jobsRepo.findJobOwner(id);
  if (postedBy === undefined) throw notFound("Job not found.");
  if (postedBy !== sub) throw forbidden("You didn't post this job.");
  return id;
}

export async function create(req: Request, rawInput: unknown) {
  const user = await requireRole(req, "recruiter");
  const input = createJobSchema.parse(rawInput);
  const jobCode = await generateJobCode();
  return jobsRepo.insertJob(input, jobCode, user.sub);
}

// Edits a recruiter's own job posting — any subset of fields, including
// `status` ('open'/'closed'), which is how a posting gets closed or
// reopened. COALESCE means omitted fields are left untouched rather than
// wiped, so this doubles as the "close job" action (just { status:
// "closed" }) without needing a separate endpoint.
export async function update(req: Request, rawId: string, rawInput: unknown) {
  const user = await requireRole(req, "recruiter");
  const id = await requireOwnedJob(rawId, user.sub);
  const input = updateJobSchema.parse(rawInput);
  return jobsRepo.updateJob(id, input, input.status ?? null);
}

export async function listApplicants(req: Request, rawId: string): Promise<Paginated<unknown>> {
  const user = await requireRole(req, "recruiter");
  const id = await requireOwnedJob(rawId, user.sub);
  const q = typeof req.query.q === "string" ? req.query.q.trim() || undefined : undefined;
  const { page, pageSize, limit, offset } = parsePagination(req.query);

  const [items, total] = await Promise.all([
    jobsRepo.findApplicantsForJob(id, q, limit, offset),
    jobsRepo.countApplicantsForJob(id, q),
  ]);
  return buildPaginated(items, total, page, pageSize);
}

export async function getApplicant(req: Request, rawJobId: string, rawApplicationId: string) {
  const user = await requireRole(req, "recruiter");
  const jobId = await requireOwnedJob(rawJobId, user.sub);
  const applicationId = parseId(rawApplicationId, "application id");
  const applicant = await jobsRepo.findApplicantDetail(jobId, applicationId);
  if (!applicant) throw notFound("Application not found.");
  return applicant;
}

// Lets a recruiter set status and leave structured post-interview feedback
// on an application to one of their own jobs — scoped to jobId so the
// ownership check is reused, rather than trusting applicationId alone.
// Candidates can only ever see feedback tied to their own applications
// (applicationsService's list already filters by candidate_sub).
export async function updateApplicant(req: Request, rawJobId: string, rawApplicationId: string, rawInput: unknown) {
  const user = await requireRole(req, "recruiter");
  const jobId = await requireOwnedJob(rawJobId, user.sub);
  const applicationId = parseId(rawApplicationId, "application id");

  const input = updateApplicantSchema.parse(rawInput);
  const fb = input.feedback ?? {};

  const result = await jobsRepo.updateApplicant(jobId, applicationId, {
    status: input.status ?? null,
    technicalRating: fb.technicalRating ?? null,
    communicationRating: fb.communicationRating ?? null,
    overallRating: fb.overallRating ?? null,
    strengths: fb.strengths ?? null,
    weaknesses: fb.weaknesses ?? null,
    recommendation: fb.recommendation ?? null,
  });
  if (!result) throw notFound("Application not found for this job.");
  return result;
}

// Recruiter's own applicant-pipeline totals: overall counts by status, plus
// a per-job breakdown, across every job they've posted (open or closed).
export async function stats(req: Request) {
  const user = await requireRole(req, "recruiter");

  const [jobs, perStatusRows] = await Promise.all([
    jobsRepo.findRecruiterJobsForStats(user.sub),
    jobsRepo.findApplicationCountsByJob(user.sub),
  ]);

  const byStatus: Record<string, number> = Object.fromEntries(APPLICATION_STATUSES.map((s) => [s, 0]));
  const perJobCounts = new Map<number, { total: number; byStatus: Record<string, number> }>();
  for (const job of jobs) {
    perJobCounts.set(job.id, { total: 0, byStatus: Object.fromEntries(APPLICATION_STATUSES.map((s) => [s, 0])) });
  }
  for (const row of perStatusRows) {
    byStatus[row.status] = (byStatus[row.status] ?? 0) + row.count;
    const entry = perJobCounts.get(row.job_id);
    if (entry) {
      entry.total += row.count;
      entry.byStatus[row.status] = row.count;
    }
  }

  const totalApplicants = Object.values(byStatus).reduce((sum, n) => sum + n, 0);

  // Platform-wide figures (not scoped to this recruiter's own postings) —
  // "Total candidates" only makes sense across the whole platform, so the
  // rest of this dashboard's aggregate numbers follow the same scope.
  // Of applications that at least reached "Interview Scheduled", what share
  // moved past just being scheduled (rounds actually happened, whichever
  // way they ended)? Applications still sitting at "Applied" haven't
  // started the interview process yet, so they're excluded from both sides
  // of this ratio.
  const interviewStages = ["Interview Scheduled", "Technical Round", "HR Round", "Offer Received", "Rejected"];
  const completedStages = ["Technical Round", "HR Round", "Offer Received", "Rejected"];

  const [totalCandidates, totalResumesUploaded, topCompanies, totalInterviewed, totalCompleted] = await Promise.all([
    jobsRepo.countCandidateProfiles(),
    jobsRepo.countUploadedResumes(),
    jobsRepo.findTopCompanies(),
    jobsRepo.countApplicationsByStatuses(interviewStages),
    jobsRepo.countApplicationsByStatuses(completedStages),
  ]);
  const interviewCompletionRate = totalInterviewed > 0 ? Math.round((totalCompleted / totalInterviewed) * 100) : 0;

  return {
    totalJobs: jobs.length,
    openJobs: jobs.filter((j) => j.status === "open").length,
    totalApplicants,
    byStatus,
    jobs: jobs.map((job) => ({
      id: job.id,
      title: job.title,
      status: job.status,
      ...perJobCounts.get(job.id),
    })),
    totalCandidates,
    totalResumesUploaded,
    topCompanies,
    interviewCompletionRate,
  };
}
