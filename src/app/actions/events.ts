"use server";

// =============================================================================
// Server Actions — Eventos e Palestras
// =============================================================================
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { eventSchema, registrationSchema, type EventInput } from "@/lib/events/schemas";
import type { ActionResult } from "@/app/actions/auth";

function eventPayload(v: EventInput) {
  return {
    name: v.name,
    description: v.description || null,
    date: v.date || null,
    start_time: v.start_time || null,
    end_time: v.end_time || null,
    location: v.location || null,
    target_audience: v.target_audience || null,
    max_registrations: v.max_registrations ? Number(v.max_registrations) : null,
    responsible_user_id: v.responsible_user_id || null,
    status: v.status,
  };
}

// --- CRUD (interno) ----------------------------------------------------------
export async function createEventAction(values: EventInput): Promise<ActionResult> {
  const profile = await getProfile();
  if (!profile || !hasPermission(profile.role, "leads.manage")) return { error: "Sem permissão." };
  const parsed = eventSchema.safeParse(values);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Verifique os campos." };
  const supabase = await createClient();
  const { data, error } = await supabase.from("events").insert(eventPayload(parsed.data)).select("id").single();
  if (error || !data) return { error: "Não foi possível criar o evento." };
  revalidatePath("/dashboard/eventos");
  redirect(`/dashboard/eventos/${data.id}`);
}

export async function updateEventAction(id: string, values: EventInput): Promise<ActionResult> {
  const profile = await getProfile();
  if (!profile || !hasPermission(profile.role, "leads.manage")) return { error: "Sem permissão." };
  const parsed = eventSchema.safeParse(values);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Verifique os campos." };
  const supabase = await createClient();
  const { error } = await supabase.from("events").update(eventPayload(parsed.data)).eq("id", id);
  if (error) return { error: "Não foi possível salvar o evento." };
  revalidatePath("/dashboard/eventos");
  revalidatePath(`/dashboard/eventos/${id}`);
  redirect(`/dashboard/eventos/${id}`);
}

export async function deleteEventAction(values: { id: string }): Promise<ActionResult> {
  const profile = await getProfile();
  if (!profile || !hasPermission(profile.role, "leads.manage")) return { error: "Sem permissão." };
  const supabase = await createClient();
  const { error } = await supabase.from("events").delete().eq("id", values.id);
  if (error) return { error: "Não foi possível excluir o evento." };
  revalidatePath("/dashboard/eventos");
  redirect("/dashboard/eventos");
}

// --- Presença e conversões ---------------------------------------------------
export async function setAttendanceAction(values: {
  registrationId: string;
  eventId: string;
  attended: boolean;
}): Promise<ActionResult> {
  const profile = await getProfile();
  if (!profile || !hasPermission(profile.role, "leads.manage")) return { error: "Sem permissão." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("event_registrations")
    .update({ attended: values.attended })
    .eq("id", values.registrationId);
  if (error) return { error: "Não foi possível atualizar a presença." };
  revalidatePath(`/dashboard/eventos/${values.eventId}`);
  return { success: true };
}

export async function convertRegistrationToLeadAction(values: {
  registrationId: string;
  eventId: string;
}): Promise<ActionResult> {
  const profile = await getProfile();
  if (!profile || !hasPermission(profile.role, "leads.manage")) return { error: "Sem permissão." };
  const supabase = await createClient();
  const { data: reg } = await supabase
    .from("event_registrations")
    .select("*")
    .eq("id", values.registrationId)
    .maybeSingle();
  if (!reg) return { error: "Inscrição não encontrada." };
  if (reg.converted_to_lead) return { error: "Já convertido em lead." };

  const { data: lead, error: leadErr } = await supabase
    .from("leads")
    .insert({
      full_name: reg.full_name,
      phone: reg.phone,
      email: reg.email,
      age: reg.age,
      guardian_name: reg.guardian_name,
      course_interest: reg.course_interest,
      city: reg.city,
      source: "evento",
      status: "novo",
      notes: reg.notes,
    })
    .select("id")
    .single();
  if (leadErr || !lead) return { error: "Não foi possível criar o lead." };

  await supabase
    .from("event_registrations")
    .update({ converted_to_lead: true, lead_id: lead.id })
    .eq("id", values.registrationId);
  revalidatePath(`/dashboard/eventos/${values.eventId}`);
  return { success: true };
}

export async function convertRegistrationToStudentAction(values: {
  registrationId: string;
  eventId: string;
}): Promise<ActionResult> {
  const profile = await getProfile();
  if (!profile || !hasPermission(profile.role, "leads.manage")) return { error: "Sem permissão." };
  if (!hasPermission(profile.role, "students.manage")) {
    return { error: "Seu perfil não pode criar alunos." };
  }
  const supabase = await createClient();
  const { data: reg } = await supabase
    .from("event_registrations")
    .select("*")
    .eq("id", values.registrationId)
    .maybeSingle();
  if (!reg) return { error: "Inscrição não encontrada." };
  if (reg.converted_to_student) return { error: "Já convertido em aluno." };

  const { data: student, error: stErr } = await supabase
    .from("students")
    .insert({
      full_name: reg.full_name,
      phone: reg.phone,
      email: reg.email,
      city: reg.city,
      status: "active",
    })
    .select("id")
    .single();
  if (stErr || !student) return { error: "Não foi possível criar o aluno." };

  await supabase
    .from("event_registrations")
    .update({ converted_to_student: true, student_id: student.id })
    .eq("id", values.registrationId);
  revalidatePath(`/dashboard/eventos/${values.eventId}`);
  return { success: true };
}

// --- Inscrição PÚBLICA (sem login) ------------------------------------------
export async function registerForEventAction(values: {
  event_id: string;
  full_name: string;
  phone?: string;
  email?: string;
  age?: string;
  guardian_name?: string;
  course_interest?: string;
  city?: string;
  school?: string;
  notes?: string;
}): Promise<ActionResult> {
  const parsed = registrationSchema.safeParse(values);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Verifique os campos." };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("register_for_event", {
    p_event: parsed.data.event_id,
    p_full_name: parsed.data.full_name,
    p_phone: parsed.data.phone || undefined,
    p_email: parsed.data.email || undefined,
    p_age: parsed.data.age ? Number(parsed.data.age) : undefined,
    p_guardian: parsed.data.guardian_name || undefined,
    p_course: parsed.data.course_interest || undefined,
    p_city: parsed.data.city || undefined,
    p_school: parsed.data.school || undefined,
    p_notes: parsed.data.notes || undefined,
  });
  if (error) return { error: "Não foi possível concluir a inscrição. Tente novamente." };

  switch (data) {
    case "ok":
      return { success: true };
    case "INSCRICOES_FECHADAS":
      return { error: "As inscrições para este evento estão encerradas." };
    case "LOTADO":
      return { error: "As vagas para este evento se esgotaram." };
    case "NAO_ENCONTRADO":
      return { error: "Evento não encontrado." };
    case "NOME_OBRIGATORIO":
      return { error: "Informe seu nome." };
    default:
      return { error: "Não foi possível concluir a inscrição." };
  }
}
