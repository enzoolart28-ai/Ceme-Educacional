"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteSubjectAction } from "@/app/actions/subjects";

export function SubjectDeleteButton({ subjectId }: { subjectId: string }) {
  const [isPending, startTransition] = useTransition();

  function remove() {
    if (!confirm("Excluir esta disciplina?")) return;
    startTransition(() => {
      void deleteSubjectAction(subjectId);
    });
  }

  return (
    <button
      onClick={remove}
      disabled={isPending}
      aria-label="Excluir"
      className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}
