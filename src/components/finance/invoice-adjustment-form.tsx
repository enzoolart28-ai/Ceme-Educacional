"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Percent } from "lucide-react";
import { updateInvoiceAdjustmentsAction } from "@/app/actions/finance";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function InvoiceAdjustmentForm({
  invoiceId,
  discountValue,
  fineValue,
  interestValue,
  notes,
}: {
  invoiceId: string;
  discountValue: number;
  fineValue: number;
  interestValue: number;
  notes: string;
}) {
  const router = useRouter();
  const [discount, setDiscount] = useState(discountValue.toFixed(2));
  const [fine, setFine] = useState(fineValue.toFixed(2));
  const [interest, setInterest] = useState(interestValue.toFixed(2));
  const [draftNotes, setDraftNotes] = useState(notes);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit() {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const result = await updateInvoiceAdjustmentsAction(invoiceId, {
        discount_value: discount,
        fine_value: fine,
        interest_value: interest,
        notes: draftNotes,
      });
      if (result.error) {
        setError(result.error);
      } else {
        setMessage("Ajustes registrados.");
        router.refresh();
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Descontos, bolsa, multa e juros</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && <Alert tone="error">{error}</Alert>}
        {message && <Alert tone="success">{message}</Alert>}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <Label htmlFor="discount">Desconto/bolsa</Label>
            <Input id="discount" inputMode="decimal" value={discount} onChange={(e) => setDiscount(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="fine">Multa</Label>
            <Input id="fine" inputMode="decimal" value={fine} onChange={(e) => setFine(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="interest">Juros</Label>
            <Input id="interest" inputMode="decimal" value={interest} onChange={(e) => setInterest(e.target.value)} />
          </div>
        </div>
        <div>
          <Label htmlFor="adjustment-notes">Observações</Label>
          <Input
            id="adjustment-notes"
            value={draftNotes}
            onChange={(e) => setDraftNotes(e.target.value)}
          />
        </div>
        <Button type="button" variant="secondary" onClick={submit} isLoading={isPending}>
          <Percent className="h-4 w-4" /> Salvar ajustes
        </Button>
      </CardContent>
    </Card>
  );
}

