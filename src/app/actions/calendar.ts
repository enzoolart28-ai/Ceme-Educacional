"use server";

// =============================================================================
// Server Actions — Calendário Acadêmico
// =============================================================================
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth/session";
import { eventSchema, type EventInput } from "@/lib/calendar/schemas";
import type { ActionResult } from "@/app/actions/auth";

function payload(v: EventInput, createdBy?: string) {
  return {
    title: v.title,
    description: v.description || null,
    type: v.type,
    start_datetime: v.start_datetime,
    end_datetime: v.end_datetime || null,
    course_id: v.course_id || null,
    class_id: v.class_id || null,
    unit_id: v.unit_id || null,
    teacher_id: v.teacher_id || null,
    location: v.location || null,
    visibility: v.visibility,
    ...(createdBy ? { created_by: createdBy } : {}),
  };
}

export async function createEventAction(values: EventInput): Promise<ActionResult> {
  const profile = await getProfile();
  if (!profile) return { error: "Sessão expirada." };
  const parsed = eventSchema.safeParse(values);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Verifique os campos." };

  const supabase = await createClient();
  const { error } = await supabase.from("calendar_events").insert(payload(parsed.data, profile.id));
  if (error) {
    return { error: "Não foi possível criar o evento (verifique sua permissão para este tipo/turma)." };
  }
  revalidatePath("/dashboard/calendario");
  redirect("/dashboard/calendario");
}

export async function updateEventAction(id: string, values: EventInput): Promise<ActionResult> {
  const profile = await getProfile();
  if (!profile) return { error: "Sessão expirada." };
  const parsed = eventSchema.safeParse(values);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Verifique os campos." };

  const supabase = await createClient();
  const { error } = await supabase.from("calendar_events").update(payload(parsed.data)).eq("id", id);
  if (error) return { error: "Não foi possível salvar o evento." };
  revalidatePath("/dashboard/calendario");
  revalidatePath(`/dashboard/calendario/${id}`);
  redirect(`/dashboard/calendario/${id}`);
}

export async function deleteEventAction(values: { id: string }): Promise<ActionResult> {
  const profile = await getProfile();
  if (!profile) return { error: "Sessão expirada." };
  const supabase = await createClient();
  const { error } = await supabase.from("calendar_events").delete().eq("id", values.id);
  if (error) return { error: "Não foi possível excluir o evento." };
  revalidatePath("/dashboard/calendario");
  redirect("/dashboard/calendario");
}
