"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, ChevronUp, ChevronDown, Upload, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  saveQuestionAction,
  deleteQuestionAction,
  moveQuestionAction,
} from "@/app/actions/online-assessments";
import {
  QUESTION_TYPE_OPTIONS,
  hasOptions,
  MATCH_DELIM,
} from "@/lib/online-assessments/labels";
import type { QuestionWithOptions } from "@/lib/online-assessments/queries";
import type { QuestionType } from "@/types/models";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { QuestionTypeBadge } from "./status-badges";

const textareaClass =
  "flex w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500";

export function QuestionManager({
  assessmentId,
  questions,
}: {
  assessmentId: string;
  questions: QuestionWithOptions[];
}) {
  const router = useRouter();
  const [editing, setEditing] = useState<QuestionWithOptions | "new" | null>(null);
  const [isPending, startTransition] = useTransition();

  function remove(id: string) {
    if (!confirm("Excluir esta questão?")) return;
    startTransition(async () => {
      await deleteQuestionAction({ id, assessment_id: assessmentId });
      router.refresh();
    });
  }
  function move(id: string, direction: "up" | "down") {
    startTransition(async () => {
      await moveQuestionAction({ id, assessment_id: assessmentId, direction });
      router.refresh();
    });
  }

  const totalPoints = questions.reduce((acc, q) => acc + Number(q.points), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          {questions.length} questão(ões) · {totalPoints} ponto(s) no total
        </p>
        {editing === null && (
          <Button onClick={() => setEditing("new")}>
            <Plus className="h-4 w-4" /> Adicionar questão
          </Button>
        )}
      </div>

      {questions.length > 0 && (
        <Card className="divide-y divide-slate-100">
          {questions.map((q, idx) => (
            <div key={q.id} className="flex items-start gap-3 px-4 py-3">
              <div className="flex flex-col pt-1">
                <button onClick={() => move(q.id, "up")} disabled={isPending} aria-label="Subir" className="text-slate-400 hover:text-slate-700 disabled:opacity-40">
                  <ChevronUp className="h-4 w-4" />
                </button>
                <button onClick={() => move(q.id, "down")} disabled={isPending} aria-label="Descer" className="text-slate-400 hover:text-slate-700 disabled:opacity-40">
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>
              <span className="pt-1 text-sm font-medium text-slate-400">{idx + 1}</span>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-slate-900">{q.statement}</p>
                <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                  <QuestionTypeBadge type={q.type} />
                  <span>{Number(q.points)} pt(s)</span>
                  {q.options.length > 0 && <span>· {q.options.length} alternativa(s)</span>}
                </div>
              </div>
              <button onClick={() => setEditing(q)} aria-label="Editar" className="text-slate-400 hover:text-indigo-600">
                <Pencil className="h-4 w-4" />
              </button>
              <button onClick={() => remove(q.id)} aria-label="Excluir" className="text-slate-400 hover:text-rose-600">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </Card>
      )}

      {editing !== null && (
        <QuestionEditor
          key={editing === "new" ? "new" : editing.id}
          assessmentId={assessmentId}
          question={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Editor de uma questão
// -----------------------------------------------------------------------------
interface PairRow {
  left: string;
  right: string;
}

function QuestionEditor({
  assessmentId,
  question,
  onClose,
  onSaved,
}: {
  assessmentId: string;
  question: QuestionWithOptions | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const sortedOpts = question
    ? [...question.options].sort((a, b) => a.order_index - b.order_index)
    : [];

  const [type, setType] = useState<QuestionType>(question?.type ?? "multiple_choice");
  const [statement, setStatement] = useState(question?.statement ?? "");
  const [points, setPoints] = useState(question ? String(Number(question.points)) : "1");
  const [mediaUrl, setMediaUrl] = useState(question?.media_url ?? "");

  // múltipla escolha
  const [mcOptions, setMcOptions] = useState<string[]>(
    question && question.type === "multiple_choice"
      ? sortedOpts.map((o) => o.text)
      : ["", ""],
  );
  const [mcCorrect, setMcCorrect] = useState<number>(
    question && question.type === "multiple_choice"
      ? Math.max(0, sortedOpts.findIndex((o) => o.is_correct))
      : 0,
  );
  // verdadeiro/falso
  const [tfCorrect, setTfCorrect] = useState<boolean>(
    question && question.type === "true_false"
      ? (sortedOpts.find((o) => o.text === "Verdadeiro")?.is_correct ?? true)
      : true,
  );
  // associação
  const [pairs, setPairs] = useState<PairRow[]>(
    question && question.type === "matching"
      ? sortedOpts.map((o) => ({
          left: o.text.split(MATCH_DELIM)[0] ?? "",
          right: o.text.split(MATCH_DELIM)[1] ?? "",
        }))
      : [
          { left: "", right: "" },
          { left: "", right: "" },
        ],
  );

  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [isPending, startTransition] = useTransition();

  async function uploadMedia(file: File) {
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const path = `questions/${assessmentId}/${Date.now()}-${file.name.replace(/\s+/g, "_")}`;
    const { error: upErr } = await supabase.storage.from("assessment-files").upload(path, file);
    if (upErr) {
      setError("Falha no upload da mídia.");
    } else {
      setMediaUrl(supabase.storage.from("assessment-files").getPublicUrl(path).data.publicUrl);
    }
    setBusy(false);
  }

  function buildOptions(): { text: string; is_correct: boolean }[] | undefined {
    if (type === "multiple_choice") {
      return mcOptions
        .map((t, i) => ({ text: t.trim(), is_correct: i === mcCorrect }))
        .filter((o) => o.text.length > 0);
    }
    if (type === "true_false") {
      return [
        { text: "Verdadeiro", is_correct: tfCorrect },
        { text: "Falso", is_correct: !tfCorrect },
      ];
    }
    if (type === "matching") {
      return pairs
        .filter((p) => p.left.trim() && p.right.trim())
        .map((p) => ({ text: `${p.left.trim()}${MATCH_DELIM}${p.right.trim()}`, is_correct: true }));
    }
    return undefined;
  }

  function save() {
    setError(null);
    if (!statement.trim()) {
      setError("Informe o enunciado.");
      return;
    }
    const options = buildOptions();
    if (type === "multiple_choice" && (!options || options.length < 2)) {
      setError("Informe ao menos duas alternativas.");
      return;
    }
    if (type === "matching" && (!options || options.length < 1)) {
      setError("Informe ao menos um par de associação.");
      return;
    }
    startTransition(async () => {
      const result = await saveQuestionAction({
        id: question?.id,
        assessment_id: assessmentId,
        type,
        statement: statement.trim(),
        media_url: mediaUrl || undefined,
        points: points || "1",
        options,
      });
      if (result.error) setError(result.error);
      else onSaved();
    });
  }

  return (
    <Card className="border-indigo-200">
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-700">
            {question ? "Editar questão" : "Nova questão"}
          </h3>
          <button onClick={onClose} aria-label="Fechar" className="text-slate-400 hover:text-slate-700">
            <X className="h-4 w-4" />
          </button>
        </div>
        {error && <Alert tone="error">{error}</Alert>}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <Label htmlFor="q_type">Tipo *</Label>
            <Select id="q_type" value={type} onChange={(e) => setType(e.target.value as QuestionType)}>
              {QUESTION_TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="q_points">Pontuação</Label>
            <Input id="q_points" inputMode="decimal" value={points} onChange={(e) => setPoints(e.target.value)} />
          </div>
        </div>

        <div>
          <Label htmlFor="q_statement">Enunciado *</Label>
          <textarea id="q_statement" rows={2} className={textareaClass} value={statement} onChange={(e) => setStatement(e.target.value)} />
        </div>

        {(type === "image" || type === "video") && (
          <div className="space-y-2 rounded-lg bg-slate-50 p-3">
            <Label htmlFor="q_media">Mídia ({type === "image" ? "imagem" : "vídeo"})</Label>
            <Input id="q_media" placeholder="URL da mídia (ou envie um arquivo)" value={mediaUrl} onChange={(e) => setMediaUrl(e.target.value)} />
            <input
              type="file"
              accept={type === "image" ? "image/*" : "video/*"}
              onChange={(e) => e.target.files?.[0] && uploadMedia(e.target.files[0])}
              className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-indigo-50 file:px-3 file:py-1.5 file:text-indigo-700"
            />
            {busy && <p className="text-xs text-slate-500"><Upload className="mr-1 inline h-3 w-3" />Enviando…</p>}
          </div>
        )}

        {/* Alternativas por tipo */}
        {type === "multiple_choice" && (
          <div className="space-y-2">
            <Label>Alternativas (marque a correta)</Label>
            {mcOptions.map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <input type="radio" name="mc_correct" checked={mcCorrect === i} onChange={() => setMcCorrect(i)} aria-label={`Correta ${i + 1}`} />
                <Input
                  value={opt}
                  placeholder={`Alternativa ${i + 1}`}
                  onChange={(e) => setMcOptions((prev) => prev.map((p, j) => (j === i ? e.target.value : p)))}
                />
                {mcOptions.length > 2 && (
                  <button onClick={() => setMcOptions((prev) => prev.filter((_, j) => j !== i))} aria-label="Remover" className="text-slate-400 hover:text-rose-600">
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
            <Button variant="outline" type="button" onClick={() => setMcOptions((prev) => [...prev, ""])}>
              <Plus className="h-4 w-4" /> Alternativa
            </Button>
          </div>
        )}

        {type === "true_false" && (
          <div>
            <Label>Resposta correta</Label>
            <div className="mt-1 flex gap-4 text-sm">
              <label className="flex items-center gap-2">
                <input type="radio" name="tf" checked={tfCorrect} onChange={() => setTfCorrect(true)} /> Verdadeiro
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" name="tf" checked={!tfCorrect} onChange={() => setTfCorrect(false)} /> Falso
              </label>
            </div>
          </div>
        )}

        {type === "matching" && (
          <div className="space-y-2">
            <Label>Pares de associação (coluna A → coluna B)</Label>
            {pairs.map((p, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input value={p.left} placeholder="Coluna A" onChange={(e) => setPairs((prev) => prev.map((x, j) => (j === i ? { ...x, left: e.target.value } : x)))} />
                <span className="text-slate-400">→</span>
                <Input value={p.right} placeholder="Coluna B" onChange={(e) => setPairs((prev) => prev.map((x, j) => (j === i ? { ...x, right: e.target.value } : x)))} />
                {pairs.length > 1 && (
                  <button onClick={() => setPairs((prev) => prev.filter((_, j) => j !== i))} aria-label="Remover" className="text-slate-400 hover:text-rose-600">
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
            <Button variant="outline" type="button" onClick={() => setPairs((prev) => [...prev, { left: "", right: "" }])}>
              <Plus className="h-4 w-4" /> Par
            </Button>
          </div>
        )}

        {!hasOptions(type) && type !== "image" && type !== "video" && (
          <p className="text-xs text-slate-500">
            {type === "file_upload"
              ? "O aluno enviará um arquivo como resposta. Correção manual."
              : "Resposta dissertativa. Correção manual."}
          </p>
        )}

        <div className="flex gap-2">
          <Button onClick={save} isLoading={isPending || busy}>Salvar questão</Button>
          <Button variant="outline" type="button" onClick={onClose}>Cancelar</Button>
        </div>
      </CardContent>
    </Card>
  );
}
