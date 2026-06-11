import { BookOpen, Library, LayoutGrid, ClipboardCheck } from "lucide-react";
import { requireRole, ACADEMIC_ROLES } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { getAcademicCounts } from "@/lib/academic/queries";
import { formatNumber } from "@/lib/utils";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { AcademicNav } from "@/components/academic/academic-nav";

export default async function AcademicoPage() {
  const profile = await requireRole(ACADEMIC_ROLES);
  const canCatalog = hasPermission(profile.role, "academic.read");
  const counts = await getAcademicCounts();

  return (
    <>
      <PageHeader
        title="Acadêmico"
        description="Cursos, disciplinas, turmas e matrículas."
      />
      <AcademicNav canCatalog={canCatalog} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Cursos ativos" value={formatNumber(counts.courses)} icon={BookOpen} tone="emerald" />
        <StatCard label="Disciplinas" value={formatNumber(counts.subjects)} icon={Library} tone="violet" />
        <StatCard label="Turmas ativas" value={formatNumber(counts.classes)} icon={LayoutGrid} tone="sky" />
        <StatCard label="Matrículas ativas" value={formatNumber(counts.enrollments)} icon={ClipboardCheck} tone="indigo" />
      </div>
    </>
  );
}
