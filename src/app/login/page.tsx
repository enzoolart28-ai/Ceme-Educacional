import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";
import { AuthShell } from "@/components/auth/auth-shell";

export const metadata: Metadata = {
  title: "Entrar",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string }>;
}) {
  const { redirectTo } = await searchParams;

  return (
    <AuthShell
      title="CEME Educacional"
      subtitle="Acesse o sistema com suas credenciais"
    >
      <LoginForm redirectTo={redirectTo} />
      <p className="mt-4 text-center text-sm text-slate-500">
        <Link
          href="/recuperar-senha"
          className="font-medium text-indigo-600 hover:underline"
        >
          Esqueci minha senha
        </Link>
      </p>
    </AuthShell>
  );
}
