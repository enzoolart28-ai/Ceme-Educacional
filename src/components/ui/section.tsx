import { cn } from "@/lib/utils";

/** Bloco de seção com título e conteúdo, usado nos dashboards. */
export function Section({
  title,
  description,
  action,
  className,
  children,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={cn("space-y-3", className)}>
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            {title}
          </h2>
          {description && (
            <p className="text-xs text-slate-400">{description}</p>
          )}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
