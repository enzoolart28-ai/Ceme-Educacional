import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Pencil,
  User,
  GraduationCap,
  Users,
  CalendarCheck,
  Wallet,
  FileText,
  Award,
  StickyNote,
  History,
} from "lucide-react";
import { requirePermission } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { getStudentById, getStudentGuardians, getSiblings } from "@/lib/students/queries";
import { getStudentAcademic } from "@/lib/academic/queries";
import { getStudentFrequency } from "@/lib/attendance/queries";
import { getStudentBoletim } from "@/lib/grades/queries";
import { BoletimView } from "@/components/grades/boletim-view";
import { formatCpf } from "@/lib/students/cpf";
import { calcAge, formatDate, formatDateTime, formatPercent } from "@/lib/utils";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import { Tabs, type TabItem } from "@/components/ui/tabs";
import { StudentStatusBadge } from "@/components/students/student-status-badge";
import { StudentActions } from "@/components/students/student-actions";

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 py-2.5 last:border-0">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-right text-sm font-medium text-slate-900">{value ?? "—"}</span>
    </div>
  );
}

function Placeholder({ icon, title }: { icon: typeof User; title: string }) {
  return (
    <Card className="p-6">
      <EmptyState
        icon={icon}
        title={title}
        description="Será integrado quando o módulo correspondente for implementado."
      />
    </Card>
  );
}

