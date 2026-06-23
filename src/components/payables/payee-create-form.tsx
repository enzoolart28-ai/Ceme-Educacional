"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { UserPlus } from "lucide-react";
import { createPayeeAction } from "@/app/actions/payables";
import { PAYEE_TYPE_OPTIONS } from "@/lib/payables/labels";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Alert } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PayeeType } from "@/types/models";

export function PayeeCreateForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [type, setType] = useState<PayeeType>("fornecedor");
  const [pix, setPix] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit() {
    if (name.trim().length < 2) {
      setError("Informe o nome.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await createPayeeAction({ name, type, pix_key: pix, notes: "" });
      if (result.error) {
        setError(result.error);
      } else {
        setName("");
        setPix("");
        setType("fornecedor");
        router.refresh();
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <UserPlus className="h-4 w-4 text-indigo-600" /> Novo favorecido
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && <Alert tone="error">{error}</Alert>}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="sm:col-span-1">
            <Label htmlFor="pname">Nome *</Label>
            <Input id="pname" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="ptype">Tipo</Label>
            <Select id="ptype" value={type} onChange={(e) => setType(e.target.value as PayeeType)}>
              {PAYEE_TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="ppix">Chave PIX</Label>
            <Input id="ppix" value={pix} onChange={(e) => setPix(e.target.value)} placeholder="CPF, e-mail, telefone…" />
          </div>
        </div>
        <Button onClick={submit} isLoading={isPending}>
          <UserPlus className="h-4 w-4" /> Cadastrar favorecido
        </Button>
      </CardContent>
    </Card>
  );
}
