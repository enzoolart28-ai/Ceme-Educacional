import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requirePermission } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { getClassById, listUnits } from "@/lib/classes/queries";
import { listCourses } from "@/lib/academic/queries";
import { listTeachers } from "@/lib/teachers/queries";
import { formatTime } from "@/lib/classes/labels";
import { PageHeader } from "@/components/ui/page-header";
import { ClassForm } from "@/components/classes/class-form";

export default async function EditarTurmaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await requirePermission("classes.read");
  if (
    !hasPermission(profile.role, "classes.manage") &&
    !hasPermission(profile.role, "academic.manage")
  ) {
    redirect("/sem-permissao");
  }

  const [turma, courses, units, teachers] = await Promise.all([
    getClassById(id),
    listCourses(),
    listUnits(),
    listTeachers(),
  ]);
  if (!turma) notFound();

  return (
    <>
      <Link
        href={`/dashboard/academico/turmas/${id}`}
        className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar para a turma
      </Link>
      <PageHeader title={`Editar: ${turma.name}`} description="Atualize os dados da turma." />
      <ClassForm
        mode="edit"
        classId={id}
        courses={courses.map((c) => ({ id: c.id, name: c.name }))}
        units={units.map((u) => ({ id: u.id, name: u.name }))}
        teachers={teachers.map((t) => ({ id: t.id, name: t.full_name }))}
        defaultValues={{
          name: turma.name,
          course_id: turma.course_id,
          unit_id: turma.unit_id ?? "",
          shift: turma.shift,
          status: turma.status,
          year: turma.year != null ? String(turma.year) : "",
          start_date: turma.start_date ?? "",
          end_date: turma.end_date ?? "",
          weekdays: turma.weekdays ?? [],
          start_time: formatTime(turma.start_time) === "—" ? "" : formatTime(turma.start_time),
          end_time: formatTime(turma.end_time) === "—" ? "" : formatTime(turma.end_time),
          main_teacher_id: turma.main_teacher_id ?? "",
          max_students: turma.max_students != null ? String(turma.max_students) : "",
        }}
      />
    </>
  );
}
