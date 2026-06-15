import type { ReportChartItem } from "@/lib/reports/types";

export function ReportChart({ items }: { items: ReportChartItem[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-slate-400">Sem dados para grafico.</p>;
  }

  const max = Math.max(...items.map((item) => item.value), 1);

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const width = Math.max((item.value / max) * 100, 4);
        return (
          <div key={item.label} className="grid grid-cols-[minmax(7rem,12rem)_1fr_auto] items-center gap-3 text-sm">
            <span className="truncate text-slate-600" title={item.label}>
              {item.label}
            </span>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-indigo-600" style={{ width: `${width}%` }} />
            </div>
            <span className="w-12 text-right font-medium text-slate-700">{item.value}</span>
          </div>
        );
      })}
    </div>
  );
}

