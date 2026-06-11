"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { UserPlus } from "lucide-react";
import { assignTeacherAction } from "@/app/actions/academic";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Alert } from "@/components/ui/alert";
import type { PersonOption } from "@/lib/academic/queries";

export function AssignTeacherForm({
  classId,
  teachers,
  subjects,
}: {
  classId: string;
  teachers: PersonOption[];
  subjects: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [teacherId, setTeacherId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit() {
    if (!teacherId || !subjectId) {
      setError("Selecione professor e disciplina.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await assignTeacherAction({
        class_id: classId,
        teacher_id: teacherId,
        subject_id: subjectId,
      });
      if (result.error) {
        setError(result.error);
      } else {
        setTeacherId("");
        setSubjectId("");
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-col gap-2 sm:flex-row">
        <Select
          value={teacherId}
          onChange={(e) => setTeacherId(e.target.value)}
          className="sm:flex-1"
          aria-label="Professor"
        >
          <option value="">Professor…</option>
          {teachers.map((t) => (
            <option key={t.id} value={t.id}>
              {t.full_name || t.email}
            </option>
          ))}
        </Select>
        <Select
          value={subjectId}
          onChange={(e) => setSubjectId(e.target.value)}
          className="sm:flex-1"
          aria-label="Disciplina"
        >
          <option value="">Disciplina…</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </Select>
        <Button onClick={submit} isLoading={isPending}>
          <UserPlus className="h-4 w-4" /> Vincular
        </Button>
      </div>
      {error && <Alert tone="error">{error}</Alert>}
    </div>
  );
}
