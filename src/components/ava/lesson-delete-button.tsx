"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteLessonAction } from "@/app/actions/ava";
import { Button } from "@/components/ui/button";

export function LessonDeleteButton({ id, courseId }: { id: string; courseId: string }) {
  const [isPending, startTransition] = useTransition();

  function remove() {
    if (!confirm("Excluir esta aula, materiais e progresso?")) return;
    startTransition(() => {
      void deleteLessonAction({ id, course_id: courseId });
    });
  }

  return (
    <Button variant="danger" onClick={remove} isLoading={isPending}>
      <Trash2 className="h-4 w-4" /> Excluir
    </Button>
  );
}
