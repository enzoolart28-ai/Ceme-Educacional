import "server-only";

// =============================================================================
// Consultas do módulo de Provas / Atividades Online (com RLS)
// =============================================================================
import { createClient } from "@/lib/supabase/server";
import type {
  OnlineAssessment,
  AssessmentQuestion,
  AssessmentOption,
  StudentAssessmentSubmission,
} from "@/types/models";

export interface AssessmentRow extends OnlineAssessment {
  className: string;
  subjectName: string | null;
  questionCount: number;
  submissionCount: number;
}

export interface QuestionWithOptions extends AssessmentQuestion {
  options: AssessmentOption[];
}

export interface SubmissionRow extends StudentAssessmentSubmission {
  studentName: string;
}

export interface StudentAssessmentRow extends OnlineAssessment {
  className: string;
  subjectName: string | null;
  attemptsUsed: number;
  lastStatus: string | null;
  bestGrade: number | null;
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

// --- Gestão (professor / coordenação) ---------------------------------------
export async function listManagerAssessments(): Promise<AssessmentRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("online_assessments")
    .select(
      "*, class:classes(name), subject:subjects(name), questions:assessment_questions(count), submissions:student_assessment_submissions(count)",
    )
    .order("created_at", { ascending: false });

  return (data ?? []).map((r) => {
    const row = r as typeof r & {
      class: { name: string } | null;
      subject: { name: string } | null;
      questions: { count: number }[];
      submissions: { count: number }[];
    };
    return {
      ...(row as unknown as OnlineAssessment),
      className: row.class?.name ?? "—",
      subjectName: row.subject?.name ?? null,
      questionCount: row.questions?.[0]?.count ?? 0,
      submissionCount: row.submissions?.[0]?.count ?? 0,
    };
  });
}

export async function getAssessment(
  id: string,
): Promise<(OnlineAssessment & { className: string; subjectName: string | null; courseName: string | null }) | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("online_assessments")
    .select("*, class:classes(name), subject:subjects(name), course:courses(name)")
    .eq("id", id)
    .maybeSingle();
  if (!data) return null;
  const row = data as typeof data & {
    class: { name: string } | null;
    subject: { name: string } | null;
    course: { name: string } | null;
  };
  return {
    ...(row as unknown as OnlineAssessment),
    className: row.class?.name ?? "—",
    subjectName: row.subject?.name ?? null,
    courseName: row.course?.name ?? null,
  };
}

export async function getQuestionsWithOptions(
  assessmentId: string,
): Promise<QuestionWithOptions[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("assessment_questions")
    .select("*, options:assessment_options(*)")
    .eq("assessment_id", assessmentId)
    .order("order_index");
  return (data ?? []).map((q) => {
    const row = q as typeof q & { options: AssessmentOption[] };
    return {
      ...(row as unknown as AssessmentQuestion),
      options: [...(row.options ?? [])].sort((a, b) => a.order_index - b.order_index),
    };
  });
}

export async function listSubmissions(assessmentId: string): Promise<SubmissionRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("student_assessment_submissions")
    .select("*, student:students(full_name)")
    .eq("assessment_id", assessmentId)
    .order("created_at", { ascending: false });
  return (data ?? []).map((s) => {
    const row = s as typeof s & { student: { full_name: string } | null };
    return {
      ...(row as unknown as StudentAssessmentSubmission),
      studentName: row.student?.full_name ?? "—",
    };
  });
}

export async function getAssessmentLogs(assessmentId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("online_assessment_logs")
    .select("*, actor:profiles(full_name)")
    .eq("assessment_id", assessmentId)
    .order("created_at", { ascending: false })
    .limit(50);
  return (data ?? []).map((l) => {
    const row = l as typeof l & { actor: { full_name: string | null } | null };
    return { ...row, actorName: row.actor?.full_name ?? "—" };
  });
}

