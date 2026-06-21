"use client";

import { useState, useTransition } from "react";
import { RefreshCw, UsersRound } from "lucide-react";
import { generateGuardianAccountsAction } from "@/app/actions/guardians";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export function GenerateGuardianAccountsButton() {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  function generate() {
    setMessage(null);
    startTransition(async () => {
      const result = await generateGuardianAccountsAction();
      if (result.error) {
        setMessage({ tone: "error", text: result.error });
        return;
      }
      setMessage({
        tone: "success",
        text: `${result.accountsCreated ?? 0} conta(s) criada(s) e ${result.studentsLinked ?? 0} aluno(s) vinculado(s).`,
      });
    });
  }

  return (
    <div className="space-y-2">
      <Button type="button" variant="outline" onClick={generate} isLoading={isPending}>
        {isPending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <UsersRound className="h-4 w-4" />}
        Gerar acessos automaticamente
      </Button>
      {message && <Alert tone={message.tone}>{message.text}</Alert>}
    </div>
  );
}
