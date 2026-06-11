import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requirePermission } from "@/lib/auth/session";
import { listClasses } from "@/lib/classes/queries";
import { listSubjects } from "@/lib/subjects/queries";
import { PageHeader } from "@/components/ui/page-header";
import { AssessmentForm } from "@/components/grades/assessment-form";

export default async function NovaAvaliacaoPage() {
  await requirePermission("grades.manage");
  const [classes, subjects] = await Promise.all([listClasses(), listSubjects()]);

  return (
    <>
      <Link
        href="/dashboard/avaliacoes"
        className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar para avaliações
      </Link>
      <PageHeader title="Nova avaliação" description="Cadastre uma avaliação para lançar notas." />
      <AssessmentForm
        mode="create"
        classes={classes.map((c) => ({ id: c.id, name: c.name }))}
        subjects={subjects.map((s) => ({ id: s.id, name: s.name }))}
        defaultValues={{
          name: "",
          type: "prova",
          class_id: "",
          subject_id: "",
          weight: "1",
          max_grade: "10",
          date: "",
          notes: "",
        }}
      />
    </>
  );
}
