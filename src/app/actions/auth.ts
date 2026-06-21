"use server";

// =============================================================================
// Server Actions de autenticação
// =============================================================================
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { onlyDigits } from "@/lib/students/cpf";
import {
  loginSchema,
  recoverSchema,
  resetPasswordSchema,
} from "@/lib/auth/schemas";

export interface ActionResult {
  error?: string;
  success?: boolean;
}

/** Origem da requisição (para montar URLs de redirect dos e-mails). */
async function getOrigin(): Promise<string> {
  const h = await headers();
  const origin = h.get("origin");
  if (origin) return origin;
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "http";
  return host ? `${proto}://${host}` : "http://localhost:3000";
}

export async function signInAction(
  values: { identifier: string; password: string },
  redirectTo?: string,
): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(values);
  if (!parsed.success) {
    return { error: "Dados de login inválidos." };
  }

  let email = parsed.data.identifier.trim().toLowerCase();
  if (!email.includes("@")) {
    const admin = createAdminClient();
    const cpf = onlyDigits(email);
    const { data: alias } = await admin
      .from("guardian_login_aliases")
      .select("guardian_id")
      .eq("login_cpf", cpf)
      .maybeSingle();
    if (!alias) return { error: "CPF ou senha incorretos." };

    const { data: guardian } = await admin
      .from("guardians")
      .select("profile_id")
      .eq("id", alias.guardian_id)
      .maybeSingle();
    if (!guardian?.profile_id) return { error: "Conta do responsavel ainda nao foi ativada." };

    const { data: guardianProfile } = await admin
      .from("profiles")
      .select("email")
      .eq("id", guardian.profile_id)
      .maybeSingle();
    if (!guardianProfile?.email) return { error: "Conta do responsavel ainda nao foi ativada." };
    email = guardianProfile.email;
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: parsed.data.password,
  });

  if (error || !data.user) {
    return { error: "E-mail ou senha incorretos." };
  }

  // Bloqueio de usuário inativo/suspenso: encerra a sessão recém-criada.
  const { data: profile } = await supabase
    .from("profiles")
    .select("status, must_change_password")
    .eq("user_id", data.user.id)
    .single();

  if (profile && profile.status !== "active") {
    await supabase.auth.signOut();
    return {
      error:
        "Sua conta não está ativa. Entre em contato com a administração.",
    };
  }

  // Registra o último acesso.
  await supabase.rpc("record_last_access");

  revalidatePath("/", "layout");
  if (profile?.must_change_password) redirect("/redefinir-senha?first=1");
  redirect(redirectTo && redirectTo.startsWith("/") ? redirectTo : "/dashboard");
}

export async function signOutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}

/** Envia e-mail de recuperação de senha. */
export async function requestPasswordResetAction(values: {
  email: string;
}): Promise<ActionResult> {
  const parsed = recoverSchema.safeParse(values);
  if (!parsed.success) {
    return { error: "E-mail inválido." };
  }

  const supabase = await createClient();
  const origin = await getOrigin();

  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${origin}/auth/callback?next=/redefinir-senha`,
  });

  if (error) {
    return { error: "Não foi possível enviar o e-mail de recuperação." };
  }

  // Resposta neutra: não revela se o e-mail existe (boa prática de segurança).
  return { success: true };
}

/** Define uma nova senha (requer sessão de recuperação ativa). */
export async function updatePasswordAction(values: {
  password: string;
  confirmPassword: string;
}): Promise<ActionResult> {
  const parsed = resetPasswordSchema.safeParse(values);
  if (!parsed.success) {
    return { error: "Verifique os campos de senha." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      error: "Link inválido ou expirado. Solicite a recuperação novamente.",
    };
  }

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    return { error: "Não foi possível atualizar a senha." };
  }

  await supabase
    .from("profiles")
    .update({ must_change_password: false })
    .eq("user_id", user.id);

  revalidatePath("/", "layout");
  redirect("/dashboard");
}
