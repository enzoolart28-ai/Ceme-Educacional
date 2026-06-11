import { FolderOpen } from "lucide-react";
import { requireAuth } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import {
  listDocuments,
  listGeneratedDocuments,
  listStudentsBrief,
  getOwnStudentId,
  type DocumentRow,
} from "@/lib/documents/queries";
import { getDependents } from "@/lib/guardians/queries";
import { documentTypeLabel, generatedDocumentTypeLabel } from "@/lib/documents/labels";
import { formatDate } from "@/lib/utils";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { DocumentStatusBadge } from "@/components/documents/document-badges";
import { DocumentUpload } from "@/components/documents/document-upload";
import { DocumentFilters } from "@/components/documents/document-filters";
import { GenerateDocumentForm } from "@/components/documents/generate-document-form";
import {
  ViewFileButton,
  ReviewControls,
  DeleteDocumentButton,
} from "@/components/documents/document-actions";
import type { DocumentType, DocumentStatus } from "@/types/models";

function DocList({
  docs,
  canManage,
  showStudent,
}: {
  docs: DocumentRow[];
  canManage: boolean;
  showStudent: boolean;
}) {
  if (docs.length === 0) {
    return <EmptyState icon={FolderOpen} title="Nenhum documento" description="Nenhum documento encontrado." />;
  }
  return (
    <Card className="divide-y divide-slate-100">
      {docs.map((d) => (
        <div key={d.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <p className="font-medium text-slate-900">{d.title}</p>
            <p className="text-xs text-slate-500">
              {documentTypeLabel(d.type)}
              {showStudent ? ` · ${d.studentName}` : ""}
              {` · enviado em ${formatDate(d.created_at)}`}
            </p>
            {d.observation && <p className="mt-1 text-xs text-amber-700">Obs.: {d.observation}</p>}
          </div>
          <div className="flex items-center gap-3">
            <ViewFileButton id={d.id} hasFile={!!d.file_url} />
            <DocumentStatusBadge status={d.status} />
            {canManage && (d.status === "enviado" || d.status === "pendente") && (
              <ReviewControls id={d.id} />
            )}
            {canManage && <DeleteDocumentButton id={d.id} />}
          </div>
        </div>
      ))}
    </Card>
  );
}

async function GeneratedList({ studentId }: { studentId?: string }) {
  const generated = await listGeneratedDocuments(studentId);
  if (generated.length === 0) return null;
  return (
    <section className="mt-8">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Documentos gerados</h2>
      <Card className="divide-y divide-slate-100">
        {generated.map((g) => (
          <div key={g.id} className="flex items-center justify-between gap-3 px-4 py-3">
            <div className="min-w-0">
              <p className="font-medium text-slate-900">{g.title}</p>
              <p className="text-xs text-slate-500">
                {generatedDocumentTypeLabel(g.type)} · {g.studentName} · {formatDate(g.created_at)}
              </p>
            </div>
            <ViewFileButton id={g.id} kind="generated" />
          </div>
        ))}
      </Card>
    </section>
  );
}

export default async function DocumentosPage({
  searchParams,
}: {
  searchParams: Promise<{ student?: string; type?: string; status?: string }>;
}) {
  const profile = await requireAuth();
  const isManager = hasPermission(profile.role, "documents.manage");

  // ----------------------------------------------------------------- Aluno
  if (profile.role === "aluno") {
    const studentId = await getOwnStudentId(profile.id);
    const docs = await listDocuments();
    return (
      <>
        <PageHeader title="Meus Documentos" description="Envie e acompanhe a situação dos seus documentos." />
        {studentId ? (
          <div className="mb-6">
            <DocumentUpload students={[{ id: studentId, full_name: profile.full_name ?? "Eu" }]} />
          </div>
        ) : (
          <p className="mb-6 text-sm text-slate-500">Seu cadastro de aluno não foi localizado.</p>
        )}
        <DocList docs={docs} canManage={false} showStudent={false} />
        <GeneratedList />
      </>
    );
  }

  // ----------------------------------------------------------- Responsável
  if (profile.role === "responsavel") {
    const dependents = await getDependents(profile.id);
    const students = dependents
      .filter((d) => d.student)
      .map((d) => ({ id: d.student!.id, full_name: d.student!.full_name }));
    const docs = await listDocuments();
    return (
      <>
        <PageHeader title="Documentos" description="Envie e acompanhe os documentos dos alunos vinculados." />
        {students.length > 0 ? (
          <div className="mb-6">
            <DocumentUpload students={students} />
          </div>
        ) : (
          <p className="mb-6 text-sm text-slate-500">Nenhum aluno vinculado.</p>
        )}
        <DocList docs={docs} canManage={false} showStudent />
        <GeneratedList />
      </>
    );
  }

  // ------------------------------------------------------- Secretaria / staff
  const sp = await searchParams;
  const [students, docs] = await Promise.all([
    listStudentsBrief(),
    listDocuments({
      studentId: sp.student || undefined,
      type: (sp.type as DocumentType) || undefined,
      status: (sp.status as DocumentStatus) || undefined,
    }),
  ]);

  return (
    <>
      <PageHeader
        title="Documentos"
        description="Confira, aprove ou reprove documentos e gere declarações em PDF."
      />
      {isManager && (
        <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <GenerateDocumentForm students={students} />
          <DocumentUpload students={students} />
        </div>
      )}
      <DocumentFilters students={students} />
      <DocList docs={docs} canManage={isManager} showStudent />
      <GeneratedList studentId={sp.student || undefined} />
    </>
  );
}
