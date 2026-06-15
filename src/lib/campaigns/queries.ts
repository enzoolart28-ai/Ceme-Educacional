import "server-only";

// =============================================================================
// Consultas do módulo de Campanhas / Sorteios / Desafios (RLS: campaigns.manage)
// =============================================================================
import { createClient } from "@/lib/supabase/server";
import type {
  Campaign,
  CampaignLevel,
  CampaignParticipant,
  CampaignParticipantStatus,
} from "@/types/models";

export interface CampaignRow extends Campaign {
  participantCount: number;
}

export interface ParticipantRow extends CampaignParticipant {
  levelsCompleted: number;
  totalScore: number;
}

export interface ParticipantFilters {
  minAge?: number;
  maxAge?: number;
  school?: string;
  city?: string;
  level?: number;
}

export interface CampaignReport {
  total: number;
  eligible: number;
  winners: number;
  byStatus: { status: CampaignParticipantStatus; count: number }[];
  byLevel: { level: number; count: number }[];
}

export async function listCampaigns(): Promise<CampaignRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("campaigns")
    .select("*, participants:campaign_participants(count)")
    .order("created_at", { ascending: false });
  return (data ?? []).map((c) => {
    const row = c as typeof c & { participants: { count: number }[] };
    return { ...(row as unknown as Campaign), participantCount: row.participants?.[0]?.count ?? 0 };
  });
}

export async function getCampaign(id: string): Promise<Campaign | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("campaigns").select("*").eq("id", id).maybeSingle();
  return data ?? null;
}

export async function getCampaignLevels(campaignId: string): Promise<CampaignLevel[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("campaign_levels")
    .select("*")
    .eq("campaign_id", campaignId)
    .order("order_index");
  return data ?? [];
}

export async function getCampaignParticipants(
  campaignId: string,
  filters: ParticipantFilters = {},
): Promise<ParticipantRow[]> {
  const supabase = await createClient();
  let query = supabase
    .from("campaign_participants")
    .select("*")
    .eq("campaign_id", campaignId)
    .order("full_name");

  if (filters.minAge != null) query = query.gte("age", filters.minAge);
  if (filters.maxAge != null) query = query.lte("age", filters.maxAge);
  if (filters.school) query = query.ilike("school", `%${filters.school}%`);
  if (filters.city) query = query.ilike("city", `%${filters.city}%`);
  if (filters.level != null) query = query.eq("current_level", filters.level);

  const { data } = await query;
  const participants = data ?? [];
  if (participants.length === 0) return [];

  const { data: progress } = await supabase
    .from("campaign_progress")
    .select("participant_id, score")
    .in("participant_id", participants.map((p) => p.id));

  const agg = new Map<string, { count: number; score: number }>();
  for (const pr of progress ?? []) {
    const cur = agg.get(pr.participant_id) ?? { count: 0, score: 0 };
    cur.count += 1;
    cur.score += pr.score != null ? Number(pr.score) : 0;
    agg.set(pr.participant_id, cur);
  }

  return participants.map((p) => {
    const a = agg.get(p.id);
    return {
      ...(p as unknown as CampaignParticipant),
      levelsCompleted: a?.count ?? 0,
      totalScore: a?.score ?? 0,
    };
  });
}

export async function getEligibleParticipants(campaignId: string): Promise<CampaignParticipant[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("campaign_participants")
    .select("*")
    .eq("campaign_id", campaignId)
    .eq("eligible_for_draw", true)
    .order("full_name");
  return data ?? [];
}

export async function getCampaignReport(campaignId: string): Promise<CampaignReport> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("campaign_participants")
    .select("status, current_level, eligible_for_draw, is_winner")
    .eq("campaign_id", campaignId);
  const rows = data ?? [];

  const statusMap = new Map<string, number>();
  const levelMap = new Map<number, number>();
  for (const r of rows) {
    statusMap.set(r.status, (statusMap.get(r.status) ?? 0) + 1);
    levelMap.set(r.current_level, (levelMap.get(r.current_level) ?? 0) + 1);
  }

  return {
    total: rows.length,
    eligible: rows.filter((r) => r.eligible_for_draw).length,
    winners: rows.filter((r) => r.is_winner).length,
    byStatus: [...statusMap.entries()].map(([status, count]) => ({
      status: status as CampaignParticipantStatus,
      count,
    })),
    byLevel: [...levelMap.entries()].map(([level, count]) => ({ level, count })).sort((a, b) => a.level - b.level),
  };
}
