"use server";

import { revalidatePath } from "next/cache";
import { getProfile } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { createChargeForInvoice } from "@/lib/asaas/charges";
import { testAsaasConnection } from "@/lib/asaas/client";
import type { AsaasBillingType } from "@/lib/asaas/types";
import type { ActionResult } from "@/app/actions/auth";

export async function createAsaasChargeAction(
  invoiceId: string,
  billingType: AsaasBillingType,
): Promise<ActionResult> {
  const profile = await getProfile();
  if (!profile || !hasPermission(profile.role, "finance.manage")) {
    return { error: "Sem permissao para gerar cobrancas no Asaas." };
  }
  if (!invoiceId || !["BOLETO", "PIX", "UNDEFINED"].includes(billingType)) {
    return { error: "Dados invalidos para cobranca Asaas." };
  }
  try {
    await createChargeForInvoice(invoiceId, billingType);
    revalidatePath(`/dashboard/financeiro/cobrancas/${invoiceId}`);
    revalidatePath("/dashboard/financeiro/cobrancas");
    return { success: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Nao foi possivel gerar a cobranca Asaas." };
  }
}

export async function testAsaasConnectionAction(): Promise<ActionResult> {
  const profile = await getProfile();
  if (!profile || !hasPermission(profile.role, "finance.manage")) return { error: "Sem permissao." };
  try {
    await testAsaasConnection();
    return { success: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Falha ao conectar com o Asaas." };
  }
}
