"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FileText } from "lucide-react";
import { generateDocumentAction } from "@/app/actions/documents";
import { GENERATED_DOCUMENT_TYPE_OPTIONS } from "@/lib/documents/labels";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import type { GeneratedDocumentType } from "@/types/models";

export function GenerateDocumentForm({
  students,
}: {
  students: { id: string; full_name: string }[];
}) {
  const router = useRouter();
  const [studentId, setStudentId] = useState(students[0]?.id ?? "");
  const [type, setType] = useState<GeneratedDocumentType>("declaracao_matricula");
  const [msg, setMsg] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  function generate() {
    setMsg(null);
    if (!studentId) return setMsg({ tone: "error", text: "Selecione o aluno." });
    startTransition(async () => {
      const result = await generateDocumentAction({ student_id: studentId, type });
      if (result.error) setMsg({ tone: "error", text: result.error });
      else {
        setMsg({ tone: "success", text: "Documento gerado em PDF." });
        router.refresh();
      }
    });
  }

  return (
    <Card>
      <CardContent className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-700">Gerar documento (PDF)</h3>
        {msg && <Alert tone={msg.tone}>{msg.text}</Alert>}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="g_student">Aluno</Label>
            <Select id="g_student" value={studentId} onChange={(e) => setStudentId(e.target.value)}>
              <option value="">Selecione…</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>{s.full_name}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="g_type">Tipo</Label>
            <Select id="g_type" value={type} onChange={(e) => setType(e.target.value as GeneratedDocumentType)}>
              {GENERATED_DOCUMENT_TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </Select>
          </div>
        </div>
        <Button onClick={generate} isLoading={isPending}>
          <FileText className="h-4 w-4" /> Gerar PDF
        </Button>
      </CardContent>
    </Card>
  );
}
