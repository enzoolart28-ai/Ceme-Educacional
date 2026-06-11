"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { uploadDocumentAction } from "@/app/actions/documents";
import { DOCUMENT_TYPE_OPTIONS } from "@/lib/documents/labels";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import type { DocumentType } from "@/types/models";

export function DocumentUpload({
  students,
}: {
  students: { id: string; full_name: string }[];
}) {
  const router = useRouter();
  const [studentId, setStudentId] = useState(students[0]?.id ?? "");
  const [type, setType] = useState<DocumentType>("rg");
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [msg, setMsg] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [isPending, startTransition] = useTransition();

  async function submit() {
    setMsg(null);
    if (!studentId) return setMsg({ tone: "error", text: "Selecione o aluno." });
    if (!title.trim()) return setMsg({ tone: "error", text: "Informe o título." });
    if (!file) return setMsg({ tone: "error", text: "Selecione o arquivo." });

    setBusy(true);
    const supabase = createClient();
    const path = `uploads/${studentId}/${Date.now()}-${file.name.replace(/\s+/g, "_")}`;
    const { error: upErr } = await supabase.storage.from("documents").upload(path, file);
    setBusy(false);
    if (upErr) return setMsg({ tone: "error", text: "Falha no upload do arquivo." });

    startTransition(async () => {
      const result = await uploadDocumentAction({ student_id: studentId, type, title: title.trim(), file_url: path });
      if (result.error) setMsg({ tone: "error", text: result.error });
      else {
        setMsg({ tone: "success", text: "Documento enviado." });
        setTitle("");
        setFile(null);
        router.refresh();
      }
    });
  }

  return (
    <Card>
      <CardContent className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-700">Enviar documento</h3>
        {msg && <Alert tone={msg.tone}>{msg.text}</Alert>}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {students.length > 1 && (
            <div className="sm:col-span-2">
              <Label htmlFor="d_student">Aluno</Label>
              <Select id="d_student" value={studentId} onChange={(e) => setStudentId(e.target.value)}>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>{s.full_name}</option>
                ))}
              </Select>
            </div>
          )}
          <div>
            <Label htmlFor="d_type">Tipo</Label>
            <Select id="d_type" value={type} onChange={(e) => setType(e.target.value as DocumentType)}>
              {DOCUMENT_TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="d_title">Título</Label>
            <Input id="d_title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex.: RG (frente e verso)" />
          </div>
        </div>
        <div>
          <Label htmlFor="d_file">Arquivo</Label>
          <input
            id="d_file"
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-indigo-50 file:px-3 file:py-1.5 file:text-indigo-700"
          />
        </div>
        <Button onClick={submit} isLoading={busy || isPending}>
          <Upload className="h-4 w-4" /> Enviar
        </Button>
      </CardContent>
    </Card>
  );
}
