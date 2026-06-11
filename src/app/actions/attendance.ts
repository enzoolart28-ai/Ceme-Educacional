"use server";

// =============================================================================
// Server Actions — Chamada e Frequência
// =============================================================================
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import type { ActionResult } from "@/app/actions/auth";
import type { AttendanceRecordStatus } from "@/types/models";

async function logChange(
  attendanceId: string,
  changedBy: string,
  action: string,
  detail?: string,
) {
  const supabase = await createClient();
  await supabase
    .from("attendance_logs")
    .insert({ attendance_id: attendanceId, changed_by: changedBy, action, detail: detail ?? null });
}

export async function createAttendanceAction(values: {
  class_id: string;
  subject_id?: string;
  date: string;
  start_time?: string;
  end_time?: string;
}): Promise<ActionResult> {
  const profile = await getProfile();
  if (!profile || !hasPermission(profile.role, "grades.manage")) {
    return { error: "Você não tem permissão para fazer chamada." };
  }
  if (!values.class_id || !values.date) return { error: "Informe a turma e a data." };

  const supabase = await createClient();
  // Vincula o professor (registro teachers) que está lançando, se houver.
  const { data: teacher } = await supabase
    .from("teachers")
    .select("id")
    .eq("profile_id", profile.id)
    .maybeSingle();

  const { data, error } = await supabase
    .from("attendance")
    .insert({
      class_id: values.class_id,
      subject_id: values.subject_id || null,
      teacher_id: teacher?.id ?? null,
      date: values.date,
      start_time: values.start_time || null,
      end_time: values.end_time || null,
      status: "open",
    })
    .select("id")
    .single();

  if (error) {
    return {
      error: error.code === "23505"
        ? "Já existe uma chamada para esta turma/disciplina nesta data."
        : "Não foi possível criar a chamada (verifique suas permissões na turma).",
    };
  }

  await logChange(data.id, profile.id, "created", "Chamada criada");
  revalidatePath(`/dashboard/chamada/${values.class_id}`);
  redirect(`/dashboard/chamada/${values.class_id}/${data.id}`);
}

export async function saveAttendanceAction(
  attendanceId: string,
  classId: string,
  records: { student_id: string; status: AttendanceRecordStatus; observation: string }[],
): Promise<ActionResult> {
  const profile = await getProfile();
  if (!profile || !hasPermission(profile.role, "grades.manage")) {
    return { error: "Você não tem permissão para lançar a chamada." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("attendance_records").upsert(
    records.map((r) => ({
      attendance_id: attendanceId,
      student_id: r.student_id,
      status: r.status,
      observation: r.observation || null,
    })),
    { onConflict: "attendance_id,student_id" },
  );

  if (error) {
    return { error: "Não foi possível salvar a chamada (verifique suas permissões)." };
  }

  await supabase.from("attendance").update({ status: "finalized" }).eq("id", attendanceId);
  await logChange(
    attendanceId,
    profile.id,
    "saved",
    `Chamada lançada/atualizada (${records.length} registros) por ${profile.full_name}`,
  );

  revalidatePath(`/dashboard/chamada/${classId}/${attendanceId}`);
  revalidatePath(`/dashboard/chamada/${classId}`);
  revalidatePath(`/dashboard/chamada/${classId}/relatorio`);
  return { success: true };
}

export async function deleteAttendanceAction(values: {
  id: string;
  class_id: string;
}): Promise<ActionResult> {
  const profile = await getProfile();
  if (!profile || !hasPermission(profile.role, "grades.manage")) {
    return { error: "Você não tem permissão para excluir a chamada." };
  }
  const supabase = await createClient();
  const { error } = await supabase.from("attendance").delete().eq("id", values.id);
  if (error) return { error: "Não foi possível excluir a chamada." };

  revalidatePath(`/dashboard/chamada/${values.class_id}`);
  redirect(`/dashboard/chamada/${values.class_id}`);
}
