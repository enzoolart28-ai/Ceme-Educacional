"use server";

// =============================================================================
// Server Actions — Provas / Atividades Online
// =============================================================================
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import {
  onlineAssessmentSchema,
  questionSchema,
  type OnlineAssessmentInput,
} from "@/lib/online-assessments/schemas";
import type { ActionResult } from "@/app/actions/auth";
import type { Json } from "@/types/database";
import type { UserRole } from "@/types/models";

function canManage(role: UserRole): boolean {
  return hasPermission(role, "grades.manage");
}

type SupabaseServer = Awaited<ReturnType<typeof createClient>>;

async function logChange(
  supabase: SupabaseServer,
  assessmentId: string,
  actor: string,
  action: string,
  detail?: string | null,
) {
  await supabase.from("online_assessment_logs").insert({
    assessment_id: assessmentId,
    actor_profile_id: actor,
    action,
    detail: detail ?? null,
  });
}

/** Deriva o curso a partir da turma (mantém course_id consistente). */
async function resolveCourseId(
  supabase: SupabaseServer,
  v: OnlineAssessmentInput,
): Promise<string | null> {
  if (v.course_id) return v.course_id;
  const { data } = await supabase
    .from("classes")
    .select("course_id")
    .eq("id", v.class_id)
    .maybeSingle();
  return data?.course_id ?? null;
}

function assessmentPayload(v: OnlineAssessmentInput) {
  return {
    title: v.title,
    description: v.description || null,
    course_id: v.course_id || null,
    class_id: v.class_id,
    subject_id: v.subject_id || null,
    teacher_id: v.teacher_id || null,
    start_date: v.start_date || null,
    end_date: v.end_date || null,
    time_limit_minutes: v.time_limit_minutes ? Number(v.time_limit_minutes) : null,
    max_attempts: v.max_attempts ? Number(v.max_attempts) : 1,
    max_grade: v.max_grade ? Number(v.max_grade) : 10,
    min_grade: v.min_grade ? Number(v.min_grade) : 6,
    correction_type: v.correction_type,
    show_answer_key: v.show_answer_key,
    shuffle_questions: v.shuffle_questions,
    shuffle_options: v.shuffle_options,
    status: v.status,
  };
}

// --- Prova: CRUD -------------------------------------------------------------
export async function createAssessmentAction(values: OnlineAssessmentInput): Promise<ActionResult> {
  const profile = await getProfile();
  if (!profile || !canManage(profile.role)) return { error: "Sem permissão para gerenciar provas." };
  const parsed = onlineAssessmentSchema.safeParse(values);
  if (!parsed.success) return { error: "Verifique os campos da prova." };

  const supabase = await createClient();
  const courseId = await resolveCourseId(supabase, parsed.data);
  const { data, error } = await supabase
    .from("online_assessments")
    .insert({ ...assessmentPayload(parsed.data), course_id: courseId })
    .select("id")
    .single();
  if (error || !data) return { error: "Não foi possível criar a prova." };

  await logChange(supabase, data.id, profile.id, "create", parsed.data.title);
  revalidatePath("/dashboard/atividades");
  redirect(`/dashboard/atividades/${data.id}`);
}

export async function updateAssessmentAction(
  id: string,
  values: OnlineAssessmentInput,
): Promise<ActionResult> {
  const profile = await getProfile();
  if (!profile || !canManage(profile.role)) return { error: "Sem permissão." };
  const parsed = onlineAssessmentSchema.safeParse(values);
  if (!parsed.success) return { error: "Verifique os campos da prova." };

  const supabase = await createClient();
  const courseId = await resolveCourseId(supabase, parsed.data);
  const { error } = await supabase
    .from("online_assessments")
    .update({ ...assessmentPayload(parsed.data), course_id: courseId })
    .eq("id", id);
  if (error) return { error: "Não foi possível salvar a prova." };

  await logChange(supabase, id, profile.id, "update", parsed.data.title);
  revalidatePath(`/dashboard/atividades/${id}`);
  revalidatePath("/dashboard/atividades");
  return { success: true };
}