// --- Aluno -------------------------------------------------------------------
export async function listStudentAssessments(
  profileId: string,
): Promise<StudentAssessmentRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("online_assessments")
    .select("*, class:classes(name), subject:subjects(name)")
    .neq("status", "draft")
    .order("end_date", { ascending: true, nullsFirst: false });

  const assessments = data ?? [];
  const studentId = await studentIdByProfile(supabase, profileId);

  const submissionsByAssessment = new Map<
    string,
    { count: number; lastStatus: string | null; bestGrade: number | null }
  >();
  if (studentId && assessments.length > 0) {
    const { data: subs } = await supabase
      .from("student_assessment_submissions")
      .select("assessment_id, status, grade, attempt_number")
      .eq("student_id", studentId)
      .in(
        "assessment_id",
        assessments.map((a) => a.id),
      )
      .order("attempt_number", { ascending: false });
    for (const s of subs ?? []) {
      const cur = submissionsByAssessment.get(s.assessment_id) ?? {
        count: 0,
        lastStatus: null,
        bestGrade: null,
      };
      cur.count += 1;
      if (cur.lastStatus === null) cur.lastStatus = s.status; // primeiro = maior attempt
      if (s.grade != null) cur.bestGrade = Math.max(cur.bestGrade ?? 0, Number(s.grade));
      submissionsByAssessment.set(s.assessment_id, cur);
    }
  }

  return assessments.map((a) => {
    const row = a as typeof a & {
      class: { name: string } | null;
      subject: { name: string } | null;
    };
    const sub = submissionsByAssessment.get(a.id);
    return {
      ...(row as unknown as OnlineAssessment),
      className: row.class?.name ?? "—",
      subjectName: row.subject?.name ?? null,
      attemptsUsed: sub?.count ?? 0,
      lastStatus: sub?.lastStatus ?? null,
      bestGrade: sub?.bestGrade ?? null,
    };
  });
}

export async function getStudentSubmissions(
  assessmentId: string,
  profileId: string,
): Promise<StudentAssessmentSubmission[]> {
  const supabase = await createClient();
  const studentId = await studentIdByProfile(supabase, profileId);
  if (!studentId) return [];
  const { data } = await supabase
    .from("student_assessment_submissions")
    .select("*")
    .eq("assessment_id", assessmentId)
    .eq("student_id", studentId)
    .order("attempt_number", { ascending: false });
  return data ?? [];
}

/** Submissão em andamento do aluno (para retomar o player), com respostas salvas. */
export async function getActiveSubmission(submissionId: string) {
  const supabase = await createClient();
  const { data: submission } = await supabase
    .from("student_assessment_submissions")
    .select("*")
    .eq("id", submissionId)
    .maybeSingle();
  if (!submission) return null;
  const { data: answers } = await supabase
    .from("student_answers")
    .select("question_id, answer_text, selected_option_id, file_url")
    .eq("submission_id", submissionId);
  return { submission, answers: answers ?? [] };
}

// --- Player / revisão (via funções SECURITY DEFINER) ------------------------
export interface PlayerOption {
  id: string;
  text?: string;
  left?: string;
  order_index: number;
}
export interface PlayerQuestion {
  id: string;
  type: string;
  statement: string;
  media_url: string | null;
  points: number;
  order_index: number;
  options: PlayerOption[];
  match_rights: string[] | null;
}

export async function getPlayerQuestions(assessmentId: string): Promise<PlayerQuestion[]> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("get_student_assessment", {
    p_assessment: assessmentId,
  });
  const obj = data as { questions?: PlayerQuestion[] } | null;
  return obj?.questions ?? [];
}

export interface ReviewQuestion {
  id: string;
  type: string;
  statement: string;
  media_url: string | null;
  points: number;
  answer_text: string | null;
  selected_option_id: string | null;
  file_url: string | null;
  grade: number | null;
  feedback: string | null;
  options: { id: string; text: string; is_correct: boolean | null }[];
  match_pairs: { left: string; right: string }[] | null;
}
export interface SubmissionReview {
  submission: StudentAssessmentSubmission;
  show_answer_key: boolean;
  is_manager: boolean;
  questions: ReviewQuestion[];
}

export async function getSubmissionReview(
  submissionId: string,
): Promise<SubmissionReview | null> {
  const supabase = await createClient();
  const { data } = await (supabase as unknown as {
    rpc: (
      fn: "get_submission_review",
      args: { p_submission: string },
    ) => Promise<{ data: unknown }>;
  }).rpc("get_submission_review", {
    p_submission: submissionId,
  });
  return (data as SubmissionReview | null) ?? null;
}
