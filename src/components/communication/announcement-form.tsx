"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Upload, Paperclip } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { announcementSchema, type AnnouncementInput } from "@/lib/communication/schemas";
import { createAnnouncementAction } from "@/app/actions/communication";
import { targetOptions, TARGETS_WITH_ID } from "@/lib/communication/labels";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Alert } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import type { AnnouncementTarget } from "@/types/models";

interface Option {
  id: string;
  name: string;
}

const textareaClass =
  "flex w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500";

export function AnnouncementForm({
  canSendGeneral,
  classes,
  courses,
  users,
}: {
  canSendGeneral: boolean;
  classes: Option[];
  courses: Option[];
  users: Option[];
}) {
  const [attachmentUrl, setAttachmentUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<AnnouncementInput>({
    resolver: zodResolver(announcementSchema),
    defaultValues: {
      title: "",
      message: "",
      target_type: canSendGeneral ? "all" : "class",
      target_id: "",
      attachment_url: "",
    },
  });

  const targetType = watch("target_type");
  const idOptions: Option[] =
    targetType === "class" ? classes : targetType === "course" ? courses : targetType === "user" ? users : [];

  async function upload(file: File) {
    setBusy(true);
    const supabase = createClient();
    const path = `announcements/${Date.now()}-${file.name.replace(/\s+/g, "_")}`;
    const { error } = await supabase.storage.from("communication-files").upload(path, file);
    if (!error) {
      setAttachmentUrl(supabase.storage.from("communication-files").getPublicUrl(path).data.publicUrl);
    }
    setBusy(false);
  }

  function onSubmit(values: AnnouncementInput) {
    setMsg(null);
    startTransition(async () => {
      const result = await createAnnouncementAction({ ...values, attachment_url: attachmentUrl });
      if (result?.error) setMsg(result.error);
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <Card>
        <CardContent className="space-y-4">
          {msg && <Alert tone="error">{msg}</Alert>}

          <div>
            <Label htmlFor="title">Título *</Label>
            <Input id="title" hasError={!!errors.title} {...register("title")} />
            {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title.message}</p>}
          </div>

          <div>
            <Label htmlFor="message">Mensagem *</Label>
            <textarea id="message" rows={5} className={textareaClass} {...register("message")} />
            {errors.message && <p className="mt-1 text-xs text-red-600">{errors.message.message}</p>}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="target_type">Destinatários *</Label>
              <Select id="target_type" {...register("target_type")}>
                {targetOptions(canSendGeneral).map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </Select>
            </div>
            {TARGETS_WITH_ID.includes(targetType as AnnouncementTarget) && (
              <div>
                <Label htmlFor="target_id">
                  {targetType === "class" ? "Turma" : targetType === "course" ? "Curso" : "Usuário"} *
                </Label>
                <Select id="target_id" hasError={!!errors.target_id} {...register("target_id")}>
                  <option value="">Selecione…</option>
                  {idOptions.map((o) => (
                    <option key={o.id} value={o.id}>{o.name}</option>
                  ))}
                </Select>
                {errors.target_id && <p className="mt-1 text-xs text-red-600">{errors.target_id.message}</p>}
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="att">Anexo (opcional)</Label>
            <input
              id="att"
              type="file"
              onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
              className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-indigo-50 file:px-3 file:py-1.5 file:text-indigo-700"
            />
            {busy && <p className="mt-1 text-xs text-slate-500"><Upload className="mr-1 inline h-3 w-3" />Enviando anexo…</p>}
            {attachmentUrl && (
              <p className="mt-1 inline-flex items-center gap-1 text-xs text-emerald-700">
                <Paperclip className="h-3 w-3" /> Anexo pronto
              </p>
            )}
          </div>

          <Button type="submit" isLoading={isPending || busy}>Enviar comunicado</Button>
        </CardContent>
      </Card>
    </form>
  );
}
