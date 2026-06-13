"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck, Check } from "lucide-react";
import {
  markNotificationReadAction,
  markAllNotificationsReadAction,
} from "@/app/actions/communication";
import { NOTIFICATION_TYPE_BADGE, notificationTypeLabel } from "@/lib/communication/labels";
import { formatDateTime } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import type { Notification, NotificationType } from "@/types/models";

export function NotificationsPanel({ notifications }: { notifications: Notification[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const hasUnread = notifications.some((n) => !n.read_at);

  function markOne(id: string) {
    startTransition(async () => {
      await markNotificationReadAction({ id });
      router.refresh();
    });
  }
  function markAll() {
    startTransition(async () => {
      await markAllNotificationsReadAction();
      router.refresh();
    });
  }

  if (notifications.length === 0) {
    return <EmptyState icon={Bell} title="Sem notificações" description="Você está em dia! 🎉" />;
  }

  return (
    <div className="space-y-3">
      {hasUnread && (
        <div className="flex justify-end">
          <Button variant="outline" onClick={markAll} isLoading={isPending}>
            <CheckCheck className="h-4 w-4" /> Marcar todas como lidas
          </Button>
        </div>
      )}
      <Card className="divide-y divide-slate-100">
        {notifications.map((n) => (
          <div
            key={n.id}
            className={`flex items-start justify-between gap-3 px-4 py-3 ${n.read_at ? "" : "bg-indigo-50/40"}`}
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Badge className={NOTIFICATION_TYPE_BADGE[n.type as NotificationType]}>
                  {notificationTypeLabel(n.type as NotificationType)}
                </Badge>
                <span className="font-medium text-slate-900">{n.title}</span>
                {!n.read_at && <span className="h-2 w-2 rounded-full bg-indigo-500" aria-label="não lida" />}
              </div>
              {n.message && <p className="mt-1 text-sm text-slate-600">{n.message}</p>}
              <p className="mt-1 text-xs text-slate-400">{formatDateTime(n.created_at)}</p>
            </div>
            {!n.read_at && (
              <button
                onClick={() => markOne(n.id)}
                disabled={isPending}
                className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-indigo-600 hover:underline disabled:opacity-50"
              >
                <Check className="h-3 w-3" /> Marcar lida
              </button>
            )}
          </div>
        ))}
      </Card>
    </div>
  );
}
