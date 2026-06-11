// =============================================================================
// Regras de liberação de aulas (puro)
// =============================================================================
import type { LessonReleaseType } from "@/types/models";

export interface LessonReleaseInput {
  id: string;
  release_type: LessonReleaseType;
  release_date: string | null;
  /** A aula anterior (na ordem) foi concluída pelo aluno? */
  previousCompleted: boolean;
}

export interface ReleaseResult {
  released: boolean;
  reason: string | null;
}

/** Determina se uma aula está liberada para o aluno. */
export function evaluateRelease(lesson: LessonReleaseInput, now: Date = new Date()): ReleaseResult {
  switch (lesson.release_type) {
    case "all":
      return { released: true, reason: null };
    case "date": {
      if (!lesson.release_date) return { released: true, reason: null };
      const date = new Date(lesson.release_date);
      if (now >= date) return { released: true, reason: null };
      return {
        released: false,
        reason: `Disponível a partir de ${date.toLocaleDateString("pt-BR")}`,
      };
    }
    case "after_previous":
      return lesson.previousCompleted
        ? { released: true, reason: null }
        : { released: false, reason: "Conclua a aula anterior para liberar" };
    default:
      return { released: true, reason: null };
  }
}
