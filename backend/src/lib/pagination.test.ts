import { describe, expect, it } from "vitest";
import { buildPaginated, parsePagination } from "./pagination.js";

describe("parsePagination", () => {
  it("defaults to page 1, pageSize 20", () => {
    expect(parsePagination({})).toEqual({ page: 1, pageSize: 20, limit: 20, offset: 0 });
  });

  it("computes offset from page and pageSize", () => {
    expect(parsePagination({ page: "3", pageSize: "10" })).toEqual({
      page: 3,
      pageSize: 10,
      limit: 10,
      offset: 20,
    });
  });

  it("clamps pageSize to the max (100)", () => {
    expect(parsePagination({ pageSize: "9999" }).pageSize).toBe(100);
  });

  it("falls back to defaults for invalid/negative values", () => {
    expect(parsePagination({ page: "-5", pageSize: "abc" })).toEqual({
      page: 1,
      pageSize: 20,
      limit: 20,
      offset: 0,
    });
  });

  it("floors non-integer values", () => {
    expect(parsePagination({ page: "2.9" }).page).toBe(2);
  });
});

describe("buildPaginated", () => {
  it("computes totalPages from total and pageSize", () => {
    expect(buildPaginated([1, 2, 3], 45, 1, 20)).toEqual({
      items: [1, 2, 3],
      page: 1,
      pageSize: 20,
      total: 45,
      totalPages: 3,
    });
  });

  it("never reports fewer than 1 total page, even with zero results", () => {
    expect(buildPaginated([], 0, 1, 20).totalPages).toBe(1);
  });
});
