import jwt from "jsonwebtoken";

// Decodes a JWT payload without verifying its signature. Only safe when the
// token was received directly from the issuer's token endpoint over a
// server-to-server HTTPS call (Cognito, Google) — never do this with a
// token handed to you by an untrusted client.
export function decodeJwtPayload<T = Record<string, unknown>>(token: string): T {
  const payload = token.split(".")[1];
  const json = Buffer.from(payload, "base64url").toString("utf8");
  return JSON.parse(json);
}

// This app's own auth token — signed by us and carried in an httpOnly
// cookie, so it gets the XSS protection of a session cookie while still
// being a real, stateless JWT (no server-side session store, which also
// means logins survive a backend restart).
export type AppTokenPayload = {
  sub: string;
  email: string;
  name?: string;
  // Which of the account's profiles (candidate and/or recruiter) is
  // currently "in view" — a display preference, not itself an authorization
  // check (see requireRole, which checks the profiles table directly).
  activeRole?: "candidate" | "recruiter";
};

const JWT_SECRET = process.env.JWT_SECRET ?? "dev-only-secret-change-me";
const JWT_EXPIRES_IN = "7d";

export function signAppToken(payload: AppTokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyAppToken(token: string): AppTokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AppTokenPayload & jwt.JwtPayload;
  } catch {
    return null;
  }
}
