"use server";

// =============================================================================
// Server Actions — Aula-Teste: Configurações (cabeçalho, pesos, critérios)
// =============================================================================
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import type { ActionResult } from "@/app/actions/auth";
import type {
  AtProcessStatus,
  AtReportUpdate,
  AtCandidateUpdate,
  AtAttachmentKind,
} from "@/types/models";
import {
  atSettingsSchema,
  atWeightsSchema,
  atCriterionSchema,
  reportCreateSchema,
  type AtSettingsInput,
  type AtWeightsInput,
  type AtCriterionInput,
  type ReportCreateInput,
} from "@/lib/aula-teste/schemas";

async function guard() {
  const profile = await getProfile();
  if (!profile || !hasPermission(profile.role, "aulateste.manage")) return null;
  return profile;
}

const CFG_PATH = "/dashboard/configuracoes/aula-teste";

// --- Cabeçalho institucional --------------------------------------------------
export async function updateAtSettingsAction(values: AtSettingsInput): Promise<ActionResult> {
  const profile = await guard();
  if (!profile) return { error: "Sem permissão." };
  const parsed = atSettingsSchema.safeParse(values);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Verifique os campos." };
  const supabase = await createClient();
  const v = parsed.data;
  const { error } = await supabase
    .from("at_settings")
    .update({
      institution_name: v.institution_name,
      cnpj: v.cnpj || null,
      address: v.address || null,
      phone: v.phone || null,
      email: v.email || null,
      sector: v.sector || null,
      updated_by: profile.id,
    })
    .eq("id", true);
  if (error) return { error: "Não foi possível salvar as configurações." };
  revalidatePath(CFG_PATH);
  return { success: true };
}

