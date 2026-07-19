import { describe, expect, it } from "vitest";
import { EMPTY_JOB_FORM_VALUES, jobFormValuesToPayload } from "./schema";

describe("jobFormValuesToPayload", () => {
  it("splits, trims, and drops empty entries from the comma-separated skills string", () => {
    const payload = jobFormValuesToPayload({
      ...EMPTY_JOB_FORM_VALUES,
      skills: "React,  Node.js ,,TypeScript,  ",
    });
    expect(payload.skills).toEqual(["React", "Node.js", "TypeScript"]);
  });

  it("coerces empty salary strings to null rather than 0 or NaN", () => {
    const payload = jobFormValuesToPayload({ ...EMPTY_JOB_FORM_VALUES, salaryMin: "", salaryMax: "" });
    expect(payload.salaryMin).toBeNull();
    expect(payload.salaryMax).toBeNull();
  });

  it("converts a real salary string to a number", () => {
    const payload = jobFormValuesToPayload({ ...EMPTY_JOB_FORM_VALUES, salaryMin: "600000", salaryMax: "900000" });
    expect(payload.salaryMin).toBe(600000);
    expect(payload.salaryMax).toBe(900000);
  });

  it("coerces empty optional string fields to null, not empty string", () => {
    const payload = jobFormValuesToPayload(EMPTY_JOB_FORM_VALUES);
    expect(payload.applicationDeadline).toBeNull();
    expect(payload.travel).toBeNull();
    expect(payload.discipline).toBeNull();
    expect(payload.responsibilities).toBeNull();
    expect(payload.qualifications).toBeNull();
  });

  it("preserves a real value for those optional fields untouched", () => {
    const payload = jobFormValuesToPayload({ ...EMPTY_JOB_FORM_VALUES, travel: "Up to 25%", discipline: "Engineering" });
    expect(payload.travel).toBe("Up to 25%");
    expect(payload.discipline).toBe("Engineering");
  });
});
