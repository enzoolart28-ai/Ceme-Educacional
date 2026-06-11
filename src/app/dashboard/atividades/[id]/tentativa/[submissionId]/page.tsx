import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireAuth } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { getAssessment, getSubmissionReview, listSubmissions } from "@/lib/online-assessments/queries";
import { formatDateTime } from "@/lib/utils";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { SubmissionStatusBadge } from "@/components/online-assessments/status-badges";
import { SubmissionReviewView } from "@/components/online-assessments/submission-review";
import { ManualGradingForm } from "@/components/online-assessments/manual-grading-form";

export default async function GradeAttemptPage({
  params,
}: {
  params: Promise<{ id: string; submissionId: string }>;
}) {
  const { id, submissionId } = await params;
  const profile = await requireAuth();
  const [assessment, review] = await Promise.all([
    getAssessment(id),
    getSubmissionReview(submissionId),
  ]);
  if (!assessment || !review) notFound();

  const isManager = hasPermission(profile.role, "grades.manage");
  const subs = await listSubmissions(id);
  const studentName = subs.find((s) => s.id === submissionId)?.studentName ?? "Aluno";
  const sub = review.submission;

  return (
    <>
      <Link href={`/dashboard/atividades/${id}/tentativas`} className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-4 w-4" /> Tentativas
      </Link>
      <PageHeader
        title={studentName}
        description={`${assessment.title} · tentativa ${sub.attempt_number}`}
      />

      <Card className="mb-6">
        <CardContent className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-slate-500">
              {sub.submitted_at ? `Enviada em ${formatDateTime(sub.submitted_at)}` : "Em andamento"}
            </p>
            <p className="text-2xl font-bold text-slate-900">
              {sub.grade != null ? Number(sub.grade) : "—"}{" "}
              <span className="text-base font-normal text-slate-400">/ {Number(assessment.max_grade)}</span>
            </p>
          </div>
          <SubmissionStatusBadge status={sub.status} />
        </CardContent>
      </Card>

      {isManager ? (
        <ManualGradingForm submissionId={submissionId} assessmentId={id} review={review} />
      ) : (
        <SubmissionReviewView review={review} />
      )}
    </>
  );
}
