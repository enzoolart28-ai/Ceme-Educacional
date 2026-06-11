"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { deleteFinancialPlanAction } from "@/app/actions/finance";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export function FinancialPlanDeleteButton({ planId }: { planId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function remove() {
    if (!window.confirm("Excluir este plano financeiro?")) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteFinancialPlanAction(planId);
      if (result?.error) {
        setError(result.error);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-2">
      {error && <Alert tone="error">{error}</Alert>}
      <Button type="button" variant="danger" onClick={remove} isLoading={isPending}>
        <Trash2 className="h-4 w-4" /> Excluir plano
      </Button>
    </div>
  );
}

