import { Filter } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type { ReportFilters, ReportOptions } from "@/lib/reports/types";

const STATUS_OPTIONS = [
  { value: "active", label: "Ativo" },
  { value: "inactive", label: "Inativo" },
  { value: "dropout", label: "Evadido" },
  { value: "completed", label: "Concluido" },
  { value: "open", label: "Em aberto" },
  { value: "overdue", label: "Vencido" },
  { value: "paid", label: "Pago" },
  { value: "partial", label: "Parcial" },
  { value: "matriculado", label: "Lead matriculado" },
  { value: "novo", label: "Lead novo" },
  { value: "published", label: "Publicado" },
  { value: "draft", label: "Rascunho" },
];

export function ReportFiltersForm({
  filters,
  options,
}: {
  filters: ReportFilters;
  options: ReportOptions;
}) {
  return (
    <Card className="mb-6 p-4">
      <form className="grid gap-4 md:grid-cols-6">
        <div>
          <Label htmlFor="from">Inicio</Label>
          <Input id="from" name="from" type="date" defaultValue={filters.from} />
        </div>
        <div>
          <Label htmlFor="to">Fim</Label>
          <Input id="to" name="to" type="date" defaultValue={filters.to} />
        </div>
        <div>
          <Label htmlFor="courseId">Curso</Label>
          <Select id="courseId" name="courseId" defaultValue={filters.courseId ?? ""}>
            <option value="">Todos</option>
            {options.courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="classId">Turma</Label>
          <Select id="classId" name="classId" defaultValue={filters.classId ?? ""}>
            <option value="">Todas</option>
            {options.classes.map((classRow) => (
              <option key={classRow.id} value={classRow.id}>
                {classRow.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="unitId">Unidade</Label>
          <Select id="unitId" name="unitId" defaultValue={filters.unitId ?? ""}>
            <option value="">Todas</option>
            {options.units.map((unit) => (
              <option key={unit.id} value={unit.id}>
                {unit.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="status">Status</Label>
          <Select id="status" name="status" defaultValue={filters.status ?? ""}>
            <option value="">Todos</option>
            {STATUS_OPTIONS.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex items-end gap-2 md:col-span-6">
          <Button type="submit">
            <Filter className="h-4 w-4" />
            Filtrar
          </Button>
          <Link href="/dashboard/relatorios">
            <Button type="button" variant="secondary">
              Limpar
            </Button>
          </Link>
        </div>
      </form>
    </Card>
  );
}
