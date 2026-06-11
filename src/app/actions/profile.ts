"use server";

// =============================================================================
// Server Actions de perfil
// =============================================================================
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { updateProfileSchema } from "@/lib/auth/schemas";
import type { ActionResult } from "@/app/actions/auth";

export async function updateProfileAction(values: {
  full_name: string;
  phone?: string;
}): Promise<ActionResult & { success?: boolean }> {
  const parsed = updateProfileSchema.safeParse(values);
  if (!parsed.success) {
    return { error: "Dados inválidos. Verifique os campos." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Sessão expirada. Faça login novamente." };
  }

  // RLS garante que o usuário só atualiza o próprio perfil; o trigger impede
  // alteração de role/status por usuário comum.
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: parsed.data.full_name,
      phone: parsed.data.phone || null,
    })
    .eq("user_id", user.id);

  if (error) {
    return { error: "Não foi possível salvar as alterações." };
  }

  revalidatePath("/dashboard/perfil");
  revalidatePath("/completar-perfil");
  revalidatePath("/dashboard", "layout");
  return { success: true };
}
