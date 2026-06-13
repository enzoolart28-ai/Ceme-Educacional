import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Paperclip, Reply } from "lucide-react";
import { requireAuth } from "@/lib/auth/session";
import { getMessage } from "@/lib/communication/queries";
import { formatDateTime } from "@/lib/utils";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AutoMarkRead } from "@/components/communication/auto-mark-read";

export default async function MensagemDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await requireAuth();
  const m = await getMessage(id);
  if (!m) notFound();

  const isReceiver = m.receiver_id === profile.id;

  return (
    <>
      <AutoMarkRead kind="message" id={id} />
      <Link href="/dashboard/mensagens" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-4 w-4" /> Voltar para mensagens
      </Link>
      <PageHeader
        title={m.subject || "(sem assunto)"}
        action={
          isReceiver && m.sender_id ? (
            <Link href={`/dashboard/mensagens/novo?to=${m.sender_id}`}>
              <Button variant="outline"><Reply className="h-4 w-4" /> Responder</Button>
            </Link>
          ) : undefined
        }
      />
      <Card>
        <CardContent className="space-y-3">
          <p className="text-xs text-slate-400">
            De <span className="font-medium text-slate-600">{m.senderName}</span> para{" "}
            <span className="font-medium text-slate-600">{m.receiverName}</span> · {formatDateTime(m.created_at)}
          </p>
          <p className="whitespace-pre-wrap text-sm text-slate-700">{m.body || "—"}</p>
          {m.attachment_url && (
            <a
              href={m.attachment_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm font-medium text-indigo-700 hover:underline"
            >
              <Paperclip className="h-4 w-4" /> Abrir anexo
            </a>
          )}
        </CardContent>
      </Card>
    </>
  );
}
