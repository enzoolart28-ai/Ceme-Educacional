import "server-only";

// =============================================================================
// Consultas do módulo de Documentos (com RLS)
// =============================================================================
import { createClient } from "@/lib/supabase/server";
import type {
  Document,
  GeneratedDocument,
  DocumentType,
  DocumentStatus,
} from "@/types/models";

export interface DocumentRow extends Document {
  studentName: string;
}
export interface GeneratedRow extends GeneratedDocument {
  studentName: string;
}

export interface DocumentFilters {
  studentId?: string;
  type?: DocumentType;
  status?: DocumentStatus;
}

async function studentIdByProfile(
  supabase: Awaited<ReturnType<typeof createClient>>,
  profileId: string,
): Promise<string | null> {
  const { data } = await supabase
    .from("students")
    .select("id")
    .eq("profile_id", profileId)
    .maybeSingle();
  return data?.id ?? null;
}

export async function getOwnStudentId(profileId: string): Promise<string | null> {
  const supabase = await createClient();
  return studentIdByProfile(supabase, profileId);
}

export async function listDocuments(filters: DocumentFilters = {}): Promise<DocumentRow[]> {
  const supabase = await createClient();
  let query = supabase
    .from("documents")
    .select("*, student:students(full_name)")
    .order("created_at", { ascending: false });

  if (filters.studentId) query = query.eq("student_id", filters.studentId);
  if (filters.type) query = query.eq("type", filters.type);
  if (filters.status) query = query.eq("status", filters.status);

  const { data } = await query;
  return (data ?? []).map((d) => {
    const row = d as typeof d & { student: { full_name: string } | null };
    return { ...(row as unknown as Document), studentName: row.student?.full_name ?? "—" };
  });
}

export async function getStudentDocuments(studentId: string): Promise<Document[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("documents")
    .select("*")
    .eq("student_id", studentId)
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function listGeneratedDocuments(studentId?: string): Promise<GeneratedRow[]> {
  const supabase = await createClient();
  let query = supabase
    .from("generated_documents")
    .select("*, student:students(full_name)")
    .order("created_at", { ascending: false });
  if (studentId) query = query.eq("student_id", studentId);
  const { data } = await query;
  return (data ?? []).map((d) => {
    const row = d as typeof d & { student: { full_name: string } | null };
    return { ...(row as unknown as GeneratedDocument), studentName: row.student?.full_name ?? "—" };
  });
}

export async function getDocumentById(id: string): Promise<Document | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("documents").select("*").eq("id", id).maybeSingle();
  return data ?? null;
}

export async function getDocumentLogs(documentId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("document_logs")
    .select("*, actor:profiles(full_name)")
    .eq("document_id", documentId)
    .order("created_at", { ascending: false });
  return (data ?? []).map((l) => {
    const row = l as typeof l & { actor: { full_name: string | null } | null };
    return { ...row, actorName: row.actor?.full_name ?? "—" };
  });
}

/** Alunos para o filtro (staff vê todos via RLS). */
export async function listStudentsBrief(): Promise<{ id: string; full_name: string }[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("students")
    .select("id, full_name")
    .is("deleted_at", null)
    .order("full_name");
  return data ?? [];
}
