"use server";

// =============================================================================
// Server Actions — Notas e Avaliações
// =============================================================================
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { assessmentSchema, type AssessmentInput } from "@/lib/grades/schemas";
import type { ActionResult } from "@/app/actions/auth";

async function ensureGrader() {
  const profile = await getProfile();
  if (!profile || !hasPermission(profile.role, "grades.manage")) return null;
  return profile;
}

async function resolveCourseAndTeacher(classId: string, profileId: string) {
  const supabase = await createClient();
  const [{ data: turma }, { data: teacher }] = await Promise.all([
    supabase.from("classes").select("course_id").eq("id", classId).maybeSingle(),
    supabase.from("teachers").select("id").eq("profile_id", profileId).maybeSingle(),
  ]);
  return { courseId: turma?.course_id ?? null, teacherId: teacher?.id ?? null };
}

function toPayload(v: AssessmentInput, courseId: string | null, teacherId: string | null) {
  return {
    name: v.name,
    type: v.type,
    class_id: v.class_id,
    subject_id: v.subject_id || null,
    course_id: courseId,
    teacher_id: teacherId,
    weight: v.weight ? Number(v.weight) : 1,
    max_grade: v.max_grade ? Number(v.max_grade) : 10,
    date: v.date || null,
    notes: v.notes || null,
  };
}

export async function createAssessmentAction(values: AssessmentInput): Promise<ActionResult> {
  const profile = await ensureGrader();
  if (!profile) return { error: "Você não tem permissão para criar avaliações." };
  const parsed = assessmentSchema.safeParse(values);
  if (!parsed.success) return { error: "Verifique os campos da avaliação." };

  const supabase = await createClient();
  const { courseId, teacherId } = await resolveCourseAndTeacher(parsed.data.class_id, profile.id);
  const { data, error } = await supabase
    .from("assessments")
    .insert(toPayload(parsed.data, courseId, teacherId))
    .select("id")
    .single();
  if (error) {
    return { error: "Não foi possível criar a avaliação (verifique suas permissões na turma)." };
  }

  await supabase
    .from("grade_logs")
    .insert({ assessment_id: data.id, changed_by: profile.id, action: "created", detail: "Avaliação criada" });

  revalidatePath("/dashboard/avaliacoes");
  redirect(`/dashboard/avaliacoes/${data.id}`);
}

export async function updateAssessmentAction(
  id: string,
  values: AssessmentInput,
): Promise<ActionResult> {
  const profile = await ensureGrader();
  if (!profile) return { error: "Você não tem permissão para editar avaliações." };
  const parsed = assessmentSchema.safeParse(values);
  if (!parsed.success) return { error: "Verifique os campos da avaliação." };

  const supabase = await createClient();
  const { courseId, teacherId } = await resolveCourseAndTeacher(parsed.data.class_id, profile.id);
  const { error } = await supabase
    .from("assessments")
    .update(toPayload(parsed.data, courseId, teacherId))
    .eq("id", id);
  if (error) return { error: "Não foi possível salvar a avaliação." };

  revalidatePath(`/dashboard/avaliacoes/${id}`);
  revalidatePath("/dashboard/avaliacoes");
  redirect(`/dashboard/avaliacoes/${id}`);
}

export async function deleteAssessmentAction(id: string): Promise<ActionResult> {
  const profile = await ensureGrader();
  if (!profile) return { error: "Você não tem permissão para excluir avaliações." };
  const supabase = await createClient();
  const { error } = await supabase.from("assessments").delete().eq("id", id);
  if (error) return { error: "Não foi possível excluir a avaliação." };

  revalidatePath("/dashboard/avaliacoes");
  redirect("/dashboard/avaliacoes");
}

export async function saveGradesAction(
  assessmentId: string,
  grades: { student_id: string; grade: string; feedback: string }[],
): Promise<ActionResult> {
  const profile = await ensureGrader();
  if (!profile) return { error: "Você não tem permissão para lançar notas." };

  const supabase = await createClient();
  const rows = grades.map((g) => ({
    assessment_id: assessmentId,
    student_id: g.student_id,
    grade: g.grade === "" ? null : Number(g.grade),
    feedback: g.feedback || null,
  }));

  const { error } = await supabase
    .from("grades")
    .upsert(rows, { onConflict: "assessment_id,student_id" });
  if (error) {
    return { error: "Não foi possível salvar as notas (verifique suas permissões)." };
  }

  await supabase.from("grade_logs").insert({
    assessment_id: assessmentId,
    changed_by: profile.id,
    action: "saved",
    detail: `Notas lançadas/atualizadas (${rows.length}) por ${profile.full_name}`,
  });

  revalidatePath(`/dashboard/avaliacoes/${assessmentId}`);
  return { success: true };
}
