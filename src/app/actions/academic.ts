"use server";

// =============================================================================
// Server Actions do módulo Acadêmico
// =============================================================================
// Cada ação valida (zod), checa permissão (espelho do RBAC) e grava. A RLS no
// banco é a barreira de segurança final.
// =============================================================================
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth/session";
import { hasPermission, type Permission } from "@/lib/auth/permissions";
import {
  assignTeacherSchema,
  classSchema,
  courseSchema,
  enrollSchema,
  subjectSchema,
} from "@/lib/academic/schemas";
import type { ActionResult } from "@/app/actions/auth";

async function ensurePermission(
  required: Permission[],
): Promise<{ ok: true } | { ok: false; result: ActionResult }> {
  const profile = await getProfile();
  if (!profile) {
    return { ok: false, result: { error: "Sessão expirada." } };
  }
  const allowed = required.some((p) => hasPermission(profile.role, p));
  if (!allowed) {
    return { ok: false, result: { error: "Você não tem permissão para esta ação." } };
  }
  return { ok: true };
}

export async function createCourseAction(values: {
  name: string;
  description?: string;
}): Promise<ActionResult> {
  const guard = await ensurePermission(["academic.manage"]);
  if (!guard.ok) return guard.result;

  const parsed = courseSchema.safeParse(values);
  if (!parsed.success) return { error: "Dados inválidos." };

  const supabase = await createClient();
  const { error } = await supabase.from("courses").insert({
    name: parsed.data.name,
    description: parsed.data.description || "",
  });
  if (error) return { error: "Não foi possível criar o curso." };

  revalidatePath("/dashboard/academico/cursos");
  revalidatePath("/dashboard/academico");
  return { success: true };
}

export async function createSubjectAction(values: {
  name: string;
  code?: string;
}): Promise<ActionResult> {
  const guard = await ensurePermission(["academic.manage"]);
  if (!guard.ok) return guard.result;

  const parsed = subjectSchema.safeParse(values);
  if (!parsed.success) return { error: "Dados inválidos." };

  const supabase = await createClient();
  const { error } = await supabase.from("subjects").insert({
    name: parsed.data.name,
    code: parsed.data.code || null,
  });
  if (error) {
    return {
      error: error.code === "23505"
        ? "Já existe uma disciplina com esse código."
        : "Não foi possível criar a disciplina.",
    };
  }

  revalidatePath("/dashboard/academico/disciplinas");
  revalidatePath("/dashboard/academico");
  return { success: true };
}

export async function createClassAction(values: {
  name: string;
  course_id: string;
  year: number;
  shift: string;
}): Promise<ActionResult> {
  const guard = await ensurePermission(["classes.manage", "academic.manage"]);
  if (!guard.ok) return guard.result;

  const parsed = classSchema.safeParse(values);
  if (!parsed.success) return { error: "Dados inválidos." };

  const supabase = await createClient();
  const { error } = await supabase.from("classes").insert({
    name: parsed.data.name,
    course_id: parsed.data.course_id,
    year: parsed.data.year,
    shift: parsed.data.shift,
  });
  if (error) {
    return {
      error: error.code === "23505"
        ? "Já existe uma turma com esse nome neste ano."
        : "Não foi possível criar a turma.",
    };
  }

  revalidatePath("/dashboard/academico/turmas");
  revalidatePath("/dashboard/academico");
  return { success: true };
}

export async function enrollStudentAction(values: {
  class_id: string;
  student_id: string;
}): Promise<ActionResult> {
  const guard = await ensurePermission(["academic.manage"]);
  if (!guard.ok) return guard.result;

  const parsed = enrollSchema.safeParse(values);
  if (!parsed.success) return { error: "Dados inválidos." };

  const supabase = await createClient();
  const { error } = await supabase.from("enrollments").insert({
    class_id: parsed.data.class_id,
    student_id: parsed.data.student_id,
  });
  if (error) {
    return {
      error: error.code === "23505"
        ? "Este aluno já está matriculado nesta turma."
        : "Não foi possível matricular o aluno.",
    };
  }

  revalidatePath(`/dashboard/academico/turmas/${parsed.data.class_id}`);
  return { success: true };
}

export async function removeEnrollmentAction(values: {
  id: string;
  class_id: string;
}): Promise<ActionResult> {
  const guard = await ensurePermission(["academic.manage"]);
  if (!guard.ok) return guard.result;

  const supabase = await createClient();
  const { error } = await supabase.from("enrollments").delete().eq("id", values.id);
  if (error) return { error: "Não foi possível remover a matrícula." };

  revalidatePath(`/dashboard/academico/turmas/${values.class_id}`);
  return { success: true };
}

export async function assignTeacherAction(values: {
  class_id: string;
  teacher_id: string;
  subject_id: string;
}): Promise<ActionResult> {
  const guard = await ensurePermission(["classes.manage", "academic.manage"]);
  if (!guard.ok) return guard.result;

  const parsed = assignTeacherSchema.safeParse(values);
  if (!parsed.success) return { error: "Dados inválidos." };

  const supabase = await createClient();
  const { error } = await supabase.from("teacher_assignments").insert({
    class_id: parsed.data.class_id,
    teacher_id: parsed.data.teacher_id,
    subject_id: parsed.data.subject_id,
  });
  if (error) {
    return {
      error: error.code === "23505"
        ? "Este professor já leciona esta disciplina nesta turma."
        : "Não foi possível vincular o professor.",
    };
  }

  revalidatePath(`/dashboard/academico/turmas/${parsed.data.class_id}`);
  return { success: true };
}

export async function removeAssignmentAction(values: {
  id: string;
  class_id: string;
}): Promise<ActionResult> {
  const guard = await ensurePermission(["classes.manage", "academic.manage"]);
  if (!guard.ok) return guard.result;

  const supabase = await createClient();
  const { error } = await supabase
    .from("teacher_assignments")
    .delete()
    .eq("id", values.id);
  if (error) return { error: "Não foi possível remover o vínculo." };

  revalidatePath(`/dashboard/academico/turmas/${values.class_id}`);
  return { success: true };
}
