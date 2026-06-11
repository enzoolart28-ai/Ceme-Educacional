import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireAuth } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { getAssessment, listSubmissions } from "@/lib/online-assessments/queries";
import { formatDateTime } from "@/lib/utils";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { SubmissionStatusBadge } from "@/components/online-assessments/status-badges";
import { ReopenSubmissionButton } from "@/components/online-assessments/action-buttons";
import { Users } from "lucide-react";

export default async function TentativasPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await requireAuth();
  const assessment = await getAssessment(id);
  if (!assessment) notFound();

  const isManager = hasPermission(profile.role, "grades.manage");
  const submissions = await listSubmissions(id);

  return (
    <>
      <Link href={`/dashboard/atividades/${id}`} className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-4 w-4" /> {assessment.title}
      </Link>
      <PageHeader title="Tentativas" description="Acompanhe e corrija as tentativas dos alunos." />

      {submissions.length === 0 ? (
        <EmptyState icon={Users} title="Nenhuma tentativa" description="Os envios dos alunos aparecerão aqui." />
      ) : (
        <Card className="divide-y divide-slate-100">
          {submissions.map((s) => (
            <div key={s.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className="font-medium text-slate-900">{s.studentName}</p>
                <p className="text-xs text-slate-500">
                  Tentativa {s.attempt_number}
                  {s.submitted_at ? ` · enviada em ${formatDateTime(s.submitted_at)}` : " · em andamento"}
                  {s.grade != null ? ` · nota ${Number(s.grade)}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <SubmissionStatusBadge status={s.status} />
                {isManager && s.status !== "in_progress" && (
                  <ReopenSubmissionButton submissionId={s.id} assessmentId={id} />
                )}
                {s.status !== "in_progress" && (
                  <Link
                    href={`/dashboard/atividades/${id}/tentativa/${s.id}`}
                    className="text-sm font-medium text-indigo-600 hover:underline"
                  >
                    {isManager ? "Corrigir" : "Ver"}
                  </Link>
                )}
              </div>
            </div>
          ))}
        </Card>
      )}
    </>
  );
}