export default async function AlunoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await requirePermission("students.read");
  const student = await getStudentById(id);
  if (!student) notFound();

  const canManage = hasPermission(profile.role, "students.manage");
  const isAdmin = profile.role === "admin";
  const age = calcAge(student.birth_date);

  const academic = student.profile_id
    ? await getStudentAcademic(student.profile_id)
    : null;
  const guardians = await getStudentGuardians(student.id);
  const siblings = await getSiblings(student.id);
  const frequency = await getStudentFrequency(student.id);
  const boletim = await getStudentBoletim(student.id);

  const tabs: TabItem[] = [
    {
      key: "dados",
      label: "Dados pessoais",
      content: (
        <Card>
          <CardContent>
            <Row label="Nome completo" value={student.full_name} />
            <Row label="CPF" value={formatCpf(student.cpf)} />
            <Row label="RG" value={student.rg} />
            <Row
              label="Nascimento"
              value={
                student.birth_date
                  ? `${formatDate(student.birth_date)}${age !== null ? ` (${age} anos)` : ""}`
                  : "—"
              }
            />
            <Row label="Telefone" value={student.phone} />
            <Row label="E-mail" value={student.email} />
            <Row label="Endereço" value={student.address} />
            <Row
              label="Cidade/UF"
              value={[student.city, student.state].filter(Boolean).join("/") || "—"}
            />
            <Row label="Nome da mãe" value={student.mother_name} />
            <Row label="Nome do pai" value={student.father_name} />
            <Row label="Status" value={<StudentStatusBadge status={student.status} />} />
          </CardContent>
        </Card>
      ),
    },
    {
      key: "matricula",
      label: "Matrícula",
      content: academic ? (
        <Card>
          <CardContent>
            <Row label="Curso atual" value={academic.courseName} />
            <Row label="Turma atual" value={academic.className} />
          </CardContent>
        </Card>
      ) : (
        <Card className="p-6">
          <EmptyState
            icon={GraduationCap}
            title="Sem matrícula vinculada"
            description="As matrículas são gerenciadas no módulo Acadêmico (turmas). Vincule uma conta de login ao aluno para exibir a matrícula."
          />
        </Card>
      ),
    },
    {
      key: "responsaveis",
      label: "Responsáveis",
      content:
        guardians.length > 0 ? (
          <Card>
            <CardContent className="divide-y divide-slate-100 p-0">
              {guardians.map((g) => (
                <div key={g.id} className="flex items-start justify-between gap-3 px-5 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900">
                      {g.guardian?.full_name || "—"}
                      {g.guardian?.kinship ? (
                        <span className="ml-2 text-xs font-normal text-slate-500">
                          ({g.guardian.kinship})
                        </span>
                      ) : null}
                    </p>
                    <p className="text-xs text-slate-500">
                      {g.guardian?.email ?? "—"}
                      {g.guardian?.phone ? ` · ${g.guardian.phone}` : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-1">
                    {g.is_financial_responsible && (
                      <Badge className="bg-emerald-100 text-emerald-800">Financeiro</Badge>
                    )}
                    {g.is_pedagogical_responsible && (
                      <Badge className="bg-indigo-100 text-indigo-800">Pedagógico</Badge>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ) : (
          <Card className="p-6">
            <EmptyState
              icon={Users}
              title="Nenhum responsável vinculado"
              description="Vincule um responsável (conta de login) ao aluno."
            />
          </Card>
        ),
    },
    {
      key: "irmaos",
      label: "Irmãos",
      content:
        siblings.length > 0 ? (
          <Card>
            <CardContent className="divide-y divide-slate-100 p-0">
              {siblings.map((s) => (
                <Link
                  key={s.id}
                  href={`/dashboard/alunos/${s.id}`}
                  className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-slate-50"
                >
                  <span className="text-sm font-medium text-slate-900">{s.full_name}</span>
                  <StudentStatusBadge status={s.status} />
                </Link>
              ))}
            </CardContent>
          </Card>
        ) : (
          <Card className="p-6">
            <EmptyState
              icon={Users}
              title="Nenhum irmão vinculado"
              description="Irmãos aparecem aqui quando compartilham um responsável. No cadastro de um novo aluno, use a opção “Irmão(ã) já cadastrado”."
            />
          </Card>
        ),
    },
    {
      key: "frequencia",
      label: "Frequência",
      content:
        frequency.total === 0 ? (
          <Placeholder icon={CalendarCheck} title="Frequência" />
        ) : (
          <Card>
            <CardContent>
              <Row label="Frequência geral" value={frequency.percent != null ? formatPercent(frequency.percent) : "—"} />
              <Row label="Aulas registradas" value={frequency.total} />
              <Row label="Presenças" value={frequency.attended} />
              <Row label="Faltas" value={frequency.absent + frequency.justified} />
              <Row label="Atrasos" value={frequency.late} />
              <Row
                label="Alertas"
                value={
                  <span className="flex flex-wrap justify-end gap-1">
                    {frequency.lowFrequency && (
                      <Badge className="bg-rose-100 text-rose-800">&lt; 75%</Badge>
                    )}
                    {frequency.hasConsecutiveAbsenceAlert && (
                      <Badge className="bg-amber-100 text-amber-800">
                        {frequency.maxConsecutiveAbsences} faltas seguidas
                      </Badge>
                    )}
                    {!frequency.lowFrequency && !frequency.hasConsecutiveAbsenceAlert && (
                      <span className="text-slate-400">—</span>
                    )}
                  </span>
                }
              />
            </CardContent>
          </Card>
        ),
    },
    { key: "notas", label: "Notas", content: <BoletimView subjects={boletim} /> },
    { key: "financeiro", label: "Financeiro", content: <Placeholder icon={Wallet} title="Financeiro" /> },
    { key: "documentos", label: "Documentos", content: <Placeholder icon={FileText} title="Documentos" /> },
    { key: "certificados", label: "Certificados", content: <Placeholder icon={Award} title="Certificados" /> },
    {
      key: "observacoes",
      label: "Observações",
      content: (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <StickyNote className="h-4 w-4 text-slate-400" /> Observações
            </CardTitle>
          </CardHeader>
          <CardContent>
            {student.notes ? (
              <p className="whitespace-pre-wrap text-sm text-slate-700">{student.notes}</p>
            ) : (
              <p className="text-sm text-slate-400">Nenhuma observação registrada.</p>
            )}
          </CardContent>
        </Card>
      ),
    },
    {
      key: "historico",
      label: "Histórico",
      content: (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-4 w-4 text-slate-400" /> Histórico
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Row label="Cadastrado em" value={formatDateTime(student.created_at)} />
            <Row label="Última atualização" value={formatDateTime(student.updated_at)} />
            {student.deleted_at && (
              <Row label="Arquivado em" value={formatDateTime(student.deleted_at)} />
            )}
          </CardContent>
        </Card>
      ),
    },
  ];

  return (
    <>
      <Link
        href="/dashboard/alunos"
        className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar para alunos
      </Link>

      <PageHeader
        title={student.full_name}
        description={formatCpf(student.cpf)}
        action={
          <div className="flex items-center gap-3">
            <StudentStatusBadge status={student.status} />
            {canManage && (
              <Link href={`/dashboard/alunos/${id}/editar`}>
                <Button variant="outline">
                  <Pencil className="h-4 w-4" /> Editar
                </Button>
              </Link>
            )}
          </div>
        }
      />

      {student.deleted_at && (
        <Alert tone="warning" className="mb-4">
          Este aluno está <strong>arquivado</strong> (soft-delete). Use “Restaurar” para reativá-lo.
        </Alert>
      )}

      {canManage && (
        <div className="mb-6">
          <StudentActions
            studentId={id}
            status={student.status}
            isArchived={!!student.deleted_at}
            canManage={canManage}
            isAdmin={isAdmin}
          />
        </div>
      )}

      <Tabs items={tabs} />
    </>
  );
}
