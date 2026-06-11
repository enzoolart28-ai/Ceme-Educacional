"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Paperclip, CheckCircle2 } from "lucide-react";
import { gradeSubmissionAction } from "@/app/actions/online-assessments";
import { isObjective, questionTypeLabel } from "@/lib/online-assessments/labels";
import type { SubmissionReview } from "@/lib/online-assessments/queries";
import type { QuestionType } from "@/types/models";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";

const textareaClass =
  "flex w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500";

export function ManualGradingForm({
  submissionId,
  assessmentId,
  review,
}: {
  submissionId: string;
  assessmentId: string;
  review: SubmissionReview;
}) {
  const router = useRouter();
  const subjective = review.questions.filter((q) => !isObjective(q.type as QuestionType));

  const [grades, setGrades] = useState<Record<string, string>>(() =>
    Object.fromEntries(subjective.map((q) => [q.id, q.grade != null ? String(Number(q.grade)) : ""])),
  );
  const [feedbacks, setFeedbacks] = useState<Record<string, string>>(() =>
    Object.fromEntries(subjective.map((q) => [q.id, q.feedback ?? ""])),
  );
  const [overall, setOverall] = useState(review.submission.feedback ?? "");
  const [msg, setMsg] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  function finalize() {
    setMsg(null);
    const answers = subjective.map((q) => ({
      question_id: q.id,
      grade: grades[q.id] ?? "",
      feedback: feedbacks[q.id] ?? "",
    }));
    startTransition(async () => {
      const result = await gradeSubmissionAction({
        submissionId,
        assessmentId,
        answers,
        feedback: overall,
      });
      if (result.error) setMsg({ tone: "error", text: result.error });
      else {
        setMsg({ tone: "success", text: "Correção salva." });
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-4">
      {msg && <Alert tone={msg.tone}>{msg.text}</Alert>}

      {review.questions.map((q, idx) => {
        const objective = isObjective(q.type as QuestionType);
        return (
          <Card key={q.id}>
            <CardContent className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <p className="font-medium text-slate-900">{idx + 1}. {q.statement}</p>
                <span className="shrink-0 text-xs text-slate-400">{Number(q.points)} pt(s)</span>
              </div>
              <p className="text-xs uppercase tracking-wide text-slate-400">
                {questionTypeLabel(q.type as QuestionType)} {objective && "· correção automática"}
              </p>

              {/* Resposta do aluno */}
              {q.type === "file_upload" ? (
                q.file_url ? (
                  <a href={q.file_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-indigo-700 hover:underline">
                    <Paperclip className="h-4 w-4" /> Abrir arquivo enviado
                  </a>
                ) : (
                  <p className="text-sm text-slate-400">Nenhum arquivo enviado.</p>
                )
              ) : q.type === "essay" || q.type === "image" || q.type === "video" ? (
                q.answer_text ? (
                  <p className="whitespace-pre-wrap rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">{q.answer_text}</p>
                ) : (
                  <p className="text-sm text-slate-400">Sem resposta.</p>
                )
              ) : (
                <p className="text-sm text-slate-500">
                  Nota automática: <strong>{q.grade != null ? Number(q.grade) : 0}</strong> / {Number(q.points)}
                </p>
              )}

              {/* Correção manual (subjetivas) */}
              {!objective && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-[140px_1fr]">
                  <div>
                    <Label htmlFor={`g_${q.id}`}>Nota (0–{Number(q.points)})</Label>
                    <Input
                      id={`g_${q.id}`}
                      inputMode="decimal"
                      value={grades[q.id] ?? ""}
                      onChange={(e) => setGrades((p) => ({ ...p, [q.id]: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`f_${q.id}`}>Feedback</Label>
                    <textarea
                      id={`f_${q.id}`}
                      rows={2}
                      className={textareaClass}
                      value={feedbacks[q.id] ?? ""}
                      onChange={(e) => setFeedbacks((p) => ({ ...p, [q.id]: e.target.value }))}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}

      <Card>
        <CardContent className="space-y-3">
          <div>
            <Label htmlFor="overall">Feedback geral</Label>
            <textarea id="overall" rows={2} className={textareaClass} value={overall} onChange={(e) => setOverall(e.target.value)} />
          </div>
          <Button onClick={finalize} isLoading={isPending}>
            <CheckCircle2 className="h-4 w-4" /> Finalizar correção
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
