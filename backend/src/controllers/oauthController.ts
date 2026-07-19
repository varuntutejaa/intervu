import type { Request, Response } from "express";
import { logger } from "../lib/logger.js";
import { setAuthCookie } from "../middleware/auth.js";
import * as oauthService from "../services/oauthService.js";

function loginErrorRedirect(res: Response, message: string) {
  res.redirect(`${oauthService.PUBLIC_URL}/login?error=${encodeURIComponent(message)}`);
}

export function googleStart(req: Request, res: Response): void {
  res.redirect(oauthService.googleAuthUrl(oauthService.roleFromState(req.query.role)));
}

export async function googleCallback(req: Request, res: Response): Promise<void> {
  const code = req.query.code;
  if (typeof code !== "string") {
    loginErrorRedirect(res, "Google sign-in failed.");
    return;
  }

  try {
    const identity = await oauthService.completeGoogleLogin(code, oauthService.roleFromState(req.query.state));
    setAuthCookie(res, identity);
    res.redirect(oauthService.PUBLIC_URL);
  } catch (err) {
    logger.error({ err }, "Google OAuth callback failed");
    loginErrorRedirect(res, "Couldn't sign in with Google. Try again.");
  }
}

export function githubStart(req: Request, res: Response): void {
  res.redirect(oauthService.githubAuthUrl(oauthService.roleFromState(req.query.role)));
}

export async function githubCallback(req: Request, res: Response): Promise<void> {
  const code = req.query.code;
  if (typeof code !== "string") {
    loginErrorRedirect(res, "GitHub sign-in failed.");
    return;
  }

  try {
    const identity = await oauthService.completeGithubLogin(code, oauthService.roleFromState(req.query.state));
    setAuthCookie(res, identity);
    res.redirect(oauthService.PUBLIC_URL);
  } catch (err) {
    logger.error({ err }, "GitHub OAuth callback failed");
    loginErrorRedirect(res, "Couldn't sign in with GitHub. Try again.");
  }
}
