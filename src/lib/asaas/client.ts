import "server-only";

import type {
  AsaasCustomerResponse,
  AsaasEnvironment,
  AsaasPaymentResponse,
  AsaasPixQrCodeResponse,
} from "@/lib/asaas/types";

const BASE_URLS: Record<AsaasEnvironment, string> = {
  sandbox: "https://api-sandbox.asaas.com",
  production: "https://api.asaas.com",
};

export interface AsaasConfigStatus {
  configured: boolean;
  environment: AsaasEnvironment;
  apiKeyConfigured: boolean;
  webhookTokenConfigured: boolean;
  baseUrl: string;
}

export function getAsaasConfigStatus(): AsaasConfigStatus {
  const environment = process.env.ASAAS_ENVIRONMENT === "production" ? "production" : "sandbox";
  const apiKeyConfigured = Boolean(process.env.ASAAS_API_KEY?.trim());
  const webhookToken = process.env.ASAAS_WEBHOOK_TOKEN?.trim() ?? "";
  const webhookTokenConfigured =
    webhookToken.length >= 32 && webhookToken.length <= 255 && !/\s/.test(webhookToken);
  return {
    configured: apiKeyConfigured && webhookTokenConfigured,
    environment,
    apiKeyConfigured,
    webhookTokenConfigured,
    baseUrl: BASE_URLS[environment],
  };
}

function apiKey(): string {
  const value = process.env.ASAAS_API_KEY?.trim();
  if (!value) throw new Error("ASAAS_API_KEY nao configurada no servidor.");
  return value;
}

interface AsaasErrorBody {
  errors?: { code?: string; description?: string }[];
}

export async function asaasRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const config = getAsaasConfigStatus();
  const response = await fetch(`${config.baseUrl}${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      access_token: apiKey(),
      "User-Agent": "CME-Educacional/1.0",
      ...init.headers,
    },
  });

  const body = (await response.json().catch(() => ({}))) as T & AsaasErrorBody;
  if (!response.ok) {
    const detail = body.errors?.map((error) => error.description).filter(Boolean).join("; ");
    throw new Error(detail || `Asaas respondeu com HTTP ${response.status}.`);
  }
  return body;
}

export function createAsaasCustomer(payload: Record<string, unknown>) {
  return asaasRequest<AsaasCustomerResponse>("/v3/customers", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function createAsaasPayment(payload: Record<string, unknown>) {
  return asaasRequest<AsaasPaymentResponse>("/v3/payments", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getAsaasPixQrCode(paymentId: string) {
  return asaasRequest<AsaasPixQrCodeResponse>(`/v3/payments/${paymentId}/pixQrCode`);
}

export function testAsaasConnection() {
  return asaasRequest<Record<string, unknown>>("/v3/myAccount");
}
