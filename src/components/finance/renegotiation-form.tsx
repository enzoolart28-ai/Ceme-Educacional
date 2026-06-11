"use client";

import { useState, useTransition } from "react";
import { RefreshCw } from "lucide-react";
import { renegotiateInvoiceAction } from "@/app/actions/finance";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function RenegotiationForm({
  invoiceId,
  defaultAmount,
}: {
  invoiceId: string;
  defaultAmount: number;
}) {
  const [amount, setAmount] = useState(defaultAmount.toFixed(2));
  const [dueDate, setDueDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit() {
    if (!window.confirm("Renegociar esta cobrança e criar uma nova?")) return;
    setError(null);
    startTransition(async () => {
      const result = await renegotiateInvoiceAction(invoiceId, {
        amount,
        due_date: dueDate,
        notes,
      });
      if (result?.error) setError(result.error);
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Renegociação</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && <Alert tone="error">{error}</Alert>}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="renegotiation-amount">Novo valor</Label>
            <Input
              id="renegotiation-amount"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="renegotiation-due-date">Novo vencimento</Label>
            <Input
              id="renegotiation-due-date"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
        </div>
        <div>
          <Label htmlFor="renegotiation-notes">Observações</Label>
          <Input
            id="renegotiation-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
        <Button type="button" variant="secondary" onClick={submit} isLoading={isPending}>
          <RefreshCw className="h-4 w-4" /> Renegociar
        </Button>
      </CardContent>
    </Card>
  );
}

