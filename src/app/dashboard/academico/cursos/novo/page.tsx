import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requirePermission } from "@/lib/auth/session";
import { PageHeader } from "@/components/ui/page-header";
import { CourseForm } from "@/components/courses/course-form";

export default async function NovoCursoPage() {
  await requirePermission("courses.manage");

  return (
    <>
      <Link
        href="/dashboard/academico/cursos"
        className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar para cursos
      </Link>
      <PageHeader title="Novo curso" description="Cadastre um novo curso." />
      <CourseForm
        mode="create"
        defaultValues={{
          name: "",
          description: "",
          modality: "presencial",
          type: "livre",
          status: "active",
          workload_hours: "",
          duration: "",
          price: "",
          certificate_enabled: false,
          minimum_attendance: "",
          minimum_grade: "",
          requirements: "",
          notes: "",
        }}
      />
    </>
  );
}
