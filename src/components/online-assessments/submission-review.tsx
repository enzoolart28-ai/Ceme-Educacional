import { Check, X, Paperclip } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { questionTypeLabel } from "@/lib/online-assessments/labels";
import type { ReviewQuestion, SubmissionReview } from "@/lib/online-assessments/queries";
import type { QuestionType } from "@/types/models";

function StudentAnswer({ q }: { q: ReviewQuestion }) {
  if (q.type === "multiple_choice" || q.type === "true_false") {
    return (
      <div className="space-y-1">
        {q.options.map((o) => {
          const chosen = q.selected_option_id === o.id;
          return (
            <div
              key={o.id}
              className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm ${
                o.is_correct === true
                  ? "bg-emerald-50 text-emerald-800"
                  : chosen
                    ? "bg-rose-50 text-rose-800"
                    : "text-slate-600"
              }`}
            >
              {o.is_correct === true && <Check className="h-4 w-4" />}
              {chosen && o.is_correct !== true && <X className="h-4 w-4" />}
              <span>{o.text}</span>
              {chosen && <span className="ml-auto text-xs font-medium">sua resposta</span>}
            </div>
          );
        })}
      </div>
    );
  }

  if (q.type === "matching") {
    const map: Record<string, string> = q.answer_text ? safeParse(q.answer_text) : {};
    return (
      <div className="space-y-1 text-sm">
        {q.options.map((o) => {
          const correct = q.match_pairs?.find((p) => p.left === o.text)?.right;
          const chosen = map[o.id] ?? "—";
          const ok = correct != null && chosen === correct;
          return (
            <div key={o.id} className="flex flex-wrap items-center gap-2">
              <span className="rounded bg-slate-50 px-2 py-1">{o.text}</span>
              <span className="text-slate-400">→</span>
              <span className={ok ? "text-emerald-700" : "text-slate-700"}>{chosen}</span>
              {correct != null && !ok && (
                <span className="text-xs text-emerald-700">(correto: {correct})</span>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  if (q.type === "file_upload") {
    return q.file_url ? (
      <a href={q.file_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-indigo-700 hover:underline">
        <Paperclip className="h-4 w-4" /> Arquivo enviado
      </a>
    ) : (
      <p className="text-sm text-slate-400">Nenhum arquivo enviado.</p>
    );
  }

  return q.answer_text ? (
    <p className="whitespace-pre-wrap rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">{q.answer_text}</p>
  ) : (
    <p className="text-sm text-slate-400">Sem resposta.</p>
  );
}

function safeParse(s: string): Record<string, string> {
  try {
    return JSON.parse(s) as Record<string, string>;
  } catch {
    return {};
  }
}

export function SubmissionReviewView({ review }: { review: SubmissionReview }) {
  return (
    <div className="space-y-4">
      {review.questions.map((q, idx) => (
        <Card key={q.id}>
          <CardContent className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <p className="font-medium text-slate-900">
                {idx + 1}. {q.statement}
              </p>
              <span className="shrink-0 text-xs text-slate-400">
                {q.grade != null ? `${Number(q.grade)}` : "—"} / {Number(q.points)} pt
              </span>
            </div>
            <p className="text-xs uppercase tracking-wide text-slate-400">
              {questionTypeLabel(q.type as QuestionType)}
            </p>
            {q.media_url && q.type === "image" && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={q.media_url} alt="" className="max-h-60 rounded-lg border border-slate-200" />
            )}
            <StudentAnswer q={q} />
            {q.feedback && (
              <p className="rounded-lg border-l-2 border-indigo-300 bg-indigo-50 px-3 py-2 text-sm text-slate-700">
                <span className="font-medium">Feedback:</span> {q.feedback}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
