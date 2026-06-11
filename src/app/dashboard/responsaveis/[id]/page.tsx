import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil, Users } from "lucide-react";
import { requirePermission } from "@/lib/auth/session";
import {
  getGuardianById,
  getGuardianStudents,
  listStudentsForLink,
} from "@/lib/guardians/queries";
import { formatCpf } from "@/lib/students/cpf";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataTable, type Column } from "@/components/ui/data-table";
import { StudentStatusBadge } from "@/components/students/student-status-badge";
import { LinkStudentForm } from "@/components/guardians/link-student-form";
import { UnlinkButton } from "@/components/guardians/unlink-button";
import { GuardianDeleteButton } from "@/components/guardians/guardian-delete-button";
import type { GuardianStudentRow } from "@/lib/guardians/queries";

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 py-2.5 last:border-0">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-right text-sm font-medium text-slate-900">{value ?? "—"}</span>
    </div>
  );
}

export default async function ResponsavelDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requirePermission("guardians.manage");

  const guardian = await getGuardianById(id);
  if (!guardian) notFound();

  const [students, studentOptions] = await Promise.all([
    getGuardianStudents(id),
    listStudentsForLink(),
  ]);

  const columns: Column<GuardianStudentRow>[] = [
    {
      header: "Aluno",
      cell: (r) =>
        r.student ? (
          <Link
            href={`/dashboard/alunos/${r.student.id}`}
            className="font-medium text-indigo-700 hover:underline"
          >
            {r.student.full_name}
          </Link>
        ) : (
          "—"
        ),
    },
    {
      header: "Situação",
      cell: (r) => (r.student ? <StudentStatusBadge status={r.student.status} /> : "—"),
    },
    {
      header: "Papéis",
      cell: (r) => (
        <div className="flex flex-wrap gap-1">
          {r.is_financial_responsible && (
            <Badge className="bg-emerald-100 text-emerald-800">Financeiro</Badge>
          )}
          {r.is_pedagogical_responsible && (
            <Badge className="bg-indigo-100 text-indigo-800">Pedagógico</Badge>
          )}
          {!r.is_financial_responsible && !r.is_pedagogical_responsible && (
            <span className="text-xs text-slate-400">—</span>
          )}
        </div>
      ),
    },
    {
      header: "",
      cell: (r) => <UnlinkButton id={r.id} guardianId={id} />,
    },
  ];

  return (
    <>
      <Link
        href="/dashboard/responsaveis"
        className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar para responsáveis
      </Link>

      <PageHeader
        title={guardian.full_name}
        description={guardian.kinship ?? undefined}
        action={
          <div className="flex items-center gap-2">
            <Link href={`/dashboard/responsaveis/${id}/editar`}>
              <Button variant="outline">
                <Pencil className="h-4 w-4" /> Editar
              </Button>
            </Link>
            <GuardianDeleteButton guardianId={id} />
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Dados</CardTitle>
          </CardHeader>
          <CardContent>
            <Row label="CPF" value={formatCpf(guardian.cpf)} />
            <Row label="RG" value={guardian.rg} />
            <Row label="Telefone" value={guardian.phone} />
            <Row label="E-mail" value={guardian.email} />
            <Row label="Endereço" value={guardian.address} />
            <Row
              label="Cidade/UF"
              value={[guardian.city, guardian.state].filter(Boolean).join("/") || "—"}
            />
            <Row label="Parentesco" value={guardian.kinship} />
            <Row
              label="Acesso ao painel"
              value={guardian.profile_id ? "Sim (conta vinculada)" : "Não"}
            />
          </CardContent>
        </Card>

        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Vincular aluno</CardTitle>
            </CardHeader>
            <CardContent>
              <LinkStudentForm guardianId={id} students={studentOptions} />
            </CardContent>
          </Card>

          <div>
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
              <Users className="h-4 w-4 text-slate-400" /> Alunos vinculados ({students.length})
            </h2>
            <DataTable
              columns={columns}
              data={students}
              getRowKey={(r) => r.id}
              emptyIcon={Users}
              emptyTitle="Nenhum aluno vinculado"
              emptyDescription="Use o formulário acima para vincular alunos a este responsável."
            />
          </div>
        </div>
      </div>
    </>
  );
}
