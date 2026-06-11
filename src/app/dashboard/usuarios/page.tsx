import { Users } from "lucide-react";
import { requireRole, MANAGEMENT_ROLES } from "@/lib/auth/session";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";

export default async function UsuariosPage() {
  await requireRole(MANAGEMENT_ROLES);

  return (
    <>
      <PageHeader
        title="Usuários"
        description="Gerencie contas, perfis e permissões dos usuários do sistema."
      />
      <EmptyState
        icon={Users}
        title="Módulo de Usuários"
        description="O cadastro e a gestão de usuários serão implementados aqui no próximo módulo."
      />
    </>
  );
}
