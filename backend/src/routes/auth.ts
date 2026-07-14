import { Router } from "express";
import {
  ConfirmSignUpCommand,
  InitiateAuthCommand,
  ResendConfirmationCodeCommand,
  SignUpCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { COGNITO_CLIENT_ID, cognitoClient, secretHash, usernameFromEmail } from "../lib/cognito.js";
import { pool } from "../lib/db.js";
import { decodeJwtPayload } from "../lib/jwt.js";

declare module "express-session" {
  interface SessionData {
    user?: { sub: string; email: string; name?: string };
    accessToken?: string;
    refreshToken?: string;
  }
}

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
    const { email, password } = req.body ?? {};
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
      req.session.user = { sub: claims.sub, email: claims.email, name: claims.name };
      req.session.accessToken = result.AuthenticationResult?.AccessToken;
      req.session.refreshToken = result.AuthenticationResult?.RefreshToken;

      res.json({ user: req.session.user });
    } catch (err) {
      res.status(401).json({ error: cognitoErrorMessage(err) });
    }
  }),
);

authRouter.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ status: "ok" });
  });
});

authRouter.get(
  "/me",
  asyncHandler(async (req, res) => {
    if (!req.session.user) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    const result = await pool.query("SELECT role FROM profiles WHERE auth_sub = $1", [
      req.session.user.sub,
    ]);
    res.json({ user: req.session.user, role: result.rows[0]?.role ?? null });
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
