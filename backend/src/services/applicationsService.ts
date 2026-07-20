import type { Request } from "express";
import type { ApplicationStatus } from "../lib/applicationStatus.js";
import { badRequest, forbidden, notFound } from "../lib/httpError.js";
import { buildPaginated, parsePagination, type Paginated } from "../lib/pagination.js";
import { requireRole } from "../middleware/requireRole.js";
import * as applicationsRepo from "../repositories/applicationsRepository.js";
import { findResumeOwner } from "../repositories/resumesRepository.js";
import {
  jobApplicationSchema,
  listApplicationsQuerySchema,
  manualApplicationSchema,
  updateApplicationSchema,
} from "../schemas/applicationSchemas.js";

export async function list(req: Request): Promise<Paginated<unknown>> {
  const user = await requireRole(req, "candidate");
  const query = listApplicationsQuerySchema.parse(req.query);
  const { page, pageSize, limit, offset } = parsePagination(req.query);

  const filters = {
    candidateSub: user.sub,
    q: query.q,
    status: query.status || undefined,
    sort: query.sort,
  };

  const [items, total] = await Promise.all([
    applicationsRepo.findApplications(filters, limit, offset),
    applicationsRepo.countApplications(filters),
  ]);
  return buildPaginated(items, total, page, pageSize);
}

// Powers the nav bar's notification bell — one entry per application,
// "applied" or "status changed" depending on its current state (see
// findRecentActivity for why this isn't a full event history).
export async function notifications(req: Request): Promise<unknown[]> {
  const user = await requireRole(req, "candidate");
  const rows = await applicationsRepo.findRecentActivity(user.sub, 10);
  return rows.map((row) => ({
    applicationId: row.application_id,
    company: row.company,
    title: row.title,
    status: row.status,
    kind: row.status === "Applied" ? "applied" : "status_changed",
    occurredAt: row.status === "Applied" ? row.applied_on : row.updated_at,
  }));
}

export async function create(req: Request, rawInput: unknown): Promise<{ status: string; id?: number }> {
  const user = await requireRole(req, "candidate");
  const body = (rawInput ?? {}) as Record<string, unknown>;

  // Applying to a real posting on the platform.
  if (body.jobId !== undefined && body.jobId !== null) {
    const { jobId, resumeId } = jobApplicationSchema.parse(body);
    if (!(await applicationsRepo.jobExists(jobId))) {
      throw notFound("That job no longer exists.");
    }
    const owner = await findResumeOwner(resumeId);
    if (owner === undefined) throw notFound("That resume no longer exists.");
    if (owner !== user.sub) throw forbidden("That's not your resume.");
    const applied = await applicationsRepo.insertJobApplication(jobId, user.sub, resumeId);
    return { status: applied ? "applied" : "already_applied" };
  }

  // Manually logging an application made outside the platform.
  const input = manualApplicationSchema.parse(body);
  const id = await applicationsRepo.insertManualApplication(
    user.sub,
    input.company,
    input.position,
    (input.status as ApplicationStatus) ?? null,
    input.appliedOn ?? null,
  );
  return { status: "created", id };
}

async function requireOwnedApplication(id: number, candidateSub: string): Promise<number | null> {
  const jobId = await applicationsRepo.findOwnedApplicationJobId(id, candidateSub);
  if (jobId === undefined) throw notFound("Application not found.");
  return jobId;
}

function parseId(rawId: string): number {
  const id = Number(rawId);
  if (!Number.isInteger(id)) throw badRequest("Invalid id.");
  return id;
}

// Candidates can freely edit/re-status applications they're just logging
// for their own tracking (job_id NULL — applied somewhere off-platform, no
// recruiter involved at all). For a real posting on this platform (job_id
// set), the recruiter owns status changes (jobs service's updateApplicant)
// — the candidate's only action on those is to withdraw, not set an
// arbitrary status or edit the company/position/date, which come from the
// job itself anyway.
export async function update(req: Request, rawId: string, rawInput: unknown): Promise<{ status: string }> {
  const user = await requireRole(req, "candidate");
  const id = parseId(rawId);

  const jobId = await requireOwnedApplication(id, user.sub);
  if (jobId !== null) {
    throw forbidden(
      "This application is to a real posting — only the recruiter can change its status. You can withdraw it instead.",
    );
  }

  const input = updateApplicationSchema.parse(rawInput);
  await applicationsRepo.updateApplication(id, user.sub, {
    status: (input.status as ApplicationStatus) ?? null,
    company: input.company ?? null,
    position: input.position ?? null,
    appliedOn: input.appliedOn ?? null,
  });
  return { status: "updated" };
}

// The only status change a candidate can make on an application to a real
// posting — preserves the row (and any recruiter feedback already left on
// it) instead of deleting it, so the recruiter can still see the candidate
// withdrew rather than the application just vanishing.
export async function withdraw(req: Request, rawId: string): Promise<{ status: string }> {
  const user = await requireRole(req, "candidate");
  const id = parseId(rawId);

  const withdrew = await applicationsRepo.withdrawApplication(id, user.sub);
  if (!withdrew) throw notFound("Application not found.");
  return { status: "withdrawn" };
}

// Deleting is only for a candidate's own off-platform tracking entries
// (job_id NULL) — an application to a real posting can only be withdrawn
// (above), never deleted, so the recruiter's view of it is never silently
// pulled out from under them.
export async function remove(req: Request, rawId: string): Promise<{ status: string }> {
  const user = await requireRole(req, "candidate");
  const id = parseId(rawId);

  const jobId = await requireOwnedApplication(id, user.sub);
  if (jobId !== null) {
    throw forbidden("Applications to a real posting can only be withdrawn, not deleted.");
  }

  await applicationsRepo.deleteApplication(id, user.sub);
  return { status: "deleted" };
}
