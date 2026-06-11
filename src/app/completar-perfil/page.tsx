import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth/session";
import { roleLabel } from "@/lib/auth/roles";
import { OnboardingForm } from "@/components/profile/onboarding-form";
import { AuthShell } from "@/components/auth/auth-shell";

export const metadata: Metadata = {
  title: "Completar perfil",
};

export default async function CompletarPerfilPage() {
  const profile = await requireAuth();

  // Se o perfil já está completo, segue para o painel.
  if (profile.full_name.trim().length > 0) {
    redirect("/dashboard");
  }

  return (
    <AuthShell
      title="Complete seu perfil"
      subtitle={`Bem-vindo! Você está entrando como ${roleLabel(profile.role)}.`}
    >
      <OnboardingForm defaultValues={{ full_name: "", phone: profile.phone ?? "" }} />
    </AuthShell>
  );
}
