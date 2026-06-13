import { requireAuth } from "@/lib/auth/session";
import { listNotifications } from "@/lib/communication/queries";
import { PageHeader } from "@/components/ui/page-header";
import { NotificationsPanel } from "@/components/communication/notifications-panel";

export default async function NotificacoesPage() {
  const profile = await requireAuth();
  const notifications = await listNotifications(profile.id);

  return (
    <>
      <PageHeader title="Notificações" description="Suas notificações do sistema." />
      <NotificationsPanel notifications={notifications} />
    </>
  );
}
