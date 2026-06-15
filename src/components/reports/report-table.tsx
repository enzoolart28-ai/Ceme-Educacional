"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import type { ReportTable as ReportTableType } from "@/lib/reports/types";

const PAGE_SIZE = 10;

export function PaginatedReportTable({ table }: { table: ReportTableType }) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(Math.ceil(table.rows.length / PAGE_SIZE), 1);
  const rows = useMemo(
    () => table.rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [page, table.rows],
  );

  if (table.rows.length === 0) {
    return (
      <Card className="p-6">
        <EmptyState
          icon={FileText}
          title="Sem registros"
          description="Ajuste os filtros ou cadastre dados para gerar este relatorio."
        />
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left">
              {table.columns.map((column) => (
                <th key={column} className="px-4 py-3 font-medium text-slate-500">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row, rowIndex) => (
              <tr key={`${page}-${rowIndex}`} className="hover:bg-slate-50">
                {row.map((cell, cellIndex) => (
                  <td key={`${rowIndex}-${cellIndex}`} className="px-4 py-3 text-slate-700">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-sm text-slate-500">
        <span>
          Pagina {page} de {totalPages} &middot; {table.rows.length} registros
        </span>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((current) => Math.max(current - 1, 1))}
            aria-label="Pagina anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((current) => Math.min(current + 1, totalPages))}
            aria-label="Proxima pagina"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
