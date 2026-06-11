import { FlaskConical } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Selo para sinalizar visualmente que um dado é de EXEMPLO (mock), e não vem
 * de uma tabela real ainda. Mantém a honestidade da interface enquanto os
 * módulos de dados não existem.
 */
export function MockBadge({ className }: { className?: string }) {
  return (
    <span
      title="Dado de exemplo — será substituído por dados reais quando o módulo existir"
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700 ring-1 ring-amber-200",
        className,
      )}
    >
      <FlaskConical className="h-3 w-3" />
      exemplo
    </span>
  );
}
