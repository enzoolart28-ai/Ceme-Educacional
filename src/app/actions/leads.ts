"use server";

// =============================================================================
// Server Action — Captação de lead (aberta a qualquer usuário logado)
// =============================================================================
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth/session";
import { quickLeadSchema, type QuickLeadInput } from "@/lib/leads/quick";
import type { ActionResult } from "@/app/actions/auth";

export async function createQuickLeadAction(values: QuickLeadInput): Promise<ActionResult> {
  const profile = await getProfile();
  if (!profile) return { error: "Sessão expirada. Entre novamente." };

  const parsed = quickLeadSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Verifique os campos." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("leads").insert({
    full_name: parsed.data.full_name.trim(),
    phone: parsed.data.phone.trim(),
    course_interest: parsed.data.course_interest.trim(),
    // source/status usam os defaults da tabela ('outro' / 'novo').
  });

  if (error) {
    return { error: "Não foi possível cadastrar o lead. Tente novamente." };
  }
  return { success: true };
}
