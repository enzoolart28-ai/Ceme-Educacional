"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { UserPlus } from "lucide-react";
import { enrollStudentAction } from "@/app/actions/academic";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Alert } from "@/components/ui/alert";
import type { PersonOption } from "@/lib/academic/queries";

export function EnrollForm({
  classId,
  students,
}: {
  classId: string;
  students: PersonOption[];
}) {
  const router = useRouter();
  const [studentId, setStudentId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit() {
    if (!studentId) {
      setError("Selecione um aluno.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await enrollStudentAction({ class_id: classId, student_id: studentId });
      if (result.error) {
        setError(result.error);
      } else {
        setStudentId("");
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-col gap-2 sm:flex-row">
        <Select
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
          className="sm:flex-1"
          aria-label="Aluno"
        >
          <option value="">Selecione um aluno…</option>
          {students.map((s) => (
            <option key={s.id} value={s.id}>
              {s.full_name || s.email}
            </option>
          ))}
        </Select>
        <Button onClick={submit} isLoading={isPending}>
          <UserPlus className="h-4 w-4" /> Matricular
        </Button>
      </div>
      {error && <Alert tone="error">{error}</Alert>}
    </div>
  );
}
