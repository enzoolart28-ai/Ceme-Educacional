import Link from "next/link";
import { ClipboardCheck, ChevronRight } from "lucide-react";
import { requirePermission } from "@/lib/auth/session";
import { listClasses, type ClassListRow } from "@/lib/classes/queries";
import { shiftLabel } from "@/lib/academic/labels";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable, type Column } from "@/components/ui/data-table";

export default async function ChamadaPage() {
  await requirePermission("classes.read");
  const classes = await listClasses();

  const columns: Column<ClassListRow>[] = [
    {
      header: "Turma",
      cell: (c) => (
        <Link href={`/dashboard/chamada/${c.id}`} className="font-medium text-indigo-700 hover:underline">
          {c.name}
        </Link>
      ),
    },
    { header: "Curso", cell: (c) => c.courseName },
    { header: "Turno", cell: (c) => shiftLabel(c.shift) },
    { header: "Alunos", cell: (c) => c.studentCount },
    {
      header: "",
      cell: (c) => (
        <Link href={`/dashboard/chamada/${c.id}`} className="text-slate-400 hover:text-indigo-600" aria-label="Abrir">
          <ChevronRight className="h-4 w-4" />
        </Link>
      ),
    },
  ];

  return (
    <>
      <PageHeader title="Chamada" description="Selecione uma turma para fazer a chamada ou ver a frequência." />
      <DataTable
        columns={columns}
        data={classes}
        getRowKey={(c) => c.id}
        emptyIcon={ClipboardCheck}
        emptyTitle="Nenhuma turma"
        emptyDescription="Você não tem turmas disponíveis para chamada."
      />
    </>
  );
}
