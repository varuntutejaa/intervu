import { createHmac } from "node:crypto";
import { CognitoIdentityProviderClient } from "@aws-sdk/client-cognito-identity-provider";

export const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.COGNITO_REGION,
});

export const COGNITO_CLIENT_ID = process.env.COGNITO_CLIENT_ID ?? "";
const COGNITO_CLIENT_SECRET = process.env.COGNITO_CLIENT_SECRET ?? "";

// Required on every Cognito auth API call when the App Client has a secret
// (a "confidential client") — Cognito rejects the request without it.
export function secretHash(username: string) {
  return createHmac("sha256", COGNITO_CLIENT_SECRET)
    .update(username + COGNITO_CLIENT_ID)
    .digest("base64");
}

// This User Pool has email configured as a sign-in *alias* rather than the
// literal username, so Cognito rejects a Username that looks like an email
// address at SignUp/ConfirmSignUp/ResendConfirmationCode time. Deterministic
// so signup and confirm (separate requests) always derive the same value.
// Login is unaffected — Cognito resolves the email alias for InitiateAuth.
export function usernameFromEmail(email: string) {
  return email.toLowerCase().replace("@", "_at_");
}
