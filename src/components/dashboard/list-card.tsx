import { Inbox, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { MockBadge } from "@/components/ui/mock-badge";
import { ProgressBar, type ProgressTone } from "@/components/ui/progress-bar";

/** Cartão com título e lista de itens. */
export function ListCard({
  title,
  icon: Icon,
  isMock = false,
  action,
  emptyIcon,
  emptyText,
  isEmpty = false,
  children,
}: {
  title: string;
  icon?: LucideIcon;
  isMock?: boolean;
  action?: React.ReactNode;
  emptyIcon?: LucideIcon;
  emptyText?: string;
  isEmpty?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          {Icon && <Icon className="h-4 w-4 text-slate-400" />}
          {title}
          {isMock && <MockBadge />}
        </CardTitle>
        {action}
      </CardHeader>
      <CardContent className="flex-1 p-0">
        {isEmpty ? (
          <div className="p-5">
            <EmptyState
              icon={emptyIcon ?? Icon ?? Inbox}
              title="Nada por aqui"
              description={emptyText ?? "Nenhum item para exibir."}
            />
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">{children}</ul>
        )}
      </CardContent>
    </Card>
  );
}

/** Linha com horário à esquerda (agenda / próximas aulas). */
export function TimelineRow({
  time,
  title,
  subtitle,
}: {
  time: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <li className="flex items-center gap-3 px-5 py-3">
      <span className="w-12 shrink-0 text-sm font-semibold text-indigo-600">
        {time}
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-slate-900">{title}</p>
        {subtitle && <p className="truncate text-xs text-slate-500">{subtitle}</p>}
      </div>
    </li>
  );
}

/** Linha simples com título, subtítulo e valor à direita. */
export function SimpleRow({
  title,
  subtitle,
  trailing,
  trailingClass,
}: {
  title: string;
  subtitle?: string;
  trailing?: React.ReactNode;
  trailingClass?: string;
}) {
  return (
    <li className="flex items-center justify-between gap-3 px-5 py-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-slate-900">{title}</p>
        {subtitle && <p className="truncate text-xs text-slate-500">{subtitle}</p>}
      </div>
      {trailing != null && (
        <span className={cn("shrink-0 text-sm font-semibold text-slate-700", trailingClass)}>
          {trailing}
        </span>
      )}
    </li>
  );
}

/** Linha com barra de progresso (frequência por turma, etc.). */
export function ProgressRow({
  label,
  value,
  tone = "indigo",
  valueLabel,
}: {
  label: string;
  value: number; // 0–100
  tone?: ProgressTone;
  valueLabel: string;
}) {
  return (
    <li className="px-5 py-3">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-sm font-medium text-slate-700">{label}</span>
        <span className="text-sm font-semibold text-slate-900">{valueLabel}</span>
      </div>
      <ProgressBar value={value} tone={tone} />
    </li>
  );
}
