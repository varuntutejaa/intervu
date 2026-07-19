import type { Request } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../middleware/auth.js", () => ({
  getAuthUser: vi.fn().mockReturnValue({ sub: "user-1", email: "a@b.com" }),
}));

vi.mock("../lib/pdfText.js", () => ({
  extractPdfText: vi.fn().mockResolvedValue("resume text"),
}));

const mockCreate = vi.fn();
vi.mock("../lib/groq.js", () => ({
  getGroqClient: vi.fn().mockReturnValue({ chat: { completions: { create: mockCreate } } }),
}));

const authModule = await import("../middleware/auth.js");
const pdfTextModule = await import("../lib/pdfText.js");
const { parseResume } = await import("./resumeService.js");

const fakeReq = {} as Request;
const validInput = { resumeData: "data:application/pdf;base64,AAAA" };

function mockGroqResponse(content: unknown) {
  mockCreate.mockResolvedValue({ choices: [{ message: { content: JSON.stringify(content) } }] });
}

describe("resumeService.parseResume", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authModule.getAuthUser).mockReturnValue({ sub: "user-1", email: "a@b.com" });
    vi.mocked(pdfTextModule.extractPdfText).mockResolvedValue("resume text");
  });

  it("401s when not authenticated (works for any logged-in user, not just candidates)", async () => {
    vi.mocked(authModule.getAuthUser).mockReturnValue(null);
    await expect(parseResume(fakeReq, validInput)).rejects.toMatchObject({ status: 401 });
  });

  it("422s when the PDF has no extractable text", async () => {
    vi.mocked(pdfTextModule.extractPdfText).mockResolvedValue("");
    await expect(parseResume(fakeReq, validInput)).rejects.toMatchObject({ status: 422 });
  });

  it("normalizes a bare linkedin.com URL to https://", async () => {
    mockGroqResponse({ linkedinUrl: "linkedin.com/in/someone" });
    const result = await parseResume(fakeReq, validInput);
    expect(result.fields.linkedinUrl).toBe("https://linkedin.com/in/someone");
  });

  it("leaves an already-protocoled URL untouched", async () => {
    mockGroqResponse({ githubUrl: "https://github.com/someone" });
    const result = await parseResume(fakeReq, validInput);
    expect(result.fields.githubUrl).toBe("https://github.com/someone");
  });

  it("discards an experience value outside the valid bracket set", async () => {
    mockGroqResponse({ experience: "20+ years" });
    const result = await parseResume(fakeReq, validInput);
    expect(result.fields.experience).toBe("");
  });

  it("keeps a valid experience bracket", async () => {
    mockGroqResponse({ experience: "3-5" });
    const result = await parseResume(fakeReq, validInput);
    expect(result.fields.experience).toBe("3-5");
  });

  it("filters non-string entries out of skills arrays", async () => {
    mockGroqResponse({ technicalSkills: ["Node.js", 42, null, "PostgreSQL"] });
    const result = await parseResume(fakeReq, validInput);
    expect(result.fields.technicalSkills).toEqual(["Node.js", "PostgreSQL"]);
  });

  it("502s when the model returns invalid JSON", async () => {
    mockCreate.mockResolvedValue({ choices: [{ message: { content: "not json" } }] });
    await expect(parseResume(fakeReq, validInput)).rejects.toMatchObject({ status: 502 });
  });
});
