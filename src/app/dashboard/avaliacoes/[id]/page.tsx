import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil } from "lucide-react";
import { requirePermission } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { getAssessmentById, getAssessmentGradeSheet } from "@/lib/grades/queries";
import { formatDate } from "@/lib/utils";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { GradeSheet } from "@/components/grades/grade-sheet";
import { AssessmentTypeBadge } from "@/components/grades/grade-badges";
import { AssessmentDeleteButton } from "@/components/grades/assessment-delete-button";

export default async function AvaliacaoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await requirePermission("classes.read");

  const assessment = await getAssessmentById(id);
  if (!assessment) notFound();

  const canManage = hasPermission(profile.role, "grades.manage");
  const sheet = await getAssessmentGradeSheet(id, assessment.class_id);

  return (
    <>
      <Link
        href="/dashboard/avaliacoes"
        className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar para avaliações
      </Link>

      <PageHeader
        title={assessment.name}
        description={`${assessment.className} · ${assessment.subjectName ?? "Geral"}`}
        action={
          <div className="flex items-center gap-2">
            <AssessmentTypeBadge type={assessment.type} />
            {canManage && (
              <>
                <Link href={`/dashboard/avaliacoes/${id}/editar`}>
                  <Button variant="outline">
                    <Pencil className="h-4 w-4" /> Editar
                  </Button>
                </Link>
                <AssessmentDeleteButton assessmentId={id} />
              </>
            )}
          </div>
        }
      />

      <Card className="mb-6">
        <CardContent className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
          <div>
            <p className="text-slate-500">Peso</p>
            <p className="font-medium text-slate-900">{assessment.weight}</p>
          </div>
          <div>
            <p className="text-slate-500">Nota máxima</p>
            <p className="font-medium text-slate-900">{assessment.max_grade}</p>
          </div>
          <div>
            <p className="text-slate-500">Data</p>
            <p className="font-medium text-slate-900">{formatDate(assessment.date)}</p>
          </div>
          <div>
            <p className="text-slate-500">Média mínima (curso)</p>
            <p className="font-medium text-slate-900">{assessment.minGrade}</p>
          </div>
        </CardContent>
      </Card>

      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
        Lançamento de notas
      </h2>
      <GradeSheet
        assessmentId={id}
        roster={sheet}
        maxGrade={Number(assessment.max_grade)}
        canManage={canManage}
      />
    </>
  );
}
