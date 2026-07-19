import type { NextFunction, Request, Response } from "express";
import { describe, expect, it, vi } from "vitest";
import { responseEnvelope } from "./responseEnvelope.js";

function fakeRes() {
  const res: Partial<Response> & { sent?: unknown } = {};
  res.json = vi.fn().mockImplementation((body: unknown) => {
    res.sent = body;
    return res;
  }) as unknown as Response["json"];
  return res as Response & { sent?: unknown };
}

describe("responseEnvelope", () => {
  it("wraps a plain payload in { success: true, data }", () => {
    const res = fakeRes();
    const next = vi.fn();

    responseEnvelope({} as Request, res, next as NextFunction);
    res.json({ id: 1, title: "Backend Engineer" });

    expect(res.sent).toEqual({ success: true, data: { id: 1, title: "Backend Engineer" } });
    expect(next).toHaveBeenCalledOnce();
  });

  it("wraps a paginated list payload as data without altering its shape", () => {
    const res = fakeRes();
    responseEnvelope({} as Request, res, vi.fn() as unknown as NextFunction);

    const paginated = { items: [1, 2], page: 1, pageSize: 20, total: 2, totalPages: 1 };
    res.json(paginated);

    expect(res.sent).toEqual({ success: true, data: paginated });
  });

  it("passes an already-enveloped error body through unchanged, not double-wrapped", () => {
    const res = fakeRes();
    responseEnvelope({} as Request, res, vi.fn() as unknown as NextFunction);

    res.json({ success: false, error: "Not authenticated" });

    expect(res.sent).toEqual({ success: false, error: "Not authenticated" });
  });
});
