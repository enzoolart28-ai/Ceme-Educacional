import { LayoutGrid, Users } from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import type { TeacherAcademic } from "@/lib/academic/queries";

export function ProfessorDashboard({ academic }: { academic: TeacherAcademic }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard label="Minhas turmas" value={academic.classCount} icon={LayoutGrid} tone="indigo" hint="Dados reais (acadêmico)" />
      <StatCard label="Meus alunos" value={academic.studentCount} icon={Users} tone="sky" hint="Dados reais (acadêmico)" />
    </div>
  );
}
