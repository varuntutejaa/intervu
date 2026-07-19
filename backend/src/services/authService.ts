import {
  ConfirmSignUpCommand,
  InitiateAuthCommand,
  ResendConfirmationCodeCommand,
  SignUpCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import type { Request, Response } from "express";
import { COGNITO_CLIENT_ID, cognitoClient, secretHash, usernameFromEmail } from "../lib/cognito.js";
import { HttpError, unauthorized } from "../lib/httpError.js";
import { decodeJwtPayload } from "../lib/jwt.js";
import { logger } from "../lib/logger.js";
import { getRolesForSub, resolveActiveRole } from "../lib/profiles.js";
import { clearAuthCookie, getAuthUser, setAuthCookie } from "../middleware/auth.js";
import { confirmSchema, loginSchema, resendCodeSchema, signupSchema, switchRoleSchema } from "../schemas/authSchemas.js";

function cognitoErrorMessage(err: unknown): string {
  const name = err instanceof Error ? err.name : "";
  switch (name) {
    case "UsernameExistsException":
      return "An account with this email already exists.";
    case "NotAuthorizedException":
      return "Incorrect email or password.";
    case "UserNotConfirmedException":
      return "Please verify your email before logging in.";
    case "UserNotFoundException":
      return "Incorrect email or password.";
    case "CodeMismatchException":
      return "That code doesn't match. Try again.";
    case "ExpiredCodeException":
      return "That code has expired. Request a new one.";
    case "InvalidPasswordException":
      return "Password doesn't meet the requirements.";
    case "LimitExceededException":
      return "Too many attempts. Try again later.";
    default:
      logger.error({ err }, "Unexpected Cognito error");
      return "Something went wrong. Please try again.";
  }
}

// Every Cognito call site wraps its request the same way: translate a
// thrown SDK exception into a friendly HttpError instead of the generic
// 500 the global error handler would otherwise produce.
async function callCognito<T>(status: number, fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    throw new HttpError(status, cognitoErrorMessage(err));
  }
}

export async function signup(rawInput: unknown): Promise<{ status: string }> {
  const { email, password, name } = signupSchema.parse(rawInput);
  const username = usernameFromEmail(email);

  await callCognito(400, () =>
    cognitoClient.send(
      new SignUpCommand({
        ClientId: COGNITO_CLIENT_ID,
        Username: username,
        Password: password,
        SecretHash: secretHash(username),
        UserAttributes: [{ Name: "email", Value: email }, ...(name ? [{ Name: "name", Value: name }] : [])],
      }),
    ),
  );
  return { status: "confirmation_required" };
}

export async function confirm(rawInput: unknown): Promise<{ status: string }> {
  const { email, code } = confirmSchema.parse(rawInput);
  const username = usernameFromEmail(email);

  await callCognito(400, () =>
    cognitoClient.send(
      new ConfirmSignUpCommand({
        ClientId: COGNITO_CLIENT_ID,
        Username: username,
        ConfirmationCode: code,
        SecretHash: secretHash(username),
      }),
    ),
  );
  return { status: "confirmed" };
}

export async function resendCode(rawInput: unknown): Promise<{ status: string }> {
  const { email } = resendCodeSchema.parse(rawInput);
  const username = usernameFromEmail(email);

  await callCognito(400, () =>
    cognitoClient.send(
      new ResendConfirmationCodeCommand({
        ClientId: COGNITO_CLIENT_ID,
        Username: username,
        SecretHash: secretHash(username),
      }),
    ),
  );
  return { status: "sent" };
}

export async function login(res: Response, rawInput: unknown): Promise<{ user: unknown }> {
  const { email, password, role } = loginSchema.parse(rawInput);

  const result = await callCognito(401, () =>
    cognitoClient.send(
      new InitiateAuthCommand({
        AuthFlow: "USER_PASSWORD_AUTH",
        ClientId: COGNITO_CLIENT_ID,
        AuthParameters: { USERNAME: email, PASSWORD: password, SECRET_HASH: secretHash(email) },
      }),
    ),
  );

  if (result.ChallengeName) {
    throw new HttpError(400, `Unsupported auth challenge: ${result.ChallengeName}`);
  }
  const idToken = result.AuthenticationResult?.IdToken;
  if (!idToken) throw new HttpError(500, "No tokens returned from Cognito.");

  const claims = decodeJwtPayload<{ sub: string; email: string; name?: string }>(idToken);
  const user = { sub: claims.sub, email: claims.email, name: claims.name };

  // The role picked on the login screen isn't just display copy — trust it
  // as the active role even if this account has no profile for it yet
  // (authentication already proved who they are); the frontend sends them
  // to profile setup instead of home in that case, same as switch-role
  // does. Falls back to whichever profile exists if no role was picked.
  const activeRole = role ?? ((await resolveActiveRole(claims.sub)) ?? undefined);

  setAuthCookie(res, { ...user, activeRole });
  return { user };
}

export function logout(res: Response): { status: string } {
  clearAuthCookie(res);
  return { status: "ok" };
}

export async function me(req: Request): Promise<{ user: unknown; role: string | null; roles: string[] }> {
  const authUser = getAuthUser(req);
  if (!authUser) throw unauthorized();

  const roles = await getRolesForSub(authUser.sub);
  return {
    user: { sub: authUser.sub, email: authUser.email, name: authUser.name },
    role: authUser.activeRole ?? null,
    roles,
  };
}

// Flips which profile (candidate or recruiter) is "in view" for this
// account — doesn't require the target role to already have a saved
// profile, since switching to a role you haven't set up yet is exactly how
// an existing account adds the other one (the frontend sends them to
// profile setup when `roles` doesn't include the target). Since the active
// role lives inside the JWT itself, changing it means re-signing and
// re-setting the cookie rather than mutating server-side state.
export function switchRole(req: Request, res: Response, rawInput: unknown): { role: string } {
  const authUser = getAuthUser(req);
  if (!authUser) throw unauthorized();

  const { role } = switchRoleSchema.parse(rawInput);
  setAuthCookie(res, { ...authUser, activeRole: role });
  return { role };
}
