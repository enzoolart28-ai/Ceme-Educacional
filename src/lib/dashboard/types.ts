// =============================================================================
// Tipos (view models) dos dashboards
// =============================================================================

export type AlertSeverity = "info" | "warning" | "success" | "danger";

export interface AlertItem {
  id: string;
  title: string;
  description: string;
  severity: AlertSeverity;
  /** Texto relativo já formatado (ex.: "há 2 horas"). */
  time: string;
}

/** Contagens REAIS derivadas da tabela profiles. */
export interface ProfileStats {
  activeStudents: number;
  teachers: number;
  coordinators: number;
  totalActiveUsers: number;
}

// --- Estruturas usadas pelos dados de exemplo (mock) ---------------------------

export interface ScheduleItem {
  time: string;
  title: string;
  subtitle: string;
}

export interface PendingActivity {
  title: string;
  subtitle: string;
  due: string;
}

export interface GradeItem {
  subject: string;
  grade: number;
}

export interface ClassAttendance {
  className: string;
  attendance: number; // fração 0–1
}

export interface LowAttendanceStudent {
  name: string;
  className: string;
  attendance: number; // fração 0–1
}

export interface TeacherPending {
  name: string;
  className: string;
}

export interface DueInstallment {
  student: string;
  amount: number;
  dueDate: string;
}
