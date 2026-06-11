"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteGuardianAction } from "@/app/actions/guardians";
import { Button } from "@/components/ui/button";

export function GuardianDeleteButton({ guardianId }: { guardianId: string }) {
  const [isPending, startTransition] = useTransition();

  function remove() {
    if (!confirm("Excluir este responsável? Os vínculos com alunos serão removidos.")) return;
    startTransition(() => {
      void deleteGuardianAction(guardianId);
    });
  }

  return (
    <Button variant="danger" onClick={remove} isLoading={isPending}>
      <Trash2 className="h-4 w-4" /> Excluir
    </Button>
  );
}
