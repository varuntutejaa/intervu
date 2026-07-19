import type { Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../middleware/auth.js", () => ({
  getAuthUser: vi.fn(),
  setAuthCookie: vi.fn(),
}));

vi.mock("../middleware/requireRole.js", () => ({
  requireRole: vi.fn(),
}));

vi.mock("../repositories/profileRepository.js", () => ({
  findProfile: vi.fn(),
  upsertProfile: vi.fn(),
  clearResume: vi.fn(),
  hasProfileForOtherRole: vi.fn().mockResolvedValue(false),
}));

const authModule = await import("../middleware/auth.js");
const requireRoleModule = await import("../middleware/requireRole.js");
const profileRepo = await import("../repositories/profileRepository.js");
const { getProfile, saveProfile, deleteResume } = await import("./profileService.js");

const fakeRes = {} as Response;
const authedUser = { sub: "user-1", email: "a@b.com", activeRole: "candidate" as const };

describe("profileService.getProfile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authModule.getAuthUser).mockReturnValue(authedUser);
  });

  it("401s when not authenticated", async () => {
    vi.mocked(authModule.getAuthUser).mockReturnValue(null);
    await expect(getProfile({ query: {} } as unknown as Request)).rejects.toMatchObject({ status: 401 });
  });

  it("defaults to the session's active role when ?role= isn't given", async () => {
    vi.mocked(profileRepo.findProfile).mockResolvedValue({ full_name: "Jane" });
    const result = await getProfile({ query: {} } as unknown as Request);
    expect(profileRepo.findProfile).toHaveBeenCalledWith("user-1", "candidate");
    expect(result).toEqual({ profile: { full_name: "Jane" } });
  });

  it("honors an explicit ?role= override", async () => {
    vi.mocked(profileRepo.findProfile).mockResolvedValue(null);
    await getProfile({ query: { role: "recruiter" } } as unknown as Request);
    expect(profileRepo.findProfile).toHaveBeenCalledWith("user-1", "recruiter");
  });

  it("returns { profile: null } without querying the DB for an invalid role", async () => {
    const result = await getProfile({ query: { role: "admin" } } as unknown as Request);
    expect(result).toEqual({ profile: null });
    expect(profileRepo.findProfile).not.toHaveBeenCalled();
  });
});

describe("profileService.saveProfile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authModule.getAuthUser).mockReturnValue(authedUser);
    vi.mocked(profileRepo.hasProfileForOtherRole).mockResolvedValue(false);
  });

  it("401s when not authenticated", async () => {
    vi.mocked(authModule.getAuthUser).mockReturnValue(null);
    await expect(saveProfile({} as Request, fakeRes, { role: "candidate" })).rejects.toMatchObject({
      status: 401,
    });
  });

  it("rejects an invalid role via schema validation", async () => {
    await expect(saveProfile({} as Request, fakeRes, { role: "admin" })).rejects.toThrow();
    expect(profileRepo.upsertProfile).not.toHaveBeenCalled();
  });

  it("saves and re-signs the cookie with the saved role as active", async () => {
    const result = await saveProfile({} as Request, fakeRes, { role: "recruiter", fields: {} });
    expect(result).toEqual({ status: "saved" });
    expect(profileRepo.upsertProfile).toHaveBeenCalledWith("user-1", "a@b.com", expect.objectContaining({ role: "recruiter" }));
    expect(authModule.setAuthCookie).toHaveBeenCalledWith(fakeRes, expect.objectContaining({ activeRole: "recruiter" }));
  });

  it("rejects when this email already has a profile under the other role", async () => {
    vi.mocked(profileRepo.hasProfileForOtherRole).mockResolvedValue(true);
    await expect(saveProfile({} as Request, fakeRes, { role: "recruiter", fields: {} })).rejects.toMatchObject({
      status: 400,
    });
    expect(profileRepo.upsertProfile).not.toHaveBeenCalled();
  });

  it("still allows editing a role the account already has, even if the other role also exists", async () => {
    vi.mocked(profileRepo.findProfile).mockResolvedValue({ full_name: "Jane" });
    vi.mocked(profileRepo.hasProfileForOtherRole).mockResolvedValue(true);
    const result = await saveProfile({} as Request, fakeRes, { role: "recruiter", fields: {} });
    expect(result).toEqual({ status: "saved" });
    expect(profileRepo.upsertProfile).toHaveBeenCalled();
  });
});

describe("profileService.deleteResume", () => {
  it("requires the candidate role and clears via the authenticated sub", async () => {
    vi.mocked(requireRoleModule.requireRole).mockResolvedValue({ sub: "user-1", email: "a@b.com" });
    const result = await deleteResume({} as Request);
    expect(result).toEqual({ status: "deleted" });
    expect(profileRepo.clearResume).toHaveBeenCalledWith("user-1");
  });
});
