import type { Request } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockUser = { sub: "candidate-1", email: "candidate@example.com" };

vi.mock("../middleware/requireRole.js", () => ({
  requireRole: vi.fn().mockResolvedValue(mockUser),
}));

vi.mock("../repositories/applicationsRepository.js", () => ({
  findOwnedApplicationJobId: vi.fn(),
  withdrawApplication: vi.fn(),
  deleteApplication: vi.fn(),
  updateApplication: vi.fn(),
  findApplications: vi.fn(),
  countApplications: vi.fn(),
  jobExists: vi.fn(),
  insertJobApplication: vi.fn(),
  insertManualApplication: vi.fn(),
}));

vi.mock("../repositories/resumesRepository.js", () => ({
  findResumeOwner: vi.fn(),
}));

const applicationsRepo = await import("../repositories/applicationsRepository.js");
const resumesRepo = await import("../repositories/resumesRepository.js");
const { update, withdraw, remove, create } = await import("./applicationsService.js");

const fakeReq = {} as Request;

describe("applicationsService — candidate self-service restrictions on real postings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("update() rejects a candidate trying to change status on a real posting (job_id set)", async () => {
    vi.mocked(applicationsRepo.findOwnedApplicationJobId).mockResolvedValue(42); // job_id = 42

    await expect(update(fakeReq, "1", { status: "Rejected" })).rejects.toMatchObject({
      status: 403,
    });
    expect(applicationsRepo.updateApplication).not.toHaveBeenCalled();
  });

  it("update() allows a candidate to edit their own manually-logged application (job_id null)", async () => {
    vi.mocked(applicationsRepo.findOwnedApplicationJobId).mockResolvedValue(null);

    const result = await update(fakeReq, "1", { status: "Interview Scheduled" });
    expect(result).toEqual({ status: "updated" });
    expect(applicationsRepo.updateApplication).toHaveBeenCalledWith(
      1,
      mockUser.sub,
      expect.objectContaining({ status: "Interview Scheduled" }),
    );
  });

  it("update() 404s when the application doesn't belong to this candidate", async () => {
    vi.mocked(applicationsRepo.findOwnedApplicationJobId).mockResolvedValue(undefined);

    await expect(update(fakeReq, "1", { status: "Rejected" })).rejects.toMatchObject({ status: 404 });
  });

  it("remove() rejects deleting an application to a real posting", async () => {
    vi.mocked(applicationsRepo.findOwnedApplicationJobId).mockResolvedValue(42);

    await expect(remove(fakeReq, "1")).rejects.toMatchObject({ status: 403 });
    expect(applicationsRepo.deleteApplication).not.toHaveBeenCalled();
  });

  it("remove() allows deleting a manually-logged application", async () => {
    vi.mocked(applicationsRepo.findOwnedApplicationJobId).mockResolvedValue(null);

    const result = await remove(fakeReq, "1");
    expect(result).toEqual({ status: "deleted" });
    expect(applicationsRepo.deleteApplication).toHaveBeenCalledWith(1, mockUser.sub);
  });

  it("withdraw() sets status to Withdrawn regardless of job_id", async () => {
    vi.mocked(applicationsRepo.withdrawApplication).mockResolvedValue(true);

    const result = await withdraw(fakeReq, "1");
    expect(result).toEqual({ status: "withdrawn" });
    expect(applicationsRepo.withdrawApplication).toHaveBeenCalledWith(1, mockUser.sub);
  });

  it("withdraw() 404s when the application doesn't exist for this candidate", async () => {
    vi.mocked(applicationsRepo.withdrawApplication).mockResolvedValue(false);

    await expect(withdraw(fakeReq, "1")).rejects.toMatchObject({ status: 404 });
  });
});

describe("applicationsService.create — resume ownership on apply", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(applicationsRepo.jobExists).mockResolvedValue(true);
    vi.mocked(applicationsRepo.insertJobApplication).mockResolvedValue(true);
  });

  it("applies with no resumeId when none is given", async () => {
    const result = await create(fakeReq, { jobId: 5 });
    expect(result).toEqual({ status: "applied" });
    expect(resumesRepo.findResumeOwner).not.toHaveBeenCalled();
    expect(applicationsRepo.insertJobApplication).toHaveBeenCalledWith(5, mockUser.sub, null);
  });

  it("attaches a resumeId that belongs to this candidate", async () => {
    vi.mocked(resumesRepo.findResumeOwner).mockResolvedValue(mockUser.sub);
    const result = await create(fakeReq, { jobId: 5, resumeId: 9 });
    expect(result).toEqual({ status: "applied" });
    expect(applicationsRepo.insertJobApplication).toHaveBeenCalledWith(5, mockUser.sub, 9);
  });

  it("rejects a resumeId that belongs to someone else", async () => {
    vi.mocked(resumesRepo.findResumeOwner).mockResolvedValue("someone-else");
    await expect(create(fakeReq, { jobId: 5, resumeId: 9 })).rejects.toMatchObject({ status: 403 });
    expect(applicationsRepo.insertJobApplication).not.toHaveBeenCalled();
  });

  it("404s a resumeId that doesn't exist", async () => {
    vi.mocked(resumesRepo.findResumeOwner).mockResolvedValue(undefined);
    await expect(create(fakeReq, { jobId: 5, resumeId: 9 })).rejects.toMatchObject({ status: 404 });
  });
});
