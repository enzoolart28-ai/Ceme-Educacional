"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { UserPlus } from "lucide-react";
import { linkClassStudentAction } from "@/app/actions/classes";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Alert } from "@/components/ui/alert";

export function ClassRosterForm({
  classId,
  students,
}: {
  classId: string;
  students: { id: string; full_name: string }[];
}) {
  const router = useRouter();
  const [studentId, setStudentId] = useState("");
  const [override, setOverride] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit() {
    if (!studentId) {
      setError("Selecione um aluno.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await linkClassStudentAction({
        class_id: classId,
        student_id: studentId,
        override_limit: override,
      });
      if (result.error) {
        setError(result.error);
      } else {
        setStudentId("");
        setOverride(false);
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-2">
      {error && <Alert tone="error">{error}</Alert>}
      <div className="flex flex-col gap-2 sm:flex-row">
        <Select
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
          className="sm:flex-1"
          aria-label="Aluno"
        >
          <option value="">Selecione um aluno…</option>
          {students.map((s) => (
            <option key={s.id} value={s.id}>{s.full_name}</option>
          ))}
        </Select>
        <Button onClick={submit} isLoading={isPending}>
          <UserPlus className="h-4 w-4" /> Vincular
        </Button>
      </div>
      <label className="flex items-center gap-2 text-xs text-slate-600">
        <input
          type="checkbox"
          checked={override}
          onChange={(e) => setOverride(e.target.checked)}
          className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
        />
        Autorizar exceder o limite máximo de alunos
      </label>
    </div>
  );
}
