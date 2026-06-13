import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireAuth } from "@/lib/auth/session";
import { STAFF_ROLES } from "@/lib/auth/roles";
import { getEvent, listUnits } from "@/lib/calendar/queries";
import { listClasses } from "@/lib/classes/queries";
import { listCourses } from "@/lib/academic/queries";
import { listTeachers } from "@/lib/teachers/queries";
import { isoToLocalInput } from "@/lib/calendar/dates";
import { PageHeader } from "@/components/ui/page-header";
import { EventForm } from "@/components/calendar/event-form";

export default async function EditarEventoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await requireAuth();
  const e = await getEvent(id);
  if (!e) notFound();

  const canManage = e.created_by === profile.id || STAFF_ROLES.includes(profile.role);
  if (!canManage) notFound();

  const [classes, courses, teachers, units] = await Promise.all([
    listClasses(),
    listCourses(),
    listTeachers(),
    listUnits(),
  ]);

  return (
    <>
      <Link href={`/dashboard/calendario/${id}`} className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-4 w-4" /> Voltar para o evento
      </Link>
      <PageHeader title="Editar evento" description="Atualize os dados do evento." />
      <EventForm
        mode="edit"
        eventId={id}
        classes={classes.map((c) => ({ id: c.id, name: c.name }))}
        courses={courses.map((c) => ({ id: c.id, name: c.name }))}
        units={units}
        teachers={teachers.map((t) => ({ id: t.id, name: t.full_name }))}
        defaultValues={{
          title: e.title,
          description: e.description ?? "",
          type: e.type,
          start_datetime: isoToLocalInput(e.start_datetime),
          end_datetime: isoToLocalInput(e.end_datetime),
          course_id: e.course_id ?? "",
          class_id: e.class_id ?? "",
          unit_id: e.unit_id ?? "",
          teacher_id: e.teacher_id ?? "",
          location: e.location ?? "",
          visibility: e.visibility,
        }}
      />
    </>
  );
}
