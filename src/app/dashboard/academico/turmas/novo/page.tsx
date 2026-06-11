import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requirePermission } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { redirect } from "next/navigation";
import { listUnits } from "@/lib/classes/queries";
import { listCourses } from "@/lib/academic/queries";
import { listTeachers } from "@/lib/teachers/queries";
import { PageHeader } from "@/components/ui/page-header";
import { ClassForm } from "@/components/classes/class-form";

export default async function NovaTurmaPage() {
  const profile = await requirePermission("classes.read");
  if (
    !hasPermission(profile.role, "classes.manage") &&
    !hasPermission(profile.role, "academic.manage")
  ) {
    redirect("/sem-permissao");
  }

  const [courses, units, teachers] = await Promise.all([
    listCourses(),
    listUnits(),
    listTeachers(),
  ]);

  return (
    <>
      <Link
        href="/dashboard/academico/turmas"
        className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar para turmas
      </Link>
      <PageHeader title="Nova turma" description="Crie uma nova turma." />
      <ClassForm
        mode="create"
        courses={courses.map((c) => ({ id: c.id, name: c.name }))}
        units={units.map((u) => ({ id: u.id, name: u.name }))}
        teachers={teachers.map((t) => ({ id: t.id, name: t.full_name }))}
        defaultValues={{
          name: "",
          course_id: "",
          unit_id: "",
          shift: "manha",
          status: "open",
          year: String(new Date().getFullYear()),
          start_date: "",
          end_date: "",
          weekdays: [],
          start_time: "",
          end_time: "",
          main_teacher_id: "",
          max_students: "",
        }}
      />
    </>
  );
}
