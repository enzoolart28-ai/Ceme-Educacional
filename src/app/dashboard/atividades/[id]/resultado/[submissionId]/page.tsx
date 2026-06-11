import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireAuth } from "@/lib/auth/session";
import { getAssessment, getSubmissionReview } from "@/lib/online-assessments/queries";
import { formatDateTime } from "@/lib/utils";
import { submissionStatusLabel } from "@/lib/online-assessments/labels";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { SubmissionStatusBadge } from "@/components/online-assessments/status-badges";
import { SubmissionReviewView } from "@/components/online-assessments/submission-review";
import type { SubmissionStatus } from "@/types/models";

export default async function ResultadoPage({
  params,
}: {
  params: Promise<{ id: string; submissionId: string }>;
}) {
  const { id, submissionId } = await params;
  await requireAuth();

  const [assessment, review] = await Promise.all([
    getAssessment(id),
    getSubmissionReview(submissionId),
  ]);
  if (!assessment || !review) notFound();

  const sub = review.submission;
  const pending = sub.status !== "graded";

  return (
    <>
      <Link href={`/dashboard/atividades/${id}`} className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-4 w-4" /> {assessment.title}
      </Link>
      <PageHeader title={`Tentativa ${sub.attempt_number}`} description="Resultado e correção." />

      <Card className="mb-6">
        <CardContent className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-slate-500">
              {sub.submitted_at ? `Enviada em ${formatDateTime(sub.submitted_at)}` : "Não enviada"}
            </p>
            <p className="text-2xl font-bold text-slate-900">
              {sub.grade != null ? Number(sub.grade) : "—"}{" "}
              <span className="text-base font-normal text-slate-400">/ {Number(assessment.max_grade)}</span>
            </p>
          </div>
          <SubmissionStatusBadge status={sub.status} />
        </CardContent>
      </Card>

      {pending && (
        <p className="mb-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {submissionStatusLabel(sub.status as SubmissionStatus)} — questões dissertativas/arquivo aguardam correção do professor.
        </p>
      )}
      {sub.feedback && (
        <p className="mb-4 rounded-lg border-l-2 border-indigo-300 bg-indigo-50 px-4 py-3 text-sm text-slate-700">
          <span className="font-medium">Feedback do professor:</span> {sub.feedback}
        </p>
      )}

      <SubmissionReviewView review={review} />
    </>
  );
}
