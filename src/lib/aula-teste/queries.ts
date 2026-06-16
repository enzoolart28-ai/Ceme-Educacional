import "server-only";

// =============================================================================
// Consultas do módulo de Aula-Teste (RLS: aulateste.manage / evaluate)
// =============================================================================
import { createClient } from "@/lib/supabase/server";
import type {
  AtSettings,
  AtCriterion,
  AtEvaluationType,
  AtReport,
  AtCandidate,
  AtAttachment,
  AtProcessStatus,
  AtReportStatus,
} from "@/types/models";

export async function getAtSettings(): Promise<AtSettings | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("at_settings").select("*").eq("id", true).maybeSingle();
  return data ?? null;
}

/** Gera uma URL assinada (privada) para um caminho no bucket aula-teste. */
export async function getAtFileUrl(path: string | null, expiresIn = 300): Promise<string | null> {
  if (!path) return null;
  const supabase = await createClient();
  const { data } = await supabase.storage.from("aula-teste").createSignedUrl(path, expiresIn);
  return data?.signedUrl ?? null;
}

export async function listAtCriteria(includeInactive = true): Promise<AtCriterion[]> {
  const supabase = await createClient();
  let query = supabase
    .from("at_criteria")
    .select("*")
    .order("section", { ascending: true })
    .order("order_index", { ascending: true });
  if (!includeInactive) query = query.eq("active", true);
  const { data } = await query;
  return data ?? [];
}

/** Agrupa os critérios por seção (mantém a ordem). */
export function groupCriteriaBySection(
  criteria: AtCriterion[],
): Record<AtEvaluationType, AtCriterion[]> {
  const groups = {
    curricular: [],
    plano_aula: [],
    didatica: [],
    dominio: [],
    professor_atual: [],
    comissao: [],
  } as Record<AtEvaluationType, AtCriterion[]>;
  for (const c of criteria) groups[c.section as AtEvaluationType]?.push(c);
  return groups;
}

// =============================================================================
// Relatórios e candidatos
// =============================================================================
export interface ReportRow extends AtReport {
  candidateName: string;
  unitName: string | null;
}

export interface ReportFilters {
  q?: string;
  discipline?: string;
  unitId?: string;
  processStatus?: AtProcessStatus;
  status?: AtReportStatus;
}

export interface ReportDetail {
  report: AtReport;
  candidate: AtCandidate;
  unitName: string | null;
}

export async function listReports(filters: ReportFilters = {}): Promise<ReportRow[]> {
  const supabase = await createClient();
  let query = supabase.from("at_reports").select("*").order("created_at", { ascending: false });
  if (filters.processStatus) query = query.eq("process_status", filters.processStatus);
  if (filters.status) query = query.eq("status", filters.status);
  if (filters.unitId) query = query.eq("unit_id", filters.unitId);
  if (filters.discipline) query = query.ilike("discipline", `%${filters.discipline}%`);
  const { data } = await query;
  const reports = (data ?? []) as AtReport[];
  if (reports.length === 0) return [];

  const candidateIds = [...new Set(reports.map((r) => r.candidate_id))];
  const unitIds = [...new Set(reports.map((r) => r.unit_id).filter((v): v is string => !!v))];
  const [candidates, units] = await Promise.all([
    supabase.from("at_candidates").select("id, full_name").in("id", candidateIds),
    unitIds.length
      ? supabase.from("units").select("id, name").in("id", unitIds)
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
  ]);
  const candidateMap = new Map((candidates.data ?? []).map((c) => [c.id, c.full_name]));
  const unitMap = new Map((units.data ?? []).map((u) => [u.id, u.name]));

  let rows: ReportRow[] = reports.map((r) => ({
    ...r,
    candidateName: candidateMap.get(r.candidate_id) ?? "—",
    unitName: r.unit_id ? unitMap.get(r.unit_id) ?? null : null,
  }));

  const q = filters.q?.trim().toLowerCase();
  if (q) {
    rows = rows.filter((r) =>
      [r.candidateName, r.position_title, r.discipline, r.code]
        .filter(Boolean)
        .some((v) => (v as string).toLowerCase().includes(q)),
    );
  }
  return rows;
}

export async function getReportDetail(id: string): Promise<ReportDetail | null> {
  const supabase = await createClient();
  const { data: report } = await supabase.from("at_reports").select("*").eq("id", id).maybeSingle();
  if (!report) return null;
  const [{ data: candidate }, unit] = await Promise.all([
    supabase.from("at_candidates").select("*").eq("id", report.candidate_id).maybeSingle(),
    report.unit_id
      ? supabase.from("units").select("name").eq("id", report.unit_id).maybeSingle()
      : Promise.resolve({ data: null as { name: string } | null }),
  ]);
  if (!candidate) return null;
  return { report, candidate, unitName: unit.data?.name ?? null };
}

export async function listUnits(): Promise<{ id: string; name: string }[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("units").select("id, name").order("name");
  return data ?? [];
}

export async function listClassesBrief(): Promise<{ id: string; name: string }[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("classes").select("id, name").order("name");
  return data ?? [];
}

export async function getReportAttachments(reportId: string): Promise<AtAttachment[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("at_attachments")
    .select("*")
    .eq("report_id", reportId)
    .order("created_at", { ascending: false });
  return data ?? [];
}

export interface AttachmentWithUrl extends AtAttachment {
  url: string | null;
}

/** Anexos com URL assinada já resolvida (para exibir/baixar). */
export async function getReportAttachmentsWithUrls(reportId: string): Promise<AttachmentWithUrl[]> {
  const attachments = await getReportAttachments(reportId);
  const withUrls = await Promise.all(
    attachments.map(async (a) => ({ ...a, url: await getAtFileUrl(a.file_path) })),
  );
  return withUrls;
}
