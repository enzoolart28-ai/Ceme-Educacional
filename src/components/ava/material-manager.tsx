"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Paperclip, ExternalLink, Trash2, Upload } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { addMaterialAction, deleteMaterialAction } from "@/app/actions/ava";
import { MATERIAL_TYPE_OPTIONS, materialTypeLabel } from "@/lib/ava/labels";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import type { LessonMaterial, MaterialType } from "@/types/models";

export function MaterialManager({
  lessonId,
  courseId,
  materials,
  canManage,
}: {
  lessonId: string;
  courseId: string;
  materials: LessonMaterial[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [type, setType] = useState<MaterialType>("pdf");
  const [externalUrl, setExternalUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [isPending, startTransition] = useTransition();

  async function submit() {
    setError(null);
    if (!title.trim()) {
      setError("Informe o título do material.");
      return;
    }
    let fileUrl = "";
    if (type === "link") {
      if (!externalUrl.trim()) {
        setError("Informe o link externo.");
        return;
      }
    } else {
      if (!file) {
        setError("Selecione um arquivo para enviar.");
        return;
      }
      setBusy(true);
      const supabase = createClient();
      const path = `${lessonId}/${Date.now()}-${file.name.replace(/\s+/g, "_")}`;
      const { error: upErr } = await supabase.storage
        .from("lesson-materials")
        .upload(path, file, { upsert: false });
      if (upErr) {
        setBusy(false);
        setError("Falha no upload do arquivo.");
        return;
      }
      fileUrl = supabase.storage.from("lesson-materials").getPublicUrl(path).data.publicUrl;
      setBusy(false);
    }

    startTransition(async () => {
      const result = await addMaterialAction({
        lesson_id: lessonId,
        course_id: courseId,
        title,
        type,
        file_url: fileUrl || undefined,
        external_url: type === "link" ? externalUrl : undefined,
      });
      if (result.error) setError(result.error);
      else {
        setTitle("");
        setExternalUrl("");
        setFile(null);
        router.refresh();
      }
    });
  }

  function remove(id: string) {
    startTransition(async () => {
      await deleteMaterialAction({ id, lesson_id: lessonId, course_id: courseId });
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      {materials.length > 0 ? (
        <Card className="divide-y divide-slate-100">
          {materials.map((m) => {
            const url = m.file_url || m.external_url || "#";
            return (
              <div key={m.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="flex min-w-0 items-center gap-2">
                  <Paperclip className="h-4 w-4 shrink-0 text-slate-400" />
                  <div className="min-w-0">
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="truncate font-medium text-indigo-700 hover:underline"
                    >
                      {m.title}
                    </a>
                    <p className="text-xs text-slate-500">{materialTypeLabel(m.type)}</p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <a href={url} target="_blank" rel="noopener noreferrer" aria-label="Abrir" className="text-slate-400 hover:text-indigo-600">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                  {canManage && (
                    <button onClick={() => remove(m.id)} disabled={isPending} aria-label="Remover" className="text-slate-400 hover:text-rose-600">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </Card>
      ) : (
        <p className="text-sm text-slate-400">Nenhum material nesta aula.</p>
      )}

      {canManage && (
        <Card>
          <CardContent className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-700">Adicionar material</h3>
            {error && <Alert tone="error">{error}</Alert>}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="sm:col-span-2">
                <Label htmlFor="mat_title">Título</Label>
                <Input id="mat_title" value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="mat_type">Tipo</Label>
                <Select id="mat_type" value={type} onChange={(e) => setType(e.target.value as MaterialType)}>
                  {MATERIAL_TYPE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </Select>
              </div>
            </div>
            {type === "link" ? (
              <div>
                <Label htmlFor="mat_url">Link externo</Label>
                <Input
                  id="mat_url"
                  placeholder="https://…"
                  value={externalUrl}
                  onChange={(e) => setExternalUrl(e.target.value)}
                />
              </div>
            ) : (
              <div>
                <Label htmlFor="mat_file">Arquivo</Label>
                <input
                  id="mat_file"
                  type="file"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-indigo-50 file:px-3 file:py-1.5 file:text-indigo-700"
                />
              </div>
            )}
            <Button onClick={submit} isLoading={busy || isPending}>
              <Upload className="h-4 w-4" /> Adicionar
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
