"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ReportTable } from "@/lib/reports/types";

function escapeCsv(value: string): string {
  const escaped = value.replaceAll('"', '""');
  return /[",\n\r]/.test(escaped) ? `"${escaped}"` : escaped;
}

export function ExportCsvButton({ table }: { table: ReportTable }) {
  function download() {
    const lines = [
      table.columns.map(escapeCsv).join(","),
      ...table.rows.map((row) => row.map(escapeCsv).join(",")),
    ];
    const blob = new Blob([lines.join("\n")], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${table.id}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Button type="button" variant="outline" size="sm" onClick={download}>
      <Download className="h-4 w-4" />
      CSV
    </Button>
  );
}

