import type { UserRole } from "@/types/models";

export type ReportCategory = "academic" | "financial" | "pedagogical" | "commercial";

export interface ReportFilters {
  from?: string;
  to?: string;
  courseId?: string;
  classId?: string;
  unitId?: string;
  status?: string;
}

export interface ReportMetric {
  label: string;
  value: string;
  hint?: string;
}

export interface ReportTable {
  id: string;
  title: string;
  description: string;
  columns: string[];
  rows: string[][];
}

export interface ReportChartItem {
  label: string;
  value: number;
}

export interface ReportSection {
  id: string;
  title: string;
  description: string;
  category: ReportCategory;
  metrics: ReportMetric[];
  chart: ReportChartItem[];
  table: ReportTable;
}

export interface ReportOption {
  id: string;
  name: string;
}

export interface ReportOptions {
  courses: ReportOption[];
  classes: (ReportOption & {
    courseId: string | null;
    unitId: string | null;
  })[];
  units: ReportOption[];
}

export interface ReportsData {
  sections: ReportSection[];
  options: ReportOptions;
}

export function allowedReportCategories(role: UserRole): ReportCategory[] {
  switch (role) {
    case "admin":
    case "diretor":
      return ["academic", "financial", "pedagogical", "commercial"];
    case "coordenacao":
      return ["academic", "pedagogical"];
    case "financeiro":
      return ["financial"];
    case "secretaria":
      return ["academic"];
    case "professor":
      return ["academic", "pedagogical"];
    default:
      return [];
  }
}

