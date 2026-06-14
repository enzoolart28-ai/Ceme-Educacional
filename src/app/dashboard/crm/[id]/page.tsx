import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil, Phone, Mail, MapPin, Clock } from "lucide-react";
import { requireAuth } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { getLead, getLeadInteractions } from "@/lib/crm/queries";
import { listClasses } from "@/lib/classes/queries";
import { SOURCE_LABELS, interactionTypeLabel } from "@/lib/crm/labels";
import { formatDateTime } from "@/lib/utils";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import {
  LeadStatusSelect,
  InteractionForm,
  ConvertLead,
  LeadDeleteButton,
} from "@/components/crm/lead-actions";
import type { LeadSource, LeadStatus, LeadInteractionType } from "@/types/models";

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await requireAuth();
  if (!hasPermission(profile.role, "leads.manage")) notFound();

  const lead = await getLead(id);
  if (!lead) notFound();
  const [interactions, classes] = await Promise.all([getLeadInteractions(id), listClasses()]);

  return (
    <>
      <Link href="/dashboard/crm" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-4 w-4" /> Voltar para o CRM
      </Link>
      <PageHeader
        title={lead.full_name}
        description={`Origem: ${SOURCE_LABELS[lead.source as LeadSource]}`}
        action={
          <div className="flex items-center gap-2">
            <LeadStatusSelect id={lead.id} status={lead.status as LeadStatus} />
            <Link href={`/dashboard/crm/${id}/editar`}><Button variant="outline"><Pencil className="h-4 w-4" /> Editar</Button></Link>
            {profile.role === "admin" && <LeadDeleteButton id={id} />}
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardContent className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
              {lead.phone && <Info icon={<Phone className="h-4 w-4" />} label="Telefone" value={lead.phone} />}
              {lead.email && <Info icon={<Mail className="h-4 w-4" />} label="E-mail" value={lead.email} />}
              {lead.city && <Info icon={<MapPin className="h-4 w-4" />} label="Cidade" value={lead.city} />}
              {lead.age != null && <Info label="Idade" value={String(lead.age)} />}
              {lead.guardian_name && <Info label="Responsável" value={lead.guardian_name} />}
              {lead.course_interest && <Info label="Curso de interesse" value={lead.course_interest} />}
            </CardContent>
          </Card>

          {lead.notes && (
            <Card><CardContent><p className="whitespace-pre-wrap text-sm text-slate-700">{lead.notes}</p></CardContent></Card>
          )}

          <InteractionForm leadId={id} />

          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Histórico de atendimento</h2>
            {interactions.length === 0 ? (
              <EmptyState icon={Clock} title="Sem registros" description="Registre o primeiro atendimento acima." />
            ) : (
              <Card className="divide-y divide-slate-100">
                {interactions.map((it) => (
                  <div key={it.id} className="px-4 py-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-800">
                        {interactionTypeLabel(it.interaction_type as LeadInteractionType)}
                      </span>
                      <span className="text-xs text-slate-400">{formatDateTime(it.created_at)}</span>
                    </div>
                    {it.description && <p className="mt-1 text-sm text-slate-600">{it.description}</p>}
                    <p className="mt-1 text-xs text-slate-400">
                      por {it.userName}
                      {it.next_contact_at ? ` · retorno: ${formatDateTime(it.next_contact_at)}` : ""}
                    </p>
                  </div>
                ))}
              </Card>
            )}
          </section>
        </div>

        <div>
          <ConvertLead
            leadId={id}
            classes={classes.map((c) => ({ id: c.id, name: c.name }))}
            convertedStudentId={lead.converted_student_id}
          />
        </div>
      </div>
    </>
  );
}

function Info({ icon, label, value }: { icon?: React.ReactNode; label: string; value: string }) {
  return (
    <div>
      <p className="flex items-center gap-1 text-xs uppercase tracking-wide text-slate-400">{icon}{label}</p>
      <p className="font-medium text-slate-800">{value}</p>
    </div>
  );
}
