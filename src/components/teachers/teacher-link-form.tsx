"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { linkSubjectAction, linkClassAction } from "@/app/actions/teachers";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Alert } from "@/components/ui/alert";

export function TeacherLinkForm({
  teacherId,
  kind,
  options,
}: {
  teacherId: string;
  kind: "subject" | "class";
  options: { id: string; label: string }[];
}) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const placeholder = kind === "subject" ? "Selecione uma disciplina…" : "Selecione uma turma…";

  function submit() {
    if (!value) {
      setError(kind === "subject" ? "Selecione uma disciplina." : "Selecione uma turma.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result =
        kind === "subject"
          ? await linkSubjectAction({ teacher_id: teacherId, subject_id: value })
          : await linkClassAction({ teacher_id: teacherId, class_id: value });
      if (result.error) {
        setError(result.error);
      } else {
        setValue("");
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-2">
      {error && <Alert tone="error">{error}</Alert>}
      <div className="flex flex-col gap-2 sm:flex-row">
        <Select
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="sm:flex-1"
          aria-label={kind === "subject" ? "Disciplina" : "Turma"}
        >
          <option value="">{placeholder}</option>
          {options.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </Select>
        <Button onClick={submit} isLoading={isPending}>
          <Plus className="h-4 w-4" /> Vincular
        </Button>
      </div>
    </div>
  );
}
