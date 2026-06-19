"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { STUDENT_STATUS_LABELS } from "@/lib/students/labels";
import type { DropoutRow } from "@/lib/desistencias/queries";
import type { StudentStatus } from "@/types/models";

function csvCell(v: unknown): string {
  const s = v == null ? "" : String(v);
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function DropoutExport({ rows }: { rows: DropoutRow[] }) {
  function exportCsv() {
    const header = ["Aluno", "Situação", "Curso", "Turma", "Data", "Motivo/Observação"];
    const lines = rows.map((r) =>
      [
        r.studentName,
        STUDENT_STATUS_LABELS[r.status as StudentStatus] ?? r.status,
        r.courseName ?? "",
        r.className ?? "",
        r.date ? new Date(r.date).toLocaleDateString("pt-BR") : "",
        r.reason ?? "",
      ]
        .map(csvCell)
        .join(","),
    );
    const csv = "﻿" + [header.join(","), ...lines].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "desistencias.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Button variant="outline" onClick={exportCsv} disabled={rows.length === 0}>
      <Download className="h-4 w-4" /> Exportar CSV
    </Button>
  );
}
