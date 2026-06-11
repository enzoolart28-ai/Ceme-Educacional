import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requirePermission } from "@/lib/auth/session";
import { getAssessmentById } from "@/lib/grades/queries";
import { listClasses } from "@/lib/classes/queries";
import { listSubjects } from "@/lib/subjects/queries";
import { PageHeader } from "@/components/ui/page-header";
import { AssessmentForm } from "@/components/grades/assessment-form";

export default async function EditarAvaliacaoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requirePermission("grades.manage");

  const [assessment, classes, subjects] = await Promise.all([
    getAssessmentById(id),
    listClasses(),
    listSubjects(),
  ]);
  if (!assessment) notFound();

  return (
    <>
      <Link
        href={`/dashboard/avaliacoes/${id}`}
        className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar para a avaliação
      </Link>
      <PageHeader title={`Editar: ${assessment.name}`} description="Atualize os dados da avaliação." />
      <AssessmentForm
        mode="edit"
        assessmentId={id}
        classes={classes.map((c) => ({ id: c.id, name: c.name }))}
        subjects={subjects.map((s) => ({ id: s.id, name: s.name }))}
        defaultValues={{
          name: assessment.name,
          type: assessment.type,
          class_id: assessment.class_id,
          subject_id: assessment.subject_id ?? "",
          weight: String(assessment.weight),
          max_grade: String(assessment.max_grade),
          date: assessment.date ?? "",
          notes: assessment.notes ?? "",
        }}
      />
    </>
  );
}
