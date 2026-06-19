import { BarChart3 } from "lucide-react";
import { REPORT_ROLES, requireRole } from "@/lib/auth/session";
import { getReportsData } from "@/lib/reports/queries";
import type { ReportFilters } from "@/lib/reports/types";
import { allowedReportCategories } from "@/lib/reports/types";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Card } from "@/components/ui/card";
import { ReportFiltersForm } from "@/components/reports/report-filters";
import { ReportSectionCard } from "@/components/reports/report-section-card";

function readParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0] || undefined;
  return value || undefined;
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const profile = await requireRole(REPORT_ROLES);
  const params = await searchParams;
  const filters: ReportFilters = {
    from: readParam(params.from),
    to: readParam(params.to),
    courseId: readParam(params.courseId),
    classId: readParam(params.classId),
    unitId: readParam(params.unitId),
    status: readParam(params.status),
  };
  const data = await getReportsData(profile.role, filters);
  const categories = allowedReportCategories(profile.role);

  return (
    <>
      <PageHeader
        title="Relatorios"
        description="Central academica, financeira, pedagogica, comercial e de desistencias com filtros e exportacao."
      />

      <ReportFiltersForm filters={filters} options={data.options} />

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-5">
        {[
          ["academic", "Academicos"],
          ["financial", "Financeiros"],
          ["pedagogical", "Pedagogicos"],
          ["commercial", "Comerciais"],
          ["dropout", "Desistencias"],
        ].map(([category, label]) => (
          <Card
            key={category}
            className={
              categories.includes(category as never)
                ? "p-4"
                : "p-4 opacity-50"
            }
          >
            <p className="text-sm font-medium text-slate-500">{label}</p>
            <p className="mt-1 text-xl font-bold text-slate-900">
              {data.sections.filter((section) => section.category === category).length}
            </p>
          </Card>
        ))}
      </div>

      {data.sections.length === 0 ? (
        <Card className="p-6">
          <EmptyState
            icon={BarChart3}
            title="Sem relatorios disponiveis"
            description="Seu perfil nao possui relatorios liberados ou ainda nao ha dados cadastrados."
          />
        </Card>
      ) : (
        <div className="space-y-10">
          {data.sections.map((section) => (
            <ReportSectionCard key={section.id} section={section} />
          ))}
        </div>
      )}
    </>
  );
}
