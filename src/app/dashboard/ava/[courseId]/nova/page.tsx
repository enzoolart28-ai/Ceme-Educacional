import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireAuth } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { getCourseById, getCourseModules, getCourseSubjects } from "@/lib/courses/queries";
import { PageHeader } from "@/components/ui/page-header";
import { LessonForm } from "@/components/ava/lesson-form";

export default async function NewLessonPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const profile = await requireAuth();

  const canManage =
    hasPermission(profile.role, "courses.manage") ||
    hasPermission(profile.role, "curriculum.manage") ||
    hasPermission(profile.role, "grades.manage");
  if (!canManage) notFound();

  const course = await getCourseById(courseId);
  if (!course) notFound();

  const [modules, courseSubjects] = await Promise.all([
    getCourseModules(courseId),
    getCourseSubjects(courseId),
  ]);

  const subjectOptions = Array.from(
    new Map(
      courseSubjects
        .filter((cs) => cs.subject)
        .map((cs) => [cs.subject!.id, cs.subject!.name]),
    ).entries(),
  ).map(([id, name]) => ({ id, name }));

  return (
    <>
      <Link
        href={`/dashboard/ava/${courseId}`}
        className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft className="h-4 w-4" /> {course.name}
      </Link>
      <PageHeader title="Nova aula" description="Crie uma aula para este curso." />
      <LessonForm
        mode="create"
        modules={modules.map((m) => ({ id: m.id, name: m.name }))}
        subjects={subjectOptions}
        defaultValues={{
          course_id: courseId,
          module_id: "",
          subject_id: "",
          title: "",
          description: "",
          video_url: "",
          release_type: "all",
          release_date: "",
          status: "draft",
        }}
      />
    </>
  );
}
