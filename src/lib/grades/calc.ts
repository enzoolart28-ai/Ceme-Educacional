// =============================================================================
// Cálculo de médias e situação acadêmica (puro)
// =============================================================================
import type { SituationStatus } from "@/lib/grades/labels";

export const DEFAULT_MINIMUM_GRADE = 6;
/** Abaixo da média, mas acima deste limite, fica em recuperação (senão, reprovado). */
export const RECOVERY_MARGIN = 2;

export interface GradeItem {
  grade: number | null;
  maxGrade: number;
  weight: number;
}

/**
 * Média ponderada normalizada para a escala 0–10.
 * Considera apenas itens com nota lançada. Retorna null se não há notas.
 */
export function weightedAverage(items: GradeItem[]): number | null {
  const graded = items.filter((i) => i.grade != null && i.maxGrade > 0);
  if (graded.length === 0) return null;

  let weighted = 0;
  let totalWeight = 0;
  for (const i of graded) {
    const normalized = (Number(i.grade) / i.maxGrade) * 10;
    const w = i.weight || 1;
    weighted += normalized * w;
    totalWeight += w;
  }
  if (totalWeight === 0) return null;
  return Math.round((weighted / totalWeight) * 100) / 100;
}

/** Situação acadêmica a partir da média e da média mínima do curso. */
export function situationFor(
  average: number | null,
  minGrade: number = DEFAULT_MINIMUM_GRADE,
): SituationStatus {
  if (average == null) return "sem_nota";
  if (average >= minGrade) return "aprovado";
  if (average >= minGrade - RECOVERY_MARGIN) return "recuperacao";
  return "reprovado";
}
