import { notFound } from "next/navigation";
import { BookOpen, MessageSquareText } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { getDependentAcademicView } from "@/lib/guardians/queries";
import { formatDate } from "@/lib/utils";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, type Column } from "@/components/ui/data-table";
import { StudentStatusBadge } from "@/components/students/student-status-badge";

type GradeRow = NonNullable<Awaited<ReturnType<typeof getDependentAcademicView>>>["grades"][number];

export default async function DependenteDetalhePage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const profile = await requireRole(["responsavel"]);
  const { studentId } = await params;
  const dependent = await getDependentAcademicView(profile.id, studentId);
  if (!dependent) notFound();

  const columns: Column<GradeRow>[] = [
    { header: "Disciplina", cell: (row) => row.subjectName },
    { header: "Avaliacao", cell: (row) => row.assessmentName },
    { header: "Data", cell: (row) => row.date ? formatDate(row.date) : "-" },
    { header: "Nota", cell: (row) => row.grade == null ? "Sem nota" : `${row.grade}/${row.maxGrade}` },
    { header: "Observacao do professor", cell: (row) => row.feedback || "-" },
  ];

  return (
    <>
      <PageHeader
        title={dependent.fullName}
        description={[dependent.courseName, dependent.className].filter(Boolean).join(" - ") || "Dados academicos"}
        action={<StudentStatusBadge status={dependent.status} />}
      />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MessageSquareText className="h-4 w-4" /> Observacoes do aluno
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap text-sm text-slate-700">
            {dependent.observations || "Nenhuma observacao cadastrada."}
          </p>
        </CardContent>
      </Card>

      <DataTable
        columns={columns}
        data={dependent.grades}
        getRowKey={(row) => row.id}
        emptyIcon={BookOpen}
        emptyTitle="Sem notas registradas"
        emptyDescription="As notas e observacoes dos professores aparecerao aqui."
      />
    </>
  );
}
