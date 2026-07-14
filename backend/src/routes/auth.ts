import { Router } from "express";
import {
  ConfirmSignUpCommand,
  InitiateAuthCommand,
  ResendConfirmationCodeCommand,
  SignUpCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { clearAuthCookie, getAuthUser, setAuthCookie } from "../middleware/auth.js";
import { COGNITO_CLIENT_ID, cognitoClient, secretHash, usernameFromEmail } from "../lib/cognito.js";
import { decodeJwtPayload } from "../lib/jwt.js";
import { getRolesForSub, resolveActiveRole } from "../lib/profiles.js";

export const authRouter = Router();

authRouter.post(
  "/signup",
  asyncHandler(async (req, res) => {
    const { email, password, name } = req.body ?? {};
    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required." });
      return;
    }

    const username = usernameFromEmail(email);

    try {
      await cognitoClient.send(
        new SignUpCommand({
          ClientId: COGNITO_CLIENT_ID,
          Username: username,
          Password: password,
          SecretHash: secretHash(username),
          UserAttributes: [
            { Name: "email", Value: email },
            ...(name ? [{ Name: "name", Value: name }] : []),
          ],
        }),
      );
      res.json({ status: "confirmation_required" });
    } catch (err) {
      res.status(400).json({ error: cognitoErrorMessage(err) });
    }
  }),
);

authRouter.post(
  "/confirm",
  asyncHandler(async (req, res) => {
    const { email, code } = req.body ?? {};
    if (!email || !code) {
      res.status(400).json({ error: "Email and code are required." });
      return;
    }

    const username = usernameFromEmail(email);

    try {
      await cognitoClient.send(
        new ConfirmSignUpCommand({
          ClientId: COGNITO_CLIENT_ID,
          Username: username,
          ConfirmationCode: code,
          SecretHash: secretHash(username),
        }),
      );
      res.json({ status: "confirmed" });
    } catch (err) {
      res.status(400).json({ error: cognitoErrorMessage(err) });
    }
  }),
);

authRouter.post(
  "/resend-code",
  asyncHandler(async (req, res) => {
    const { email } = req.body ?? {};
    if (!email) {
      res.status(400).json({ error: "Email is required." });
      return;
    }

    const username = usernameFromEmail(email);

    try {
      await cognitoClient.send(
        new ResendConfirmationCodeCommand({
          ClientId: COGNITO_CLIENT_ID,
          Username: username,
          SecretHash: secretHash(username),
        }),
      );
      res.json({ status: "sent" });
    } catch (err) {
      res.status(400).json({ error: cognitoErrorMessage(err) });
    }
  }),
);

authRouter.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { email, password, role } = req.body ?? {};
    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required." });
      return;
    }

    try {
      const result = await cognitoClient.send(
        new InitiateAuthCommand({
          AuthFlow: "USER_PASSWORD_AUTH",
          ClientId: COGNITO_CLIENT_ID,
          AuthParameters: {
            USERNAME: email,
            PASSWORD: password,
            SECRET_HASH: secretHash(email),
          },
        }),
      );

      if (result.ChallengeName) {
        res.status(400).json({ error: `Unsupported auth challenge: ${result.ChallengeName}` });
        return;
      }

      const idToken = result.AuthenticationResult?.IdToken;
      if (!idToken) {
        res.status(500).json({ error: "No tokens returned from Cognito." });
        return;
      }

      const claims = decodeJwtPayload<{ sub: string; email: string; name?: string }>(idToken);

      const user = { sub: claims.sub, email: claims.email, name: claims.name };
      // The role picked on the login screen isn't just display copy — trust
      // it as the active role even if this account has no profile for it
      // yet (authentication already proved who they are); the frontend
      // sends them to profile setup instead of home in that case, same as
      // switch-role does. Falls back to whichever profile exists if no
      // role was picked at all.
      const activeRole =
        role === "candidate" || role === "recruiter"
          ? role
          : ((await resolveActiveRole(claims.sub)) ?? undefined);

      setAuthCookie(res, { ...user, activeRole });
      res.json({ user });
    } catch (err) {
      res.status(401).json({ error: cognitoErrorMessage(err) });
    }
  }),
);

authRouter.post("/logout", (_req, res) => {
  clearAuthCookie(res);
  res.json({ status: "ok" });
});

authRouter.get(
  "/me",
  asyncHandler(async (req, res) => {
    const authUser = getAuthUser(req);
    if (!authUser) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    const roles = await getRolesForSub(authUser.sub);
    res.json({
      user: { sub: authUser.sub, email: authUser.email, name: authUser.name },
      role: authUser.activeRole ?? null,
      roles,
    });
  }),
);

// Flips which profile (candidate or recruiter) is "in view" for this
// account — doesn't require the target role to already have a saved
// profile, since switching to a role you haven't set up yet is exactly how
// an existing account adds the other one (the frontend sends them to
// profile setup when `roles` doesn't include the target). Since the active
// role lives inside the JWT itself, changing it means re-signing and
// re-setting the cookie rather than mutating server-side state.
authRouter.post(
  "/switch-role",
  asyncHandler(async (req, res) => {
    const authUser = getAuthUser(req);
    if (!authUser) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    const { role } = req.body ?? {};
    if (role !== "candidate" && role !== "recruiter") {
      res.status(400).json({ error: "Role must be 'candidate' or 'recruiter'." });
      return;
    }

    setAuthCookie(res, { ...authUser, activeRole: role });
    res.json({ role });
  }),
);

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
      console.error(err);
      return "Something went wrong. Please try again.";
  }
}
