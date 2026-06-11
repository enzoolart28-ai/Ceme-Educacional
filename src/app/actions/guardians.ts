"use server";

// =============================================================================
// Server Actions — Responsáveis (guardians)
// =============================================================================
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import {
  guardianSchema,
  linkStudentSchema,
  type GuardianInput,
} from "@/lib/guardians/schemas";
import { onlyDigits } from "@/lib/students/cpf";
import type { ActionResult } from "@/app/actions/auth";

async function canManage(): Promise<boolean> {
  const profile = await getProfile();
  return !!profile && hasPermission(profile.role, "guardians.manage");
}

function toPayload(v: GuardianInput) {
  return {
    full_name: v.full_name,
    cpf: v.cpf ? onlyDigits(v.cpf) : null,
    rg: v.rg || null,
    phone: v.phone || null,
    email: v.email || null,
    address: v.address || null,
    city: v.city || null,
    state: v.state ? v.state.toUpperCase() : null,
    kinship: v.kinship || null,
    notes: v.notes || null,
  };
}

export async function createGuardianAction(values: GuardianInput): Promise<ActionResult> {
  if (!(await canManage())) return { error: "Você não tem permissão para esta ação." };

  const parsed = guardianSchema.safeParse(values);
  if (!parsed.success) return { error: "Verifique os campos do formulário." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("guardians")
    .insert(toPayload(parsed.data))
    .select("id")
    .single();

  if (error) {
    return {
      error: error.code === "23505"
        ? "Já existe um responsável com este CPF."
        : "Não foi possível cadastrar o responsável.",
    };
  }

  revalidatePath("/dashboard/responsaveis");
  redirect(`/dashboard/responsaveis/${data.id}`);
}

export async function updateGuardianAction(
  id: string,
  values: GuardianInput,
): Promise<ActionResult> {
  if (!(await canManage())) return { error: "Você não tem permissão para esta ação." };

  const parsed = guardianSchema.safeParse(values);
  if (!parsed.success) return { error: "Verifique os campos do formulário." };

  const supabase = await createClient();
  const { error } = await supabase.from("guardians").update(toPayload(parsed.data)).eq("id", id);

  if (error) {
    return {
      error: error.code === "23505"
        ? "Já existe um responsável com este CPF."
        : "Não foi possível salvar as alterações.",
    };
  }

  revalidatePath(`/dashboard/responsaveis/${id}`);
  revalidatePath("/dashboard/responsaveis");
  redirect(`/dashboard/responsaveis/${id}`);
}

export async function deleteGuardianAction(id: string): Promise<ActionResult> {
  if (!(await canManage())) return { error: "Você não tem permissão para esta ação." };

  const supabase = await createClient();
  const { error } = await supabase.from("guardians").delete().eq("id", id);
  if (error) return { error: "Não foi possível excluir o responsável." };

  revalidatePath("/dashboard/responsaveis");
  redirect("/dashboard/responsaveis");
}

export async function linkStudentAction(values: {
  guardian_id: string;
  student_id: string;
  is_financial_responsible: boolean;
  is_pedagogical_responsible: boolean;
}): Promise<ActionResult> {
  if (!(await canManage())) return { error: "Você não tem permissão para esta ação." };

  const parsed = linkStudentSchema.safeParse(values);
  if (!parsed.success) return { error: "Dados inválidos." };

  const supabase = await createClient();
  const { error } = await supabase.from("student_guardians").insert({
    guardian_id: parsed.data.guardian_id,
    student_id: parsed.data.student_id,
    is_financial_responsible: parsed.data.is_financial_responsible,
    is_pedagogical_responsible: parsed.data.is_pedagogical_responsible,
  });

  if (error) {
    return {
      error: error.code === "23505"
        ? "Este aluno já está vinculado a este responsável."
        : "Não foi possível vincular o aluno.",
    };
  }

  revalidatePath(`/dashboard/responsaveis/${parsed.data.guardian_id}`);
  return { success: true };
}

export async function unlinkStudentAction(values: {
  id: string;
  guardian_id: string;
}): Promise<ActionResult> {
  if (!(await canManage())) return { error: "Você não tem permissão para esta ação." };

  const supabase = await createClient();
  const { error } = await supabase.from("student_guardians").delete().eq("id", values.id);
  if (error) return { error: "Não foi possível remover o vínculo." };

  revalidatePath(`/dashboard/responsaveis/${values.guardian_id}`);
  return { success: true };
}
