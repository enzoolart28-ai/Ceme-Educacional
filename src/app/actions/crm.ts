"use server";

// =============================================================================
// Server Actions — Comercial / CRM
// =============================================================================
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { leadSchema, interactionSchema, type LeadInput } from "@/lib/crm/schemas";
import type { ActionResult } from "@/app/actions/auth";
import type { LeadStatus } from "@/types/models";

function leadPayload(v: LeadInput) {
  return {
    full_name: v.full_name,
    phone: v.phone || null,
    email: v.email || null,
    age: v.age ? Number(v.age) : null,
    guardian_name: v.guardian_name || null,
    course_interest: v.course_interest || null,
    source: v.source,
    city: v.city || null,
    status: v.status,
    notes: v.notes || null,
  };
}

export async function createLeadAction(values: LeadInput): Promise<ActionResult> {
  const profile = await getProfile();
  if (!profile || !hasPermission(profile.role, "leads.manage")) return { error: "Sem permissão." };
  const parsed = leadSchema.safeParse(values);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Verifique os campos." };

  const supabase = await createClient();
  const { data, error } = await supabase.from("leads").insert(leadPayload(parsed.data)).select("id").single();
  if (error || !data) return { error: "Não foi possível cadastrar o lead." };
  revalidatePath("/dashboard/crm");
  redirect(`/dashboard/crm/${data.id}`);
}

export async function updateLeadAction(id: string, values: LeadInput): Promise<ActionResult> {
  const profile = await getProfile();
  if (!profile || !hasPermission(profile.role, "leads.manage")) return { error: "Sem permissão." };
  const parsed = leadSchema.safeParse(values);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Verifique os campos." };

  const supabase = await createClient();
  const { error } = await supabase.from("leads").update(leadPayload(parsed.data)).eq("id", id);
  if (error) return { error: "Não foi possível salvar o lead." };
  revalidatePath("/dashboard/crm");
  revalidatePath(`/dashboard/crm/${id}`);
  redirect(`/dashboard/crm/${id}`);
}

export async function setLeadStatusAction(values: { id: string; status: string }): Promise<ActionResult> {
  const profile = await getProfile();
  if (!profile || !hasPermission(profile.role, "leads.manage")) return { error: "Sem permissão." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("leads")
    .update({ status: values.status as LeadStatus })
    .eq("id", values.id);
  if (error) return { error: "Não foi possível alterar o status." };
  revalidatePath("/dashboard/crm");
  revalidatePath(`/dashboard/crm/${values.id}`);
  return { success: true };
}

export async function deleteLeadAction(values: { id: string }): Promise<ActionResult> {
  const profile = await getProfile();
  if (!profile || profile.role !== "admin") return { error: "Apenas o administrador pode excluir leads." };
  const supabase = await createClient();
  const { error } = await supabase.from("leads").delete().eq("id", values.id);
  if (error) return { error: "Não foi possível excluir o lead." };
  revalidatePath("/dashboard/crm");
  redirect("/dashboard/crm");
}

export async function addInteractionAction(values: {
  lead_id: string;
  interaction_type: string;
  description?: string;
  next_contact_at?: string;
}): Promise<ActionResult> {
  const profile = await getProfile();
  if (!profile || !hasPermission(profile.role, "leads.manage")) return { error: "Sem permissão." };
  const parsed = interactionSchema.safeParse(values);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  const supabase = await createClient();
  const { error } = await supabase.from("lead_interactions").insert({
    lead_id: parsed.data.lead_id,
    user_id: profile.id,
    interaction_type: parsed.data.interaction_type,
    description: parsed.data.description || null,
    next_contact_at: parsed.data.next_contact_at || null,
  });
  if (error) return { error: "Não foi possível registrar o atendimento." };
  revalidatePath(`/dashboard/crm/${parsed.data.lead_id}`);
  return { success: true };
}

/** Converte o lead em aluno (e, se informado, vincula a uma turma = matrícula). */
export async function convertLeadAction(values: {
  leadId: string;
  classId?: string;
}): Promise<ActionResult> {
  const profile = await getProfile();
  if (!profile || !hasPermission(profile.role, "leads.manage")) return { error: "Sem permissão." };
  if (!hasPermission(profile.role, "students.manage")) {
    return { error: "Seu perfil não pode criar alunos. Peça à secretaria/direção." };
  }

  const supabase = await createClient();
  const { data: lead } = await supabase.from("leads").select("*").eq("id", values.leadId).maybeSingle();
  if (!lead) return { error: "Lead não encontrado." };
  if (lead.converted_student_id) return { error: "Este lead já foi convertido em aluno." };

  const { data: student, error: stErr } = await supabase
    .from("students")
    .insert({
      full_name: lead.full_name,
      phone: lead.phone,
      email: lead.email,
      city: lead.city,
      notes: lead.notes,
      status: "active",
    })
    .select("id")
    .single();
  if (stErr || !student) return { error: "Não foi possível criar o aluno." };

  if (values.classId) {
    await supabase.from("class_students").insert({
      class_id: values.classId,
      student_id: student.id,
      status: "active",
    });
  }

  await supabase
    .from("leads")
    .update({ status: "matriculado", converted_student_id: student.id })
    .eq("id", values.leadId);

  await supabase.from("lead_interactions").insert({
    lead_id: values.leadId,
    user_id: profile.id,
    interaction_type: "observacao",
    description: values.classId ? "Convertido em matrícula (aluno + turma)." : "Convertido em aluno.",
  });

  revalidatePath("/dashboard/crm");
  revalidatePath(`/dashboard/crm/${values.leadId}`);
  return { success: true };
}
