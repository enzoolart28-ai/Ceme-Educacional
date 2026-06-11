import Link from "next/link";
import { Contact, Plus } from "lucide-react";
import { requirePermission } from "@/lib/auth/session";
import { listGuardians } from "@/lib/guardians/queries";
import { formatCpf } from "@/lib/students/cpf";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/ui/data-table";
import { GuardianSearch } from "@/components/guardians/guardian-search";
import type { Guardian } from "@/types/models";

export default async function ResponsaveisPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requirePermission("guardians.manage");
  const { q } = await searchParams;
  const guardians = await listGuardians(q);

  const columns: Column<Guardian>[] = [
    {
      header: "Nome",
      cell: (g) => (
        <Link
          href={`/dashboard/responsaveis/${g.id}`}
          className="font-medium text-indigo-700 hover:underline"
        >
          {g.full_name}
        </Link>
      ),
    },
    { header: "CPF", cell: (g) => formatCpf(g.cpf) },
    { header: "Telefone", cell: (g) => g.phone || "—" },
    { header: "E-mail", cell: (g) => g.email || "—" },
    { header: "Parentesco", cell: (g) => g.kinship || "—" },
  ];

  return (
    <>
      <PageHeader
        title="Responsáveis"
        description="Cadastro de responsáveis e vínculo com alunos."
        action={
          <Link href="/dashboard/responsaveis/novo">
            <Button>
              <Plus className="h-4 w-4" /> Novo responsável
            </Button>
          </Link>
        }
      />
      <GuardianSearch />
      <p className="mb-3 text-sm text-slate-500">
        {guardians.length} responsável(is) encontrado(s)
      </p>
      <DataTable
        columns={columns}
        data={guardians}
        getRowKey={(g) => g.id}
        emptyIcon={Contact}
        emptyTitle="Nenhum responsável encontrado"
        emptyDescription="Ajuste a busca ou cadastre um novo responsável."
      />
    </>
  );
}
