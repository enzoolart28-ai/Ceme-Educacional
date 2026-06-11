import Link from "next/link";
import { Search, X } from "lucide-react";
import { INVOICE_STATUS_OPTIONS, type InvoiceStatus } from "@/lib/finance/labels";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

export function InvoiceFilters({
  filters,
  students,
  courses,
  classes,
  units,
}: {
  filters: {
    studentId?: string;
    courseId?: string;
    classId?: string;
    unitId?: string;
    status?: InvoiceStatus;
    dueFrom?: string;
    dueTo?: string;
  };
  students: { id: string; full_name: string }[];
  courses: { id: string; name: string }[];
  classes: { id: string; name: string }[];
  units: { id: string; name: string }[];
}) {
  return (
    <Card className="mb-5 p-4">
      <form className="grid grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-7">
        <div>
          <Label htmlFor="studentId">Aluno</Label>
          <Select id="studentId" name="studentId" defaultValue={filters.studentId ?? ""}>
            <option value="">Todos</option>
            {students.map((student) => (
              <option key={student.id} value={student.id}>
                {student.full_name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="courseId">Curso</Label>
          <Select id="courseId" name="courseId" defaultValue={filters.courseId ?? ""}>
            <option value="">Todos</option>
            {courses.map((course) => (
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
            {classes.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="unitId">Unidade</Label>
          <Select id="unitId" name="unitId" defaultValue={filters.unitId ?? ""}>
            <option value="">Todas</option>
            {units.map((unit) => (
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
            {INVOICE_STATUS_OPTIONS.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="dueFrom">Venc. inicial</Label>
          <Input id="dueFrom" name="dueFrom" type="date" defaultValue={filters.dueFrom ?? ""} />
        </div>
        <div>
          <Label htmlFor="dueTo">Venc. final</Label>
          <Input id="dueTo" name="dueTo" type="date" defaultValue={filters.dueTo ?? ""} />
        </div>
        <div className="flex gap-2 md:col-span-3 xl:col-span-7">
          <Button type="submit" variant="secondary">
            <Search className="h-4 w-4" /> Filtrar
          </Button>
          <Link
            href="/dashboard/financeiro/cobrancas"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <X className="h-4 w-4" /> Limpar
          </Link>
        </div>
      </form>
    </Card>
  );
}

