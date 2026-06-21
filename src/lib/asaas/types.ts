export type AsaasEnvironment = "sandbox" | "production";
export type AsaasBillingType = "BOLETO" | "PIX" | "UNDEFINED";

export interface AsaasCustomerResponse {
  id: string;
  name: string;
  cpfCnpj: string;
  email?: string;
  mobilePhone?: string;
  externalReference?: string;
}

export interface AsaasPaymentResponse {
  id: string;
  customer: string;
  billingType: string;
  value: number;
  dueDate: string;
  status: string;
  externalReference?: string;
  invoiceUrl?: string;
  bankSlipUrl?: string;
  description?: string;
}

export interface AsaasPixQrCodeResponse {
  encodedImage?: string;
  payload?: string;
  expirationDate?: string;
}

export interface AsaasWebhookPayload {
  id: string;
  event: string;
  payment?: {
    id: string;
    customer?: string;
    value?: number;
    netValue?: number;
    status?: string;
    billingType?: string;
    dueDate?: string;
    paymentDate?: string;
    clientPaymentDate?: string;
    externalReference?: string;
    invoiceUrl?: string;
    bankSlipUrl?: string;
  };
}
