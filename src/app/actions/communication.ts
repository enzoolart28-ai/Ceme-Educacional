"use server";

// =============================================================================
// Server Actions — Comunicação Interna
// =============================================================================
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth/session";
import { announcementSchema, messageSchema } from "@/lib/communication/schemas";
import type { ActionResult } from "@/app/actions/auth";

const TARGETS_WITH_ID = ["class", "course", "user"];

// --- Comunicados -------------------------------------------------------------
export async function createAnnouncementAction(values: {
  title: string;
  message: string;
  target_type: string;
  target_id?: string;
  attachment_url?: string;
}): Promise<ActionResult> {
  const profile = await getProfile();
  if (!profile) return { error: "Sessão expirada." };
  const parsed = announcementSchema.safeParse(values);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Verifique os campos." };

  const supabase = await createClient();
  const targetId = TARGETS_WITH_ID.includes(parsed.data.target_type)
    ? parsed.data.target_id || null
    : null;

  const { data, error } = await supabase
    .from("announcements")
    .insert({
      title: parsed.data.title,
      message: parsed.data.message,
      author_id: profile.id,
      target_type: parsed.data.target_type,
      target_id: targetId,
      attachment_url: parsed.data.attachment_url || null,
    })
    .select("id")
    .single();
  if (error || !data) {
    return { error: "Não foi possível enviar o comunicado (verifique sua permissão para este destino)." };
  }

  // Notifica o usuário específico, quando for o caso.
  if (parsed.data.target_type === "user" && targetId) {
    await supabase.from("notifications").insert({
      user_id: targetId,
      title: "Novo comunicado",
      message: parsed.data.title,
      type: "announcement",
    });
  }

  revalidatePath("/dashboard/comunicacao");
  redirect("/dashboard/comunicacao");
}

export async function deleteAnnouncementAction(values: { id: string }): Promise<ActionResult> {
  const profile = await getProfile();
  if (!profile) return { error: "Sessão expirada." };
  const supabase = await createClient();
  const { error } = await supabase.from("announcements").delete().eq("id", values.id);
  if (error) return { error: "Não foi possível excluir o comunicado." };
  revalidatePath("/dashboard/comunicacao");
  redirect("/dashboard/comunicacao");
}

export async function markAnnouncementReadAction(values: {
  announcementId: string;
}): Promise<ActionResult> {
  const profile = await getProfile();
  if (!profile) return { error: "Sessão expirada." };
  const supabase = await createClient();
  await supabase
    .from("announcement_reads")
    .upsert(
      { announcement_id: values.announcementId, user_id: profile.id },
      { onConflict: "announcement_id,user_id", ignoreDuplicates: true },
    );
  revalidatePath("/dashboard/comunicacao");
  revalidatePath(`/dashboard/comunicacao/${values.announcementId}`);
  return { success: true };
}

// --- Mensagens ---------------------------------------------------------------
export async function sendMessageAction(values: {
  receiver_id: string;
  subject?: string;
  body?: string;
  attachment_url?: string;
}): Promise<ActionResult> {
  const parsed = messageSchema.safeParse(values);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Verifique os campos." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("send_message", {
    p_receiver: parsed.data.receiver_id,
    p_subject: parsed.data.subject || "",
    p_body: parsed.data.body || "",
    p_attachment: parsed.data.attachment_url || undefined,
  });
  if (error) {
    if (error.message.includes("DESTINATARIO_INVALIDO")) return { error: "Destinatário inválido." };
    return { error: "Não foi possível enviar a mensagem." };
  }
  revalidatePath("/dashboard/mensagens");
  redirect("/dashboard/mensagens");
}

export async function markMessageReadAction(values: { id: string }): Promise<ActionResult> {
  const profile = await getProfile();
  if (!profile) return { error: "Sessão expirada." };
  const supabase = await createClient();
  await supabase
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("id", values.id)
    .is("read_at", null);
  revalidatePath("/dashboard/mensagens");
  return { success: true };
}

// --- Notificações ------------------------------------------------------------
export async function markNotificationReadAction(values: { id: string }): Promise<ActionResult> {
  const profile = await getProfile();
  if (!profile) return { error: "Sessão expirada." };
  const supabase = await createClient();
  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", values.id);
  revalidatePath("/dashboard/notificacoes");
  return { success: true };
}

export async function markAllNotificationsReadAction(): Promise<ActionResult> {
  const profile = await getProfile();
  if (!profile) return { error: "Sessão expirada." };
  const supabase = await createClient();
  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", profile.id)
    .is("read_at", null);
  revalidatePath("/dashboard/notificacoes");
  return { success: true };
}
