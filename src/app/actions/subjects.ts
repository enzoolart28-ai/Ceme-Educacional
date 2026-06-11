"use server";

// =============================================================================
// Server Actions — Disciplinas (subjects)
// =============================================================================
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { subjectSchema, type SubjectInput } from "@/lib/subjects/schemas";
import type { ActionResult } from "@/app/actions/auth";

async function canManage(): Promise<boolean> {
  const profile = await getProfile();
  return (
    !!profile &&
    (hasPermission(profile.role, "academic.manage") ||
      hasPermission(profile.role, "curriculum.manage"))
  );
}

function toPayload(v: SubjectInput) {
  return {
    name: v.name,
    code: v.code || null,
    description: v.description || null,
    workload_hours: v.workload_hours ? Number(v.workload_hours) : null,
    status: v.status,
  };
}

export async function createSubjectAction(values: SubjectInput): Promise<ActionResult> {
  if (!(await canManage())) return { error: "Você não tem permissão para esta ação." };
  const parsed = subjectSchema.safeParse(values);
  if (!parsed.success) return { error: "Verifique os campos do formulário." };

  const supabase = await createClient();
  const { error } = await supabase.from("subjects").insert(toPayload(parsed.data));
  if (error) {
    return {
      error: error.code === "23505"
        ? "Já existe uma disciplina com este código."
        : "Não foi possível cadastrar a disciplina.",
    };
  }

  revalidatePath("/dashboard/academico/disciplinas");
  redirect("/dashboard/academico/disciplinas");
}

export async function updateSubjectAction(
  id: string,
  values: SubjectInput,
): Promise<ActionResult> {
  if (!(await canManage())) return { error: "Você não tem permissão para esta ação." };
  const parsed = subjectSchema.safeParse(values);
  if (!parsed.success) return { error: "Verifique os campos do formulário." };

  const supabase = await createClient();
  const { error } = await supabase.from("subjects").update(toPayload(parsed.data)).eq("id", id);
  if (error) {
    return {
      error: error.code === "23505"
        ? "Já existe uma disciplina com este código."
        : "Não foi possível salvar as alterações.",
    };
  }

  revalidatePath("/dashboard/academico/disciplinas");
  redirect("/dashboard/academico/disciplinas");
}

export async function deleteSubjectAction(id: string): Promise<ActionResult> {
  if (!(await canManage())) return { error: "Você não tem permissão para esta ação." };
  const supabase = await createClient();
  const { error } = await supabase.from("subjects").delete().eq("id", id);
  if (error) {
    return {
      error: error.code === "23503"
        ? "Não é possível excluir: a disciplina está vinculada a cursos/turmas."
        : "Não foi possível excluir a disciplina.",
    };
  }
  revalidatePath("/dashboard/academico/disciplinas");
  redirect("/dashboard/academico/disciplinas");
}
