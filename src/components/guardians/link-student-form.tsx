"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Link2 } from "lucide-react";
import { linkStudentAction } from "@/app/actions/guardians";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Alert } from "@/components/ui/alert";

export function LinkStudentForm({
  guardianId,
  students,
}: {
  guardianId: string;
  students: { id: string; full_name: string }[];
}) {
  const router = useRouter();
  const [studentId, setStudentId] = useState("");
  const [isFin, setIsFin] = useState(false);
  const [isPed, setIsPed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit() {
    if (!studentId) {
      setError("Selecione um aluno.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await linkStudentAction({
        guardian_id: guardianId,
        student_id: studentId,
        is_financial_responsible: isFin,
        is_pedagogical_responsible: isPed,
      });
      if (result.error) {
        setError(result.error);
      } else {
        setStudentId("");
        setIsFin(false);
        setIsPed(false);
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-3">
      {error && <Alert tone="error">{error}</Alert>}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Select
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
          className="sm:flex-1"
          aria-label="Aluno"
        >
          <option value="">Selecione um aluno…</option>
          {students.map((s) => (
            <option key={s.id} value={s.id}>
              {s.full_name}
            </option>
          ))}
        </Select>
        <Button onClick={submit} isLoading={isPending}>
          <Link2 className="h-4 w-4" /> Vincular
        </Button>
      </div>
      <div className="flex flex-wrap gap-4">
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={isFin}
            onChange={(e) => setIsFin(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
          />
          Responsável financeiro
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={isPed}
            onChange={(e) => setIsPed(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
          />
          Responsável pedagógico
        </label>
      </div>
    </div>
  );
}
