import { describe, expect, it } from "vitest";
import { roleFromState } from "./oauthService.js";

describe("roleFromState", () => {
  it("accepts 'candidate' and 'recruiter'", () => {
    expect(roleFromState("candidate")).toBe("candidate");
    expect(roleFromState("recruiter")).toBe("recruiter");
  });

  it("returns undefined for anything else (missing, garbage, wrong type)", () => {
    expect(roleFromState(undefined)).toBeUndefined();
    expect(roleFromState("admin")).toBeUndefined();
    expect(roleFromState(["candidate"])).toBeUndefined();
    expect(roleFromState(123)).toBeUndefined();
  });
});
