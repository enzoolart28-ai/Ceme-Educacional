import { Target } from "lucide-react";
import { GESTOR_ROLES, requireRole } from "@/lib/auth/session";
import { listDepartmentGoals, listDepartments } from "@/lib/management/queries";
import { GOAL_STATUS_LABELS, GOAL_STATUS_OPTIONS } from "@/lib/management/labels";
import { createDepartmentGoalAction } from "@/app/actions/management";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

type GoalRow = Awaited<ReturnType<typeof listDepartmentGoals>>[number];

export default async function MetasPage() {
  await requireRole(GESTOR_ROLES);
  const [departments, goals] = await Promise.all([listDepartments(), listDepartmentGoals()]);
  const columns: Column<GoalRow>[] = [
    { header: "Meta", cell: (row) => row.title },
    { header: "Setor", cell: (row) => row.departmentName },
    { header: "Progresso", cell: (row) => `${row.progress}%` },
    { header: "Prazo", cell: (row) => row.endDate ?? "-" },
    { header: "Status", cell: (row) => GOAL_STATUS_LABELS[row.status as keyof typeof GOAL_STATUS_LABELS] ?? row.status },
  ];

  return (
    <>
      <PageHeader title="Metas" description="Definicao e acompanhamento de metas por setor." />
      <div className="mb-6 grid gap-6 lg:grid-cols-[24rem_1fr]">
        <Card>
          <CardHeader><CardTitle>Nova meta</CardTitle></CardHeader>
          <CardContent>
            <form action={createDepartmentGoalAction} className="space-y-3">
              <div>
                <Label htmlFor="departmentId">Setor</Label>
                <Select id="departmentId" name="departmentId" required>
                  <option value="">Selecione</option>
                  {departments.map((department) => (
                    <option key={department.id} value={department.id}>{department.name}</option>
                  ))}
                </Select>
              </div>
              <div>
                <Label htmlFor="title">Titulo</Label>
                <Input id="title" name="title" required />
              </div>
              <div>
                <Label htmlFor="targetValue">Valor planejado</Label>
                <Input id="targetValue" name="targetValue" type="number" step="0.01" />
              </div>
              <div>
                <Label htmlFor="progressPercentage">Conclusao %</Label>
                <Input id="progressPercentage" name="progressPercentage" type="number" min="0" max="100" defaultValue="0" />
              </div>
              <div>
                <Label htmlFor="endDate">Data final</Label>
                <Input id="endDate" name="endDate" type="date" />
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select id="status" name="status" defaultValue="not_started">
                  {GOAL_STATUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </Select>
              </div>
              <div>
                <Label htmlFor="managerNotes">Observacao</Label>
                <Input id="managerNotes" name="managerNotes" />
              </div>
              <Button type="submit">Criar meta</Button>
            </form>
          </CardContent>
        </Card>
        <DataTable
          columns={columns}
          data={goals}
          getRowKey={(row) => row.id}
          emptyIcon={Target}
          emptyTitle="Sem metas"
          emptyDescription="Crie metas para acompanhar os setores."
        />
      </div>
    </>
  );
}

