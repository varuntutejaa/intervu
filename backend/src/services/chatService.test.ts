import type { Request } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../middleware/auth.js", () => ({
  getAuthUser: vi.fn(),
}));

vi.mock("../repositories/profileRepository.js", () => ({
  findCandidateResumeData: vi.fn(),
}));

vi.mock("../lib/pdfText.js", () => ({
  extractPdfText: vi.fn(),
}));

vi.mock("../rag/ragService.js", () => ({
  answerQuestion: vi.fn().mockResolvedValue({ answer: "grounded answer", citations: [] }),
}));

const authModule = await import("../middleware/auth.js");
const profileRepo = await import("../repositories/profileRepository.js");
const pdfTextModule = await import("../lib/pdfText.js");
const ragService = await import("../rag/ragService.js");
const { ask } = await import("./chatService.js");

const fakeReq = {} as Request;

describe("chatService.ask — resume source priority", () => {
  beforeEach(() => vi.clearAllMocks());

  it("400s on an empty question", async () => {
    await expect(ask(fakeReq, { question: "" })).rejects.toThrow();
  });

  it("uses only the knowledge base when logged out and nothing attached", async () => {
    vi.mocked(authModule.getAuthUser).mockReturnValue(null);
    await ask(fakeReq, { question: "Is my resume ATS friendly?" });
    expect(ragService.answerQuestion).toHaveBeenCalledWith("Is my resume ATS friendly?", undefined);
  });

  it("falls back to the logged-in candidate's stored resume when nothing is attached", async () => {
    vi.mocked(authModule.getAuthUser).mockReturnValue({ sub: "user-1", email: "a@b.com" });
    vi.mocked(profileRepo.findCandidateResumeData).mockResolvedValue("data:application/pdf;base64,STORED");
    vi.mocked(pdfTextModule.extractPdfText).mockResolvedValue("stored resume text");

    await ask(fakeReq, { question: "What am I missing?" });
    expect(pdfTextModule.extractPdfText).toHaveBeenCalledWith("data:application/pdf;base64,STORED");
    expect(ragService.answerQuestion).toHaveBeenCalledWith("What am I missing?", "stored resume text");
  });

  it("prefers an attached resume over the stored one, even when logged in", async () => {
    vi.mocked(authModule.getAuthUser).mockReturnValue({ sub: "user-1", email: "a@b.com" });
    vi.mocked(pdfTextModule.extractPdfText).mockResolvedValue("attached resume text");

    await ask(fakeReq, { question: "How is my resume?", resumeData: "data:application/pdf;base64,ATTACHED" });

    expect(pdfTextModule.extractPdfText).toHaveBeenCalledWith("data:application/pdf;base64,ATTACHED");
    // The stored-resume lookup path is never consulted once an attachment is present.
    expect(profileRepo.findCandidateResumeData).not.toHaveBeenCalled();
    expect(ragService.answerQuestion).toHaveBeenCalledWith("How is my resume?", "attached resume text");
  });

  it("has no resume text when logged in but the candidate has none on file", async () => {
    vi.mocked(authModule.getAuthUser).mockReturnValue({ sub: "user-1", email: "a@b.com" });
    vi.mocked(profileRepo.findCandidateResumeData).mockResolvedValue(null);

    await ask(fakeReq, { question: "Generic question" });
    expect(ragService.answerQuestion).toHaveBeenCalledWith("Generic question", undefined);
  });
});
