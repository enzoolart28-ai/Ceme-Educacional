import { notFound, redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth/session";
import {
  getAssessment,
  getActiveSubmission,
  getPlayerQuestions,
} from "@/lib/online-assessments/queries";
import { PageHeader } from "@/components/ui/page-header";
import { AssessmentPlayer } from "@/components/online-assessments/assessment-player";

export default async function ResponderPage({
  params,
}: {
  params: Promise<{ id: string; submissionId: string }>;
}) {
  const { id, submissionId } = await params;
  await requireAuth();

  const [assessment, active] = await Promise.all([
    getAssessment(id),
    getActiveSubmission(submissionId),
  ]);
  if (!assessment || !active) notFound();

  // Tentativa já enviada → vai para o resultado.
  if (active.submission.status !== "in_progress") {
    redirect(`/dashboard/atividades/${id}/resultado/${submissionId}`);
  }

  const questions = await getPlayerQuestions(id);

  return (
    <>
      <PageHeader title={assessment.title} description="Responda e clique em Enviar. Suas respostas são salvas automaticamente." />
      <AssessmentPlayer
        assessmentId={id}
        submissionId={submissionId}
        questions={questions}
        savedAnswers={active.answers}
        shuffleQuestions={assessment.shuffle_questions}
        shuffleOptions={assessment.shuffle_options}
        timeLimitMinutes={assessment.time_limit_minutes}
        startedAt={active.submission.started_at}
        endDate={assessment.end_date}
      />
    </>
  );
}
