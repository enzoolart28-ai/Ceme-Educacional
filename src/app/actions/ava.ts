"use server";

// =============================================================================
// Server Actions — AVA / EAD
// =============================================================================
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { lessonSchema, materialSchema, type LessonInput } from "@/lib/ava/schemas";
import type { ActionResult } from "@/app/actions/auth";
import type { UserRole } from "@/types/models";

function canManageContent(role: UserRole): boolean {
  return (
    hasPermission(role, "courses.manage") ||
    hasPermission(role, "curriculum.manage") ||
    hasPermission(role, "grades.manage")
  );
}

async function requireContentManager() {
  const profile = await getProfile();
  if (!profile || !canManageContent(profile.role)) return null;
  return profile;
}

function lessonPayload(v: LessonInput) {
  return {
    course_id: v.course_id,
    module_id: v.module_id || null,
    subject_id: v.subject_id || null,
    title: v.title,
    description: v.description || null,
    video_url: v.video_url || null,
    release_type: v.release_type,
    release_date: v.release_date || null,
    status: v.status,
  };
}

export async function createLessonAction(values: LessonInput): Promise<ActionResult> {
  if (!(await requireContentManager())) return { error: "Sem permissão para gerenciar conteúdo." };
  const parsed = lessonSchema.safeParse(values);
  if (!parsed.success) return { error: "Verifique os campos da aula." };

  const supabase = await createClient();
  const { count } = await supabase
    .from("lessons")
    .select("*", { count: "exact", head: true })
    .eq("course_id", parsed.data.course_id);

  const { data, error } = await supabase
    .from("lessons")
    .insert({ ...lessonPayload(parsed.data), order_index: count ?? 0 })
    .select("id")
    .single();
  if (error) return { error: "Não foi possível criar a aula." };

  revalidatePath(`/dashboard/ava/${parsed.data.course_id}`);
  redirect(`/dashboard/ava/${parsed.data.course_id}/aula/${data.id}`);
}

export async function updateLessonAction(id: string, values: LessonInput): Promise<ActionResult> {
  if (!(await requireContentManager())) return { error: "Sem permissão para gerenciar conteúdo." };
  const parsed = lessonSchema.safeParse(values);
  if (!parsed.success) return { error: "Verifique os campos da aula." };

  const supabase = await createClient();
  const { error } = await supabase.from("lessons").update(lessonPayload(parsed.data)).eq("id", id);
  if (error) return { error: "Não foi possível salvar a aula." };

  revalidatePath(`/dashboard/ava/${parsed.data.course_id}/aula/${id}`);
  revalidatePath(`/dashboard/ava/${parsed.data.course_id}`);
  return { success: true };
}

export async function deleteLessonAction(values: {
  id: string;
  course_id: string;
}): Promise<ActionResult> {
  if (!(await requireContentManager())) return { error: "Sem permissão." };
  const supabase = await createClient();
  const { error } = await supabase.from("lessons").delete().eq("id", values.id);
  if (error) return { error: "Não foi possível excluir a aula." };

  revalidatePath(`/dashboard/ava/${values.course_id}`);
  redirect(`/dashboard/ava/${values.course_id}`);
}

export async function moveLessonAction(values: {
  id: string;
  course_id: string;
  direction: "up" | "down";
}): Promise<ActionResult> {
  if (!(await requireContentManager())) return { error: "Sem permissão." };
  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("lessons")
    .select("id")
    .eq("course_id", values.course_id)
    .order("order_index");
  const ids = (rows ?? []).map((r) => r.id);
  const i = ids.indexOf(values.id);
  const j = values.direction === "up" ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= ids.length) return { success: true };
  [ids[i], ids[j]] = [ids[j], ids[i]];
  await Promise.all(
    ids.map((rid, idx) => supabase.from("lessons").update({ order_index: idx }).eq("id", rid)),
  );
  revalidatePath(`/dashboard/ava/${values.course_id}`);
  return { success: true };
}

export async function addMaterialAction(values: {
  lesson_id: string;
  course_id: string;
  title: string;
  type: string;
  file_url?: string;
  external_url?: string;
}): Promise<ActionResult> {
  if (!(await requireContentManager())) return { error: "Sem permissão." };
  const parsed = materialSchema.safeParse(values);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  const supabase = await createClient();
  const { error } = await supabase.from("lesson_materials").insert({
    lesson_id: parsed.data.lesson_id,
    title: parsed.data.title,
    type: parsed.data.type,
    file_url: parsed.data.file_url || null,
    external_url: parsed.data.external_url || null,
  });
  if (error) return { error: "Não foi possível adicionar o material." };

  revalidatePath(`/dashboard/ava/${values.course_id}/aula/${parsed.data.lesson_id}`);
  return { success: true };
}

export async function deleteMaterialAction(values: {
  id: string;
  lesson_id: string;
  course_id: string;
}): Promise<ActionResult> {
  if (!(await requireContentManager())) return { error: "Sem permissão." };
  const supabase = await createClient();
  const { error } = await supabase.from("lesson_materials").delete().eq("id", values.id);
  if (error) return { error: "Não foi possível remover o material." };

  revalidatePath(`/dashboard/ava/${values.course_id}/aula/${values.lesson_id}`);
  return { success: true };
}

/** Aluno marca/desmarca a aula como concluída (progresso do próprio). */
export async function markLessonProgressAction(values: {
  lesson_id: string;
  course_id: string;
  completed: boolean;
}): Promise<ActionResult> {
  const profile = await getProfile();
  if (!profile) return { error: "Sessão expirada." };

  const supabase = await createClient();
  const { data: student } = await supabase
    .from("students")
    .select("id")
    .eq("profile_id", profile.id)
    .maybeSingle();
  if (!student) return { error: "Apenas alunos podem registrar progresso." };

  const { error } = await supabase.from("student_lesson_progress").upsert(
    {
      student_id: student.id,
      lesson_id: values.lesson_id,
      status: values.completed ? "completed" : "in_progress",
      completed_at: values.completed ? new Date().toISOString() : null,
      progress_percentage: values.completed ? 100 : 0,
    },
    { onConflict: "student_id,lesson_id" },
  );
  if (error) return { error: "Não foi possível registrar o progresso." };

  revalidatePath(`/dashboard/ava/${values.course_id}`);
  revalidatePath(`/dashboard/ava/${values.course_id}/aula/${values.lesson_id}`);
  return { success: true };
}