export async function deleteAssessmentAction(values: { id: string }): Promise<ActionResult> {
  const profile = await getProfile();
  if (!profile || !canManage(profile.role)) return { error: "Sem permissão." };
  const supabase = await createClient();
  const { error } = await supabase.from("online_assessments").delete().eq("id", values.id);
  if (error) return { error: "Não foi possível excluir a prova." };
  revalidatePath("/dashboard/atividades");
  redirect("/dashboard/atividades");
}

// --- Questões ----------------------------------------------------------------
export interface QuestionActionInput {
  id?: string;
  assessment_id: string;
  type: string;
  statement: string;
  media_url?: string;
  points?: string;
  options?: { text: string; is_correct: boolean }[];
}

export async function saveQuestionAction(input: QuestionActionInput): Promise<ActionResult> {
  const profile = await getProfile();
  if (!profile || !canManage(profile.role)) return { error: "Sem permissão." };
  const parsed = questionSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  const supabase = await createClient();
  const points = parsed.data.points ? Number(parsed.data.points) : 1;
  const base = {
    assessment_id: parsed.data.assessment_id,
    type: parsed.data.type,
    statement: parsed.data.statement,
    media_url: parsed.data.media_url || null,
    points,
  };

  let questionId = input.id;
  if (questionId) {
    const { error } = await supabase.from("assessment_questions").update(base).eq("id", questionId);
    if (error) return { error: "Não foi possível salvar a questão." };
  } else {
    const { count } = await supabase
      .from("assessment_questions")
      .select("*", { count: "exact", head: true })
      .eq("assessment_id", parsed.data.assessment_id);
    const { data, error } = await supabase
      .from("assessment_questions")
      .insert({ ...base, order_index: count ?? 0 })
      .select("id")
      .single();
    if (error || !data) return { error: "Não foi possível criar a questão." };
    questionId = data.id;
  }

  // Substitui as alternativas (objetivas / associação).
  await supabase.from("assessment_options").delete().eq("question_id", questionId);
  const opts = parsed.data.options ?? [];
  if (opts.length > 0) {
    const { error } = await supabase.from("assessment_options").insert(
      opts.map((o, i) => ({
        question_id: questionId!,
        text: o.text,
        is_correct: o.is_correct,
        order_index: i,
      })),
    );
    if (error) return { error: "Não foi possível salvar as alternativas." };
  }

  await logChange(supabase, parsed.data.assessment_id, profile.id, "question", parsed.data.statement.slice(0, 80));
  revalidatePath(`/dashboard/atividades/${parsed.data.assessment_id}`);
  return { success: true };
}

export async function deleteQuestionAction(values: {
  id: string;
  assessment_id: string;
}): Promise<ActionResult> {
  const profile = await getProfile();
  if (!profile || !canManage(profile.role)) return { error: "Sem permissão." };
  const supabase = await createClient();
  const { error } = await supabase.from("assessment_questions").delete().eq("id", values.id);
  if (error) return { error: "Não foi possível excluir a questão." };
  revalidatePath(`/dashboard/atividades/${values.assessment_id}`);
  return { success: true };
}

export async function moveQuestionAction(values: {
  id: string;
  assessment_id: string;
  direction: "up" | "down";
}): Promise<ActionResult> {
  const profile = await getProfile();
  if (!profile || !canManage(profile.role)) return { error: "Sem permissão." };
  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("assessment_questions")
    .select("id")
    .eq("assessment_id", values.assessment_id)
    .order("order_index");
  const ids = (rows ?? []).map((r) => r.id);
  const i = ids.indexOf(values.id);
  const j = values.direction === "up" ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= ids.length) return { success: true };
  [ids[i], ids[j]] = [ids[j], ids[i]];
  await Promise.all(
    ids.map((rid, idx) =>
      supabase.from("assessment_questions").update({ order_index: idx }).eq("id", rid),
    ),
  );
  revalidatePath(`/dashboard/atividades/${values.assessment_id}`);
  return { success: true };
}

