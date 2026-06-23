"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { createPayableAction } from "@/app/actions/payables";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Alert } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SearchableSelect } from "@/components/ui/searchable-select";

export function PayableCreateForm({
  categories,
  payees,
  year,
  month,
}: {
  categories: { id: string; name: string }[];
  payees: { id: string; name: string }[];
  year: number;
  month: number;
}) {
  const router = useRouter();
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const [payeeId, setPayeeId] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [recurring, setRecurring] = useState(false);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit() {
    if (!description.trim()) {
      setError("Informe a descrição.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await createPayableAction({
        category_id: categoryId,
        payee_id: payeeId || "",
        description,
        competence_month: month,
        competence_year: year,
        amount: Number(amount.replace(/\./g, "").replace(",", ".")) || 0,
        due_date: dueDate,
        recurring,
        notes,
      });
      if (result.error) {
        setError(result.error);
      } else {
        setDescription("");
        setAmount("");
        setDueDate("");
        setPayeeId("");
        setNotes("");
        setRecurring(false);
        router.refresh();
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Plus className="h-4 w-4 text-indigo-600" /> Nova conta a pagar
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && <Alert tone="error">{error}</Alert>}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="category">Categoria *</Label>
            <Select id="category" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="payee">Favorecido</Label>
            <SearchableSelect
              options={payees.map((p) => ({ value: p.id, label: p.name }))}
              value={payeeId}
              onChange={setPayeeId}
              placeholder="— Opcional —"
              ariaLabel="Favorecido"
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="desc">Descrição *</Label>
            <Input id="desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ex.: Salário de junho, Conta de energia…" />
          </div>
          <div>
            <Label htmlFor="amount">Valor (R$)</Label>
            <Input id="amount" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0,00" />
          </div>
          <div>
            <Label htmlFor="due">Vencimento</Label>
            <Input id="due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="notes">Observações</Label>
            <Input id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ex.: descontar 166,00; pago via PIX…" />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={recurring}
            onChange={(e) => setRecurring(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
          />
          Conta recorrente (repete todo mês)
        </label>
        <Button onClick={submit} isLoading={isPending}>
          <Plus className="h-4 w-4" /> Adicionar conta
        </Button>
      </CardContent>
    </Card>
  );
}
