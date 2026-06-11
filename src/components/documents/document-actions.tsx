"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Eye, Check, X, Trash2 } from "lucide-react";
import {
  getDocumentUrlAction,
  getGeneratedUrlAction,
  reviewDocumentAction,
  deleteDocumentAction,
} from "@/app/actions/documents";
import { Button } from "@/components/ui/button";

export function ViewFileButton({
  id,
  kind = "document",
  label = "Ver / baixar",
  hasFile = true,
}: {
  id: string;
  kind?: "document" | "generated";
  label?: string;
  hasFile?: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function open() {
    setError(null);
    startTransition(async () => {
      const result =
        kind === "generated"
          ? await getGeneratedUrlAction({ id })
          : await getDocumentUrlAction({ id });
      if (result.url) window.open(result.url, "_blank", "noopener");
      else setError(result.error ?? "Indisponível.");
    });
  }

  if (!hasFile) return <span className="text-xs text-slate-400">Sem arquivo</span>;
  return (
    <span className="inline-flex items-center gap-2">
      <button onClick={open} disabled={isPending} className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:underline disabled:opacity-50">
        <Eye className="h-4 w-4" /> {label}
      </button>
      {error && <span className="text-xs text-rose-600">{error}</span>}
    </span>
  );
}

export function ReviewControls({ id }: { id: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function review(status: "aprovado" | "reprovado") {
    let observation: string | undefined;
    if (status === "reprovado") {
      const reason = window.prompt("Motivo da reprovação (opcional):") ?? "";
      observation = reason || undefined;
    }
    startTransition(async () => {
      await reviewDocumentAction({ id, status, observation });
      router.refresh();
    });
  }

  return (
    <span className="inline-flex items-center gap-2">
      <Button variant="outline" onClick={() => review("aprovado")} isLoading={isPending}>
        <Check className="h-4 w-4 text-emerald-600" /> Aprovar
      </Button>
      <Button variant="outline" onClick={() => review("reprovado")} isLoading={isPending}>
        <X className="h-4 w-4 text-rose-600" /> Reprovar
      </Button>
    </span>
  );
}

export function DeleteDocumentButton({ id }: { id: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  function remove() {
    if (!confirm("Excluir este documento?")) return;
    startTransition(async () => {
      await deleteDocumentAction({ id });
      router.refresh();
    });
  }
  return (
    <button onClick={remove} disabled={isPending} aria-label="Excluir" className="text-slate-400 hover:text-rose-600 disabled:opacity-50">
      <Trash2 className="h-4 w-4" />
    </button>
  );
}
