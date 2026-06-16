import { z } from "zod";

export const departmentGoalSchema = z.object({
  departmentId: z.string().uuid(),
  title: z.string().min(3),
  description: z.string().optional(),
  responsibleUserId: z.string().uuid().optional().or(z.literal("")),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  targetValue: z.coerce.number().min(0).optional(),
  achievedValue: z.coerce.number().min(0).default(0),
  progressPercentage: z.coerce.number().min(0).max(100).default(0),
  status: z.enum(["not_started", "in_progress", "on_track", "late", "completed", "cancelled"]),
  managerNotes: z.string().optional(),
});

export const managerReviewSchema = z.object({
  departmentId: z.string().uuid().optional().or(z.literal("")),
  reviewType: z.enum(["department", "goal", "cash_session", "financial_request", "indicator", "other"]),
  referenceId: z.string().uuid().optional().or(z.literal("")),
  status: z.enum(["on_track", "attention", "late", "critical", "completed"]),
  notes: z.string().min(3),
  deadline: z.string().optional(),
});

export type DepartmentGoalInput = z.infer<typeof departmentGoalSchema>;
export type ManagerReviewInput = z.infer<typeof managerReviewSchema>;

