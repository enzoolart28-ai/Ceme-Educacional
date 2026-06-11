import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth/session";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { AuthShell } from "@/components/auth/auth-shell";

export const metadata: Metadata = {
  title: "Redefinir senha",
};

export default async function RedefinirSenhaPage() {
  // Só acessível com sessão de recuperação ativa (criada pelo /auth/callback).
  const user = await getUser();
  if (!user) {
    redirect("/recuperar-senha");
  }

  return (
    <AuthShell
      title="Definir nova senha"
      subtitle="Escolha uma nova senha para sua conta"
    >
      <ResetPasswordForm />
    </AuthShell>
  );
}
