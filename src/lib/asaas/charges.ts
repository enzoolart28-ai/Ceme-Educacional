import "server-only";

import { createClient } from "@/lib/supabase/server";
import { onlyDigits } from "@/lib/students/cpf";
import {
  createAsaasCustomer,
  createAsaasPayment,
  getAsaasConfigStatus,
  getAsaasPixQrCode,
} from "@/lib/asaas/client";
import type { AsaasBillingType } from "@/lib/asaas/types";
import type { Json } from "@/types/database";

export interface AsaasChargeRow {
  id: string;
  invoiceId: string;
  paymentId: string;
  billingType: string;
  status: string;
  value: number;
  dueDate: string;
  invoiceUrl: string | null;
  bankSlipUrl: string | null;
  pixPayload: string | null;
  pixEncodedImage: string | null;
  environment: string;
}

export async function getAsaasChargeByInvoice(invoiceId: string): Promise<AsaasChargeRow | null> {
  const supabase = await createClient();
  const config = getAsaasConfigStatus();
  const { data } = await supabase
    .from("asaas_charges")
    .select("*")
    .eq("invoice_id", invoiceId)
    .eq("environment", config.environment)
    .maybeSingle();
  if (!data) return null;
  return {
    id: data.id,
    invoiceId: data.invoice_id,
    paymentId: data.asaas_payment_id,
    billingType: data.billing_type,
    status: data.status,
    value: Number(data.value),
    dueDate: data.due_date,
    invoiceUrl: data.invoice_url,
    bankSlipUrl: data.bank_slip_url,
    pixPayload: data.pix_payload,
    pixEncodedImage: data.pix_encoded_image,
    environment: data.environment,
  };
}

export async function createChargeForInvoice(
  invoiceId: string,
  billingType: AsaasBillingType,
): Promise<AsaasChargeRow> {
  const existing = await getAsaasChargeByInvoice(invoiceId);
  if (existing) return existing;

  const config = getAsaasConfigStatus();
  if (!config.apiKeyConfigured) throw new Error("Configure a chave da API Asaas antes de gerar cobrancas.");

  const supabase = await createClient();
  const { data: invoice } = await supabase
    .from("invoices")
    .select("id, student_id, final_value, due_date, notes, student:students(id, full_name, cpf, email, phone)")
    .eq("id", invoiceId)
    .maybeSingle();
  if (!invoice) throw new Error("Cobranca nao encontrada.");

  const student = invoice.student as unknown as {
    id: string;
    full_name: string;
    cpf: string | null;
    email: string | null;
    phone: string | null;
  } | null;
  if (!student) throw new Error("Aluno da cobranca nao encontrado.");
  const cpfCnpj = onlyDigits(student.cpf ?? "");
  if (cpfCnpj.length !== 11) throw new Error("O aluno precisa ter CPF valido para ser enviado ao Asaas.");

  const { data: customerMap } = await supabase
    .from("asaas_customers")
    .select("asaas_customer_id")
    .eq("student_id", student.id)
    .eq("environment", config.environment)
    .maybeSingle();

  let customerId = customerMap?.asaas_customer_id;
  if (!customerId) {
    const customer = await createAsaasCustomer({
      name: student.full_name,
      cpfCnpj,
      email: student.email || undefined,
      mobilePhone: onlyDigits(student.phone ?? "") || undefined,
      externalReference: student.id,
      notificationDisabled: false,
    });
    customerId = customer.id;
    const { error } = await supabase.from("asaas_customers").insert({
      student_id: student.id,
      asaas_customer_id: customer.id,
      environment: config.environment,
      name: student.full_name,
      cpf_cnpj: cpfCnpj,
      raw_response: customer as unknown as Json,
    });
    if (error) throw new Error("Cliente criado no Asaas, mas nao foi possivel salvar o vinculo local.");
  }

  const payment = await createAsaasPayment({
    customer: customerId,
    billingType,
    value: Number(invoice.final_value),
    dueDate: invoice.due_date,
    description: invoice.notes || `Mensalidade CME - ${student.full_name}`,
    externalReference: invoice.id,
  });

  let pixPayload: string | null = null;
  let pixEncodedImage: string | null = null;
  let pixExpirationAt: string | null = null;
  if (billingType === "PIX" || billingType === "UNDEFINED") {
    try {
      const pix = await getAsaasPixQrCode(payment.id);
      pixPayload = pix.payload ?? null;
      pixEncodedImage = pix.encodedImage ?? null;
      pixExpirationAt = pix.expirationDate ?? null;
    } catch {
      // A cobranca continua valida mesmo se o QR Code ainda nao estiver disponivel.
    }
  }

  const { data: saved, error: saveError } = await supabase
    .from("asaas_charges")
    .insert({
      invoice_id: invoice.id,
      asaas_customer_id: customerId,
      asaas_payment_id: payment.id,
      environment: config.environment,
      billing_type: payment.billingType || billingType,
      status: payment.status,
      value: payment.value,
      due_date: payment.dueDate,
      external_reference: payment.externalReference || invoice.id,
      invoice_url: payment.invoiceUrl ?? null,
      bank_slip_url: payment.bankSlipUrl ?? null,
      pix_payload: pixPayload,
      pix_encoded_image: pixEncodedImage,
      pix_expiration_at: pixExpirationAt,
      raw_response: payment as unknown as Json,
    })
    .select("*")
    .single();
  if (saveError || !saved) throw new Error("Cobranca criada no Asaas, mas nao foi possivel salvar o vinculo local.");

  await supabase.from("financial_logs").insert({
    invoice_id: invoice.id,
    action: "asaas.charge_created",
    metadata: { paymentId: payment.id, billingType, environment: config.environment },
  });

  return (await getAsaasChargeByInvoice(invoice.id))!;
}
