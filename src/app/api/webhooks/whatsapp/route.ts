import { createHmac, createHash, timingSafeEqual } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { getWhatsAppWebhookSecrets } from "@/lib/whatsapp/client";
import type { Database, Json } from "@/types/database";

export const runtime = "nodejs";

interface WebhookStatus {
  id: string;
  status: string;
  timestamp?: string;
  errors?: Array<{ code?: number; title?: string; message?: string }>;
}

interface WebhookMessage {
  id: string;
  from: string;
  timestamp?: string;
  type?: string;
  text?: { body?: string };
}

interface WebhookValue {
  contacts?: Array<{ wa_id?: string; profile?: { name?: string } }>;
  messages?: WebhookMessage[];
  statuses?: WebhookStatus[];
}

type WhatsAppMessageUpdate = Database["public"]["Tables"]["whatsapp_messages"]["Update"];

function equalSecret(received: string, expected: string) {
  const left = Buffer.from(received);
  const right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token") || "";
  const challenge = url.searchParams.get("hub.challenge") || "";
  try {
    const { verifyToken } = getWhatsAppWebhookSecrets();
    if (mode === "subscribe" && equalSecret(token, verifyToken)) {
      return new Response(challenge, { status: 200 });
    }
  } catch {
    return new Response("Webhook nao configurado", { status: 503 });
  }
  return new Response("Token invalido", { status: 403 });
}

function isValidSignature(rawBody: string, signature: string, appSecret: string) {
  if (!signature.startsWith("sha256=")) return false;
  const expected = `sha256=${createHmac("sha256", appSecret).update(rawBody).digest("hex")}`;
  return equalSecret(signature, expected);
}

function mapStatus(status: string): "sent" | "delivered" | "read" | "failed" {
  if (status === "delivered" || status === "read" || status === "failed") return status;
  return "sent";
}

async function getOrCreateContact(value: WebhookValue, message: WebhookMessage) {
  const admin = createAdminClient();
  const phone = `+${message.from.replace(/\D/g, "")}`;
  const displayName = value.contacts?.find((item) => item.wa_id === message.from)?.profile?.name;
  const { data, error } = await admin
    .from("whatsapp_contacts")
    .upsert(
      { phone_e164: phone, display_name: displayName || null },
      { onConflict: "phone_e164", ignoreDuplicates: false },
    )
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

async function processValue(value: WebhookValue, payload: Json) {
  const admin = createAdminClient();

  for (const message of value.messages || []) {
    const eventKey = `message:${message.id}`;
    const { error: eventError } = await admin
      .from("whatsapp_webhook_events")
      .insert({ event_key: eventKey, payload });
    if (eventError?.code === "23505") continue;
    if (eventError) throw eventError;

    try {
      const contactId = await getOrCreateContact(value, message);
      const body = message.text?.body || `[${message.type || "mensagem"}]`;
      const { error } = await admin.from("whatsapp_messages").upsert({
        contact_id: contactId,
        direction: "inbound",
        status: "received",
        meta_message_id: message.id,
        body,
        metadata: message as unknown as Json,
      }, { onConflict: "meta_message_id", ignoreDuplicates: true });
      if (error) throw error;
      await admin.from("whatsapp_webhook_events")
        .update({ processed_at: new Date().toISOString() }).eq("event_key", eventKey);
    } catch (error) {
      await admin.from("whatsapp_webhook_events").update({
        processing_error: error instanceof Error ? error.message : "Falha ao processar mensagem.",
      }).eq("event_key", eventKey);
      throw error;
    }
  }

  for (const status of value.statuses || []) {
    const eventKey = `status:${status.id}:${status.status}:${status.timestamp || "0"}`;
    const { error: eventError } = await admin
      .from("whatsapp_webhook_events")
      .insert({ event_key: eventKey, payload });
    if (eventError?.code === "23505") continue;
    if (eventError) throw eventError;

    const occurredAt = status.timestamp
      ? new Date(Number(status.timestamp) * 1000).toISOString()
      : new Date().toISOString();
    const firstError = status.errors?.[0];
    const update: WhatsAppMessageUpdate = {
      status: mapStatus(status.status),
      error_code: firstError?.code ? String(firstError.code) : null,
      error_message: firstError?.message || firstError?.title || null,
    };
    if (status.status === "sent") update.sent_at = occurredAt;
    if (status.status === "delivered") update.delivered_at = occurredAt;
    if (status.status === "read") update.read_at = occurredAt;

    const { error } = await admin.from("whatsapp_messages")
      .update(update).eq("meta_message_id", status.id);
    if (error) throw error;
    await admin.from("whatsapp_webhook_events")
      .update({ processed_at: new Date().toISOString() }).eq("event_key", eventKey);
  }
}

export async function POST(request: Request) {
  let appSecret: string;
  try {
    ({ appSecret } = getWhatsAppWebhookSecrets());
  } catch {
    return Response.json({ error: "Webhook nao configurado" }, { status: 503 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get("x-hub-signature-256") || "";
  if (!isValidSignature(rawBody, signature, appSecret)) {
    return Response.json({ error: "Assinatura invalida" }, { status: 401 });
  }

  try {
    const payload = JSON.parse(rawBody) as Json & {
      entry?: Array<{ changes?: Array<{ value?: WebhookValue }> }>;
    };
    for (const entry of payload.entry || []) {
      for (const change of entry.changes || []) {
        if (change.value) await processValue(change.value, payload);
      }
    }
    return Response.json({ received: true });
  } catch (error) {
    const fallbackKey = `invalid:${createHash("sha256").update(rawBody).digest("hex")}`;
    try {
      await createAdminClient().from("whatsapp_webhook_events").upsert({
        event_key: fallbackKey,
        payload: { raw: rawBody },
        processing_error: error instanceof Error ? error.message : "Payload invalido.",
      }, { onConflict: "event_key" });
    } catch {
      // A resposta 500 solicita uma nova tentativa ao provedor.
    }
    return Response.json({ error: "Falha ao processar webhook" }, { status: 500 });
  }
}
