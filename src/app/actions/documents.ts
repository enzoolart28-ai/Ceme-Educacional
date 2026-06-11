"use server";

// =============================================================================
// Server Actions — Documentos
// =============================================================================
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { documentSchema, generateDocumentSchema } from "@/lib/documents/schemas";
import { buildDocumentPdf, type PdfContent } from "@/lib/documents/pdf";
import { GENERATED_DOCUMENT_TYPE_LABELS } from "@/lib/documents/labels";
import { formatDate } from "@/lib/utils";
import type { ActionResult } from "@/app/actions/auth";
import type { GeneratedDocumentType } from "@/types/models";

type SupabaseServer = Awaited<ReturnType<typeof createClient>>;

// --- Upload (aluno / responsável / gestor) ----------------------------------
export async function uploadDocumentAction(values: {
  student_id: string;
  type: string;
  title: string;
  file_url: string;
}): Promise<ActionResult> {
  const profile = await getProfile();
  if (!profile) return { error: "Sessão expirada." };
  const parsed = documentSchema.safeParse(values);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  const supabase = await createClient();
  const { error } = await supabase.from("documents").insert({
    student_id: parsed.data.student_id,
    type: parsed.data.type,
    title: parsed.data.title,
    file_url: parsed.data.file_url,
    status: "enviado",
  });
  if (error) return { error: "Não foi possível enviar o documento." };

  revalidatePath("/dashboard/documentos");
  return { success: true };
}

