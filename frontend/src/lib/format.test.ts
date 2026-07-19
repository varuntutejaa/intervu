import { describe, expect, it } from "vitest";
import { formatSalary } from "./format";

describe("formatSalary", () => {
  it("returns null when both bounds are missing", () => {
    expect(formatSalary(null, null)).toBeNull();
  });

  it("formats a range with Indian digit grouping", () => {
    expect(formatSalary(600000, 900000)).toBe("₹6,00,000 – ₹9,00,000 per annum");
  });

  it("formats a single bound when only one side is given", () => {
    expect(formatSalary(500000, null)).toBe("₹5,00,000 per annum");
    expect(formatSalary(null, 1200000)).toBe("₹12,00,000 per annum");
  });

  it("groups a crore-scale number correctly (lakh, not thousand, grouping)", () => {
    expect(formatSalary(10000000, null)).toBe("₹1,00,00,000 per annum");
  });
});
