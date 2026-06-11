import Link from "next/link";
import { ClipboardList, Plus } from "lucide-react";
import { requirePermission } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { listAssessments, type AssessmentRow } from "@/lib/grades/queries";
import { formatDate } from "@/lib/utils";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/ui/data-table";
import { AssessmentTypeBadge } from "@/components/grades/grade-badges";

export default async function AvaliacoesPage() {
  const profile = await requirePermission("classes.read");
  const canManage = hasPermission(profile.role, "grades.manage");
  const assessments = await listAssessments();

  const columns: Column<AssessmentRow>[] = [
    {
      header: "Avaliação",
      cell: (a) => (
        <Link href={`/dashboard/avaliacoes/${a.id}`} className="font-medium text-indigo-700 hover:underline">
          {a.name}
        </Link>
      ),
    },
    { header: "Tipo", cell: (a) => <AssessmentTypeBadge type={a.type} /> },
    { header: "Turma", cell: (a) => a.className },
    { header: "Disciplina", cell: (a) => a.subjectName ?? "—" },
    { header: "Peso", cell: (a) => a.weight },
    { header: "Máx.", cell: (a) => a.max_grade },
    { header: "Data", cell: (a) => formatDate(a.date) },
    { header: "Notas", cell: (a) => a.gradeCount },
  ];

  return (
    <>
      <PageHeader
        title="Avaliações"
        description="Avaliações e lançamento de notas."
        action={
          canManage ? (
            <Link href="/dashboard/avaliacoes/nova">
              <Button>
                <Plus className="h-4 w-4" /> Nova avaliação
              </Button>
            </Link>
          ) : undefined
        }
      />
      <DataTable
        columns={columns}
        data={assessments}
        getRowKey={(a) => a.id}
        emptyIcon={ClipboardList}
        emptyTitle="Nenhuma avaliação"
        emptyDescription="Crie a primeira avaliação para lançar notas."
      />
    </>
  );
}
