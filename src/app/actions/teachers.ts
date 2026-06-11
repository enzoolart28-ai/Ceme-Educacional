"use server";

// =============================================================================
// Server Actions — Professores (teachers)
// =============================================================================
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import {
  teacherSchema,
  teacherSubjectSchema,
  teacherClassSchema,
  type TeacherInput,
} from "@/lib/teachers/schemas";
import { onlyDigits } from "@/lib/students/cpf";
import type { ActionResult } from "@/app/actions/auth";

async function canManage(): Promise<boolean> {
  const profile = await getProfile();
  return !!profile && hasPermission(profile.role, "teachers.manage");
}

function toPayload(v: TeacherInput) {
  return {
    full_name: v.full_name,
    cpf: v.cpf ? onlyDigits(v.cpf) : null,
    rg: v.rg || null,
    phone: v.phone || null,
    email: v.email || null,
    education: v.education || null,
    expertise_area: v.expertise_area || null,
    workload: v.workload ? Number(v.workload) : null,
    status: v.status,
    notes: v.notes || null,
  };
}

export async function createTeacherAction(values: TeacherInput): Promise<ActionResult> {
  if (!(await canManage())) return { error: "Você não tem permissão para esta ação." };
  const parsed = teacherSchema.safeParse(values);
  if (!parsed.success) return { error: "Verifique os campos do formulário." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("teachers")
    .insert(toPayload(parsed.data))
    .select("id")
    .single();
  if (error) {
    return {
      error: error.code === "23505"
        ? "Já existe um professor com este CPF."
        : "Não foi possível cadastrar o professor.",
    };
  }

  revalidatePath("/dashboard/professores");
  redirect(`/dashboard/professores/${data.id}`);
}

export async function updateTeacherAction(
  id: string,
  values: TeacherInput,
): Promise<ActionResult> {
  if (!(await canManage())) return { error: "Você não tem permissão para esta ação." };
  const parsed = teacherSchema.safeParse(values);
  if (!parsed.success) return { error: "Verifique os campos do formulário." };

  const supabase = await createClient();
  const { error } = await supabase.from("teachers").update(toPayload(parsed.data)).eq("id", id);
  if (error) {
    return {
      error: error.code === "23505"
        ? "Já existe um professor com este CPF."
        : "Não foi possível salvar as alterações.",
    };
  }

  revalidatePath(`/dashboard/professores/${id}`);
  revalidatePath("/dashboard/professores");
  redirect(`/dashboard/professores/${id}`);
}

export async function deleteTeacherAction(id: string): Promise<ActionResult> {
  if (!(await canManage())) return { error: "Você não tem permissão para esta ação." };
  const supabase = await createClient();
  const { error } = await supabase.from("teachers").delete().eq("id", id);
  if (error) return { error: "Não foi possível excluir o professor." };

  revalidatePath("/dashboard/professores");
  redirect("/dashboard/professores");
}

export async function linkSubjectAction(values: {
  teacher_id: string;
  subject_id: string;
}): Promise<ActionResult> {
  if (!(await canManage())) return { error: "Você não tem permissão para esta ação." };
  const parsed = teacherSubjectSchema.safeParse(values);
  if (!parsed.success) return { error: "Dados inválidos." };

  const supabase = await createClient();
  const { error } = await supabase.from("teacher_subjects").insert({
    teacher_id: parsed.data.teacher_id,
    subject_id: parsed.data.subject_id,
  });
  if (error) {
    return {
      error: error.code === "23505"
        ? "Esta disciplina já está vinculada."
        : "Não foi possível vincular a disciplina.",
    };
  }
  revalidatePath(`/dashboard/professores/${parsed.data.teacher_id}`);
  return { success: true };
}

export async function unlinkSubjectAction(values: {
  id: string;
  teacher_id: string;
}): Promise<ActionResult> {
  if (!(await canManage())) return { error: "Você não tem permissão para esta ação." };
  const supabase = await createClient();
  const { error } = await supabase.from("teacher_subjects").delete().eq("id", values.id);
  if (error) return { error: "Não foi possível remover a disciplina." };
  revalidatePath(`/dashboard/professores/${values.teacher_id}`);
  return { success: true };
}

export async function linkClassAction(values: {
  teacher_id: string;
  class_id: string;
}): Promise<ActionResult> {
  if (!(await canManage())) return { error: "Você não tem permissão para esta ação." };
  const parsed = teacherClassSchema.safeParse(values);
  if (!parsed.success) return { error: "Dados inválidos." };

  const supabase = await createClient();
  const { error } = await supabase.from("teacher_classes").insert({
    teacher_id: parsed.data.teacher_id,
    class_id: parsed.data.class_id,
  });
  if (error) {
    return {
      error: error.code === "23505"
        ? "Esta turma já está vinculada."
        : "Não foi possível vincular a turma.",
    };
  }
  revalidatePath(`/dashboard/professores/${parsed.data.teacher_id}`);
  return { success: true };
}

export async function unlinkClassAction(values: {
  id: string;
  teacher_id: string;
}): Promise<ActionResult> {
  if (!(await canManage())) return { error: "Você não tem permissão para esta ação." };
  const supabase = await createClient();
  const { error } = await supabase.from("teacher_classes").delete().eq("id", values.id);
  if (error) return { error: "Não foi possível remover a turma." };
  revalidatePath(`/dashboard/professores/${values.teacher_id}`);
  return { success: true };
}