// --- Conferência: aprovar / reprovar (gera log) -----------------------------
export async function reviewDocumentAction(values: {
  id: string;
  status: "aprovado" | "reprovado";
  observation?: string;
}): Promise<ActionResult> {
  const profile = await getProfile();
  if (!profile || !hasPermission(profile.role, "documents.manage")) {
    return { error: "Sem permissão para conferir documentos." };
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("documents")
    .update({
      status: values.status,
      observation: values.observation || null,
      reviewed_by: profile.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", values.id);
  if (error) return { error: "Não foi possível atualizar o documento." };

  await supabase.from("document_logs").insert({
    document_id: values.id,
    changed_by: profile.id,
    action: values.status,
    detail: values.observation || null,
  });

  revalidatePath("/dashboard/documentos");
  revalidatePath(`/dashboard/documentos/${values.id}`);
  return { success: true };
}

export async function setObservationAction(values: {
  id: string;
  observation: string;
}): Promise<ActionResult> {
  const profile = await getProfile();
  if (!profile || !hasPermission(profile.role, "documents.manage")) return { error: "Sem permissão." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("documents")
    .update({ observation: values.observation || null })
    .eq("id", values.id);
  if (error) return { error: "Não foi possível salvar a observação." };
  await supabase.from("document_logs").insert({
    document_id: values.id,
    changed_by: profile.id,
    action: "observation",
    detail: values.observation || null,
  });
  revalidatePath(`/dashboard/documentos/${values.id}`);
  return { success: true };
}

export async function deleteDocumentAction(values: { id: string }): Promise<ActionResult> {
  const profile = await getProfile();
  if (!profile) return { error: "Sessão expirada." };
  const supabase = await createClient();
  const { error } = await supabase.from("documents").delete().eq("id", values.id);
  if (error) return { error: "Não foi possível excluir o documento." };
  revalidatePath("/dashboard/documentos");
  return { success: true };
}

// --- URLs assinadas (bucket privado) ----------------------------------------
export async function getDocumentUrlAction(values: {
  id: string;
}): Promise<{ url?: string; error?: string }> {
  const supabase = await createClient();
  const { data: doc } = await supabase
    .from("documents")
    .select("file_url")
    .eq("id", values.id)
    .maybeSingle();
  if (!doc?.file_url) return { error: "Arquivo indisponível." };
  const { data, error } = await supabase.storage
    .from("documents")
    .createSignedUrl(doc.file_url, 120);
  if (error || !data) return { error: "Não foi possível gerar o link." };
  return { url: data.signedUrl };
}

export async function getGeneratedUrlAction(values: {
  id: string;
}): Promise<{ url?: string; error?: string }> {
  const supabase = await createClient();
  const { data: doc } = await supabase
    .from("generated_documents")
    .select("file_url")
    .eq("id", values.id)
    .maybeSingle();
  if (!doc?.file_url) return { error: "Arquivo indisponível." };
  const { data, error } = await supabase.storage
    .from("documents")
    .createSignedUrl(doc.file_url, 120);
  if (error || !data) return { error: "Não foi possível gerar o link." };
  return { url: data.signedUrl };
}

// --- Geração de PDF ----------------------------------------------------------
async function buildContent(
  supabase: SupabaseServer,
  studentId: string,
  type: GeneratedDocumentType,
): Promise<PdfContent> {
  const { data: student } = await supabase
    .from("students")
    .select("full_name, cpf, profile_id")
    .eq("id", studentId)
    .maybeSingle();

  const name = student?.full_name ?? "—";
  const cpf = student?.cpf ?? "não informado";

  // Curso/turma a partir da matrícula ativa.
  const { data: cs } = await supabase
    .from("class_students")
    .select("class:classes(name, year, course:courses(name))")
    .eq("student_id", studentId)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();
  const cls = (cs?.class as { name: string; year: number; course: { name: string } | null } | null) ?? null;
  const courseName = cls?.course?.name ?? "—";
  const className = cls?.name ?? "—";
  const year = cls?.year ?? new Date().getFullYear();

  const today = formatDate(new Date().toISOString());
  const footer = [
    `Documento gerado eletronicamente em ${today}.`,
    "Sistema CME Educacional — validade sujeita a conferência.",
  ];
  const titleLabel = GENERATED_DOCUMENT_TYPE_LABELS[type];

  switch (type) {
    case "declaracao_matricula":
      return {
        title: "Declaração de Matrícula",
        bodyParagraphs: [
          `Declaramos, para os devidos fins, que o(a) aluno(a) ${name}, inscrito(a) sob o CPF ${cpf}, encontra-se regularmente matriculado(a) no curso ${courseName}, turma ${className}, referente ao ano letivo de ${year}.`,
          "Por ser expressão da verdade, firmamos a presente declaração.",
        ],
        footerLines: footer,
      };
    case "declaracao_frequencia":
      return {
        title: "Declaração de Frequência",
        bodyParagraphs: [
          `Declaramos que o(a) aluno(a) ${name} está frequentando regularmente as atividades do curso ${courseName}, turma ${className}, no ano letivo de ${year}.`,
        ],
        footerLines: footer,
      };
    case "contrato_educacional":
      return {
        title: "Contrato de Prestação de Serviços Educacionais",
        subtitle: `Aluno(a): ${name}`,
        bodyParagraphs: [
          `Pelo presente instrumento, a instituição compromete-se a prestar serviços educacionais ao(à) aluno(a) ${name}, matriculado(a) no curso ${courseName}, turma ${className}.`,
          "As condições financeiras, calendário e demais cláusulas seguem o regimento interno da instituição.",
        ],
        footerLines: footer,
      };
    case "historico_escolar":
      return {
        title: "Histórico Escolar",
        subtitle: `Aluno(a): ${name} — CPF ${cpf}`,
        bodyParagraphs: [
          `Curso: ${courseName} — Turma: ${className} — Ano letivo: ${year}.`,
          "O presente histórico apresenta a vida escolar do(a) aluno(a) na instituição.",
        ],
        footerLines: footer,
      };
    case "recibo":
      return {
        title: "Recibo",
        bodyParagraphs: [
          `Recebemos do(a) responsável pelo(a) aluno(a) ${name} a importância referente aos serviços educacionais prestados.`,
        ],
        footerLines: footer,
      };
    case "comprovante_financeiro":
      return {
        title: "Comprovante Financeiro",
        bodyParagraphs: [
          `Comprovante referente à situação financeira do(a) aluno(a) ${name}, curso ${courseName}.`,
        ],
        footerLines: footer,
      };
    case "relatorio_academico":
      return {
        title: "Relatório Acadêmico",
        subtitle: `Aluno(a): ${name}`,
        bodyParagraphs: [
          `Relatório acadêmico do(a) aluno(a) ${name}, matriculado(a) no curso ${courseName}, turma ${className}, ano letivo ${year}.`,
        ],
        footerLines: footer,
      };
    default:
      return { title: titleLabel, bodyParagraphs: [`Documento referente ao(à) aluno(a) ${name}.`], footerLines: footer };
  }
}

export async function generateDocumentAction(values: {
  student_id: string;
  type: string;
  enrollment_id?: string;
}): Promise<ActionResult> {
  const profile = await getProfile();
  if (!profile || !hasPermission(profile.role, "documents.manage")) {
    return { error: "Sem permissão para gerar documentos." };
  }
  const parsed = generateDocumentSchema.safeParse(values);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  const supabase = await createClient();
  const type = parsed.data.type as GeneratedDocumentType;
  const content = await buildContent(supabase, parsed.data.student_id, type);
  const bytes = await buildDocumentPdf(content);

  const path = `generated/${parsed.data.student_id}/${type}-${Date.now()}.pdf`;
  const { error: upErr } = await supabase.storage
    .from("documents")
    .upload(path, Buffer.from(bytes), { contentType: "application/pdf", upsert: false });
  if (upErr) return { error: "Falha ao salvar o PDF no Storage." };

  const { error } = await supabase.from("generated_documents").insert({
    student_id: parsed.data.student_id,
    enrollment_id: parsed.data.enrollment_id || null,
    type,
    title: content.title,
    file_url: path,
    generated_by: profile.id,
  });
  if (error) return { error: "Não foi possível registrar o documento gerado." };

  revalidatePath("/dashboard/documentos");
  return { success: true };
}
