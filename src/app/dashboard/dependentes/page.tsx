import { UsersRound } from "lucide-react";
import { requireRole } from "@/lib/auth/session";
import { getDependents } from "@/lib/guardians/queries";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { StudentStatusBadge } from "@/components/students/student-status-badge";

export default async function DependentesPage() {
  const profile = await requireRole(["responsavel"]);
  const dependents = await getDependents(profile.id);

  return (
    <>
      <PageHeader
        title="Meus dependentes"
        description="Alunos vinculados a você."
      />

      {dependents.length === 0 ? (
        <Card className="p-6">
          <EmptyState
            icon={UsersRound}
            title="Nenhum dependente vinculado"
            description="Quando a secretaria vincular um aluno a você, ele aparecerá aqui."
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {dependents.map((d) => (
            <Card key={d.id} className="p-5">
              <div className="flex items-start justify-between">
                <p className="font-semibold text-slate-900">
                  {d.student?.full_name ?? "—"}
                </p>
                {d.student && <StudentStatusBadge status={d.student.status} />}
              </div>
              <div className="mt-3 flex flex-wrap gap-1">
                {d.is_financial_responsible && (
                  <Badge className="bg-emerald-100 text-emerald-800">Financeiro</Badge>
                )}
                {d.is_pedagogical_responsible && (
                  <Badge className="bg-indigo-100 text-indigo-800">Pedagógico</Badge>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
