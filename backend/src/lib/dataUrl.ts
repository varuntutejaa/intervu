// Base64 inflates size by ~4/3 — this recovers the real decoded byte size of
// a `data:<mime>;base64,<payload>` string without actually decoding it,
// which matters for enforcing upload limits server-side (the frontend's own
// limit is just a UX nicety a direct API call can bypass).
export function dataUrlByteSize(dataUrl: string): number {
  const base64 = dataUrl.slice(dataUrl.indexOf(",") + 1);
  const padding = base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0;
  return Math.floor((base64.length * 3) / 4) - padding;
}

export function dataUrlMimeType(dataUrl: string): string {
  const match = /^data:([^;,]+)/.exec(dataUrl);
  return match?.[1] ?? "";
}
