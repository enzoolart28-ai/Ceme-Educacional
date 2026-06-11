"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Ban, Trash2 } from "lucide-react";
import { cancelInvoiceAction, deletePaymentAction } from "@/app/actions/finance";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export function CancelInvoiceButton({ invoiceId }: { invoiceId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function cancel() {
    const notes = window.prompt("Motivo do cancelamento") ?? "";
    if (!window.confirm("Cancelar esta cobrança?")) return;
    setError(null);
    startTransition(async () => {
      const result = await cancelInvoiceAction(invoiceId, { notes });
      if (result.error) {
        setError(result.error);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-2">
      {error && <Alert tone="error">{error}</Alert>}
      <Button type="button" variant="danger" onClick={cancel} isLoading={isPending}>
        <Ban className="h-4 w-4" /> Cancelar cobrança
      </Button>
    </div>
  );
}

export function DeletePaymentButton({
  paymentId,
  invoiceId,
}: {
  paymentId: string;
  invoiceId: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function remove() {
    if (!window.confirm("Excluir este pagamento?")) return;
    setError(null);
    startTransition(async () => {
      const result = await deletePaymentAction(paymentId, invoiceId);
      if (result.error) {
        setError(result.error);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-2">
      {error && <Alert tone="error">{error}</Alert>}
      <Button type="button" variant="ghost" size="sm" onClick={remove} isLoading={isPending}>
        <Trash2 className="h-4 w-4" /> Excluir
      </Button>
    </div>
  );
}

