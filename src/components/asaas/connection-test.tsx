"use client";

import { useState, useTransition } from "react";
import { PlugZap } from "lucide-react";
import { testAsaasConnectionAction } from "@/app/actions/asaas";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export function AsaasConnectionTest({ disabled }: { disabled: boolean }) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  function test() {
    setResult(null);
    startTransition(async () => {
      const response = await testAsaasConnectionAction();
      setResult(response.error
        ? { tone: "error", text: response.error }
        : { tone: "success", text: "Conexao com o Asaas confirmada." });
    });
  }

  return (
    <div className="space-y-3">
      <Button type="button" onClick={test} disabled={disabled} isLoading={isPending}>
        <PlugZap className="h-4 w-4" /> Testar conexao
      </Button>
      {result && <Alert tone={result.tone}>{result.text}</Alert>}
    </div>
  );
}
