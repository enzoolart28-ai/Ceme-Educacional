import type { Metadata } from "next";
import { RecoverForm } from "@/components/auth/recover-form";
import { AuthShell } from "@/components/auth/auth-shell";

export const metadata: Metadata = {
  title: "Recuperar senha",
};

export default function RecuperarSenhaPage() {
  return (
    <AuthShell
      title="Recuperar senha"
      subtitle="Informe seu e-mail para receber o link de redefinição"
    >
      <RecoverForm />
    </AuthShell>
  );
}
