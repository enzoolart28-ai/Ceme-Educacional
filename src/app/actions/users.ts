"use server";

// =============================================================================
// Server Actions — Gestão de Usuários (criar/editar contas via service_role)
// =============================================================================
// Todas as ações exigem a permissão users.manage. O cliente administrativo
// (service_role) só é usado aqui, no servidor.
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getProfile } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { ALL_ROLES } from "@/lib/auth/roles";
import { createUserSchema, resetPasswordSchema, type CreateUserInput } from "@/lib/users/schemas";
import type { ActionResult } from "@/app/actions/auth";
import type { UserRole, UserStatus } from "@/types/models";

const PATH = "/dashboard/usuarios";

async function guard() {
  const profile = await getProfile();
  if (!profile || !hasPermission(profile.role, "users.manage")) return null;
  return profile;
}

export async function createUserAction(values: CreateUserInput): Promise<ActionResult> {
  if (!(await guard())) return { error: "Sem permissão." };
  const parsed = createUserSchema.safeParse(values);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Verifique os campos." };
  const { full_name, email, password, role } = parsed.data;

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name, role },
  });
  if (error || !data.user) {
    const already = error?.message?.toLowerCase().includes("already") || error?.status === 422;
    return { error: already ? "Já existe um usuário com este e-mail." : "Não foi possível criar o usuário." };
  }

  // O trigger handle_new_user cria o perfil; garantimos papel/status/nome.
  await admin
    .from("profiles")
    .update({ role, status: "active", full_name })
    .eq("user_id", data.user.id);

  revalidatePath(PATH);
  return { success: true };
}

export async function setUserRoleAction(values: { profileId: string; role: string }): Promise<ActionResult> {
  const me = await guard();
  if (!me) return { error: "Sem permissão." };
  if (!ALL_ROLES.includes(values.role as UserRole)) return { error: "Perfil inválido." };
  if (values.profileId === me.id) return { error: "Você não pode alterar o próprio perfil." };

  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({ role: values.role as UserRole })
    .eq("id", values.profileId);
  if (error) return { error: "Não foi possível alterar o perfil." };
  revalidatePath(PATH);
  return { success: true };
}

export async function setUserStatusAction(values: { profileId: string; status: UserStatus }): Promise<ActionResult> {
  const me = await guard();
  if (!me) return { error: "Sem permissão." };
  if (values.profileId === me.id) return { error: "Você não pode alterar o próprio status." };

  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({ status: values.status })
    .eq("id", values.profileId);
  if (error) return { error: "Não foi possível alterar o status." };
  revalidatePath(PATH);
  return { success: true };
}

export async function resetUserPasswordAction(values: { user_id: string; password: string }): Promise<ActionResult> {
  if (!(await guard())) return { error: "Sem permissão." };
  const parsed = resetPasswordSchema.safeParse(values);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Senha inválida." };

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(parsed.data.user_id, {
    password: parsed.data.password,
  });
  if (error) return { error: "Não foi possível redefinir a senha." };
  return { success: true };
}

export async function deleteUserAction(values: { profileId: string; user_id: string }): Promise<ActionResult> {
  const me = await guard();
  if (!me) return { error: "Sem permissão." };
  if (values.profileId === me.id) return { error: "Você não pode excluir a própria conta." };

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(values.user_id);
  if (error) return { error: "Não foi possível excluir o usuário." };
  // Caso o perfil não tenha sido removido em cascata, remove explicitamente.
  await admin.from("profiles").delete().eq("id", values.profileId);
  revalidatePath(PATH);
  return { success: true };
}
