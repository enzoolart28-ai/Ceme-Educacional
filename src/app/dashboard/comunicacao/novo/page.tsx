import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireAuth } from "@/lib/auth/session";
import { STAFF_ROLES } from "@/lib/auth/roles";
import { listClasses } from "@/lib/classes/queries";
import { listCourses } from "@/lib/academic/queries";
import { listMessageRecipients } from "@/lib/communication/queries";
import { PageHeader } from "@/components/ui/page-header";
import { AnnouncementForm } from "@/components/communication/announcement-form";

export default async function NovoComunicadoPage() {
  const profile = await requireAuth();
  const canSendGeneral = STAFF_ROLES.includes(profile.role);
  const canSend = canSendGeneral || profile.role === "professor";
  if (!canSend) notFound();

  const [classes, courses, users] = await Promise.all([
    listClasses(),
    listCourses(),
    canSendGeneral ? listMessageRecipients() : Promise.resolve([]),
  ]);

  return (
    <>
      <Link href="/dashboard/comunicacao" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-4 w-4" /> Voltar para comunicados
      </Link>
      <PageHeader title="Novo comunicado" description="Escreva e selecione quem deve receber." />
      <AnnouncementForm
        canSendGeneral={canSendGeneral}
        classes={classes.map((c) => ({ id: c.id, name: c.name }))}
        courses={courses.map((c) => ({ id: c.id, name: c.name }))}
        users={users.map((u) => ({ id: u.id, name: u.full_name }))}
      />
    </>
  );
}
