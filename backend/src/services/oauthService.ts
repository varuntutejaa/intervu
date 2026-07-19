import { decodeJwtPayload } from "../lib/jwt.js";
import { resolveActiveRole, resolveCanonicalSub } from "../lib/profiles.js";

// The publicly-reachable origin the app is served from — same value in dev
// (proxied by Vite to this server) and prod (proxied by CloudFront to this
// server), so it doubles as both the OAuth redirect_uri host and the
// post-login redirect target. Not the same thing as this process's own bind
// address, which Google/GitHub can't reach directly.
export const PUBLIC_URL = process.env.PUBLIC_URL ?? "http://localhost:5174";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID ?? "";
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET ?? "";
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID ?? "";
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET ?? "";

// Round-trips the role picked on the login screen through the provider via
// the standard OAuth `state` param, so the callback can enforce it the same
// way the Cognito login route does.
export function roleFromState(state: unknown): "candidate" | "recruiter" | undefined {
  return state === "candidate" || state === "recruiter" ? state : undefined;
}

export function googleAuthUrl(role?: "candidate" | "recruiter"): string {
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", GOOGLE_CLIENT_ID);
  url.searchParams.set("redirect_uri", `${PUBLIC_URL}/api/auth/google/callback`);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("prompt", "select_account");
  if (role) url.searchParams.set("state", role);
  return url.toString();
}

export function githubAuthUrl(role?: "candidate" | "recruiter"): string {
  const url = new URL("https://github.com/login/oauth/authorize");
  url.searchParams.set("client_id", GITHUB_CLIENT_ID);
  url.searchParams.set("redirect_uri", `${PUBLIC_URL}/api/auth/github/callback`);
  url.searchParams.set("scope", "read:user user:email");
  if (role) url.searchParams.set("state", role);
  return url.toString();
}

export interface OAuthIdentity {
  sub: string;
  email: string;
  name?: string;
  activeRole?: "candidate" | "recruiter";
}

export async function completeGoogleLogin(code: string, role?: "candidate" | "recruiter"): Promise<OAuthIdentity> {
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
  const tokenData = (await tokenRes.json()) as { id_token?: string; error_description?: string };
  if (!tokenRes.ok || !tokenData.id_token) {
    throw new Error(tokenData.error_description ?? "No id_token returned");
  }

  const claims = decodeJwtPayload<{ sub: string; email?: string; name?: string }>(tokenData.id_token);
  const email = claims.email ?? "";
  const sub = await resolveCanonicalSub(email, `google:${claims.sub}`);

  // Trust the role picked on the login screen even if this account has no
  // profile for it yet — the frontend sends them to profile setup instead
  // of home in that case, same as switch-role does.
  const activeRole = role ?? ((await resolveActiveRole(sub)) ?? undefined);
  return { sub, email, name: claims.name, activeRole };
}

export async function completeGithubLogin(code: string, role?: "candidate" | "recruiter"): Promise<OAuthIdentity> {
  const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body: new URLSearchParams({
      code,
      client_id: GITHUB_CLIENT_ID,
      client_secret: GITHUB_CLIENT_SECRET,
      redirect_uri: `${PUBLIC_URL}/api/auth/github/callback`,
    }),
  });
  const tokenData = (await tokenRes.json()) as { access_token?: string; error_description?: string };
  if (!tokenRes.ok || !tokenData.access_token) {
    throw new Error(tokenData.error_description ?? "No access_token returned");
  }

  const headers = {
    Authorization: `Bearer ${tokenData.access_token}`,
    "User-Agent": "intervu-app",
    Accept: "application/vnd.github+json",
  };
  const userRes = await fetch("https://api.github.com/user", { headers });
  const user = (await userRes.json()) as { id: number; login: string; name?: string; email?: string };
  if (!userRes.ok) throw new Error("Couldn't fetch GitHub profile.");

  // GitHub only includes `email` on the profile if it's public — fall back
  // to the emails endpoint for the verified primary address.
  let email: string = user.email ?? "";
  if (!email) {
    const emailsRes = await fetch("https://api.github.com/user/emails", { headers });
    if (emailsRes.ok) {
      const emails = (await emailsRes.json()) as { email: string; primary: boolean; verified: boolean }[];
      email = emails.find((e) => e.primary && e.verified)?.email ?? emails[0]?.email ?? "";
    }
  }

  const sub = await resolveCanonicalSub(email, `github:${user.id}`);
  const activeRole = role ?? ((await resolveActiveRole(sub)) ?? undefined);
  return { sub, email, name: typeof user.name === "string" ? user.name : user.login, activeRole };
}
