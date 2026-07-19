import { describe, expect, it } from "vitest";
import { dataUrlByteSize, dataUrlMimeType } from "./dataUrl.js";

describe("dataUrlMimeType", () => {
  it("extracts the mime type", () => {
    expect(dataUrlMimeType("data:application/pdf;base64,AAAA")).toBe("application/pdf");
    expect(dataUrlMimeType("data:image/png;base64,AAAA")).toBe("image/png");
  });

  it("returns empty string for a non-data URL", () => {
    expect(dataUrlMimeType("not-a-data-url")).toBe("");
  });
});

describe("dataUrlByteSize", () => {
  it("recovers the exact decoded byte size", () => {
    // "hello" is 5 bytes -> base64 "aGVsbG8=" (one padding char)
    const b64 = Buffer.from("hello").toString("base64");
    const dataUrl = `data:text/plain;base64,${b64}`;
    expect(dataUrlByteSize(dataUrl)).toBe(5);
  });

  it("matches Buffer.byteLength for a larger, unpadded payload", () => {
    const raw = "x".repeat(300); // 300 bytes, base64 length divisible by 4 (no padding)
    const b64 = Buffer.from(raw).toString("base64");
    const dataUrl = `data:application/octet-stream;base64,${b64}`;
    expect(dataUrlByteSize(dataUrl)).toBe(300);
  });
});
