"use server";

import { getProfile } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { testWhatsAppConnection } from "@/lib/whatsapp/client";
import type { ActionResult } from "@/app/actions/auth";

export async function testWhatsAppConnectionAction(): Promise<ActionResult & { detail?: string }> {
  const profile = await getProfile();
  if (!profile || !hasPermission(profile.role, "whatsapp.manage")) {
    return { error: "Sem permissao para configurar o WhatsApp." };
  }
  try {
    const phone = await testWhatsAppConnection();
    return {
      success: true,
      detail: [phone.verified_name, phone.display_phone_number].filter(Boolean).join(" - "),
    };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Falha ao conectar com o WhatsApp." };
  }
}
