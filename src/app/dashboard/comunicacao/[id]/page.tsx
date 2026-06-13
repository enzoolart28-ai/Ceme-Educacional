import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Paperclip, Eye } from "lucide-react";
import { requireAuth } from "@/lib/auth/session";
import { STAFF_ROLES } from "@/lib/auth/roles";
import { getAnnouncement, getAnnouncementReads } from "@/lib/communication/queries";
import { TARGET_BADGE, targetLabel } from "@/lib/communication/labels";
import { formatDateTime } from "@/lib/utils";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AutoMarkRead } from "@/components/communication/auto-mark-read";
import { AnnouncementDeleteButton } from "@/components/communication/delete-buttons";
import type { AnnouncementTarget } from "@/types/models";

export default async function ComunicadoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await requireAuth();
  const a = await getAnnouncement(id);
  if (!a) notFound();

  const isOwnerOrStaff = a.author_id === profile.id || STAFF_ROLES.includes(profile.role);
  const reads = isOwnerOrStaff ? await getAnnouncementReads(id) : [];

  return (
    <>
      <AutoMarkRead kind="announcement" id={id} />
      <Link href="/dashboard/comunicacao" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-4 w-4" /> Voltar para comunicados
      </Link>
      <PageHeader
        title={a.title}
        action={
          <div className="flex items-center gap-2">
            <Badge className={TARGET_BADGE[a.target_type as AnnouncementTarget]}>
              {targetLabel(a.target_type as AnnouncementTarget)}
            </Badge>
            {isOwnerOrStaff && <AnnouncementDeleteButton id={id} />}
          </div>
        }
      />

      <Card className="mb-6">
        <CardContent className="space-y-3">
          <p className="text-xs text-slate-400">
            Por {a.authorName} · {formatDateTime(a.created_at)}
          </p>
          <p className="whitespace-pre-wrap text-sm text-slate-700">{a.message}</p>
          {a.attachment_url && (
            <a
              href={a.attachment_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm font-medium text-indigo-700 hover:underline"
            >
              <Paperclip className="h-4 w-4" /> Abrir anexo
            </a>
          )}
        </CardContent>
      </Card>

      {isOwnerOrStaff && (
        <section>
          <h2 className="mb-3 flex items-center gap-1 text-sm font-semibold uppercase tracking-wide text-slate-500">
            <Eye className="h-4 w-4" /> Confirmações de leitura ({reads.length})
          </h2>
          {reads.length === 0 ? (
            <p className="text-sm text-slate-400">Ninguém leu ainda.</p>
          ) : (
            <Card className="divide-y divide-slate-100">
              {reads.map((r, i) => (
                <div key={i} className="flex items-center justify-between px-4 py-2 text-sm">
                  <span className="text-slate-700">{r.userName}</span>
                  <span className="text-xs text-slate-400">{formatDateTime(r.read_at)}</span>
                </div>
              ))}
            </Card>
          )}
        </section>
      )}
    </>
  );
}
