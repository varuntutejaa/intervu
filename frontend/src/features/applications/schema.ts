import { z } from "zod";
import { APPLICATION_STATUSES, type ApplicationStatus } from "./api";

export const addApplicationSchema = z.object({
  company: z.string().min(1, "Company is required."),
  position: z.string().min(1, "Position is required."),
  appliedOn: z.string().min(1, "Applied-on date is required."),
  status: z.enum(APPLICATION_STATUSES as unknown as [ApplicationStatus, ...ApplicationStatus[]]),
});
export type AddApplicationFormValues = z.infer<typeof addApplicationSchema>;
