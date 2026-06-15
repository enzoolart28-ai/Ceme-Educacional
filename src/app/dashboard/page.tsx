import { requireAuth } from "@/lib/auth/session";
import { getProfileStats } from "@/lib/dashboard/queries";
import {
  getAcademicCounts,
  getStudentAcademic,
  getTeacherAcademic,
} from "@/lib/academic/queries";
import { getStudentFrequencyByProfile } from "@/lib/attendance/queries";
import { getStudentRecentGradesByProfile } from "@/lib/grades/queries";
import { getStudentProgressByProfile } from "@/lib/ava/queries";
import { listUpcomingEvents } from "@/lib/calendar/queries";
import { UpcomingEvents } from "@/components/calendar/upcoming-events";
import { DashboardAlerts } from "@/components/alerts/dashboard-alerts";
import { PageHeader } from "@/components/ui/page-header";
import { RoleBadge } from "@/components/ui/badge";
import { AdminDashboard } from "@/components/dashboard/admin-dashboard";
import { AlunoDashboard } from "@/components/dashboard/aluno-dashboard";
import { ProfessorDashboard } from "@/components/dashboard/professor-dashboard";
import { CoordenacaoDashboard } from "@/components/dashboard/coordenacao-dashboard";
import { FinanceiroDashboard } from "@/components/dashboard/financeiro-dashboard";
import { SecretariaDashboard } from "@/components/dashboard/secretaria-dashboard";
import { ResponsavelDashboard } from "@/components/dashboard/responsavel-dashboard";

export default async function DashboardPage() {
  const profile = await requireAuth();
  const firstName = profile.full_name?.split(" ")[0] || "Bem-vindo";
  const role = profile.role;

  async function renderDashboard() {
    switch (role) {
      case "admin":
      case "diretor": {
        const [stats, academic] = await Promise.all([
          getProfileStats(),
          getAcademicCounts(),
        ]);
        return <AdminDashboard stats={stats} academic={academic} />;
      }
      case "coordenacao": {
        const stats = await getProfileStats();
        return <CoordenacaoDashboard stats={stats} />;
      }
      case "secretaria": {
        const stats = await getProfileStats();
        return <SecretariaDashboard stats={stats} />;
      }
      case "financeiro":
        return <FinanceiroDashboard />;
      case "professor": {
        const academic = await getTeacherAcademic(profile.id);
        return <ProfessorDashboard academic={academic} />;
      }
      case "aluno": {
        const [academic, frequency, recentGrades, courseProgress] = await Promise.all([
          getStudentAcademic(profile.id),
          getStudentFrequencyByProfile(profile.id),
          getStudentRecentGradesByProfile(profile.id),
          getStudentProgressByProfile(profile.id),
        ]);
        return (
          <AlunoDashboard
            academic={academic}
            frequency={frequency}
            recentGrades={recentGrades}
            courseProgress={courseProgress}
          />
        );
      }
      case "responsavel":
        return <ResponsavelDashboard />;
      default:
        return null;
    }
  }

  const [dashboard, upcoming] = await Promise.all([
    renderDashboard(),
    listUpcomingEvents(5),
  ]);

  return (
    <>
      <PageHeader
        title={`Olá, ${firstName}!`}
        description="Bem-vindo ao Sistema CME Educacional."
        action={<RoleBadge role={role} />}
      />
      {dashboard}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <DashboardAlerts />
        <UpcomingEvents events={upcoming} />
      </div>
    </>
  );
}
