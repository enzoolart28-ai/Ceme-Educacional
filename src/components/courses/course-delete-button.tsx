"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteCourseAction } from "@/app/actions/courses";
import { Button } from "@/components/ui/button";

export function CourseDeleteButton({ courseId }: { courseId: string }) {
  const [isPending, startTransition] = useTransition();

  function remove() {
    if (!confirm("Excluir este curso? Disciplinas e módulos vinculados serão removidos."))
      return;
    startTransition(() => {
      void deleteCourseAction(courseId);
    });
  }

  return (
    <Button variant="danger" onClick={remove} isLoading={isPending}>
      <Trash2 className="h-4 w-4" /> Excluir
    </Button>
  );
}
