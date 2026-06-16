import Link from "next/link";
import { Lock } from "lucide-react";
import { AT_WIZARD_STEPS } from "@/lib/aula-teste/labels";
import { cn } from "@/lib/utils";

export function WizardStepper({ reportId, current }: { reportId: string; current: number }) {
  return (
    <nav className="space-y-1">
      {AT_WIZARD_STEPS.map((s) => {
        const active = s.n === current;
        const base = "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors";
        if (!s.ready) {
          return (
            <div key={s.n} className={cn(base, "cursor-not-allowed text-slate-300")} title="Em breve">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-[10px]">{s.n}</span>
              <span className="flex-1">{s.label}</span>
              <Lock className="h-3 w-3" />
            </div>
          );
        }
        return (
          <Link
            key={s.n}
            href={`/dashboard/aula-teste/${reportId}/editar?step=${s.n}`}
            className={cn(base, active ? "bg-indigo-600 font-medium text-white" : "text-slate-600 hover:bg-indigo-50 hover:text-indigo-700")}
          >
            <span className={cn("flex h-5 w-5 items-center justify-center rounded-full text-[10px]", active ? "bg-white/20" : "bg-indigo-50 text-indigo-600")}>{s.n}</span>
            <span className="flex-1">{s.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
