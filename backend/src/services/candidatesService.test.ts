import type { Request } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../middleware/requireRole.js", () => ({
  requireRole: vi.fn(),
}));

vi.mock("../repositories/candidatesRepository.js", () => ({
  findCandidates: vi.fn().mockResolvedValue([{ auth_sub: "c1" }, { auth_sub: "c2" }]),
  countCandidates: vi.fn().mockResolvedValue(2),
}));

const requireRoleModule = await import("../middleware/requireRole.js");
const candidatesRepo = await import("../repositories/candidatesRepository.js");
const { listCandidates } = await import("./candidatesService.js");

describe("candidatesService.listCandidates", () => {
  beforeEach(() => vi.clearAllMocks());

  it("requires the recruiter role before querying candidates", async () => {
    vi.mocked(requireRoleModule.requireRole).mockRejectedValue(
      Object.assign(new Error("Only recruiters can do this."), { status: 403 }),
    );

    await expect(listCandidates({ query: {} } as unknown as Request)).rejects.toMatchObject({ status: 403 });
    expect(candidatesRepo.findCandidates).not.toHaveBeenCalled();
  });

  it("returns a paginated result once authorized", async () => {
    vi.mocked(requireRoleModule.requireRole).mockResolvedValue({ sub: "recruiter-1", email: "r@b.com" });
    vi.mocked(candidatesRepo.findCandidates).mockResolvedValue([{ auth_sub: "c1" }, { auth_sub: "c2" }]);
    vi.mocked(candidatesRepo.countCandidates).mockResolvedValue(2);

    const result = await listCandidates({ query: {} } as unknown as Request);
    expect(result).toEqual({
      items: [{ auth_sub: "c1" }, { auth_sub: "c2" }],
      page: 1,
      pageSize: 20,
      total: 2,
      totalPages: 1,
    });
  });
});