export async function updateAtLogoAction(path: string | null): Promise<ActionResult> {
  const profile = await guard();
  if (!profile) return { error: "Sem permissão." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("at_settings")
    .update({ logo_path: path, updated_by: profile.id })
    .eq("id", true);
  if (error) return { error: "Não foi possível atualizar o logotipo." };
  revalidatePath(CFG_PATH);
  return { success: true };
}

// --- Pesos --------------------------------------------------------------------
export async function updateAtWeightsAction(values: AtWeightsInput): Promise<ActionResult> {
  const profile = await guard();
  if (!profile) return { error: "Sem permissão." };
  const parsed = atWeightsSchema.safeParse(values);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Pesos inválidos." };
  const weights = Object.fromEntries(
    Object.entries(parsed.data).map(([k, v]) => [k, Number(v)]),
  );
  const supabase = await createClient();
  const { error } = await supabase
    .from("at_settings")
    .update({ default_weights: weights, updated_by: profile.id })
    .eq("id", true);
  if (error) return { error: "Não foi possível salvar os pesos." };
  revalidatePath(CFG_PATH);
  return { success: true };
}

// --- Critérios ----------------------------------------------------------------
export async function saveAtCriterionAction(input: AtCriterionInput): Promise<ActionResult> {
  if (!(await guard())) return { error: "Sem permissão." };
  const parsed = atCriterionSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  const supabase = await createClient();

  if (parsed.data.id) {
    const { error } = await supabase
      .from("at_criteria")
      .update({ label: parsed.data.label })
      .eq("id", parsed.data.id);
    if (error) return { error: "Não foi possível salvar o critério." };
  } else {
    // Próximo order_index dentro da seção.
    const { data: last } = await supabase
      .from("at_criteria")
      .select("order_index")
      .eq("section", parsed.data.section)
      .order("order_index", { ascending: false })
      .limit(1)
      .maybeSingle();
    const nextOrder = (last?.order_index ?? 0) + 1;
    const { error } = await supabase
      .from("at_criteria")
      .insert({ section: parsed.data.section, label: parsed.data.label, order_index: nextOrder });
    if (error) return { error: "Não foi possível adicionar o critério." };
  }
  revalidatePath(CFG_PATH);
  return { success: true };
}

export async function toggleAtCriterionAction(values: {
  id: string;
  active: boolean;
}): Promise<ActionResult> {
  if (!(await guard())) return { error: "Sem permissão." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("at_criteria")
    .update({ active: values.active })
    .eq("id", values.id);
  if (error) return { error: "Não foi possível atualizar o critério." };
  revalidatePath(CFG_PATH);
  return { success: true };
}

// --- Relatórios: criar / excluir / situação -----------------------------------
const LIST_PATH = "/dashboard/aula-teste";

export async function createReportAction(values: ReportCreateInput): Promise<ActionResult> {
  const profile = await guard();
  if (!profile) return { error: "Sem permissão." };
  const parsed = reportCreateSchema.safeParse(values);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Verifique os campos." };
  const supabase = await createClient();
  const v = parsed.data;

  const { data: cand, error: candErr } = await supabase
    .from("at_candidates")
    .insert({
      full_name: v.full_name,
      cpf: v.cpf || null,
      email: v.email || null,
      phone: v.phone || null,
      created_by: profile.id,
    })
    .select("id")
    .single();
  if (candErr || !cand) return { error: "Não foi possível cadastrar o candidato." };

  const year = new Date().getFullYear();
  const { count } = await supabase
    .from("at_reports")
    .select("*", { count: "exact", head: true })
    .ilike("code", `AT-${year}-%`);
  const code = `AT-${year}-${String((count ?? 0) + 1).padStart(4, "0")}`;

  const { data: report, error: repErr } = await supabase
    .from("at_reports")
    .insert({
      code,
      candidate_id: cand.id,
      position_title: v.position_title || null,
      discipline: v.discipline || null,
      unit_id: v.unit_id || null,
      modality: v.modality || null,
      test_date: v.test_date || null,
      created_by: profile.id,
    })
    .select("id")
    .single();
  if (repErr || !report) return { error: "Não foi possível criar o relatório." };

  await supabase.from("at_logs").insert({
    report_id: report.id,
    actor_id: profile.id,
    action: "report.created",
    detail: code,
  });

  revalidatePath(LIST_PATH);
  redirect(`${LIST_PATH}/${report.id}`);
}

export async function deleteReportAction(values: { id: string }): Promise<ActionResult> {
  const profile = await guard();
  if (!profile) return { error: "Sem permissão." };
  const supabase = await createClient();
  const { error } = await supabase.from("at_reports").delete().eq("id", values.id);
  if (error) return { error: "Não foi possível excluir o relatório." };
  revalidatePath(LIST_PATH);
  redirect(LIST_PATH);
}

export async function setReportProcessStatusAction(values: {
  id: string;
  status: AtProcessStatus;
}): Promise<ActionResult> {
  const profile = await guard();
  if (!profile) return { error: "Sem permissão." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("at_reports")
    .update({ process_status: values.status })
    .eq("id", values.id);
  if (error) return { error: "Não foi possível atualizar a situação." };
  await supabase.from("at_logs").insert({
    report_id: values.id,
    actor_id: profile.id,
    action: "process_status.changed",
    detail: values.status,
  });
  revalidatePath(`${LIST_PATH}/${values.id}`);
  return { success: true };
}

// =============================================================================
// Wizard (M4): atualização de candidato, campos do relatório e anexos
// =============================================================================

// Colunas do relatório editáveis pelo wizard, agrupadas por tratamento de valor.
const REPORT_TEXT_FIELDS = new Set([
  "position_title", "modality", "discipline", "theme", "content", "location",
  "available_resources", "used_resources", "evaluators_present", "age_group",
  "resume_summary", "resume_notes", "start_time", "end_time", "test_modality",
  "notes",
]);
const REPORT_UUID_FIELDS = new Set(["unit_id", "class_id"]);
const REPORT_DATE_FIELDS = new Set(["test_date", "resume_sent_at"]);
const REPORT_NUMBER_FIELDS = new Set(["duration_minutes", "students_present", "wizard_step"]);

type ReportPatch = Record<string, unknown>;

export async function updateReportAction(reportId: string, patch: ReportPatch): Promise<ActionResult> {
  if (!(await guard())) return { error: "Sem permissão." };
  const supabase = await createClient();
  const update: Record<string, unknown> = {};

  for (const [key, raw] of Object.entries(patch)) {
    if (key === "lesson_plan") {
      update.lesson_plan = raw ?? {};
    } else if (REPORT_NUMBER_FIELDS.has(key)) {
      const n = raw === "" || raw == null ? null : Number(raw);
      update[key] = Number.isFinite(n as number) ? n : null;
    } else if (REPORT_UUID_FIELDS.has(key) || REPORT_DATE_FIELDS.has(key) || REPORT_TEXT_FIELDS.has(key)) {
      update[key] = raw === "" || raw == null ? null : raw;
    }
    // chaves fora da allowlist são ignoradas (segurança)
  }

  if (Object.keys(update).length === 0) return { success: true };
  const { error } = await supabase.from("at_reports").update(update as unknown as AtReportUpdate).eq("id", reportId);
  if (error) return { error: "Não foi possível salvar." };
  revalidatePath(`${LIST_PATH}/${reportId}/editar`);
  return { success: true };
}

const CANDIDATE_FIELDS = new Set([
  "full_name", "cpf", "birth_date", "phone", "email", "address",
  "academic_background", "postgrad", "complementary_courses",
  "professional_experience", "teaching_experience", "disciplines",
  "availability", "observations",
]);

export async function updateCandidateAction(
  candidateId: string,
  patch: Record<string, unknown>,
): Promise<ActionResult> {
  if (!(await guard())) return { error: "Sem permissão." };
  const supabase = await createClient();
  const update: Record<string, unknown> = {};
  for (const [key, raw] of Object.entries(patch)) {
    if (!CANDIDATE_FIELDS.has(key)) continue;
    if (key === "full_name") {
      if (!raw || String(raw).trim().length < 2) return { error: "Informe o nome do candidato." };
      update[key] = String(raw).trim();
    } else {
      update[key] = raw === "" || raw == null ? null : raw;
    }
  }
  if (Object.keys(update).length === 0) return { success: true };
  const { error } = await supabase.from("at_candidates").update(update as unknown as AtCandidateUpdate).eq("id", candidateId);
  if (error) return { error: "Não foi possível salvar o candidato." };
  return { success: true };
}

export async function addAttachmentAction(values: {
  report_id: string;
  kind: string;
  file_path: string;
  file_name: string;
  mime_type?: string | null;
}): Promise<ActionResult> {
  const profile = await guard();
  if (!profile) return { error: "Sem permissão." };
  const supabase = await createClient();
  const { error } = await supabase.from("at_attachments").insert({
    report_id: values.report_id,
    kind: values.kind as AtAttachmentKind,
    file_path: values.file_path,
    file_name: values.file_name,
    mime_type: values.mime_type ?? null,
    uploaded_by: profile.id,
  });
  if (error) return { error: "Não foi possível registrar o anexo." };
  revalidatePath(`${LIST_PATH}/${values.report_id}/editar`);
  return { success: true };
}

export async function deleteAttachmentAction(values: {
  id: string;
  report_id: string;
  file_path: string;
}): Promise<ActionResult> {
  if (!(await guard())) return { error: "Sem permissão." };
  const supabase = await createClient();
  await supabase.storage.from("aula-teste").remove([values.file_path]);
  const { error } = await supabase.from("at_attachments").delete().eq("id", values.id);
  if (error) return { error: "Não foi possível remover o anexo." };
  revalidatePath(`${LIST_PATH}/${values.report_id}/editar`);
  return { success: true };
}
