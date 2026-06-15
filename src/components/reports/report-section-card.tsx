import { BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { ExportCsvButton } from "@/components/reports/export-csv-button";
import { ReportChart } from "@/components/reports/report-chart";
import { PaginatedReportTable } from "@/components/reports/report-table";
import type { ReportSection } from "@/lib/reports/types";

export function ReportSectionCard({ section }: { section: ReportSection }) {
  return (
    <section className="space-y-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{section.title}</h2>
          <p className="text-sm text-slate-500">{section.description}</p>
        </div>
        <ExportCsvButton table={section.table} />
      </div>

      {section.metrics.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {section.metrics.map((metric) => (
            <StatCard
              key={`${section.id}-${metric.label}`}
              label={metric.label}
              value={metric.value}
              hint={metric.hint}
              icon={BarChart3}
              tone="slate"
            />
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(18rem,24rem)_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Grafico</CardTitle>
          </CardHeader>
          <CardContent>
            <ReportChart items={section.chart} />
          </CardContent>
        </Card>

        <div>
          <div className="mb-3">
            <h3 className="text-base font-semibold text-slate-900">{section.table.title}</h3>
            <p className="text-sm text-slate-500">{section.table.description}</p>
          </div>
          <PaginatedReportTable table={section.table} />
        </div>
      </div>
    </section>
  );
}

