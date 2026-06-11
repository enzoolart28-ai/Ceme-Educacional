import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

export interface Column<T> {
  header: string;
  cell: (row: T) => React.ReactNode;
  className?: string;
}

export function DataTable<T>({
  columns,
  data,
  getRowKey,
  emptyIcon,
  emptyTitle = "Nada por aqui",
  emptyDescription = "Nenhum registro encontrado.",
}: {
  columns: Column<T>[];
  data: T[];
  getRowKey: (row: T, index: number) => string;
  emptyIcon: LucideIcon;
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  if (data.length === 0) {
    return (
      <Card className="p-6">
        <EmptyState
          icon={emptyIcon}
          title={emptyTitle}
          description={emptyDescription}
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
              {columns.map((col, i) => (
                <th
                  key={i}
                  className="px-4 py-3 font-medium text-slate-500"
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map((row, rowIndex) => (
              <tr key={getRowKey(row, rowIndex)} className="hover:bg-slate-50">
                {columns.map((col, colIndex) => (
                  <td
                    key={colIndex}
                    className={`px-4 py-3 text-slate-700 ${col.className ?? ""}`}
                  >
                    {col.cell(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
