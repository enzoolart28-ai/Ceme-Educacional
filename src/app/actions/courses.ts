"use server";

// =============================================================================
// Server Actions — Cursos
// =============================================================================
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import {
  courseSchema,
  courseSubjectSchema,
  courseModuleSchema,
  type CourseInput,
} from "@/lib/courses/schemas";
import type { ActionResult } from "@/app/actions/auth";

async function canManage(): Promise<boolean> {
  const profile = await getProfile();
  return !!profile && hasPermission(profile.role, "courses.manage");
}

const numOrNull = (v?: string) => (v ? Number(v) : null);

function toPayload(v: CourseInput) {
  return {
    name: v.name,
    description: v.description || "",
    modality: v.modality,
    type: v.type,
    status: v.status,
    workload_hours: numOrNull(v.workload_hours),
    duration: v.duration || null,
    price: numOrNull(v.price),
    certificate_enabled: v.certificate_enabled,
    minimum_attendance: numOrNull(v.minimum_attendance),
    minimum_grade: numOrNull(v.minimum_grade),
    requirements: v.requirements || null,
    notes: v.notes || null,
  };
}

export async function createCourseAction(values: CourseInput): Promise<ActionResult> {
  if (!(await canManage())) return { error: "Você não tem permissão para esta ação." };
  const parsed = courseSchema.safeParse(values);
  if (!parsed.success) return { error: "Verifique os campos do formulário." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("courses")
    .insert(toPayload(parsed.data))
    .select("id")
    .single();
  if (error) return { error: "Não foi possível cadastrar o curso." };

  revalidatePath("/dashboard/academico/cursos");
  redirect(`/dashboard/academico/cursos/${data.id}`);
}

export async function updateCourseAction(
  id: string,
  values: CourseInput,
): Promise<ActionResult> {
  if (!(await canManage())) return { error: "Você não tem permissão para esta ação." };
  const parsed = courseSchema.safeParse(values);
  if (!parsed.success) return { error: "Verifique os campos do formulário." };

  const supabase = await createClient();
  const { error } = await supabase.from("courses").update(toPayload(parsed.data)).eq("id", id);
  if (error) return { error: "Não foi possível salvar as alterações." };

  revalidatePath(`/dashboard/academico/cursos/${id}`);
  revalidatePath("/dashboard/academico/cursos");
  redirect(`/dashboard/academico/cursos/${id}`);
}

export async function deleteCourseAction(id: string): Promise<ActionResult> {
  if (!(await canManage())) return { error: "Você não tem permissão para esta ação." };
  const supabase = await createClient();
  const { error } = await supabase.from("courses").delete().eq("id", id);
  if (error) {
    return {
      error: error.code === "23503"
        ? "Não é possível excluir: há turmas vinculadas a este curso."
        : "Não foi possível excluir o curso.",
    };
  }
  revalidatePath("/dashboard/academico/cursos");
  redirect("/dashboard/academico/cursos");
}

export async function linkCourseSubjectAction(values: {
  course_id: string;
  subject_id: string;
  module_id?: string;
  workload_hours?: string;
  teacher_id?: string;
}): Promise<ActionResult> {
  if (!(await canManage())) return { error: "Você não tem permissão para esta ação." };
  const parsed = courseSubjectSchema.safeParse(values);
  if (!parsed.success) return { error: "Dados inválidos." };

  const supabase = await createClient();
  const { count } = await supabase
    .from("course_subjects")
    .select("*", { count: "exact", head: true })
    .eq("course_id", parsed.data.course_id);

  const { error } = await supabase.from("course_subjects").insert({
    course_id: parsed.data.course_id,
    subject_id: parsed.data.subject_id,
    module_id: parsed.data.module_id || null,
    workload_hours: parsed.data.workload_hours ? Number(parsed.data.workload_hours) : null,
    teacher_id: parsed.data.teacher_id || null,
    order_index: count ?? 0,
  });
  if (error) {
    return {
      error: error.code === "23505"
        ? "Esta disciplina já está no curso."
        : "Não foi possível adicionar a disciplina.",
    };
  }
  revalidatePath(`/dashboard/academico/cursos/${parsed.data.course_id}`);
  return { success: true };
}

export async function unlinkCourseSubjectAction(values: {
  id: string;
  course_id: string;
}): Promise<ActionResult> {
  if (!(await canManage())) return { error: "Você não tem permissão para esta ação." };
  const supabase = await createClient();
  const { error } = await supabase.from("course_subjects").delete().eq("id", values.id);
  if (error) return { error: "Não foi possível remover a disciplina." };
  revalidatePath(`/dashboard/academico/cursos/${values.course_id}`);
  return { success: true };
}

export async function moveCourseSubjectAction(values: {
  id: string;
  course_id: string;
  direction: "up" | "down";
}): Promise<ActionResult> {
  if (!(await canManage())) return { error: "Você não tem permissão para esta ação." };
  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("course_subjects")
    .select("id")
    .eq("course_id", values.course_id)
    .order("order_index");

  const ids = (rows ?? []).map((r) => r.id);
  const i = ids.indexOf(values.id);
  const j = values.direction === "up" ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= ids.length) return { success: true };
  [ids[i], ids[j]] = [ids[j], ids[i]];
  await Promise.all(
    ids.map((rid, idx) =>
      supabase.from("course_subjects").update({ order_index: idx }).eq("id", rid),
    ),
  );

  revalidatePath(`/dashboard/academico/cursos/${values.course_id}`);
  return { success: true };
}

