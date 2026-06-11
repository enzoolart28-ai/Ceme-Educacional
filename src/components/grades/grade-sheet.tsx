"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { saveGradesAction } from "@/app/actions/grades";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import type { GradeSheetEntry } from "@/lib/grades/queries";

interface RowState {
  grade: string;
  feedback: string;
}

export function GradeSheet({
  assessmentId,
  roster,
  maxGrade,
  canManage,
}: {
  assessmentId: string;
  roster: GradeSheetEntry[];
  maxGrade: number;
  canManage: boolean;
}) {
  const router = useRouter();
  const [rows, setRows] = useState<Record<string, RowState>>(
    Object.fromEntries(roster.map((r) => [r.studentId, { grade: r.grade, feedback: r.feedback }])),
  );
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  function set(studentId: string, patch: Partial<RowState>) {
    setRows((prev) => ({ ...prev, [studentId]: { ...prev[studentId], ...patch } }));
  }

  function save() {
    // Validação leve: nota não pode exceder a nota máxima.
    for (const r of roster) {
      const v = rows[r.studentId].grade;
      if (v !== "" && (Number.isNaN(Number(v)) || Number(v) > maxGrade || Number(v) < 0)) {
        setMessage({ tone: "error", text: `Nota de ${r.fullName} inválida (0–${maxGrade}).` });
        return;
      }
    }
    setMessage(null);
    startTransition(async () => {
      const grades = roster.map((r) => ({
        student_id: r.studentId,
        grade: rows[r.studentId].grade,
        feedback: rows[r.studentId].feedback,
      }));
      const result = await saveGradesAction(assessmentId, grades);
      if (result.error) setMessage({ tone: "error", text: result.error });
      else {
        setMessage({ tone: "success", text: "Notas salvas com sucesso." });
        router.refresh();
      }
    });
  }

  if (roster.length === 0) {
    return (
      <Card className="p-6 text-center text-sm text-slate-500">
        Nenhum aluno na turma. Vincule alunos à turma antes de lançar notas.
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {message && <Alert tone={message.tone}>{message.text}</Alert>}
      <Card className="divide-y divide-slate-100">
        {roster.map((r) => {
          const st = rows[r.studentId];
          return (
            <div key={r.studentId} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center">
              <span className="flex-1 font-medium text-slate-900">{r.fullName}</span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.1"
                  min={0}
                  max={maxGrade}
                  value={st.grade}
                  disabled={!canManage}
                  onChange={(e) => set(r.studentId, { grade: e.target.value })}
                  placeholder="—"
                  className="h-9 w-20 rounded-md border border-slate-300 px-2 text-center text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:bg-slate-50"
                />
                <span className="text-xs text-slate-400">/ {maxGrade}</span>
              </div>
              <input
                type="text"
                value={st.feedback}
                disabled={!canManage}
                onChange={(e) => set(r.studentId, { feedback: e.target.value })}
                placeholder="Feedback (opcional)"
                className="rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:bg-slate-50 sm:w-64"
              />
            </div>
          );
        })}
      </Card>
      {canManage && (
        <Button onClick={save} isLoading={isPending}>
          <Save className="h-4 w-4" /> Salvar notas
        </Button>
      )}
    </div>
  );
}
