import { ClipboardList } from "lucide-react";
import { requireRole, STAFF_ROLES } from "@/lib/auth/session";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";

export default async function SecretariaPage() {
  await requireRole(STAFF_ROLES);

  return (
    <>
      <PageHeader
        title="Secretaria"
        description="Documentos, declarações e atendimento à comunidade escolar."
      />
      <EmptyState
        icon={ClipboardList}
        title="Módulo de Secretaria"
        description="Emissão de documentos e rotinas de secretaria serão implementadas aqui."
      />
    </>
  );
}
