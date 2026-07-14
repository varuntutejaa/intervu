import { initializeApp } from "firebase/app";
import type { FirebaseApp } from "firebase/app";
import { GithubAuthProvider, GoogleAuthProvider, getAuth, signInWithPopup } from "firebase/auth";
import type { Auth } from "firebase/auth";

// Firebase's web config isn't secret (it's meant to ship in client bundles),
// but it's still per-project, so it lives in env vars rather than hardcoded.
//
// Lazy on purpose: this module is imported at the top of AuroraLayout.tsx,
// which every page (including ones with no social buttons) pulls in.
// Initializing eagerly means a missing .env throws at import time and
// blanks the entire app, not just the social-login buttons.
let cachedAuth: Auth | null = null;

function getFirebaseAuth(): Auth {
  if (cachedAuth) return cachedAuth;

  const app: FirebaseApp = initializeApp({
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  });

  cachedAuth = getAuth(app);
  return cachedAuth;
}

// Cognito remains the system of record for email/password. Firebase is used
// only for the Google/GitHub buttons — its popup flow hands us an ID token,
// which the backend verifies and turns into the same kind of session cookie
// the Cognito login route creates, so the rest of the app doesn't care which
// provider was used.
export async function signInWithGoogle() {
  const result = await signInWithPopup(getFirebaseAuth(), new GoogleAuthProvider());
  return result.user.getIdToken();
}

export async function signInWithGithub() {
  const result = await signInWithPopup(getFirebaseAuth(), new GithubAuthProvider());
  return result.user.getIdToken();
}
