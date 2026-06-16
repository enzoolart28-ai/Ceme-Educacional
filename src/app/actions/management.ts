"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { departmentGoalSchema, managerReviewSchema } from "@/lib/management/schemas";

function revalidateManagement() {
  revalidatePath("/dashboard/gestao");
  revalidatePath("/dashboard/gestao/metas");
  revalidatePath("/dashboard/gestao/relatorios");
}

async function requireManagement(permission: "management.goals.manage" | "management.review") {
  const profile = await getProfile();
  if (!profile || !hasPermission(profile.role, permission)) return null;
  return profile;
}

export async function createDepartmentGoalAction(formData: FormData): Promise<void> {
  const profile = await requireManagement("management.goals.manage");
  if (!profile) return;
  const parsed = departmentGoalSchema.safeParse({
    departmentId: formData.get("departmentId"),
    title: formData.get("title"),
    description: formData.get("description") ?? "",
    responsibleUserId: formData.get("responsibleUserId") ?? "",
    startDate: formData.get("startDate") ?? "",
    endDate: formData.get("endDate") ?? "",
    targetValue: formData.get("targetValue") || undefined,
    achievedValue: formData.get("achievedValue") || 0,
    progressPercentage: formData.get("progressPercentage") || 0,
    status: formData.get("status"),
    managerNotes: formData.get("managerNotes") ?? "",
  });
  if (!parsed.success) return;

  const supabase = await createClient();
  const { error } = await supabase.from("department_goals").insert({
    department_id: parsed.data.departmentId,
    title: parsed.data.title,
    description: parsed.data.description || null,
    responsible_user_id: parsed.data.responsibleUserId || null,
    start_date: parsed.data.startDate || null,
    end_date: parsed.data.endDate || null,
    target_value: parsed.data.targetValue ?? null,
    achieved_value: parsed.data.achievedValue,
    progress_percentage: parsed.data.progressPercentage,
    status: parsed.data.status,
    manager_notes: parsed.data.managerNotes || null,
  });
  if (error) return;
  revalidateManagement();
}

export async function createManagerReviewAction(formData: FormData): Promise<void> {
  const profile = await requireManagement("management.review");
  if (!profile) return;
  const parsed = managerReviewSchema.safeParse({
    departmentId: formData.get("departmentId") ?? "",
    reviewType: formData.get("reviewType"),
    referenceId: formData.get("referenceId") ?? "",
    status: formData.get("status"),
    notes: formData.get("notes"),
    deadline: formData.get("deadline") ?? "",
  });
  if (!parsed.success) return;

  const supabase = await createClient();
  const { error } = await supabase.from("manager_reviews").insert({
    manager_id: profile.id,
    department_id: parsed.data.departmentId || null,
    review_type: parsed.data.reviewType,
    reference_id: parsed.data.referenceId || null,
    status: parsed.data.status,
    notes: parsed.data.notes,
    deadline: parsed.data.deadline || null,
  });
  if (error) return;
  revalidateManagement();
}
