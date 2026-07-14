// Decodes a JWT payload without verifying its signature. Only safe when the
// token was received directly from the issuer's token endpoint over a
// server-to-server HTTPS call (Cognito, Google) — never do this with a
// token handed to you by an untrusted client.
export function decodeJwtPayload<T = Record<string, unknown>>(token: string): T {
  const payload = token.split(".")[1];
  const json = Buffer.from(payload, "base64url").toString("utf8");
  return JSON.parse(json);
}
