export interface WhatsAppConfigStatus {
  configured: boolean;
  apiVersionConfigured: boolean;
  phoneNumberIdConfigured: boolean;
  businessAccountIdConfigured: boolean;
  accessTokenConfigured: boolean;
  appSecretConfigured: boolean;
  verifyTokenConfigured: boolean;
}

export interface WhatsAppTemplateComponent {
  type: "header" | "body" | "button";
  sub_type?: string;
  index?: string;
  parameters: Array<Record<string, unknown>>;
}

export interface WhatsAppSendResponse {
  messaging_product: "whatsapp";
  contacts?: Array<{ input: string; wa_id: string }>;
  messages?: Array<{ id: string; message_status?: string }>;
}

export interface WhatsAppPhoneInfo {
  id: string;
  display_phone_number?: string;
  verified_name?: string;
  quality_rating?: string;
}
