import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import type { Auth } from "firebase-admin/auth";

// Lazy on purpose: this module is imported at server startup alongside the
// Cognito routes, but Firebase is optional (only the social-login route
// needs it). Initializing eagerly means a missing/invalid service account
// throws at import time and crashes the whole process — taking down the
// already-working Cognito email/password flow along with it.
let cachedAuth: Auth | null = null;

export function getFirebaseAuth(): Auth {
  if (cachedAuth) return cachedAuth;

  const app =
    getApps()[0] ??
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // Service account keys store the private key with literal "\n"
        // escapes in most .env-friendly formats — turn them back into real
        // newlines.
        privateKey: (process.env.FIREBASE_PRIVATE_KEY ?? "").replace(/\\n/g, "\n"),
      }),
    });

  cachedAuth = getAuth(app);
  return cachedAuth;
}
