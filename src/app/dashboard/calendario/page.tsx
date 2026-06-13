import Link from "next/link";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { requireAuth } from "@/lib/auth/session";
import { STAFF_ROLES } from "@/lib/auth/roles";
import { listEvents } from "@/lib/calendar/queries";
import { listClasses } from "@/lib/classes/queries";
import { listCourses } from "@/lib/academic/queries";
import { listTeachers } from "@/lib/teachers/queries";
import { listUnits } from "@/lib/calendar/queries";
import { rangeForView, shiftRef, rangeLabel, todayKey } from "@/lib/calendar/dates";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { CalendarFilters } from "@/components/calendar/calendar-filters";
import { MonthView, WeekView, ListView } from "@/components/calendar/calendar-views";
import type { CalendarEventType } from "@/types/models";

type View = "month" | "week" | "list";

export default async function CalendarioPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const profile = await requireAuth();
  const sp = await searchParams;

  const view: View = sp.view === "week" || sp.view === "list" ? sp.view : "month";
  const refKey = sp.date && /^\d{4}-\d{2}-\d{2}$/.test(sp.date) ? sp.date : todayKey();
  const range = rangeForView(view, refKey);

  const [events, classes, courses, teachers, units] = await Promise.all([
    listEvents({
      rangeStart: range.start,
      rangeEnd: range.end,
      type: (sp.type as CalendarEventType) || undefined,
      course: sp.course || undefined,
      class: sp.class || undefined,
      teacher: sp.teacher || undefined,
      unit: sp.unit || undefined,
    }),
    listClasses(),
    listCourses(),
    listTeachers(),
    listUnits(),
  ]);

  const canCreate =
    STAFF_ROLES.includes(profile.role) || profile.role === "professor" || profile.role === "financeiro";

  function buildUrl(overrides: Record<string, string>) {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(sp)) if (v) params.set(k, v);
    for (const [k, v] of Object.entries(overrides)) {
      if (v) params.set(k, v);
      else params.delete(k);
    }
    return `/dashboard/calendario?${params.toString()}`;
  }

  const tabClass = (v: View) =>
    `rounded-md px-3 py-1.5 text-sm font-medium ${view === v ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-100"}`;

  return (
    <>
      <PageHeader
        title="Calendário Acadêmico"
        description="Aulas, provas, reuniões, feriados e vencimentos."
        action={
          canCreate ? (
            <Link href="/dashboard/calendario/novo">
              <Button><Plus className="h-4 w-4" /> Novo evento</Button>
            </Link>
          ) : undefined
        }
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {view !== "list" && (
            <>
              <Link href={buildUrl({ date: shiftRef(view, refKey, -1) })} aria-label="Anterior" className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100">
                <ChevronLeft className="h-5 w-5" />
              </Link>
              <Link href={buildUrl({ date: shiftRef(view, refKey, 1) })} aria-label="Próximo" className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100">
                <ChevronRight className="h-5 w-5" />
              </Link>
            </>
          )}
          <h2 className="ml-1 text-lg font-semibold capitalize text-slate-900">{rangeLabel(view, refKey)}</h2>
          <Link href={buildUrl({ date: todayKey() })} className="ml-2 text-sm font-medium text-indigo-600 hover:underline">Hoje</Link>
        </div>
        <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
          <Link href={buildUrl({ view: "month" })} className={tabClass("month")}>Mês</Link>
          <Link href={buildUrl({ view: "week" })} className={tabClass("week")}>Semana</Link>
          <Link href={buildUrl({ view: "list" })} className={tabClass("list")}>Lista</Link>
        </div>
      </div>

      <CalendarFilters
        classes={classes.map((c) => ({ id: c.id, name: c.name }))}
        courses={courses.map((c) => ({ id: c.id, name: c.name }))}
        units={units}
        teachers={teachers.map((t) => ({ id: t.id, name: t.full_name }))}
      />

      {view === "month" && <MonthView events={events} refKey={refKey} />}
      {view === "week" && <WeekView events={events} refKey={refKey} />}
      {view === "list" && <ListView events={events} />}
    </>
  );
}
