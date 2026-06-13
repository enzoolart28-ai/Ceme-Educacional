// =============================================================================
// Utilidades de data do calendário (puras, fuso América/São_Paulo)
// =============================================================================
export const TZ = "America/Sao_Paulo";

const keyFmt = new Intl.DateTimeFormat("en-CA", {
  timeZone: TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
const timeFmt = new Intl.DateTimeFormat("pt-BR", {
  timeZone: TZ,
  hour: "2-digit",
  minute: "2-digit",
});

/** Chave de dia local (YYYY-MM-DD) de um ISO. */
export function eventDateKey(iso: string): string {
  return keyFmt.format(new Date(iso));
}
/** Hora local (HH:mm) de um ISO. */
export function eventTime(iso: string): string {
  return timeFmt.format(new Date(iso));
}

const localFmt = new Intl.DateTimeFormat("sv-SE", {
  timeZone: TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});
/** ISO → valor de <input type="datetime-local"> (YYYY-MM-DDTHH:mm) em horário de SP. */
export function isoToLocalInput(iso: string | null | undefined): string {
  if (!iso) return "";
  return localFmt.format(new Date(iso)).replace(" ", "T");
}
/** datetime-local (hora de SP) → ISO com offset -03:00. */
export function localInputToIso(local: string): string {
  return local ? `${local}:00-03:00` : "";
}

const pad = (n: number) => String(n).padStart(2, "0");
const ymd = (d: Date) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;

export const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];
export const WEEKDAY_SHORT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export interface DayCell {
  key: string;
  day: number;
  inMonth: boolean;
  isToday: boolean;
}

export function todayKey(): string {
  return eventDateKey(new Date().toISOString());
}

/** Grade do mês (6 semanas × 7 dias), começando no domingo. */
export function buildMonthGrid(year: number, month: number): DayCell[] {
  const startWeekday = new Date(Date.UTC(year, month, 1)).getUTCDay();
  const tk = todayKey();
  const cells: DayCell[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(Date.UTC(year, month, 1 - startWeekday + i));
    const key = ymd(d);
    cells.push({ key, day: d.getUTCDate(), inMonth: d.getUTCMonth() === month, isToday: key === tk });
  }
  return cells;
}

/** Os 7 dias da semana (domingo→sábado) que contêm a data de referência. */
export function buildWeek(refKey: string): DayCell[] {
  const [y, m, dd] = refKey.split("-").map(Number);
  const wd = new Date(Date.UTC(y, m - 1, dd)).getUTCDay();
  const tk = todayKey();
  const cells: DayCell[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(Date.UTC(y, m - 1, dd - wd + i));
    const key = ymd(d);
    cells.push({ key, day: d.getUTCDate(), inMonth: true, isToday: key === tk });
  }
  return cells;
}

/** Intervalo ISO [start, end) para buscar eventos conforme a visão. */
export function rangeForView(
  view: "month" | "week" | "list",
  refKey: string,
): { start: string; end: string } {
  const [y, m, dd] = refKey.split("-").map(Number);
  if (view === "month") {
    const startWeekday = new Date(Date.UTC(y, m - 1, 1)).getUTCDay();
    const start = new Date(Date.UTC(y, m - 1, 1 - startWeekday));
    const end = new Date(Date.UTC(y, m - 1, 1 - startWeekday + 42));
    return { start: start.toISOString(), end: end.toISOString() };
  }
  if (view === "week") {
    const wd = new Date(Date.UTC(y, m - 1, dd)).getUTCDay();
    const start = new Date(Date.UTC(y, m - 1, dd - wd));
    const end = new Date(Date.UTC(y, m - 1, dd - wd + 7));
    return { start: start.toISOString(), end: end.toISOString() };
  }
  // list: a partir do dia de referência, próximos 90 dias
  const start = new Date(Date.UTC(y, m - 1, dd));
  const end = new Date(Date.UTC(y, m - 1, dd + 90));
  return { start: start.toISOString(), end: end.toISOString() };
}

/** Navegação: nova data de referência (YYYY-MM-DD) ao avançar/voltar. */
export function shiftRef(view: "month" | "week" | "list", refKey: string, dir: -1 | 1): string {
  const [y, m, dd] = refKey.split("-").map(Number);
  const delta = view === "month" ? 0 : view === "week" ? 7 * dir : 30 * dir;
  const d =
    view === "month"
      ? new Date(Date.UTC(y, m - 1 + dir, 1))
      : new Date(Date.UTC(y, m - 1, dd + delta));
  return ymd(d);
}

export function monthLabel(refKey: string): string {
  const [y, m] = refKey.split("-").map(Number);
  return `${MONTH_NAMES[m - 1]} de ${y}`;
}

export function rangeLabel(view: "month" | "week" | "list", refKey: string): string {
  if (view === "month") return monthLabel(refKey);
  const week = buildWeek(refKey);
  const first = week[0];
  const last = week[6];
  const [, fm] = first.key.split("-").map(Number);
  const [, lm] = last.key.split("-").map(Number);
  if (view === "week") {
    return `${first.day} ${MONTH_NAMES[fm - 1].slice(0, 3)} – ${last.day} ${MONTH_NAMES[lm - 1].slice(0, 3)}`;
  }
  return "Próximos eventos";
}
