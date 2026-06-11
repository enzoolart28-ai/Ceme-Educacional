"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteClassAction } from "@/app/actions/classes";
import { Button } from "@/components/ui/button";

export function ClassDeleteButton({ classId }: { classId: string }) {
  const [isPending, startTransition] = useTransition();

  function remove() {
    if (!confirm("Excluir esta turma? Matrículas e vínculos serão removidos."))
      return;
    startTransition(() => {
      void deleteClassAction(classId);
    });
  }

  return (
    <Button variant="danger" onClick={remove} isLoading={isPending}>
      <Trash2 className="h-4 w-4" /> Excluir
    </Button>
  );
}
