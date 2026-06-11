import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requirePermission } from "@/lib/auth/session";
import { listClasses } from "@/lib/classes/queries";
import { listSubjects } from "@/lib/subjects/queries";
import { listTeachers } from "@/lib/teachers/queries";
import { PageHeader } from "@/components/ui/page-header";
import { AssessmentForm } from "@/components/online-assessments/assessment-form";

export default async function NovaProvaPage() {
  await requirePermission("grades.manage");
  const [classes, subjects, teachers] = await Promise.all([
    listClasses(),
    listSubjects(),
    listTeachers(),
  ]);

  return (
    <>
      <Link
        href="/dashboard/atividades"
        className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar para provas
      </Link>
      <PageHeader title="Nova prova" description="Defina as configurações; depois adicione as questões." />
      <AssessmentForm
        mode="create"
        classes={classes.map((c) => ({ id: c.id, name: c.name }))}
        subjects={subjects.map((s) => ({ id: s.id, name: s.name }))}
        teachers={teachers.map((t) => ({ id: t.id, name: t.full_name }))}
        defaultValues={{
          title: "",
          description: "",
          course_id: "",
          class_id: "",
          subject_id: "",
          teacher_id: "",
          start_date: "",
          end_date: "",
          time_limit_minutes: "",
          max_attempts: "1",
          max_grade: "10",
          min_grade: "6",
          correction_type: "automatic",
          show_answer_key: false,
          shuffle_questions: false,
          shuffle_options: false,
          status: "draft",
        }}
      />
    </>
  );
}
