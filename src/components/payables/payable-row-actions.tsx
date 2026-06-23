"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, RotateCcw, Trash2 } from "lucide-react";
import { setPayableStatusAction, deletePayableAction } from "@/app/actions/payables";
import type { PayableStatus } from "@/types/models";

export function PayableRowActions({
  id,
  status,
}: {
  id: string;
  status: PayableStatus;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function setStatus(next: PayableStatus) {
    startTransition(async () => {
      await setPayableStatusAction(id, next);
      router.refresh();
    });
  }

  function remove() {
    if (!confirm("Excluir esta conta? Esta ação não pode ser desfeita.")) return;
    startTransition(async () => {
      await deletePayableAction(id);
      router.refresh();
    });
  }

  return (
    <div className="flex shrink-0 items-center gap-1">
      {status === "pago" ? (
        <button
          type="button"
          onClick={() => setStatus("pendente")}
          disabled={isPending}
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-amber-700 hover:bg-amber-50 disabled:opacity-50"
          title="Marcar como pendente"
        >
          <RotateCcw className="h-3.5 w-3.5" /> Reabrir
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setStatus("pago")}
          disabled={isPending}
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"
          title="Marcar como pago"
        >
          <Check className="h-3.5 w-3.5" /> Pagar
        </button>
      )}
      <button
        type="button"
        onClick={remove}
        disabled={isPending}
        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50 disabled:opacity-50"
        title="Excluir"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
