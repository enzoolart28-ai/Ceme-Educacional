"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { deactivatePayeeAction } from "@/app/actions/payables";

export function PayeeRemoveButton({ id }: { id: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function remove() {
    if (!confirm("Remover este favorecido da lista?")) return;
    startTransition(async () => {
      await deactivatePayeeAction(id);
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={remove}
      disabled={isPending}
      className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50 disabled:opacity-50"
      title="Remover favorecido"
    >
      <Trash2 className="h-3.5 w-3.5" /> Remover
    </button>
  );
}
