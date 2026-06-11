import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Lock } from "lucide-react";
import { requireAuth } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { getCourseModules, getCourseSubjects } from "@/lib/courses/queries";
import {
  getLessonById,
  getLessonMaterials,
  getStudentCourseView,
} from "@/lib/ava/queries";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { LessonForm } from "@/components/ava/lesson-form";
import { MaterialManager } from "@/components/ava/material-manager";
import { MarkCompleteButton } from "@/components/ava/mark-complete-button";
import { LessonDeleteButton } from "@/components/ava/lesson-delete-button";

export default async function LessonPage({
  params,
}: {
  params: Promise<{ courseId: string; lessonId: string }>;
}) {
  const { courseId, lessonId } = await params;
  const profile = await requireAuth();

  const lesson = await getLessonById(lessonId);
  if (!lesson || lesson.course_id !== courseId) notFound();

  const canManage =
    hasPermission(profile.role, "courses.manage") ||
    hasPermission(profile.role, "curriculum.manage") ||
    hasPermission(profile.role, "grades.manage");

  const materials = await getLessonMaterials(lessonId);

  const backLink = (
    <Link
      href={`/dashboard/ava/${courseId}`}
      className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800"
    >
      <ArrowLeft className="h-4 w-4" /> {lesson.courseName}
    </Link>
  );

  // -------------------------------------------------------------------------
  // Editor (gestão)
  // -------------------------------------------------------------------------
  if (canManage) {
    const [modules, courseSubjects] = await Promise.all([
      getCourseModules(courseId),
      getCourseSubjects(courseId),
    ]);
    const subjectOptions = Array.from(
      new Map(
        courseSubjects.filter((cs) => cs.subject).map((cs) => [cs.subject!.id, cs.subject!.name]),
      ).entries(),
    ).map(([id, name]) => ({ id, name }));

    return (
      <>
        {backLink}
        <PageHeader
          title={lesson.title}
          description="Edite a aula, defina a regra de liberação e gerencie os materiais."
          action={<LessonDeleteButton id={lessonId} courseId={courseId} />}
        />
        <div className="space-y-8">
          <LessonForm
            mode="edit"
            lessonId={lessonId}
            modules={modules.map((m) => ({ id: m.id, name: m.name }))}
            subjects={subjectOptions}
            defaultValues={{
              course_id: courseId,
              module_id: lesson.module_id ?? "",
              subject_id: lesson.subject_id ?? "",
              title: lesson.title,
              description: lesson.description ?? "",
              video_url: lesson.video_url ?? "",
              release_type: lesson.release_type,
              release_date: lesson.release_date ?? "",
              status: lesson.status,
            }}
          />
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
              Materiais
            </h2>
            <MaterialManager
              lessonId={lessonId}
              courseId={courseId}
              materials={materials}
              canManage
            />
          </section>
        </div>
      </>
    );
  }

  // -------------------------------------------------------------------------
  // Player (aluno) — respeita regra de liberação
  // -------------------------------------------------------------------------
  const view = await getStudentCourseView(courseId, profile.id);
  const current = view.lessons.find((l) => l.id === lessonId);
  const released = current?.released ?? false;
  const completed = current?.progress === "completed";

  if (!released) {
    return (
      <>
        {backLink}
        <PageHeader title={lesson.title} description="Aula bloqueada." />
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <Lock className="h-6 w-6" />
            </div>
            <p className="font-medium text-slate-700">Esta aula ainda não está liberada</p>
            {current?.reason && <p className="max-w-sm text-sm text-slate-500">{current.reason}</p>}
          </CardContent>
        </Card>
      </>
    );
  }

  return (
    <>
      {backLink}
      <PageHeader
        title={lesson.title}
        action={<MarkCompleteButton lessonId={lessonId} courseId={courseId} completed={completed} />}
      />
      <div className="space-y-6">
        {lesson.video_url && (
          <div className="aspect-video w-full overflow-hidden rounded-xl bg-black">
            <iframe
              src={lesson.video_url}
              title={lesson.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="h-full w-full"
            />
          </div>
        )}
        {lesson.description && (
          <Card>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm text-slate-700">{lesson.description}</p>
            </CardContent>
          </Card>
        )}
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Materiais
          </h2>
          <MaterialManager
            lessonId={lessonId}
            courseId={courseId}
            materials={materials}
            canManage={false}
          />
        </section>
      </div>
    </>
  );
}
