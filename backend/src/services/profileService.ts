import type { Request, Response } from "express";
import { badRequest, unauthorized } from "../lib/httpError.js";
import type { AppTokenPayload } from "../lib/jwt.js";
import { getAuthUser, setAuthCookie } from "../middleware/auth.js";
import { requireRole } from "../middleware/requireRole.js";
import { clearResume, findProfile, hasProfileForOtherRole, upsertProfile } from "../repositories/profileRepository.js";
import { saveProfileSchema, type SaveProfileInput } from "../schemas/profileSchemas.js";

function requireAuth(req: Request): AppTokenPayload {
  const authUser = getAuthUser(req);
  if (!authUser) throw unauthorized();
  return authUser;
}

export async function getProfile(req: Request): Promise<{ profile: unknown }> {
  const authUser = requireAuth(req);

  // One account can hold both a candidate and a recruiter profile — which
  // one this fetches defaults to whichever is active right now, but callers
  // (e.g. viewing the "other" role's data) can ask directly.
  const role = typeof req.query.role === "string" ? req.query.role : authUser.activeRole;
  if (role !== "candidate" && role !== "recruiter") {
    return { profile: null };
  }

  const profile = await findProfile(authUser.sub, role);
  return { profile };
}

export async function saveProfile(req: Request, res: Response, rawInput: unknown): Promise<{ status: string }> {
  const authUser = requireAuth(req);
  const input: SaveProfileInput = saveProfileSchema.parse(rawInput);

  // Only blocks creating a *new* role for this email — editing a role the
  // account already has must never be blocked just because the other role
  // also happens to exist (matters for any account that already held both
  // before this rule existed).
  const alreadyHasThisRole = await findProfile(authUser.sub, input.role);
  if (!alreadyHasThisRole && (await hasProfileForOtherRole(authUser.email, input.role))) {
    const otherRole = input.role === "candidate" ? "recruiter" : "candidate";
    throw badRequest(`This email is already registered as a ${otherRole}. An account can only be one or the other.`);
  }

  await upsertProfile(authUser.sub, authUser.email, input);

  // Saving/updating a profile makes it the one "in view" going forward.
  setAuthCookie(res, { ...authUser, activeRole: input.role });
  return { status: "saved" };
}

export async function deleteResume(req: Request): Promise<{ status: string }> {
  const user = await requireRole(req, "candidate");
  await clearResume(user.sub);
  return { status: "deleted" };
}
