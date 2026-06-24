"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

export type StatTone = "indigo" | "emerald" | "amber" | "sky" | "rose" | "violet" | "slate";

const toneClasses: Record<StatTone, string> = {
  indigo: "bg-indigo-50 text-indigo-600",
  emerald: "bg-emerald-50 text-emerald-600",
  amber: "bg-amber-50 text-amber-600",
  sky: "bg-sky-50 text-sky-600",
  rose: "bg-rose-50 text-rose-600",
  violet: "bg-violet-50 text-violet-600",
  slate: "bg-slate-100 text-slate-600",
};

export function InfoStatCard({
  label,
  value,
  icon: Icon,
  tone = "indigo",
  explanation,
  related = [],
  href,
  linkLabel = "Ver detalhes",
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone?: StatTone;
  explanation: string;
  related?: { label: string; value: string }[];
  href: string;
  linkLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  return (
    <Card className="relative p-5">
      <div className="flex items-start justify-between">
        <span className="text-sm font-medium text-slate-500">{label}</span>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={`Resumo de ${label}`}
          aria-expanded={open}
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-transform hover:scale-105",
            toneClasses[tone],
          )}
        >
          <Icon className="h-5 w-5" />
        </button>
      </div>

      <div className="mt-3 text-2xl font-bold text-slate-900">{value}</div>
      <p className="mt-1 text-xs text-slate-400">Toque no ícone para o resumo</p>

      {open && (
        <div ref={ref} className="absolute right-3 top-14 z-30 w-72">
          <Link
            href={href}
            className="block rounded-xl border border-slate-200 bg-white p-4 shadow-lg transition-colors hover:border-indigo-300"
            onClick={() => setOpen(false)}
          >
            <p className="text-sm font-semibold text-slate-900">{label}</p>
            <p className="mt-1 text-xs text-slate-600">{explanation}</p>

            {related.length > 0 && (
              <ul className="mt-3 space-y-1 border-t border-slate-100 pt-2">
                {related.map((r) => (
                  <li key={r.label} className="flex items-center justify-between gap-3 text-xs">
                    <span className="text-slate-500">{r.label}</span>
                    <span className="font-medium text-slate-800">{r.value}</span>
                  </li>
                ))}
              </ul>
            )}

            <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-indigo-600">
              {linkLabel} <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </Link>
        </div>
      )}
    </Card>
  );
}
