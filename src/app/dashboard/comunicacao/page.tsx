import Link from "next/link";
import { Plus, Megaphone } from "lucide-react";
import { requireAuth } from "@/lib/auth/session";
import { STAFF_ROLES } from "@/lib/auth/roles";
import { listAnnouncements } from "@/lib/communication/queries";
import { TARGET_BADGE, targetLabel } from "@/lib/communication/labels";
import { formatDateTime } from "@/lib/utils";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import type { AnnouncementTarget } from "@/types/models";

export default async function ComunicacaoPage() {
  const profile = await requireAuth();
  const canSend = STAFF_ROLES.includes(profile.role) || profile.role === "professor";
  const announcements = await listAnnouncements(profile.id);

  return (
    <>
      <PageHeader
        title="Comunicados"
        description="Avisos e comunicados da instituição."
        action={
          canSend ? (
            <Link href="/dashboard/comunicacao/novo">
              <Button><Plus className="h-4 w-4" /> Novo comunicado</Button>
            </Link>
          ) : undefined
        }
      />
      {announcements.length === 0 ? (
        <EmptyState icon={Megaphone} title="Nenhum comunicado" description="Não há comunicados para você no momento." />
      ) : (
        <Card className="divide-y divide-slate-100">
          {announcements.map((a) => (
            <Link
              key={a.id}
              href={`/dashboard/comunicacao/${a.id}`}
              className={`flex items-start gap-3 px-4 py-3 hover:bg-slate-50 ${a.read ? "" : "bg-indigo-50/40"}`}
            >
              {!a.read && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-indigo-500" aria-label="não lido" />}
              <div className={`min-w-0 flex-1 ${a.read ? "pl-5" : ""}`}>
                <p className="truncate font-medium text-slate-900">{a.title}</p>
                <p className="truncate text-sm text-slate-500">{a.message}</p>
                <p className="mt-1 text-xs text-slate-400">
                  {a.authorName} · {formatDateTime(a.created_at)}
                </p>
              </div>
              <Badge className={TARGET_BADGE[a.target_type as AnnouncementTarget]}>
                {targetLabel(a.target_type as AnnouncementTarget)}
              </Badge>
            </Link>
          ))}
        </Card>
      )}
    </>
  );
}
