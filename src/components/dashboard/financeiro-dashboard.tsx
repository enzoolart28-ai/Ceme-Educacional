import {
  TrendingUp,
  Wallet,
  AlertTriangle,
  Users,
  CalendarClock,
  BadgePercent,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { StatCard } from "@/components/ui/stat-card";
import { ListCard, SimpleRow } from "@/components/dashboard/list-card";
import { mockFinanceiro } from "@/lib/dashboard/mock";

export function FinanceiroDashboard() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Receita prevista"
          value={formatCurrency(mockFinanceiro.receitaPrevista)}
          icon={TrendingUp}
          tone="sky"
          isMock
        />
        <StatCard
          label="Receita recebida"
          value={formatCurrency(mockFinanceiro.receitaRecebida)}
          icon={Wallet}
          tone="emerald"
          isMock
        />
        <StatCard
          label="Pagamentos em atraso"
          value={formatCurrency(mockFinanceiro.pagamentosEmAtraso)}
          icon={AlertTriangle}
          tone="rose"
          isMock
        />
        <StatCard
          label="Alunos inadimplentes"
          value={mockFinanceiro.alunosInadimplentes}
          icon={Users}
          tone="amber"
          isMock
        />
        <StatCard
          label="Descontos concedidos"
          value={formatCurrency(mockFinanceiro.descontosConcedidos)}
          icon={BadgePercent}
          tone="violet"
          isMock
        />
        <StatCard
          label="Parcelas vencendo"
          value={mockFinanceiro.parcelasVencendo.length}
          icon={CalendarClock}
          tone="indigo"
          isMock
        />
      </div>

      <ListCard title="Parcelas vencendo nos próximos dias" icon={CalendarClock} isMock>
        {mockFinanceiro.parcelasVencendo.map((p, i) => (
          <SimpleRow
            key={i}
            title={p.student}
            subtitle={`Vence em ${p.dueDate}`}
            trailing={formatCurrency(p.amount)}
          />
        ))}
      </ListCard>
    </div>
  );
}
