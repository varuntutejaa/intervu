// Shared between applications.ts (candidate self-service) and jobs.ts
// (recruiter updates on their own postings' applicants) so both sides
// validate against the exact same pipeline.
export const APPLICATION_STATUSES = [
  "Applied",
  "Interview Scheduled",
  "Technical Round",
  "HR Round",
  "Offer Received",
  "Rejected",
  "Withdrawn",
] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export const RECOMMENDATIONS = ["Strong Hire", "Hire", "No Hire", "Strong No Hire"] as const;

export type Recommendation = (typeof RECOMMENDATIONS)[number];
