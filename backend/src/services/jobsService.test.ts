import type { Request } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockUser = { sub: "recruiter-1", email: "recruiter@example.com" };

vi.mock("../middleware/requireRole.js", () => ({
  requireRole: vi.fn().mockResolvedValue(mockUser),
}));

vi.mock("../repositories/jobsRepository.js", () => ({
  findJobs: vi.fn(),
  countJobs: vi.fn(),
  findJobsByRecruiter: vi.fn(),
  countJobsByRecruiter: vi.fn(),
  findJobById: vi.fn(),
  findJobOwner: vi.fn(),
  jobCodeExists: vi.fn().mockResolvedValue(false),
  insertJob: vi.fn(),
  updateJob: vi.fn(),
  findApplicantsForJob: vi.fn(),
  updateApplicant: vi.fn(),
  findRecruiterJobsForStats: vi.fn(),
  findApplicationCountsByJob: vi.fn(),
  countCandidateProfiles: vi.fn().mockResolvedValue(0),
  countUploadedResumes: vi.fn().mockResolvedValue(0),
  findTopCompanies: vi.fn().mockResolvedValue([]),
  countApplicationsByStatuses: vi.fn().mockResolvedValue(0),
}));

const jobsRepo = await import("../repositories/jobsRepository.js");
const { update, listApplicants, updateApplicant, getById, stats } = await import("./jobsService.js");

const fakeReq = {} as Request;

describe("jobsService — ownership checks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(jobsRepo.jobCodeExists).mockResolvedValue(false);
  });

  it("update() 403s a recruiter editing someone else's job", async () => {
    vi.mocked(jobsRepo.findJobOwner).mockResolvedValue("someone-else");

    await expect(update(fakeReq, "1", { title: "New title" })).rejects.toMatchObject({ status: 403 });
    expect(jobsRepo.updateJob).not.toHaveBeenCalled();
  });

  it("update() 404s a nonexistent job", async () => {
    vi.mocked(jobsRepo.findJobOwner).mockResolvedValue(undefined);

    await expect(update(fakeReq, "1", { title: "New title" })).rejects.toMatchObject({ status: 404 });
  });

  it("update() succeeds for the job's own recruiter", async () => {
    vi.mocked(jobsRepo.findJobOwner).mockResolvedValue(mockUser.sub);
    vi.mocked(jobsRepo.updateJob).mockResolvedValue({ id: 1, title: "New title" });

    const result = await update(fakeReq, "1", { title: "New title" });
    expect(result).toEqual({ id: 1, title: "New title" });
    expect(jobsRepo.updateJob).toHaveBeenCalledWith(1, expect.objectContaining({ title: "New title" }), null);
  });

  it("listApplicants() 403s for a non-owner", async () => {
    vi.mocked(jobsRepo.findJobOwner).mockResolvedValue("someone-else");

    await expect(listApplicants(fakeReq, "1")).rejects.toMatchObject({ status: 403 });
    expect(jobsRepo.findApplicantsForJob).not.toHaveBeenCalled();
  });

  it("updateApplicant() 403s for a non-owner before ever touching the application row", async () => {
    vi.mocked(jobsRepo.findJobOwner).mockResolvedValue("someone-else");

    await expect(updateApplicant(fakeReq, "1", "5", { status: "Rejected" })).rejects.toMatchObject({ status: 403 });
    expect(jobsRepo.updateApplicant).not.toHaveBeenCalled();
  });

  it("updateApplicant() 404s when the application doesn't belong to this job", async () => {
    vi.mocked(jobsRepo.findJobOwner).mockResolvedValue(mockUser.sub);
    vi.mocked(jobsRepo.updateApplicant).mockResolvedValue(null);

    await expect(updateApplicant(fakeReq, "1", "5", { status: "Rejected" })).rejects.toMatchObject({ status: 404 });
  });

  it("getById() 404s a nonexistent job (public, no auth required)", async () => {
    vi.mocked(jobsRepo.findJobById).mockResolvedValue(null);

    await expect(getById("999")).rejects.toMatchObject({ status: 404 });
  });

  it("rejects a non-integer id before ever querying the repository", async () => {
    await expect(update(fakeReq, "abc", {})).rejects.toMatchObject({ status: 400 });
    expect(jobsRepo.findJobOwner).not.toHaveBeenCalled();
  });
});

describe("jobsService — stats aggregation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("computes interviewCompletionRate as completed/interviewed, rounded", async () => {
    vi.mocked(jobsRepo.findRecruiterJobsForStats).mockResolvedValue([]);
    vi.mocked(jobsRepo.findApplicationCountsByJob).mockResolvedValue([]);
    vi.mocked(jobsRepo.countApplicationsByStatuses)
      .mockResolvedValueOnce(3) // interviewed
      .mockResolvedValueOnce(2); // completed

    const result = await stats(fakeReq);
    expect(result.interviewCompletionRate).toBe(67); // 2/3 -> 66.67 -> rounds to 67
  });

  it("returns 0% completion rate when nobody has been interviewed yet (avoids divide-by-zero)", async () => {
    vi.mocked(jobsRepo.findRecruiterJobsForStats).mockResolvedValue([]);
    vi.mocked(jobsRepo.findApplicationCountsByJob).mockResolvedValue([]);
    vi.mocked(jobsRepo.countApplicationsByStatuses).mockResolvedValue(0);

    const result = await stats(fakeReq);
    expect(result.interviewCompletionRate).toBe(0);
  });

  it("attributes per-status counts to the right job and rolls them into totals", async () => {
    vi.mocked(jobsRepo.findRecruiterJobsForStats).mockResolvedValue([
      { id: 1, title: "Backend Engineer", status: "open" },
      { id: 2, title: "Frontend Engineer", status: "closed" },
    ]);
    vi.mocked(jobsRepo.findApplicationCountsByJob).mockResolvedValue([
      { job_id: 1, status: "Applied", count: 3 },
      { job_id: 1, status: "Offer Received", count: 1 },
      { job_id: 2, status: "Rejected", count: 2 },
    ]);
    vi.mocked(jobsRepo.countApplicationsByStatuses).mockResolvedValue(0);

    const result = await stats(fakeReq);
    expect(result.totalApplicants).toBe(6);
    expect(result.byStatus["Applied"]).toBe(3);
    expect(result.byStatus["Offer Received"]).toBe(1);
    expect(result.openJobs).toBe(1);
    expect(result.totalJobs).toBe(2);

    const job1 = result.jobs.find((j) => j.id === 1);
    expect(job1?.total).toBe(4);
    expect(job1?.byStatus?.["Applied"]).toBe(3);
  });
});
