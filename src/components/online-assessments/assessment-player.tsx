"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { Clock, Save, Send, Upload, Paperclip } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  saveProgressAction,
  submitAssessmentAction,
  type AnswerPayload,
} from "@/app/actions/online-assessments";
import type { PlayerQuestion } from "@/lib/online-assessments/queries";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";

const textareaClass =
  "flex w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500";

interface AnswerState {
  selected_option_id?: string | null;
  answer_text?: string | null;
  file_url?: string | null;
  matching?: Record<string, string>;
}

interface SavedAnswer {
  question_id: string;
  answer_text: string | null;
  selected_option_id: string | null;
  file_url: string | null;
}

// PRNG determinístico (mulberry32) com hash de string simples.
function seeded(seed: string) {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let a = h >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function shuffle<T>(arr: T[], rng: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function AssessmentPlayer({
  assessmentId,
  submissionId,
  questions,
  savedAnswers,
  shuffleQuestions,
  shuffleOptions,
  timeLimitMinutes,
  startedAt,
  endDate,
}: {
  assessmentId: string;
  submissionId: string;
  questions: PlayerQuestion[];
  savedAnswers: SavedAnswer[];
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  timeLimitMinutes: number | null;
  startedAt: string;
  endDate: string | null;
}) {
  // ----- estado das respostas -----
  const [answers, setAnswers] = useState<Record<string, AnswerState>>(() => {
    const init: Record<string, AnswerState> = {};
    for (const sa of savedAnswers) {
      const st: AnswerState = {
        selected_option_id: sa.selected_option_id,
        answer_text: sa.answer_text,
        file_url: sa.file_url,
      };
      const q = questions.find((x) => x.id === sa.question_id);
      if (q?.type === "matching" && sa.answer_text) {
        try {
          st.matching = JSON.parse(sa.answer_text) as Record<string, string>;
        } catch {
          st.matching = {};
        }
      }
      init[sa.question_id] = st;
    }
    return init;
  });

  const [msg, setMsg] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const submittedRef = useRef(false);

  // ----- ordem (embaralhamento estável por tentativa) -----
  const ordered = useMemo(() => {
    const base = shuffleQuestions ? shuffle(questions, seeded(submissionId)) : questions;
    return base;
  }, [questions, shuffleQuestions, submissionId]);

  const optionOrder = useMemo(() => {
    const map: Record<string, PlayerQuestion["options"]> = {};
    const rightsMap: Record<string, string[]> = {};
    for (const q of questions) {
      map[q.id] = shuffleOptions ? shuffle(q.options, seeded(submissionId + q.id)) : q.options;
      if (q.match_rights) {
        rightsMap[q.id] = shuffle(q.match_rights, seeded(submissionId + q.id + "r"));
      }
    }
    return { map, rightsMap };
  }, [questions, shuffleOptions, submissionId]);

  function update(qid: string, patch: AnswerState) {
    setAnswers((prev) => ({ ...prev, [qid]: { ...prev[qid], ...patch } }));
  }

  const buildPayload = useCallback((): AnswerPayload[] => {
    return questions.map((q) => {
      const a = answers[q.id] ?? {};
      if (q.type === "matching") {
        return { question_id: q.id, answer_text: JSON.stringify(a.matching ?? {}) };
      }
      if (q.type === "multiple_choice" || q.type === "true_false") {
        return { question_id: q.id, selected_option_id: a.selected_option_id ?? null };
      }
      if (q.type === "file_upload") {
        return { question_id: q.id, file_url: a.file_url ?? null };
      }
      return { question_id: q.id, answer_text: a.answer_text ?? null };
    });
  }, [answers, questions]);

  const doSave = useCallback(
    (silent = false) => {
      startTransition(async () => {
        const result = await saveProgressAction({ submissionId, answers: buildPayload() });
        if (result.error) setMsg({ tone: "error", text: result.error });
        else if (!silent) setMsg({ tone: "success", text: "Rascunho salvo." });
      });
    },
    [buildPayload, submissionId],
  );

  const doSubmit = useCallback(() => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    startTransition(async () => {
      const result = await submitAssessmentAction({
        submissionId,
        assessmentId,
        answers: buildPayload(),
      });
      if (result?.error) {
        submittedRef.current = false;
        setMsg({ tone: "error", text: result.error });
      }
    });
  }, [assessmentId, buildPayload, submissionId]);

  // ----- cronômetro -----
  const deadline = useMemo(() => {
    const limits: number[] = [];
    if (timeLimitMinutes && timeLimitMinutes > 0) {
      limits.push(new Date(startedAt).getTime() + timeLimitMinutes * 60_000);
    }
    if (endDate) limits.push(new Date(endDate).getTime());
    return limits.length ? Math.min(...limits) : null;
  }, [timeLimitMinutes, startedAt, endDate]);

  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (deadline == null) return;
    // setState só dentro de callbacks (evita render em cascata e mismatch de SSR).
    const update = () => {
      const left = deadline - Date.now();
      setRemaining(left);
      if (left <= 0) doSubmit();
    };
    const kick = setTimeout(update, 0);
    const t = setInterval(update, 1000);
    return () => {
      clearTimeout(kick);
      clearInterval(t);
    };
  }, [deadline, doSubmit]);

  // autosave leve
  useEffect(() => {
    const t = setInterval(() => doSave(true), 30_000);
    return () => clearInterval(t);
  }, [doSave]);

  function fmt(ms: number) {
    const s = Math.max(0, Math.floor(ms / 1000));
    const m = Math.floor(s / 60);
    return `${m}:${String(s % 60).padStart(2, "0")}`;
  }

  return (
    <div className="space-y-5">
      {(deadline != null || msg) && (
        <div className="flex items-center justify-between">
          <div>{msg && <Alert tone={msg.tone}>{msg.text}</Alert>}</div>
          {remaining != null && (
            <div className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-semibold ${remaining < 60_000 ? "bg-rose-100 text-rose-700" : "bg-slate-100 text-slate-700"}`}>
              <Clock className="h-4 w-4" /> {fmt(remaining)}
            </div>
          )}
        </div>
      )}

      {ordered.map((q, idx) => (
        <Card key={q.id}>
          <CardContent className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <p className="font-medium text-slate-900">
                {idx + 1}. {q.statement}
              </p>
              <span className="shrink-0 text-xs text-slate-400">{Number(q.points)} pt(s)</span>
            </div>

            {q.media_url && q.type === "image" && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={q.media_url} alt="" className="max-h-72 rounded-lg border border-slate-200" />
            )}
            {q.media_url && q.type === "video" && (
              <div className="aspect-video overflow-hidden rounded-lg bg-black">
                <iframe src={q.media_url} title={q.statement} allowFullScreen className="h-full w-full" />
              </div>
            )}

            <QuestionInput
              q={q}
              answer={answers[q.id] ?? {}}
              options={optionOrder.map[q.id] ?? []}
              rights={optionOrder.rightsMap[q.id] ?? []}
              submissionId={submissionId}
              onChange={(patch) => update(q.id, patch)}
            />
          </CardContent>
        </Card>
      ))}

      <div className="flex flex-wrap gap-3">
        <Button variant="outline" onClick={() => doSave(false)} isLoading={isPending}>
          <Save className="h-4 w-4" /> Salvar rascunho
        </Button>
        <Button
          onClick={() => {
            if (confirm("Enviar a prova? Você não poderá alterar as respostas depois.")) doSubmit();
          }}
          isLoading={isPending}
        >
          <Send className="h-4 w-4" /> Enviar prova
        </Button>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
function QuestionInput({
  q,
  answer,
  options,
  rights,
  submissionId,
  onChange,
}: {
  q: PlayerQuestion;
  answer: AnswerState;
  options: PlayerQuestion["options"];
  rights: string[];
  submissionId: string;
  onChange: (patch: AnswerState) => void;
}) {
  const [uploading, setUploading] = useState(false);

  async function upload(file: File) {
    setUploading(true);
    const supabase = createClient();
    const path = `answers/${submissionId}/${q.id}-${Date.now()}-${file.name.replace(/\s+/g, "_")}`;
    const { error } = await supabase.storage.from("assessment-files").upload(path, file);
    if (!error) {
      onChange({ file_url: supabase.storage.from("assessment-files").getPublicUrl(path).data.publicUrl });
    }
    setUploading(false);
  }

  if (q.type === "multiple_choice" || q.type === "true_false") {
    return (
      <div className="space-y-2">
        {options.map((o) => (
          <label key={o.id} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50">
            <input
              type="radio"
              name={`q_${q.id}`}
              checked={answer.selected_option_id === o.id}
              onChange={() => onChange({ selected_option_id: o.id })}
            />
            {o.text}
          </label>
        ))}
      </div>
    );
  }

  if (q.type === "matching") {
    const matching = answer.matching ?? {};
    return (
      <div className="space-y-2">
        {options.map((o) => (
          <div key={o.id} className="flex items-center gap-2">
            <span className="min-w-0 flex-1 rounded-lg bg-slate-50 px-3 py-2 text-sm">{o.left}</span>
            <span className="text-slate-400">→</span>
            <select
              className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              value={matching[o.id] ?? ""}
              onChange={(e) => onChange({ matching: { ...matching, [o.id]: e.target.value } })}
            >
              <option value="">Selecione…</option>
              {rights.map((r, i) => (
                <option key={i} value={r}>{r}</option>
              ))}
            </select>
          </div>
        ))}
      </div>
    );
  }

  if (q.type === "file_upload") {
    return (
      <div className="space-y-2">
        <input
          type="file"
          onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
          className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-indigo-50 file:px-3 file:py-1.5 file:text-indigo-700"
        />
        {uploading && <p className="text-xs text-slate-500"><Upload className="mr-1 inline h-3 w-3" />Enviando…</p>}
        {answer.file_url && (
          <a href={answer.file_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-indigo-700 hover:underline">
            <Paperclip className="h-4 w-4" /> Arquivo enviado
          </a>
        )}
      </div>
    );
  }

  // essay / image / video → resposta dissertativa
  return (
    <textarea
      rows={4}
      className={textareaClass}
      placeholder="Digite sua resposta…"
      value={answer.answer_text ?? ""}
      onChange={(e) => onChange({ answer_text: e.target.value })}
    />
  );
}
