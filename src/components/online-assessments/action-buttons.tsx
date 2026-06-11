"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Play, Trash2, RotateCcw } from "lucide-react";
import {
  startAssessmentAction,
  deleteAssessmentAction,
  reopenSubmissionAction,
} from "@/app/actions/online-assessments";
import { Button } from "@/components/ui/button";

export function StartAttemptButton({
  assessmentId,
  label = "Iniciar tentativa",
}: {
  assessmentId: string;
  label?: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function start() {
    setError(null);
    startTransition(async () => {
      const result = await startAssessmentAction(assessmentId);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div>
      <Button onClick={start} isLoading={isPending}>
        <Play className="h-4 w-4" /> {label}
      </Button>
      {error && <p className="mt-2 text-sm text-rose-600">{error}</p>}
    </div>
  );
}

export function AssessmentDeleteButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();
  function remove() {
    if (!confirm("Excluir esta prova, questões, tentativas e respostas?")) return;
    startTransition(() => {
      void deleteAssessmentAction({ id });
    });
  }
  return (
    <Button variant="danger" onClick={remove} isLoading={isPending}>
      <Trash2 className="h-4 w-4" /> Excluir
    </Button>
  );
}

export function ReopenSubmissionButton({
  submissionId,
  assessmentId,
}: {
  submissionId: string;
  assessmentId: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  function reopen() {
    if (!confirm("Reabrir esta tentativa para o aluno reenviar?")) return;
    startTransition(async () => {
      await reopenSubmissionAction({ submissionId, assessmentId });
      router.refresh();
    });
  }
  return (
    <Button variant="outline" onClick={reopen} isLoading={isPending}>
      <RotateCcw className="h-4 w-4" /> Reabrir
    </Button>
  );
}
