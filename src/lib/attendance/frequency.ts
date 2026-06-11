// =============================================================================
// Cálculo de frequência e alertas (puro — usável em server e client)
// =============================================================================
import type { AttendanceRecordStatus } from "@/types/models";

export const LOW_FREQUENCY_THRESHOLD = 0.75;
export const CONSECUTIVE_ABSENCE_ALERT = 3;

export interface FrequencySummary {
  total: number;
  present: number;
  absent: number;
  justified: number;
  late: number;
  /** Aulas em que o aluno esteve presente (present + atraso). */
  attended: number;
  /** Fração 0–1 (null se não há aulas). */
  percent: number | null;
  /** Maior sequência de faltas (não justificadas) consecutivas. */
  maxConsecutiveAbsences: number;
  lowFrequency: boolean;
  hasConsecutiveAbsenceAlert: boolean;
}

/**
 * Calcula a frequência a partir de registros JÁ ORDENADOS por data (asc).
 * Presença = present + late. Faltas consecutivas consideram apenas "absent".
 */
export function computeFrequency(
  statusesInDateOrder: AttendanceRecordStatus[],
): FrequencySummary {
  let present = 0;
  let absent = 0;
  let justified = 0;
  let late = 0;
  let run = 0;
  let maxRun = 0;

  for (const s of statusesInDateOrder) {
    if (s === "present") present++;
    else if (s === "late") late++;
    else if (s === "justified_absence") justified++;
    else if (s === "absent") absent++;

    if (s === "absent") {
      run++;
      if (run > maxRun) maxRun = run;
    } else {
      run = 0;
    }
  }

  const total = statusesInDateOrder.length;
  const attended = present + late;
  const percent = total > 0 ? attended / total : null;

  return {
    total,
    present,
    absent,
    justified,
    late,
    attended,
    percent,
    maxConsecutiveAbsences: maxRun,
    lowFrequency: percent != null && percent < LOW_FREQUENCY_THRESHOLD,
    hasConsecutiveAbsenceAlert: maxRun >= CONSECUTIVE_ABSENCE_ALERT,
  };
}