// --- Correção manual / reabertura -------------------------------------------
export async function gradeSubmissionAction(values: {
  submissionId: string;
  assessmentId: string;
  answers: { question_id: string; grade: string; feedback?: string }[];
  feedback?: string;
}): Promise<ActionResult> {
  const profile = await getProfile();
  if (!profile || !canManage(profile.role)) return { error: "Sem permissão." };
  const supabase = await createClient();

  for (const a of values.answers) {
    const grade = a.grade === "" || a.grade == null ? null : Number(a.grade);
    const { error } = await supabase
      .from("student_answers")
      .update({ grade, feedback: a.feedback || null })
      .eq("submission_id", values.submissionId)
      .eq("question_id", a.question_id);
    if (error) return { error: "Não foi possível salvar a correção." };
  }

  const { data: answers } = await supabase
    .from("student_answers")
    .select("grade")
    .eq("submission_id", values.submissionId);
  const total = (answers ?? []).reduce((acc, r) => acc + (r.grade != null ? Number(r.grade) : 0), 0);

  const { error: subErr } = await supabase
    .from("student_assessment_submissions")
    .update({ grade: total, status: "graded", feedback: values.feedback || null })
    .eq("id", values.submissionId);
  if (subErr) return { error: "Não foi possível finalizar a correção." };

  await logChange(supabase, values.assessmentId, profile.id, "grade", `submission ${values.submissionId}`);
  revalidatePath(`/dashboard/atividades/${values.assessmentId}/tentativas`);
  revalidatePath(`/dashboard/atividades/${values.assessmentId}/tentativa/${values.submissionId}`);
  return { success: true };
}

export async function reopenSubmissionAction(values: {
  submissionId: string;
  assessmentId: string;
}): Promise<ActionResult> {
  const profile = await getProfile();
  if (!profile || !canManage(profile.role)) return { error: "Sem permissão." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("student_assessment_submissions")
    .update({ status: "in_progress", reopened_at: new Date().toISOString() })
    .eq("id", values.submissionId);
  if (error) return { error: "Não foi possível reabrir a tentativa." };
  await logChange(supabase, values.assessmentId, profile.id, "reopen", `submission ${values.submissionId}`);
  revalidatePath(`/dashboard/atividades/${values.assessmentId}/tentativas`);
  return { success: true };
}

// --- Aluno: responder --------------------------------------------------------
function mapStudentError(msg: string): string {
  if (msg.includes("APENAS_ALUNOS")) return "Apenas alunos respondem provas.";
  if (msg.includes("PROVA_INDISPONIVEL")) return "Prova indisponível.";
  if (msg.includes("NAO_MATRICULADO")) return "Você não está matriculado nesta turma.";
  if (msg.includes("AINDA_NAO_INICIADA")) return "A prova ainda não começou.";
  if (msg.includes("PRAZO_ENCERRADO")) return "O prazo desta prova foi encerrado.";
  if (msg.includes("TENTATIVAS_ESGOTADAS")) return "Você já usou todas as tentativas.";
  if (msg.includes("TENTATIVA_NAO_ESTA_EM_ANDAMENTO")) return "Esta tentativa já foi enviada.";
  return "Não foi possível concluir a operação.";
}

export interface AnswerPayload {
  [key: string]: Json | undefined;
  question_id: string;
  answer_text?: string | null;
  selected_option_id?: string | null;
  file_url?: string | null;
}

export async function startAssessmentAction(assessmentId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("start_assessment", { p_assessment: assessmentId });
  if (error || !data) return { error: error ? mapStudentError(error.message) : "Não foi possível iniciar." };
  redirect(`/dashboard/atividades/${assessmentId}/responder/${data}`);
}

export async function saveProgressAction(values: {
  submissionId: string;
  answers: AnswerPayload[];
}): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("save_assessment_progress", {
    p_submission: values.submissionId,
    p_answers: values.answers,
    p_submit: false,
  });
  if (error) return { error: mapStudentError(error.message) };
  return { success: true };
}

export async function submitAssessmentAction(values: {
  submissionId: string;
  assessmentId: string;
  answers: AnswerPayload[];
}): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("save_assessment_progress", {
    p_submission: values.submissionId,
    p_answers: values.answers,
    p_submit: true,
  });
  if (error) return { error: mapStudentError(error.message) };
  revalidatePath(`/dashboard/atividades/${values.assessmentId}`);
  redirect(`/dashboard/atividades/${values.assessmentId}/resultado/${values.submissionId}`);
}
