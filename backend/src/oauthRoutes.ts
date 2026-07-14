import { Router } from "express";
import { asyncHandler } from "./asyncHandler.js";
import { decodeJwtPayload } from "./jwt.js";

export const oauthRouter = Router();

// The publicly-reachable origin the app is served from — same value in dev
// (proxied by Vite to this server) and prod (proxied by CloudFront to this
// server), so it doubles as both the OAuth redirect_uri host and the
// post-login redirect target. Not the same thing as this process's own bind
// address, which Google/GitHub can't reach directly.
const PUBLIC_URL = process.env.PUBLIC_URL ?? "http://localhost:5174";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID ?? "";
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET ?? "";
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID ?? "";
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET ?? "";

function loginErrorRedirect(res: import("express").Response, message: string) {
  res.redirect(`${PUBLIC_URL}/login?error=${encodeURIComponent(message)}`);
}

oauthRouter.get("/google/start", (_req, res) => {
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", GOOGLE_CLIENT_ID);
  url.searchParams.set("redirect_uri", `${PUBLIC_URL}/api/auth/google/callback`);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("prompt", "select_account");
  res.redirect(url.toString());
});

oauthRouter.get(
  "/google/callback",
  asyncHandler(async (req, res) => {
    const code = req.query.code;
    if (typeof code !== "string") {
      loginErrorRedirect(res, "Google sign-in failed.");
      return;
    }

    try {
      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: GOOGLE_CLIENT_ID,
          client_secret: GOOGLE_CLIENT_SECRET,
          redirect_uri: `${PUBLIC_URL}/api/auth/google/callback`,
          grant_type: "authorization_code",
        }),
      });
      const tokenData = (await tokenRes.json()) as {
        id_token?: string;
        error_description?: string;
      };
      if (!tokenRes.ok || !tokenData.id_token) {
        throw new Error(tokenData.error_description ?? "No id_token returned");
      }

      const claims = decodeJwtPayload<{ sub: string; email?: string; name?: string }>(
        tokenData.id_token,
      );
      req.session.user = {
        sub: `google:${claims.sub}`,
        email: claims.email ?? "",
        name: claims.name,
      };
      res.redirect(PUBLIC_URL);
    } catch (err) {
      console.error(err);
      loginErrorRedirect(res, "Couldn't sign in with Google. Try again.");
    }
  }),
);

oauthRouter.get("/github/start", (_req, res) => {
  const url = new URL("https://github.com/login/oauth/authorize");
  url.searchParams.set("client_id", GITHUB_CLIENT_ID);
  url.searchParams.set("redirect_uri", `${PUBLIC_URL}/api/auth/github/callback`);
  url.searchParams.set("scope", "read:user user:email");
  res.redirect(url.toString());
});

oauthRouter.get(
  "/github/callback",
  asyncHandler(async (req, res) => {
    const code = req.query.code;
    if (typeof code !== "string") {
      loginErrorRedirect(res, "GitHub sign-in failed.");
      return;
    }

    try {
      const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
        },
        body: new URLSearchParams({
          code,
          client_id: GITHUB_CLIENT_ID,
          client_secret: GITHUB_CLIENT_SECRET,
          redirect_uri: `${PUBLIC_URL}/api/auth/github/callback`,
        }),
      });
      const tokenData = (await tokenRes.json()) as {
        access_token?: string;
        error_description?: string;
      };
      if (!tokenRes.ok || !tokenData.access_token) {
        throw new Error(tokenData.error_description ?? "No access_token returned");
      }

      const headers = {
        Authorization: `Bearer ${tokenData.access_token}`,
        "User-Agent": "intervu-app",
        Accept: "application/vnd.github+json",
      };
      const userRes = await fetch("https://api.github.com/user", { headers });
      const user = (await userRes.json()) as {
        id: number;
        login: string;
        name?: string;
        email?: string;
      };
      if (!userRes.ok) throw new Error("Couldn't fetch GitHub profile.");

      // GitHub only includes `email` on the profile if it's public — fall
      // back to the emails endpoint for the verified primary address.
      let email: string = user.email ?? "";
      if (!email) {
        const emailsRes = await fetch("https://api.github.com/user/emails", { headers });
        if (emailsRes.ok) {
          const emails = (await emailsRes.json()) as {
            email: string;
            primary: boolean;
            verified: boolean;
          }[];
          email = emails.find((e) => e.primary && e.verified)?.email ?? emails[0]?.email ?? "";
        }
      }

      req.session.user = {
        sub: `github:${user.id}`,
        email,
        name: typeof user.name === "string" ? user.name : user.login,
      };
      res.redirect(PUBLIC_URL);
    } catch (err) {
      console.error(err);
      loginErrorRedirect(res, "Couldn't sign in with GitHub. Try again.");
    }
  }),
);
