import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAuth } from "@/lib/auth/session";
import { listMessageRecipients } from "@/lib/communication/queries";
import { PageHeader } from "@/components/ui/page-header";
import { MessageForm } from "@/components/communication/message-form";

export default async function NovaMensagemPage({
  searchParams,
}: {
  searchParams: Promise<{ to?: string }>;
}) {
  await requireAuth();
  const { to } = await searchParams;
  const recipients = await listMessageRecipients();

  return (
    <>
      <Link href="/dashboard/mensagens" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-4 w-4" /> Voltar para mensagens
      </Link>
      <PageHeader title="Nova mensagem" description="Escolha o destinatário e escreva sua mensagem." />
      <MessageForm recipients={recipients} defaultReceiver={to} />
    </>
  );
}
