"use server";

// =============================================================================
// Server Actions — Turmas (classes)
// =============================================================================
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import {
  classSchema,
  linkClassStudentSchema,
  type ClassInput,
} from "@/lib/classes/schemas";
import type { ActionResult } from "@/app/actions/auth";

async function canManage(): Promise<boolean> {
  const profile = await getProfile();
  return (
    !!profile &&
    (hasPermission(profile.role, "classes.manage") ||
      hasPermission(profile.role, "academic.manage"))
  );
}

function toPayload(v: ClassInput) {
  return {
    name: v.name,
    course_id: v.course_id,
    unit_id: v.unit_id || null,
    shift: v.shift,
    status: v.status,
    year: v.year ? Number(v.year) : new Date().getFullYear(),
    start_date: v.start_date || null,
    end_date: v.end_date || null,
    weekdays: v.weekdays ?? [],
    start_time: v.start_time || null,
    end_time: v.end_time || null,
    main_teacher_id: v.main_teacher_id || null,
    max_students: v.max_students ? Number(v.max_students) : null,
  };
}

export async function createClassAction(values: ClassInput): Promise<ActionResult> {
  if (!(await canManage())) return { error: "Você não tem permissão para esta ação." };
  const parsed = classSchema.safeParse(values);
  if (!parsed.success) return { error: "Verifique os campos da turma." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("classes")
    .insert(toPayload(parsed.data))
    .select("id")
    .single();
  if (error) return { error: "Não foi possível criar a turma." };

  revalidatePath("/dashboard/academico/turmas");
  redirect(`/dashboard/academico/turmas/${data.id}`);
}

export async function updateClassAction(
  id: string,
  values: ClassInput,
): Promise<ActionResult> {
  if (!(await canManage())) return { error: "Você não tem permissão para esta ação." };
  const parsed = classSchema.safeParse(values);
  if (!parsed.success) return { error: "Verifique os campos da turma." };

  const supabase = await createClient();
  const { error } = await supabase.from("classes").update(toPayload(parsed.data)).eq("id", id);
  if (error) return { error: "Não foi possível salvar as alterações." };

  revalidatePath(`/dashboard/academico/turmas/${id}`);
  revalidatePath("/dashboard/academico/turmas");
  redirect(`/dashboard/academico/turmas/${id}`);
}

export async function deleteClassAction(id: string): Promise<ActionResult> {
  if (!(await canManage())) return { error: "Você não tem permissão para esta ação." };
  const supabase = await createClient();
  const { error } = await supabase.from("classes").delete().eq("id", id);
  if (error) return { error: "Não foi possível excluir a turma." };

  revalidatePath("/dashboard/academico/turmas");
  redirect("/dashboard/academico/turmas");
}

/** Vincula um aluno à turma, respeitando o limite (a menos que autorizado). */
export async function linkClassStudentAction(values: {
  class_id: string;
  student_id: string;
  override_limit?: boolean;
}): Promise<ActionResult> {
  if (!(await canManage())) return { error: "Você não tem permissão para esta ação." };
  const parsed = linkClassStudentSchema.safeParse(values);
  if (!parsed.success) return { error: "Dados inválidos." };

  const supabase = await createClient();

  // Verifica o limite máximo de alunos.
  const [{ data: turma }, { count }] = await Promise.all([
    supabase.from("classes").select("max_students").eq("id", parsed.data.class_id).single(),
    supabase
      .from("class_students")
      .select("*", { count: "exact", head: true })
      .eq("class_id", parsed.data.class_id)
      .eq("status", "active"),
  ]);

  const max = turma?.max_students ?? null;
  if (max != null && (count ?? 0) >= max && !parsed.data.override_limit) {
    return {
      error: `Limite de ${max} alunos atingido. Autorize a exceção para continuar.`,
    };
  }

  // Sincroniza com enrollments quando o aluno tem conta de login.
  const { data: student } = await supabase
    .from("students")
    .select("profile_id")
    .eq("id", parsed.data.student_id)
    .single();

  let enrollmentId: string | null = null;
  if (student?.profile_id) {
    const { data: existing } = await supabase
      .from("enrollments")
      .select("id")
      .eq("student_id", student.profile_id)
      .eq("class_id", parsed.data.class_id)
      .maybeSingle();
    if (existing) {
      enrollmentId = existing.id;
    } else {
      const { data: created } = await supabase
        .from("enrollments")
        .insert({ student_id: student.profile_id, class_id: parsed.data.class_id })
        .select("id")
        .single();
      enrollmentId = created?.id ?? null;
    }
  }

  const { error } = await supabase.from("class_students").insert({
    class_id: parsed.data.class_id,
    student_id: parsed.data.student_id,
    enrollment_id: enrollmentId,
    status: "active",
  });
  if (error) {
    return {
      error: error.code === "23505"
        ? "Este aluno já está nesta turma."
        : "Não foi possível vincular o aluno.",
    };
  }

  revalidatePath(`/dashboard/academico/turmas/${parsed.data.class_id}`);
  return { success: true };
}

export async function unlinkClassStudentAction(values: {
  id: string;
  class_id: string;
}): Promise<ActionResult> {
  if (!(await canManage())) return { error: "Você não tem permissão para esta ação." };
  const supabase = await createClient();

  const { data: row } = await supabase
    .from("class_students")
    .select("enrollment_id")
    .eq("id", values.id)
    .single();

  await supabase.from("class_students").delete().eq("id", values.id);
  if (row?.enrollment_id) {
    await supabase.from("enrollments").delete().eq("id", row.enrollment_id);
  }

  revalidatePath(`/dashboard/academico/turmas/${values.class_id}`);
  return { success: true };
}
