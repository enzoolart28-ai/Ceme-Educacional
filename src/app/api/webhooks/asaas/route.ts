import { timingSafeEqual } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAsaasConfigStatus } from "@/lib/asaas/client";
import type { AsaasWebhookPayload } from "@/lib/asaas/types";
import type { Json } from "@/types/database";

export const runtime = "nodejs";

function validToken(received: string | null): boolean {
  const expected = process.env.ASAAS_WEBHOOK_TOKEN?.trim();
  if (!expected || !received) return false;
  const a = Buffer.from(received);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

function paymentMethod(billingType?: string) {
  switch (billingType) {
    case "PIX": return "pix" as const;
    case "BOLETO": return "bank_slip" as const;
    case "CREDIT_CARD": return "credit_card" as const;
    case "DEBIT_CARD": return "debit_card" as const;
    case "TRANSFER": return "transfer" as const;
    default: return "other" as const;
  }
}

const PAID_EVENTS = new Set(["PAYMENT_RECEIVED", "PAYMENT_CONFIRMED"]);

export async function POST(request: Request) {
  if (!validToken(request.headers.get("asaas-access-token"))) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  let payload: AsaasWebhookPayload;
  try {
    payload = (await request.json()) as AsaasWebhookPayload;
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }
  if (!payload.id || !payload.event) {
    return Response.json({ error: "invalid_event" }, { status: 400 });
  }

  const admin = createAdminClient();
  const environment = getAsaasConfigStatus().environment;
  const { data: existing } = await admin
    .from("asaas_webhook_events")
    .select("id, processed_at")
    .eq("asaas_event_id", payload.id)
    .maybeSingle();
  if (existing?.processed_at) return Response.json({ received: true, duplicate: true });

  let eventRowId = existing?.id;
  if (!eventRowId) {
    const { data: inserted, error } = await admin
      .from("asaas_webhook_events")
      .insert({
        asaas_event_id: payload.id,
        event_type: payload.event,
        asaas_payment_id: payload.payment?.id ?? null,
        payload: payload as unknown as Json,
      })
      .select("id")
      .single();
    if (error || !inserted) return Response.json({ error: "event_store_failed" }, { status: 500 });
    eventRowId = inserted.id;
  }

  try {
    const payment = payload.payment;
    if (payment?.id) {
      const { data: charge } = await admin
        .from("asaas_charges")
        .select("invoice_id")
        .eq("asaas_payment_id", payment.id)
        .eq("environment", environment)
        .maybeSingle();
      const invoiceId = charge?.invoice_id ?? payment.externalReference ?? null;

      await admin
        .from("asaas_charges")
        .update({
          status: payment.status || payload.event,
          invoice_url: payment.invoiceUrl ?? undefined,
          bank_slip_url: payment.bankSlipUrl ?? undefined,
          raw_response: payment as unknown as Json,
        })
        .eq("asaas_payment_id", payment.id)
        .eq("environment", environment);

      if (invoiceId && PAID_EVENTS.has(payload.event)) {
        const { error: paymentError } = await admin.from("payments").insert({
          invoice_id: invoiceId,
          amount: Number(payment.value ?? 0),
          payment_method: paymentMethod(payment.billingType),
          paid_at: payment.paymentDate || payment.clientPaymentDate || new Date().toISOString(),
          notes: `Baixa automatica Asaas (${payload.event})`,
          payment_provider: "asaas",
          provider_payment_id: payment.id,
        });
        if (paymentError && paymentError.code !== "23505") throw paymentError;
      }

      if (invoiceId && payload.event === "PAYMENT_OVERDUE") {
        await admin.from("invoices").update({ status: "overdue" }).eq("id", invoiceId);
      }

      if (invoiceId) {
        await admin.from("financial_logs").insert({
          invoice_id: invoiceId,
          action: `asaas.webhook.${payload.event.toLowerCase()}`,
          metadata: { eventId: payload.id, paymentId: payment.id, status: payment.status },
        });
      }
    }

    await admin
      .from("asaas_webhook_events")
      .update({ processed_at: new Date().toISOString(), processing_error: null })
      .eq("id", eventRowId);
    return Response.json({ received: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "processing_failed";
    await admin
      .from("asaas_webhook_events")
      .update({ processing_error: message.slice(0, 1000) })
      .eq("id", eventRowId);
    return Response.json({ error: "processing_failed" }, { status: 500 });
  }
}
