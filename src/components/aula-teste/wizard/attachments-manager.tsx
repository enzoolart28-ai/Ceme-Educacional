"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Upload, FileText, Download, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { addAttachmentAction, deleteAttachmentAction } from "@/app/actions/aula-teste";
import { Alert } from "@/components/ui/alert";
import type { AttachmentWithUrl } from "@/lib/aula-teste/queries";

export function AttachmentsManager({
  reportId,
  kind,
  label,
  attachments,
}: {
  reportId: string;
  kind: "curriculo" | "plano_aula" | "outro";
  label: string;
  attachments: AttachmentWithUrl[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const items = attachments.filter((a) => a.kind === kind);

  async function upload(file: File) {
    setMsg(null);
    setBusy(true);
    const supabase = createClient();
    const path = `reports/${reportId}/${kind}/${Date.now()}-${file.name.replace(/\s+/g, "_")}`;
    const { error } = await supabase.storage.from("aula-teste").upload(path, file);
    setBusy(false);
    if (error) return setMsg("Falha no upload do arquivo.");
    startTransition(async () => {
      const r = await addAttachmentAction({
        report_id: reportId,
        kind,
        file_path: path,
        file_name: file.name,
        mime_type: file.type,
      });
      if (r.error) setMsg(r.error);
      else router.refresh();
    });
  }

  function remove(a: AttachmentWithUrl) {
    if (!confirm("Remover este anexo?")) return;
    startTransition(async () => {
      await deleteAttachmentAction({ id: a.id, report_id: reportId, file_path: a.file_path });
      router.refresh();
    });
  }

  return (
    <div className="space-y-2">
      {msg && <Alert tone="error">{msg}</Alert>}
      {items.length > 0 && (
        <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
          {items.map((a) => (
            <li key={a.id} className="flex items-center gap-2 px-3 py-2">
              <FileText className="h-4 w-4 shrink-0 text-slate-400" />
              <span className="min-w-0 flex-1 truncate text-sm text-slate-700">{a.file_name}</span>
              {a.url && (
                <a href={a.url} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-indigo-600" aria-label="Baixar">
                  <Download className="h-4 w-4" />
                </a>
              )}
              <button onClick={() => remove(a)} disabled={isPending} className="text-slate-400 hover:text-rose-600" aria-label="Remover">
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
        <Upload className="h-4 w-4" /> {busy ? "Enviando…" : `Anexar ${label} (PDF, Word ou imagem)`}
        <input
          type="file"
          accept=".pdf,.doc,.docx,image/*"
          className="hidden"
          disabled={busy || isPending}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) void upload(f); }}
        />
      </label>
    </div>
  );
}
