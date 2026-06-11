"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteAssessmentAction } from "@/app/actions/grades";
import { Button } from "@/components/ui/button";

export function AssessmentDeleteButton({ assessmentId }: { assessmentId: string }) {
  const [isPending, startTransition] = useTransition();

  function remove() {
    if (!confirm("Excluir esta avaliação e suas notas?")) return;
    startTransition(() => {
      void deleteAssessmentAction(assessmentId);
    });
  }

  return (
    <Button variant="danger" onClick={remove} isLoading={isPending}>
      <Trash2 className="h-4 w-4" /> Excluir
    </Button>
  );
}
