"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { saveGradebookAction } from "@/app/actions/grades";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";

interface Assessment {
  id: string;
  name: string;
  maxGrade: number;
}
interface Student {
  id: string;
  name: string;
}

export function GradebookGrid({
  assessments,
  students,
  initialGrades,
}: {
  assessments: Assessment[];
  students: Student[];
  initialGrades: Record<string, string>;
}) {
  const router = useRouter();
  const [grades, setGrades] = useState<Record<string, string>>(initialGrades);
  const [msg, setMsg] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  function setCell(assessmentId: string, studentId: string, value: string) {
    setGrades((g) => ({ ...g, [`${assessmentId}:${studentId}`]: value }));
  }

  function save() {
    setMsg(null);
    const entries = students.flatMap((s) =>
      assessments.map((a) => ({
        assessment_id: a.id,
        student_id: s.id,
        grade: grades[`${a.id}:${s.id}`] ?? "",
      })),
    );
    startTransition(async () => {
      const result = await saveGradebookAction(entries);
      if (result.error) setMsg({ tone: "error", text: result.error });
      else {
        setMsg({ tone: "success", text: "Notas salvas com sucesso." });
        router.refresh();
      }
    });
  }

  if (assessments.length === 0) {
    return (
      <Alert tone="warning">
        Esta turma ainda não tem avaliações. Crie uma avaliação primeiro (botão “Nova avaliação”) para lançar as notas aqui.
      </Alert>
    );
  }
  if (students.length === 0) {
    return <Alert tone="warning">Nenhum aluno matriculado nesta turma.</Alert>;
  }

  return (
    <div className="space-y-4">
      {msg && <Alert tone={msg.tone}>{msg.text}</Alert>}
      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr className="bg-slate-50">
              <th className="sticky left-0 z-10 bg-slate-50 px-4 py-2 text-left font-semibold text-slate-700">
                Aluno
              </th>
              {assessments.map((a) => (
                <th key={a.id} className="px-3 py-2 text-center font-semibold text-slate-700">
                  <div className="whitespace-nowrap">{a.name}</div>
                  <div className="text-xs font-normal text-slate-400">máx. {a.maxGrade}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {students.map((s) => (
              <tr key={s.id} className="border-t border-slate-100">
                <td className="sticky left-0 z-10 bg-white px-4 py-2 font-medium text-slate-800">
                  {s.name}
                </td>
                {assessments.map((a) => (
                  <td key={a.id} className="px-2 py-1 text-center">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max={a.maxGrade}
                      value={grades[`${a.id}:${s.id}`] ?? ""}
                      onChange={(e) => setCell(a.id, s.id, e.target.value)}
                      className="w-16 rounded-md border border-slate-300 px-2 py-1 text-center text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Button onClick={save} isLoading={isPending}>
        <Save className="h-4 w-4" /> Salvar notas
      </Button>
    </div>
  );
}
