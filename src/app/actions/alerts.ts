"use server";

// =============================================================================
// Server Actions - Alertas Automaticos
// =============================================================================
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import type { ActionResult } from "@/app/actions/auth";
import type { AlertStatus } from "@/types/models";

async function guard() {
  const profile = await getProfile();
  if (!profile || !hasPermission(profile.role, "alerts.manage")) return null;
  return profile;
}

function revalidate() {
  revalidatePath("/dashboard/alertas");
  revalidatePath("/dashboard");
}

/** Varre os dados e cria alertas para as situacoes pendentes. */
export async function generateAlertsAction(): Promise<ActionResult & { created?: number }> {
  if (!(await guard())) return { error: "Sem permissao." };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("generate_alerts");
  if (error) return { error: "Nao foi possivel gerar os alertas." };
  revalidate();
  return { success: true, created: data ?? 0 };
}

/** Atualiza o status de um alerta. */
export async function setAlertStatusAction(values: {
  id: string;
  status: AlertStatus;
}): Promise<ActionResult> {
  const profile = await getProfile();
  if (!profile) return { error: "Sem permissao." };
  const supabase = await createClient();
  const canManage = hasPermission(profile.role, "alerts.manage");

  if (!canManage) {
    if (values.status !== "visualizado") return { error: "Sem permissao." };
    const { data: alert } = await supabase
      .from("alerts")
      .select("related_user_id,status")
      .eq("id", values.id)
      .maybeSingle();
    if (!alert || alert.related_user_id !== profile.id || alert.status !== "novo") {
      return { error: "Sem permissao." };
    }
  }

  const resolving = values.status === "resolvido";
  const { error } = await supabase
    .from("alerts")
    .update({
      status: values.status,
      resolved_by: resolving ? profile.id : null,
      resolved_at: resolving ? new Date().toISOString() : null,
    })
    .eq("id", values.id);
  if (error) return { error: "Nao foi possivel atualizar o alerta." };
  revalidate();
  return { success: true };
}