export async function addCourseModuleAction(values: {
  course_id: string;
  name: string;
  description?: string;
  workload_hours?: string;
}): Promise<ActionResult> {
  if (!(await canManage())) return { error: "Você não tem permissão para esta ação." };
  const parsed = courseModuleSchema.safeParse(values);
  if (!parsed.success) return { error: "Verifique os campos do módulo." };

  const supabase = await createClient();
  // Próxima ordem = quantidade atual de módulos do curso.
  const { count } = await supabase
    .from("course_modules")
    .select("*", { count: "exact", head: true })
    .eq("course_id", parsed.data.course_id);

  const { error } = await supabase.from("course_modules").insert({
    course_id: parsed.data.course_id,
    name: parsed.data.name,
    description: parsed.data.description || null,
    order_index: count ?? 0,
    workload_hours: parsed.data.workload_hours ? Number(parsed.data.workload_hours) : null,
  });
  if (error) return { error: "Não foi possível adicionar o módulo." };

  revalidatePath(`/dashboard/academico/cursos/${parsed.data.course_id}`);
  return { success: true };
}

export async function moveCourseModuleAction(values: {
  id: string;
  course_id: string;
  direction: "up" | "down";
}): Promise<ActionResult> {
  if (!(await canManage())) return { error: "Você não tem permissão para esta ação." };
  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("course_modules")
    .select("id")
    .eq("course_id", values.course_id)
    .order("order_index");

  const ids = (rows ?? []).map((r) => r.id);
  const i = ids.indexOf(values.id);
  const j = values.direction === "up" ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= ids.length) return { success: true };
  [ids[i], ids[j]] = [ids[j], ids[i]];
  await Promise.all(
    ids.map((rid, idx) =>
      supabase.from("course_modules").update({ order_index: idx }).eq("id", rid),
    ),
  );

  revalidatePath(`/dashboard/academico/cursos/${values.course_id}`);
  return { success: true };
}

export async function deleteCourseModuleAction(values: {
  id: string;
  course_id: string;
}): Promise<ActionResult> {
  if (!(await canManage())) return { error: "Você não tem permissão para esta ação." };
  const supabase = await createClient();
  const { error } = await supabase.from("course_modules").delete().eq("id", values.id);
  if (error) return { error: "Não foi possível remover o módulo." };
  revalidatePath(`/dashboard/academico/cursos/${values.course_id}`);
  return { success: true };
}
