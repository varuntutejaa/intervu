import type { Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../lib/cognito.js", () => ({
  cognitoClient: { send: vi.fn() },
  COGNITO_CLIENT_ID: "test-client-id",
  secretHash: vi.fn().mockReturnValue("hash"),
  usernameFromEmail: (email: string) => email.toLowerCase().replace("@", "_at_"),
}));

vi.mock("../lib/profiles.js", () => ({
  resolveActiveRole: vi.fn().mockResolvedValue(null),
  getRolesForSub: vi.fn().mockResolvedValue([]),
}));

vi.mock("../middleware/auth.js", () => ({
  setAuthCookie: vi.fn(),
  clearAuthCookie: vi.fn(),
  getAuthUser: vi.fn(),
}));

const { cognitoClient } = await import("../lib/cognito.js");
const authModule = await import("../middleware/auth.js");
const { signup, login, me, switchRole } = await import("./authService.js");

const fakeRes = {} as Response;

describe("authService — Cognito error mapping (via signup)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("maps UsernameExistsException to a friendly, specific message", async () => {
    const err = new Error("dup");
    err.name = "UsernameExistsException";
    vi.mocked(cognitoClient.send).mockRejectedValue(err);

    await expect(signup({ email: "a@b.com", password: "pw" })).rejects.toMatchObject({
      status: 400,
      message: "An account with this email already exists.",
    });
  });

  it("maps an unrecognized Cognito exception to a generic message (never leaks the raw error)", async () => {
    const err = new Error("some internal AWS detail");
    err.name = "SomeWeirdInternalException";
    vi.mocked(cognitoClient.send).mockRejectedValue(err);

    await expect(signup({ email: "a@b.com", password: "pw" })).rejects.toMatchObject({
      status: 400,
      message: "Something went wrong. Please try again.",
    });
  });

  it("succeeds and returns confirmation_required on a clean signup", async () => {
    vi.mocked(cognitoClient.send).mockResolvedValue({} as never);
    await expect(signup({ email: "a@b.com", password: "pw" })).resolves.toEqual({
      status: "confirmation_required",
    });
  });
});

describe("authService — login", () => {
  beforeEach(() => vi.clearAllMocks());

  it("maps NotAuthorizedException to 401 with a friendly message", async () => {
    const err = new Error("bad creds");
    err.name = "NotAuthorizedException";
    vi.mocked(cognitoClient.send).mockRejectedValue(err);

    await expect(login(fakeRes, { email: "a@b.com", password: "wrong" })).rejects.toMatchObject({
      status: 401,
      message: "Incorrect email or password.",
    });
  });

  it("trusts the role picked on the login screen as the active role", async () => {
    const idToken = Buffer.from(JSON.stringify({ sub: "user-1", email: "a@b.com" })).toString("base64url");
    vi.mocked(cognitoClient.send).mockResolvedValue({
      AuthenticationResult: { IdToken: `header.${idToken}.sig` },
    } as never);

    const result = await login(fakeRes, { email: "a@b.com", password: "pw", role: "recruiter" });
    expect(result).toEqual({ user: { sub: "user-1", email: "a@b.com", name: undefined } });
    expect(authModule.setAuthCookie).toHaveBeenCalledWith(
      fakeRes,
      expect.objectContaining({ sub: "user-1", activeRole: "recruiter" }),
    );
  });
});

describe("authService — me / switchRole require authentication", () => {
  beforeEach(() => vi.clearAllMocks());

  it("me() 401s when there's no session", async () => {
    vi.mocked(authModule.getAuthUser).mockReturnValue(null);
    await expect(me({} as Request)).rejects.toMatchObject({ status: 401 });
  });

  it("switchRole() 401s when there's no session", () => {
    vi.mocked(authModule.getAuthUser).mockReturnValue(null);
    expect(() => switchRole({} as Request, fakeRes, { role: "candidate" })).toThrow(
      expect.objectContaining({ status: 401 }),
    );
  });
});
