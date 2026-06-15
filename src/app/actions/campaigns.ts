"use server";

// =============================================================================
// Server Actions — Campanhas / Sorteios / Desafios
// =============================================================================
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import {
  campaignSchema,
  levelSchema,
  participantSchema,
  progressSchema,
  type CampaignInput,
  type ParticipantInput,
} from "@/lib/campaigns/schemas";
import type { ActionResult } from "@/app/actions/auth";

async function guard() {
  const profile = await getProfile();
  if (!profile || !hasPermission(profile.role, "campaigns.manage")) return null;
  return profile;
}

// --- Campanha ----------------------------------------------------------------
function campaignPayload(v: CampaignInput) {
  return {
    name: v.name,
    description: v.description || null,
    start_date: v.start_date || null,
    end_date: v.end_date || null,
    target_audience: v.target_audience || null,
    rules: v.rules || null,
    prizes: v.prizes || null,
    status: v.status,
  };
}

export async function createCampaignAction(values: CampaignInput): Promise<ActionResult> {
  if (!(await guard())) return { error: "Sem permissão." };
  const parsed = campaignSchema.safeParse(values);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Verifique os campos." };
  const supabase = await createClient();
  const { data, error } = await supabase.from("campaigns").insert(campaignPayload(parsed.data)).select("id").single();
  if (error || !data) return { error: "Não foi possível criar a campanha." };
  revalidatePath("/dashboard/campanhas");
  redirect(`/dashboard/campanhas/${data.id}`);
}

export async function updateCampaignAction(id: string, values: CampaignInput): Promise<ActionResult> {
  if (!(await guard())) return { error: "Sem permissão." };
  const parsed = campaignSchema.safeParse(values);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Verifique os campos." };
  const supabase = await createClient();
  const { error } = await supabase.from("campaigns").update(campaignPayload(parsed.data)).eq("id", id);
  if (error) return { error: "Não foi possível salvar a campanha." };
  revalidatePath(`/dashboard/campanhas/${id}`);
  redirect(`/dashboard/campanhas/${id}`);
}

export async function deleteCampaignAction(values: { id: string }): Promise<ActionResult> {
  if (!(await guard())) return { error: "Sem permissão." };
  const supabase = await createClient();
  const { error } = await supabase.from("campaigns").delete().eq("id", values.id);
  if (error) return { error: "Não foi possível excluir a campanha." };
  revalidatePath("/dashboard/campanhas");
  redirect("/dashboard/campanhas");
}

// --- Níveis ------------------------------------------------------------------
export async function saveLevelAction(input: {
  id?: string;
  campaign_id: string;
  name: string;
  description?: string;
  difficulty: string;
  order_index?: string;
}): Promise<ActionResult> {
  if (!(await guard())) return { error: "Sem permissão." };
  const parsed = levelSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  const supabase = await createClient();
  const base = {
    campaign_id: parsed.data.campaign_id,
    name: parsed.data.name,
    description: parsed.data.description || null,
    difficulty: parsed.data.difficulty,
    order_index: parsed.data.order_index ? Number(parsed.data.order_index) : 0,
  };
  const { error } = input.id
    ? await supabase.from("campaign_levels").update(base).eq("id", input.id)
    : await supabase.from("campaign_levels").insert(base);
  if (error) return { error: "Não foi possível salvar o nível." };
  revalidatePath(`/dashboard/campanhas/${parsed.data.campaign_id}`);
  return { success: true };
}

export async function deleteLevelAction(values: { id: string; campaignId: string }): Promise<ActionResult> {
  if (!(await guard())) return { error: "Sem permissão." };
  const supabase = await createClient();
  const { error } = await supabase.from("campaign_levels").delete().eq("id", values.id);
  if (error) return { error: "Não foi possível excluir o nível." };
  revalidatePath(`/dashboard/campanhas/${values.campaignId}`);
  return { success: true };
}

