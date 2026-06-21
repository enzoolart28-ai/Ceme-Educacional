"use client";

import { useState, useTransition } from "react";
import { MessageCircleMore } from "lucide-react";
import { testWhatsAppConnectionAction } from "@/app/actions/whatsapp";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export function WhatsAppConnectionTest({ disabled }: { disabled: boolean }) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  function test() {
    setResult(null);
    startTransition(async () => {
      const response = await testWhatsAppConnectionAction();
      setResult(response.error
        ? { tone: "error", text: response.error }
        : { tone: "success", text: `Conexao confirmada${response.detail ? `: ${response.detail}` : "."}` });
    });
  }

  return (
    <div className="space-y-3">
      <Button type="button" onClick={test} disabled={disabled} isLoading={pending}>
        <MessageCircleMore className="h-4 w-4" /> Testar conexao
      </Button>
      {result && <Alert tone={result.tone}>{result.text}</Alert>}
    </div>
  );
}
