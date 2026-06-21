import "server-only";

import type {
  WhatsAppConfigStatus,
  WhatsAppPhoneInfo,
  WhatsAppSendResponse,
  WhatsAppTemplateComponent,
} from "@/lib/whatsapp/types";

const GRAPH_BASE_URL = "https://graph.facebook.com";

function config() {
  return {
    version: process.env.WHATSAPP_GRAPH_API_VERSION?.trim(),
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID?.trim(),
    businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID?.trim(),
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN?.trim(),
    appSecret: process.env.WHATSAPP_APP_SECRET?.trim(),
    verifyToken: process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN?.trim(),
  };
}

export function getWhatsAppConfigStatus(): WhatsAppConfigStatus {
  const value = config();
  const status = {
    apiVersionConfigured: Boolean(value.version),
    phoneNumberIdConfigured: Boolean(value.phoneNumberId),
    businessAccountIdConfigured: Boolean(value.businessAccountId),
    accessTokenConfigured: Boolean(value.accessToken),
    appSecretConfigured: Boolean(value.appSecret),
    verifyTokenConfigured: Boolean(value.verifyToken),
  };
  return { ...status, configured: Object.values(status).every(Boolean) };
}

export function getWhatsAppWebhookSecrets() {
  const value = config();
  if (!value.appSecret || !value.verifyToken) {
    throw new Error("Segredos do webhook do WhatsApp nao configurados.");
  }
  return { appSecret: value.appSecret, verifyToken: value.verifyToken };
}

function getApiConfig() {
  const value = config();
  if (!value.version || !value.phoneNumberId || !value.accessToken) {
    throw new Error("Credenciais da API do WhatsApp nao configuradas.");
  }
  if (!/^v\d+\.\d+$/.test(value.version)) {
    throw new Error("WHATSAPP_GRAPH_API_VERSION deve seguir o formato vNN.N.");
  }
  return {
    version: value.version,
    phoneNumberId: value.phoneNumberId,
    accessToken: value.accessToken,
  };
}

async function graphRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const { version, accessToken } = getApiConfig();
  const response = await fetch(`${GRAPH_BASE_URL}/${version}/${path.replace(/^\//, "")}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
    cache: "no-store",
  });
  const payload = (await response.json()) as T & { error?: { message?: string } };
  if (!response.ok) {
    throw new Error(payload.error?.message || `Falha na API do WhatsApp (${response.status}).`);
  }
  return payload;
}

export async function testWhatsAppConnection(): Promise<WhatsAppPhoneInfo> {
  const { phoneNumberId } = getApiConfig();
  return graphRequest<WhatsAppPhoneInfo>(
    `${phoneNumberId}?fields=id,display_phone_number,verified_name,quality_rating`,
  );
}

export async function sendWhatsAppText(to: string, body: string): Promise<WhatsAppSendResponse> {
  const { phoneNumberId } = getApiConfig();
  return graphRequest<WhatsAppSendResponse>(`${phoneNumberId}/messages`, {
    method: "POST",
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: to.replace(/\D/g, ""),
      type: "text",
      text: { preview_url: false, body },
    }),
  });
}

export async function sendWhatsAppTemplate(input: {
  to: string;
  name: string;
  language?: string;
  components?: WhatsAppTemplateComponent[];
}): Promise<WhatsAppSendResponse> {
  const { phoneNumberId } = getApiConfig();
  return graphRequest<WhatsAppSendResponse>(`${phoneNumberId}/messages`, {
    method: "POST",
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: input.to.replace(/\D/g, ""),
      type: "template",
      template: {
        name: input.name,
        language: { code: input.language || "pt_BR" },
        ...(input.components?.length ? { components: input.components } : {}),
      },
    }),
  });
}
