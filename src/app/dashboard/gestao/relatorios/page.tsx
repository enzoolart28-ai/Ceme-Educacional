import Link from "next/link";
import { BarChart3, UserMinus, ArrowRightLeft, Percent, Users } from "lucide-react";
import { GESTOR_ROLES, requireRole } from "@/lib/auth/session";
import { getManagementDashboard } from "@/lib/management/queries";
import { getDropoutReport } from "@/lib/desistencias/queries";
import { PageHeader } from "@/components/ui/page-header";
import { Section } from "@/components/ui/section";
import { StatCard } from "@/components/ui/stat-card";
import { InfoStatCard, type StatTone } from "@/components/ui/info-stat-card";

function formatMetric(value: number, kind?: "money" | "number" | "percent") {
  if (kind === "money") return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  if (kind === "percent") return `${value.toFixed(1)}%`;
  return value.toLocaleString("pt-BR");
}

/** Explicação curta de cada indicador (mostrada no resumo ao clicar no ícone). */
const EXPLAIN: Record<string, string> = {
  "Saldo atual em caixa": "Quanto há em caixa agora (entradas menos saídas do período).",
  Entradas: "Total de dinheiro que entrou no caixa no período.",
  Saidas: "Total de dinheiro que saiu do caixa no período.",
  "Solicitacoes pendentes": "Pedidos financeiros aguardando aprovação.",
  "Solicitacoes aprovadas": "Pedidos financeiros já aprovados.",
  "Solicitacoes recusadas": "Pedidos financeiros que foram recusados.",
  "Caixas abertos": "Caixas que estão abertos neste momento.",
  "Fechamentos com diferenca": "Fechamentos de caixa cujo valor não bateu.",
  "Alunos ativos": "Alunos com matrícula ativa no momento.",
  Matriculas: "Total de matrículas (aluno vinculado a uma turma).",
  "Turmas ativas": "Turmas em funcionamento atualmente.",
  "Professores ativos": "Professores ativos no sistema.",
  "Professores sem chamada": "Professores que ainda não lançaram a chamada.",
  "Atividades pendentes": "Atividades/provas enviadas aguardando correção.",
  "Conteudos nao publicados": "Conteúdos (aulas) ainda em rascunho, não publicados.",
  "Leads recebidos": "Total de contatos/interessados recebidos.",
  "Leads em atendimento": "Leads que estão em atendimento agora.",
  "Leads convertidos": "Leads que viraram matrícula.",
  "Taxa de conversao": "Percentual de leads que viraram matrícula.",
  "Eventos realizados": "Eventos já finalizados.",
  "Inscritos em eventos": "Total de inscrições em eventos.",
  "Participantes convertidos": "Participantes de evento que viraram alunos.",
  "Documentos pendentes": "Documentos aguardando emissão/assinatura.",
  "Solicitacoes internas abertas": "Solicitações internas ainda abertas.",
  "Solicitacoes atrasadas": "Solicitações que passaram do prazo.",
};

export default async function RelatoriosGestaoPage() {
  await requireRole(GESTOR_ROLES);
  const dashboard = await getManagementDashboard();
  const dropout = await getDropoutReport();

  const groups: {
    title: string;
    metrics: typeof dashboard.finance;
    href: string;
    label: string;
    tone: StatTone;
  }[] = [
    { title: "Financeiro", metrics: dashboard.finance, href: "/dashboard/gestao/fluxo-caixa", label: "Abrir Fluxo de Caixa", tone: "emerald" },
    { title: "Academico", metrics: dashboard.academic, href: "/dashboard/academico", label: "Abrir Acadêmico", tone: "indigo" },
    { title: "Pedagogico", metrics: dashboard.pedagogical, href: "/dashboard/pedagogico", label: "Abrir Pedagógico", tone: "violet" },
    { title: "Comercial", metrics: dashboard.commercial, href: "/dashboard/crm/relatorios", label: "Abrir Relatórios do CRM", tone: "sky" },
    { title: "Administrativo", metrics: dashboard.administrative, href: "/dashboard/documentos", label: "Abrir Documentos", tone: "amber" },
  ];

  return (
    <>
      <PageHeader title="Relatorios Gerenciais" description="Indicadores consolidados por area. Toque no ícone de um cartão para ver o resumo e ir para a área." />
      <div className="space-y-8">
        <Section title="Desistências e Evasão">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Desistentes" value={formatMetric(dropout.dropoutCount)} icon={UserMinus} tone="rose" />
            <StatCard label="Transferidos" value={formatMetric(dropout.transferredCount)} icon={ArrowRightLeft} tone="amber" />
            <StatCard label="Taxa de desistência" value={`${dropout.rate}%`} icon={Percent} tone="violet" />
            <StatCard label="Total de alunos" value={formatMetric(dropout.totalStudents)} icon={Users} tone="indigo" />
          </div>
          <div className="mt-4">
            <Link href="/dashboard/desistencias" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
              Ver relatório completo de desistências →
            </Link>
          </div>
        </Section>

        {groups.map((group) => (
          <Section key={group.title} title={group.title}>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {group.metrics.map((metric) => (
                <InfoStatCard
                  key={`${group.title}-${metric.label}`}
                  label={metric.label}
                  value={formatMetric(metric.value, metric.kind)}
                  icon={BarChart3}
                  tone={group.tone}
                  explanation={EXPLAIN[metric.label] ?? `Indicador da área ${group.title}.`}
                  related={group.metrics
                    .filter((m) => m.label !== metric.label)
                    .slice(0, 3)
                    .map((m) => ({ label: m.label, value: formatMetric(m.value, m.kind) }))}
                  href={group.href}
                  linkLabel={group.label}
                />
              ))}
            </div>
            <div className="mt-4">
              <Link href={group.href} className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
                {group.label} →
              </Link>
            </div>
          </Section>
        ))}
      </div>
    </>
  );
}
