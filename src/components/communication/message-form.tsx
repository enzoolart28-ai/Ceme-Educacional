"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Upload, Paperclip } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { messageSchema, type MessageInput } from "@/lib/communication/schemas";
import { sendMessageAction } from "@/app/actions/communication";
import { ROLE_LABELS } from "@/lib/auth/roles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Alert } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import type { UserRole } from "@/types/models";

const textareaClass =
  "flex w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500";

export function MessageForm({
  recipients,
  defaultReceiver,
}: {
  recipients: { id: string; full_name: string; role: UserRole }[];
  defaultReceiver?: string;
}) {
  const [attachmentUrl, setAttachmentUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MessageInput>({
    resolver: zodResolver(messageSchema),
    defaultValues: { receiver_id: defaultReceiver ?? "", subject: "", body: "", attachment_url: "" },
  });

  async function upload(file: File) {
    setBusy(true);
    const supabase = createClient();
    const path = `messages/${Date.now()}-${file.name.replace(/\s+/g, "_")}`;
    const { error } = await supabase.storage.from("communication-files").upload(path, file);
    if (!error) {
      setAttachmentUrl(supabase.storage.from("communication-files").getPublicUrl(path).data.publicUrl);
    }
    setBusy(false);
  }

  function onSubmit(values: MessageInput) {
    setMsg(null);
    startTransition(async () => {
      const result = await sendMessageAction({ ...values, attachment_url: attachmentUrl });
      if (result?.error) setMsg(result.error);
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <Card>
        <CardContent className="space-y-4">
          {msg && <Alert tone="error">{msg}</Alert>}

          <div>
            <Label htmlFor="receiver_id">Para *</Label>
            <Select id="receiver_id" hasError={!!errors.receiver_id} {...register("receiver_id")}>
              <option value="">Selecione…</option>
              {recipients.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.full_name} · {ROLE_LABELS[r.role] ?? r.role}
                </option>
              ))}
            </Select>
            {errors.receiver_id && <p className="mt-1 text-xs text-red-600">{errors.receiver_id.message}</p>}
          </div>

          <div>
            <Label htmlFor="subject">Assunto</Label>
            <Input id="subject" {...register("subject")} />
          </div>

          <div>
            <Label htmlFor="body">Mensagem</Label>
            <textarea id="body" rows={5} className={textareaClass} {...register("body")} />
            {errors.body && <p className="mt-1 text-xs text-red-600">{errors.body.message}</p>}
          </div>

          <div>
            <Label htmlFor="matt">Anexo (opcional)</Label>
            <input
              id="matt"
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

          <Button type="submit" isLoading={isPending || busy}>Enviar mensagem</Button>
        </CardContent>
      </Card>
    </form>
  );
}
