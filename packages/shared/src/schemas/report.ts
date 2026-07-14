import { z } from "zod";

export const ReportSchema = z.object({
  id: z.string().uuid(),
  reporter_id: z.string().uuid(),
  target_type: z.enum(["store", "user", "event"]),
  target_id: z.string().uuid(),
  reason: z.string(),
  status: z.enum(["pending", "resolved", "dismissed"]),
  admin_notes: z.string().nullable(),
  created_at: z.string().datetime(),
  resolved_at: z.string().datetime().nullable(),
});

export const CreateReportSchema = z.object({
  target_type: z.enum(["store", "user", "event"]),
  target_id: z.string().uuid(),
  reason: z.string().min(1).max(1000),
});

export type Report = z.infer<typeof ReportSchema>;
export type CreateReportInput = z.input<typeof CreateReportSchema>;
