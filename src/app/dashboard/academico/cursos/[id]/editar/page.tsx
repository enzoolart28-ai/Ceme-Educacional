import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requirePermission } from "@/lib/auth/session";
import { getCourseById } from "@/lib/courses/queries";
import { PageHeader } from "@/components/ui/page-header";
import { CourseForm } from "@/components/courses/course-form";

export default async function EditarCursoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requirePermission("courses.manage");

  const c = await getCourseById(id);
  if (!c) notFound();

  return (
    <>
      <Link
        href={`/dashboard/academico/cursos/${id}`}
        className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar para o curso
      </Link>
      <PageHeader title={`Editar: ${c.name}`} description="Atualize os dados do curso." />
      <CourseForm
        mode="edit"
        courseId={id}
        defaultValues={{
          name: c.name,
          description: c.description ?? "",
          modality: c.modality,
          type: c.type,
          status: c.status,
          workload_hours: c.workload_hours != null ? String(c.workload_hours) : "",
          duration: c.duration ?? "",
          price: c.price != null ? String(c.price) : "",
          certificate_enabled: c.certificate_enabled,
          minimum_attendance: c.minimum_attendance != null ? String(c.minimum_attendance) : "",
          minimum_grade: c.minimum_grade != null ? String(c.minimum_grade) : "",
          requirements: c.requirements ?? "",
          notes: c.notes ?? "",
        }}
      />
    </>
  );
}
