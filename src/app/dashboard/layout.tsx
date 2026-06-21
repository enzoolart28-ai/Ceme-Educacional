import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth/session";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireAuth();

  if (profile.must_change_password) {
    redirect("/redefinir-senha?first=1");
  }

  // Gate de cadastro inicial: perfil sem nome precisa completar o cadastro.
  if (profile.full_name.trim().length === 0) {
    redirect("/completar-perfil");
  }

  return (
    <DashboardShell
      role={profile.role}
      fullName={profile.full_name}
      email={profile.email}
    >
      {children}
    </DashboardShell>
  );
}
