import Link from "next/link";
import { Plus, Inbox, Send, Mail } from "lucide-react";
import { requireAuth } from "@/lib/auth/session";
import { listInbox, listSent } from "@/lib/communication/queries";
import { formatDateTime } from "@/lib/utils";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import type { MessageRow } from "@/lib/communication/queries";

function MessageList({ items, kind }: { items: MessageRow[]; kind: "inbox" | "sent" }) {
  if (items.length === 0) {
    return <p className="px-4 py-6 text-center text-sm text-slate-400">Nenhuma mensagem.</p>;
  }
  return (
    <Card className="divide-y divide-slate-100">
      {items.map((m) => {
        const unread = kind === "inbox" && !m.read_at;
        return (
          <Link
            key={m.id}
            href={`/dashboard/mensagens/${m.id}`}
            className={`flex items-start gap-3 px-4 py-3 hover:bg-slate-50 ${unread ? "bg-indigo-50/40" : ""}`}
          >
            {unread && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-indigo-500" aria-label="não lida" />}
            <div className={`min-w-0 flex-1 ${unread ? "" : "pl-5"}`}>
              <p className="truncate font-medium text-slate-900">{m.subject || "(sem assunto)"}</p>
              <p className="truncate text-sm text-slate-500">{m.body || "—"}</p>
              <p className="mt-1 text-xs text-slate-400">
                {kind === "inbox" ? "De" : "Para"}: {m.otherName} · {formatDateTime(m.created_at)}
              </p>
            </div>
          </Link>
        );
      })}
    </Card>
  );
}

export default async function MensagensPage() {
  const profile = await requireAuth();
  const [inbox, sent] = await Promise.all([listInbox(profile.id), listSent(profile.id)]);

  return (
    <>
      <PageHeader
        title="Mensagens"
        description="Conversas diretas com a equipe, professores e responsáveis."
        action={
          <Link href="/dashboard/mensagens/novo">
            <Button><Plus className="h-4 w-4" /> Nova mensagem</Button>
          </Link>
        }
      />
      {inbox.length === 0 && sent.length === 0 ? (
        <EmptyState icon={Mail} title="Sem mensagens" description="Comece enviando uma nova mensagem." />
      ) : (
        <div className="space-y-6">
          <section>
            <h2 className="mb-2 flex items-center gap-1 text-sm font-semibold uppercase tracking-wide text-slate-500">
              <Inbox className="h-4 w-4" /> Recebidas
            </h2>
            <MessageList items={inbox} kind="inbox" />
          </section>
          <section>
            <h2 className="mb-2 flex items-center gap-1 text-sm font-semibold uppercase tracking-wide text-slate-500">
              <Send className="h-4 w-4" /> Enviadas
            </h2>
            <MessageList items={sent} kind="sent" />
          </section>
        </div>
      )}
    </>
  );
}
