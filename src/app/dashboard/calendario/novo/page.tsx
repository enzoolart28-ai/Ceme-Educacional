import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireAuth } from "@/lib/auth/session";
import { STAFF_ROLES } from "@/lib/auth/roles";
import { listClasses } from "@/lib/classes/queries";
import { listCourses } from "@/lib/academic/queries";
import { listTeachers } from "@/lib/teachers/queries";
import { listUnits } from "@/lib/calendar/queries";
import { PageHeader } from "@/components/ui/page-header";
import { EventForm } from "@/components/calendar/event-form";

export default async function NovoEventoPage() {
  const profile = await requireAuth();
  const canCreate =
    STAFF_ROLES.includes(profile.role) || profile.role === "professor" || profile.role === "financeiro";
  if (!canCreate) notFound();

  const [classes, courses, teachers, units] = await Promise.all([
    listClasses(),
    listCourses(),
    listTeachers(),
    listUnits(),
  ]);

  return (
    <>
      <Link href="/dashboard/calendario" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-4 w-4" /> Voltar para o calendário
      </Link>
      <PageHeader title="Novo evento" description="Cadastre um evento no calendário." />
      <EventForm
        mode="create"
        classes={classes.map((c) => ({ id: c.id, name: c.name }))}
        courses={courses.map((c) => ({ id: c.id, name: c.name }))}
        units={units}
        teachers={teachers.map((t) => ({ id: t.id, name: t.full_name }))}
        defaultValues={{
          title: "",
          description: "",
          type: profile.role === "financeiro" ? "vencimento_financeiro" : "aula",
          start_datetime: "",
          end_datetime: "",
          course_id: "",
          class_id: "",
          unit_id: "",
          teacher_id: "",
          location: "",
          visibility: "restricted",
        }}
      />
    </>
  );
}
