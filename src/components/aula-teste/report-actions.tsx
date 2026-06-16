"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { setReportProcessStatusAction, deleteReportAction } from "@/app/actions/aula-teste";
import { AT_PROCESS_STATUS_OPTIONS } from "@/lib/aula-teste/labels";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { AtProcessStatus } from "@/types/models";

export function ProcessStatusSelect({ id, value }: { id: string; value: AtProcessStatus }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  return (
    <Select
      value={value}
      disabled={isPending}
      onChange={(e) => {
        const status = e.target.value as AtProcessStatus;
        startTransition(async () => {
          await setReportProcessStatusAction({ id, status });
          router.refresh();
        });
      }}
      aria-label="Situação do processo"
      className="w-64"
    >
      {AT_PROCESS_STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </Select>
  );
}

export function ReportDeleteButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();
  return (
    <Button
      variant="danger"
      isLoading={isPending}
      onClick={() => {
        if (!confirm("Excluir este relatório e todos os dados associados?")) return;
        startTransition(() => { void deleteReportAction({ id }); });
      }}
    >
      <Trash2 className="h-4 w-4" /> Excluir
    </Button>
  );
}
