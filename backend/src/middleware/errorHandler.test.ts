import type { Request, Response } from "express";
import { z } from "zod";
import { describe, expect, it, vi } from "vitest";
import { HttpError } from "../lib/httpError.js";
import { errorHandler } from "./errorHandler.js";

function fakeRes() {
  const res: Partial<Response> & { statusCode?: number; body?: unknown } = {};
  res.status = vi.fn().mockImplementation((code: number) => {
    res.statusCode = code;
    return res;
  }) as unknown as Response["status"];
  res.json = vi.fn().mockImplementation((body: unknown) => {
    res.body = body;
    return res;
  }) as unknown as Response["json"];
  return res as Response & { statusCode?: number; body?: unknown };
}

describe("errorHandler", () => {
  it("maps a ZodError to 400 with the first issue's message", () => {
    const schema = z.object({ email: z.string().min(1, "Email is required.") });
    const result = schema.safeParse({ email: "" });
    const res = fakeRes();

    errorHandler(result.error, {} as Request, res, vi.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.body).toEqual({ success: false, error: "Email is required." });
  });

  it("maps an HttpError to its own status and message", () => {
    const res = fakeRes();
    errorHandler(new HttpError(403, "You didn't post this job."), {} as Request, res, vi.fn());

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.body).toEqual({ success: false, error: "You didn't post this job." });
  });

  it("collapses an unrecognized error to a generic 500 (never leaks internals)", () => {
    const res = fakeRes();
    errorHandler(new Error("some internal detail"), { path: "/api/x" } as Request, res, vi.fn());

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.body).toEqual({ success: false, error: "Internal server error" });
  });
});
