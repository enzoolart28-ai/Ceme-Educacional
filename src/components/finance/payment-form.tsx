"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CreditCard } from "lucide-react";
import {
  manualCloseInvoiceAction,
  registerPaymentAction,
} from "@/app/actions/finance";
import { PAYMENT_METHOD_OPTIONS, type PaymentMethod } from "@/lib/finance/labels";
import { formatMoney } from "@/lib/finance/format";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

export function PaymentForm({
  invoiceId,
  remainingAmount,
  mode = "payment",
}: {
  invoiceId: string;
  remainingAmount: number;
  mode?: "payment" | "manual";
}) {
  const router = useRouter();
  const [amount, setAmount] = useState(remainingAmount.toFixed(2));
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("pix");
  const [paidAt, setPaidAt] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit() {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const payload = {
        amount,
        payment_method: paymentMethod,
        paid_at: paidAt,
        notes,
      };
      const result =
        mode === "manual"
          ? await manualCloseInvoiceAction(invoiceId, payload)
          : await registerPaymentAction(invoiceId, payload);
      if (result.error) {
        setError(result.error);
      } else {
        setMessage(mode === "manual" ? "Baixa registrada." : "Pagamento registrado.");
        router.refresh();
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{mode === "manual" ? "Baixa manual" : "Registrar pagamento"}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && <Alert tone="error">{error}</Alert>}
        {message && <Alert tone="success">{message}</Alert>}
        <p className="text-sm text-slate-500">Saldo atual: {formatMoney(remainingAmount)}</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor={`${mode}-amount`}>Valor</Label>
            <Input
              id={`${mode}-amount`}
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor={`${mode}-payment-method`}>Forma de pagamento</Label>
            <Select
              id={`${mode}-payment-method`}
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
            >
              {PAYMENT_METHOD_OPTIONS.map((method) => (
                <option key={method.value} value={method.value}>
                  {method.label}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor={`${mode}-paid-at`}>Data de pagamento</Label>
            <Input
              id={`${mode}-paid-at`}
              type="date"
              value={paidAt}
              onChange={(e) => setPaidAt(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor={`${mode}-notes`}>Observações</Label>
            <Input
              id={`${mode}-notes`}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>
        <Button type="button" onClick={submit} isLoading={isPending}>
          <CreditCard className="h-4 w-4" />
          {mode === "manual" ? "Dar baixa" : "Registrar"}
        </Button>
      </CardContent>
    </Card>
  );
}

