import Link from "next/link";
import { ArrowLeft, Plus, ClipboardList } from "lucide-react";
import { requirePermission } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { listGradebookClasses, getClassGradebook } from "@/lib/grades/queries";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import { ClassPicker } from "@/components/grades/class-picker";
import { GradebookGrid } from "@/components/grades/gradebook-grid";

export default async function DiarioNotasPage({
  searchParams,
}: {
  searchParams: Promise<{ turma?: string }>;
}) {
  const profile = await requirePermission("classes.read");
  const canManage = hasPermission(profile.role, "grades.manage");

  const sp = await searchParams;
  const classId = sp.turma ?? "";
  const classes = await listGradebookClasses();
  const gradebook = classId ? await getClassGradebook(classId) : null;

  return (
    <>
      <Link
        href="/dashboard/avaliacoes"
        className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar para Avaliações
      </Link>

      <PageHeader
        title="Diário de Notas"
        description="Escolha a turma e lance todas as notas dos alunos numa planilha só."
        action={
          canManage ? (
            <Link href="/dashboard/avaliacoes/nova">
              <Button variant="outline">
                <Plus className="h-4 w-4" /> Nova avaliação
              </Button>
            </Link>
          ) : undefined
        }
      />

      <Card className="mb-6">
        <CardContent className="space-y-2">
          <p className="text-sm font-medium text-slate-700">Turma</p>
          <ClassPicker classes={classes} value={classId} />
        </CardContent>
      </Card>

      {!classId ? (
        <Card>
          <CardContent>
            <EmptyState
              icon={ClipboardList}
              title="Selecione uma turma"
              description="Escolha a turma acima para ver os alunos e lançar as notas."
            />
          </CardContent>
        </Card>
      ) : !canManage ? (
        <Alert tone="warning">
          Você pode visualizar as notas, mas o lançamento é restrito a professores e coordenação.
        </Alert>
      ) : (
        <GradebookGrid
          assessments={gradebook!.assessments}
          students={gradebook!.students}
          initialGrades={gradebook!.grades}
        />
      )}
    </>
  );
}