// --- Participantes -----------------------------------------------------------
function participantPayload(v: ParticipantInput) {
  return {
    campaign_id: v.campaign_id,
    full_name: v.full_name,
    age: v.age ? Number(v.age) : null,
    phone: v.phone || null,
    father_name: v.father_name || null,
    mother_name: v.mother_name || null,
    guardian_name: v.guardian_name || null,
    school: v.school || null,
    city: v.city || null,
    status: v.status,
  };
}

export async function saveParticipantAction(input: { id?: string } & ParticipantInput): Promise<ActionResult> {
  if (!(await guard())) return { error: "Sem permissão." };
  const parsed = participantSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Verifique os campos." };
  const supabase = await createClient();
  const { error } = input.id
    ? await supabase.from("campaign_participants").update(participantPayload(parsed.data)).eq("id", input.id)
    : await supabase.from("campaign_participants").insert(participantPayload(parsed.data));
  if (error) return { error: "Não foi possível salvar o participante." };
  revalidatePath(`/dashboard/campanhas/${parsed.data.campaign_id}`);
  return { success: true };
}

export async function deleteParticipantAction(values: { id: string; campaignId: string }): Promise<ActionResult> {
  if (!(await guard())) return { error: "Sem permissão." };
  const supabase = await createClient();
  const { error } = await supabase.from("campaign_participants").delete().eq("id", values.id);
  if (error) return { error: "Não foi possível excluir o participante." };
  revalidatePath(`/dashboard/campanhas/${values.campaignId}`);
  return { success: true };
}

/** Registra a conclusão de um nível e recalcula nível atual/status do participante. */
export async function completeLevelAction(values: {
  participant_id: string;
  level_id: string;
  campaign_id: string;
  score?: string;
  notes?: string;
}): Promise<ActionResult> {
  if (!(await guard())) return { error: "Sem permissão." };
  const parsed = progressSchema.safeParse(values);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  const supabase = await createClient();

  const { error: progErr } = await supabase.from("campaign_progress").upsert(
    {
      participant_id: parsed.data.participant_id,
      level_id: parsed.data.level_id,
      score: parsed.data.score ? Number(parsed.data.score) : null,
      notes: parsed.data.notes || null,
    },
    { onConflict: "participant_id,level_id" },
  );
  if (progErr) return { error: "Não foi possível registrar a conclusão." };

  // Recalcula nível atual (nº de níveis concluídos) e status.
  const [{ count: done }, { count: total }] = await Promise.all([
    supabase.from("campaign_progress").select("*", { count: "exact", head: true }).eq("participant_id", parsed.data.participant_id),
    supabase.from("campaign_levels").select("*", { count: "exact", head: true }).eq("campaign_id", values.campaign_id),
  ]);
  const completed = done ?? 0;
  const status = total != null && completed >= total ? "concluido" : "em_andamento";
  await supabase
    .from("campaign_participants")
    .update({ current_level: completed, status })
    .eq("id", parsed.data.participant_id);

  revalidatePath(`/dashboard/campanhas/${values.campaign_id}`);
  return { success: true };
}

export async function setEligibleAction(values: {
  id: string;
  campaignId: string;
  eligible: boolean;
}): Promise<ActionResult> {
  if (!(await guard())) return { error: "Sem permissão." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("campaign_participants")
    .update({ eligible_for_draw: values.eligible })
    .eq("id", values.id);
  if (error) return { error: "Não foi possível atualizar a elegibilidade." };
  revalidatePath(`/dashboard/campanhas/${values.campaignId}`);
  return { success: true };
}

export async function setWinnerAction(values: {
  id: string;
  campaignId: string;
  isWinner: boolean;
}): Promise<ActionResult> {
  if (!(await guard())) return { error: "Sem permissão." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("campaign_participants")
    .update({ is_winner: values.isWinner })
    .eq("id", values.id);
  if (error) return { error: "Não foi possível registrar o ganhador." };
  revalidatePath(`/dashboard/campanhas/${values.campaignId}`);
  return { success: true };
}
