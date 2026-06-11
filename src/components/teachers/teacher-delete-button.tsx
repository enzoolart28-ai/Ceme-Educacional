"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteTeacherAction } from "@/app/actions/teachers";
import { Button } from "@/components/ui/button";

export function TeacherDeleteButton({ teacherId }: { teacherId: string }) {
  const [isPending, startTransition] = useTransition();

  function remove() {
    if (!confirm("Excluir este professor? Os vínculos com turmas/disciplinas serão removidos."))
      return;
    startTransition(() => {
      void deleteTeacherAction(teacherId);
    });
  }

  return (
    <Button variant="danger" onClick={remove} isLoading={isPending}>
      <Trash2 className="h-4 w-4" /> Excluir
    </Button>
  );
}
