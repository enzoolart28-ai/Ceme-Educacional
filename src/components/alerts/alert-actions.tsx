"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Eye, CheckCircle2, XCircle, RotateCcw } from "lucide-react";
import { setAlertStatusAction } from "@/app/actions/alerts";
import type { AlertStatus } from "@/types/models";

const btn =
  "inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors disabled:opacity-50";

export function AlertActions({ id, status }: { id: string; status: AlertStatus }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function set(next: AlertStatus) {
    startTransition(async () => {
      await setAlertStatusAction({ id, status: next });
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {status === "novo" && (
        <button className={`${btn} bg-slate-100 text-slate-600 hover:bg-slate-200`} disabled={isPending} onClick={() => set("visualizado")}>
          <Eye className="h-3 w-3" /> Visualizado
        </button>
      )}
      {(status === "novo" || status === "visualizado") && (
        <>
          <button className={`${btn} bg-emerald-100 text-emerald-700 hover:bg-emerald-200`} disabled={isPending} onClick={() => set("resolvido")}>
            <CheckCircle2 className="h-3 w-3" /> Resolver
          </button>
          <button className={`${btn} bg-slate-100 text-slate-500 hover:bg-slate-200`} disabled={isPending} onClick={() => set("ignorado")}>
            <XCircle className="h-3 w-3" /> Ignorar
          </button>
        </>
      )}
      {(status === "resolvido" || status === "ignorado") && (
        <button className={`${btn} bg-slate-100 text-slate-600 hover:bg-slate-200`} disabled={isPending} onClick={() => set("novo")}>
          <RotateCcw className="h-3 w-3" /> Reabrir
        </button>
      )}
    </div>
  );
}
