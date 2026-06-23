"use server";

// =============================================================================
// Server Actions — Gestão de Alunos
// =============================================================================
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { studentSchema, type StudentInput } from "@/lib/students/schemas";
import { onlyDigits } from "@/lib/students/cpf";
import { generateAutomaticGuardianAccounts } from "@/lib/guardians/automatic-accounts";
import type { ActionResult } from "@/app/actions/auth";
import type { StudentStatus } from "@/types/models";

async function canManage(): Promise<boolean> {
  const profile = await getProfile();
  return !!profile && hasPermission(profile.role, "students.manage");
}

async function isAdmin(): Promise<boolean> {
  const profile = await getProfile();
  return profile?.role === "admin";
}

function toPayload(v: StudentInput) {
  return {
    full_name: v.full_name,
    cpf: v.cpf ? onlyDigits(v.cpf) : null,
    rg: v.rg || null,
    birth_date: v.birth_date || null,
    phone: v.phone || null,
    email: v.email || null,
    address: v.address || null,
    city: v.city || null,
    state: v.state ? v.state.toUpperCase() : null,
    mother_name: v.mother_name || null,
    father_name: v.father_name || null,
    status: v.status,
    notes: v.notes || null,
  };
}

export async function createStudentAction(
  values: StudentInput,
  /** Quando informado, copia os responsáveis deste irmão para o novo aluno. */
  siblingOfId?: string,
): Promise<ActionResult> {
  if (!(await canManage())) return { error: "Você não tem permissão para esta ação." };

  const parsed = studentSchema.safeParse(values);
  if (!parsed.success) return { error: "Verifique os campos do formulário." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("students")
    .insert(toPayload(parsed.data))
    .select("id")
    .single();

  if (error) {
    return {
      error: error.code === "23505"
        ? "Já existe um aluno com este CPF."
        : "Não foi possível cadastrar o aluno.",
    };
  }

  // Vínculo de irmãos: reaproveita os responsáveis do irmão informado.
  if (siblingOfId) {
    const { data: links } = await supabase
      .from("student_guardians")
      .select("guardian_id, is_financial_responsible, is_pedagogical_responsible")
      .eq("student_id", siblingOfId);
    if (links && links.length > 0) {
      await supabase.from("student_guardians").insert(
        links.map((l) => ({
          student_id: data.id,
          guardian_id: l.guardian_id,
          is_financial_responsible: l.is_financial_responsible,
          is_pedagogical_responsible: l.is_pedagogical_responsible,
        })),
      );
    }
  }

  try {
    await generateAutomaticGuardianAccounts([data.id]);
  } catch {
    // O cadastro do aluno permanece valido; a secretaria pode gerar o acesso em lote.
  }

  revalidatePath("/dashboard/alunos");
  redirect(`/dashboard/alunos/${data.id}`);
}

export async function updateStudentAction(
  id: string,
  values: StudentInput,
): Promise<ActionResult> {
  if (!(await canManage())) return { error: "Você não tem permissão para esta ação." };

  const parsed = studentSchema.safeParse(values);
  if (!parsed.success) return { error: "Verifique os campos do formulário." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("students")
    .update(toPayload(parsed.data))
    .eq("id", id);

  if (error) {
    return {
      error: error.code === "23505"
        ? "Já existe um aluno com este CPF."
        : "Não foi possível salvar as alterações.",
    };
  }

  try {
    await generateAutomaticGuardianAccounts([id]);
  } catch {
    // O vinculo pode ser reprocessado pela tela de responsaveis.
  }

  revalidatePath(`/dashboard/alunos/${id}`);
  revalidatePath("/dashboard/alunos");
  redirect(`/dashboard/alunos/${id}`);
}

/** Altera o status (inclui inativar). */
export async function setStudentStatusAction(
  id: string,
  status: StudentStatus,
): Promise<ActionResult> {
  if (!(await canManage())) return { error: "Você não tem permissão para esta ação." };

  const supabase = await createClient();
  const { error } = await supabase.from("students").update({ status }).eq("id", id);
  if (error) return { error: "Não foi possível alterar o status." };

  revalidatePath(`/dashboard/alunos/${id}`);
  revalidatePath("/dashboard/alunos");
  return { success: true };
}

/** Soft-delete: arquiva sem excluir do banco. */
export async function archiveStudentAction(id: string): Promise<ActionResult> {
  if (!(await canManage())) return { error: "Você não tem permissão para esta ação." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("students")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { error: "Não foi possível arquivar o aluno." };

  revalidatePath("/dashboard/alunos");
  redirect("/dashboard/alunos");
}

export async function restoreStudentAction(id: string): Promise<ActionResult> {
  if (!(await canManage())) return { error: "Você não tem permissão para esta ação." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("students")
    .update({ deleted_at: null })
    .eq("id", id);
  if (error) return { error: "Não foi possível restaurar o aluno." };

  revalidatePath(`/dashboard/alunos/${id}`);
  revalidatePath("/dashboard/alunos");
  return { success: true };
}

/** Exclusão PERMANENTE — apenas administrador (confirmação no cliente). */
export async function deleteStudentAction(id: string): Promise<ActionResult> {
  if (!(await isAdmin())) {
    return { error: "Apenas o administrador pode excluir permanentemente." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("students").delete().eq("id", id);
  if (error) return { error: "Não foi possível excluir o aluno." };

  revalidatePath("/dashboard/alunos");
  redirect("/dashboard/alunos");
}
