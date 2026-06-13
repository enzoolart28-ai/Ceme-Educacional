import "server-only";

// =============================================================================
// Consultas do módulo de Comunicação Interna (com RLS)
// =============================================================================
import { createClient } from "@/lib/supabase/server";
import type {
  Announcement,
  Message,
  Notification,
  UserRole,
} from "@/types/models";

export interface AnnouncementRow extends Announcement {
  authorName: string;
  read: boolean;
}
export interface MessageRow extends Message {
  otherName: string;
}
export interface ReadReceipt {
  userName: string;
  read_at: string;
}

// --- Comunicados -------------------------------------------------------------
export async function listAnnouncements(profileId: string): Promise<AnnouncementRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("announcements")
    .select("*, author:profiles!announcements_author_id_fkey(full_name)")
    .order("created_at", { ascending: false });

  const rows = data ?? [];
  const ids = rows.map((r) => r.id);
  const readSet = new Set<string>();
  if (ids.length > 0) {
    const { data: reads } = await supabase
      .from("announcement_reads")
      .select("announcement_id")
      .eq("user_id", profileId)
      .in("announcement_id", ids);
    for (const r of reads ?? []) readSet.add(r.announcement_id);
  }

  return rows.map((r) => {
    const row = r as typeof r & { author: { full_name: string | null } | null };
    return {
      ...(row as unknown as Announcement),
      authorName: row.author?.full_name ?? "—",
      read: readSet.has(r.id),
    };
  });
}

export async function getAnnouncement(
  id: string,
): Promise<(Announcement & { authorName: string }) | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("announcements")
    .select("*, author:profiles!announcements_author_id_fkey(full_name)")
    .eq("id", id)
    .maybeSingle();
  if (!data) return null;
  const row = data as typeof data & { author: { full_name: string | null } | null };
  return { ...(row as unknown as Announcement), authorName: row.author?.full_name ?? "—" };
}

/** Recibos de leitura (para autor/staff). */
export async function getAnnouncementReads(id: string): Promise<ReadReceipt[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("announcement_reads")
    .select("read_at, user:profiles(full_name)")
    .eq("announcement_id", id)
    .order("read_at", { ascending: false });
  return (data ?? []).map((r) => {
    const row = r as typeof r & { user: { full_name: string | null } | null };
    return { userName: row.user?.full_name ?? "—", read_at: row.read_at };
  });
}

// --- Mensagens ---------------------------------------------------------------
export async function listInbox(profileId: string): Promise<MessageRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("messages")
    .select("*, sender:profiles!messages_sender_id_fkey(full_name)")
    .eq("receiver_id", profileId)
    .order("created_at", { ascending: false });
  return (data ?? []).map((m) => {
    const row = m as typeof m & { sender: { full_name: string | null } | null };
    return { ...(row as unknown as Message), otherName: row.sender?.full_name ?? "—" };
  });
}

export async function listSent(profileId: string): Promise<MessageRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("messages")
    .select("*, receiver:profiles!messages_receiver_id_fkey(full_name)")
    .eq("sender_id", profileId)
    .order("created_at", { ascending: false });
  return (data ?? []).map((m) => {
    const row = m as typeof m & { receiver: { full_name: string | null } | null };
    return { ...(row as unknown as Message), otherName: row.receiver?.full_name ?? "—" };
  });
}

export async function getMessage(
  id: string,
): Promise<(Message & { senderName: string; receiverName: string }) | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("messages")
    .select(
      "*, sender:profiles!messages_sender_id_fkey(full_name), receiver:profiles!messages_receiver_id_fkey(full_name)",
    )
    .eq("id", id)
    .maybeSingle();
  if (!data) return null;
  const row = data as typeof data & {
    sender: { full_name: string | null } | null;
    receiver: { full_name: string | null } | null;
  };
  return {
    ...(row as unknown as Message),
    senderName: row.sender?.full_name ?? "—",
    receiverName: row.receiver?.full_name ?? "—",
  };
}

/** Destinatários possíveis para enviar mensagem (via função SECURITY DEFINER). */
export async function listMessageRecipients(): Promise<
  { id: string; full_name: string; role: UserRole }[]
> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("list_message_recipients");
  return (data ?? []).map((r) => ({
    id: r.id,
    full_name: r.full_name ?? "—",
    role: r.role,
  }));
}

// --- Notificações ------------------------------------------------------------
export async function listNotifications(profileId: string): Promise<Notification[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", profileId)
    .order("created_at", { ascending: false })
    .limit(100);
  return data ?? [];
}

export async function getUnreadCounts(
  profileId: string,
): Promise<{ messages: number; notifications: number }> {
  const supabase = await createClient();
  const [{ count: messages }, { count: notifications }] = await Promise.all([
    supabase
      .from("messages")
      .select("*", { count: "exact", head: true })
      .eq("receiver_id", profileId)
      .is("read_at", null),
    supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", profileId)
      .is("read_at", null),
  ]);
  return { messages: messages ?? 0, notifications: notifications ?? 0 };
}
