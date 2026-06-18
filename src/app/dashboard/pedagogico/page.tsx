import Link from "next/link";
import { School, Users, DoorOpen, ClipboardCheck, UserX, AlertTriangle } from "lucide-react";
import { requirePermission } from "@/lib/auth/session";
import { getClassesPedagogical } from "@/lib/pedagogico/queries";
import { CLASS_STATUS_BADGE, classStatusLabel } from "@/lib/classes/labels";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/ui/stat-card";
import { EmptyState } from "@/components/ui/empty-state";
import type { ClassStatus } from "@/types/models";

const SHIFT_LABELS: Record<string, string> = {
  manha: "Manhã",
  tarde: "Tarde",
  noite: "Noite",
  integral: "Integral",
  sabado: "Sábado",
};

export default async function PedagogicoPage() {
  await requirePermission("classes.read");
  const classes = await getClassesPedagogical();

  const totalEnrolled = classes.reduce((s, c) => s + c.enrolled, 0);
  const lotadas = classes.filter((c) => c.maxStudents != null && c.enrolled >= c.maxStudents).length;
  const comFaltas = classes.reduce((s, c) => s + c.studentsWithAbsences, 0);

  return (
    <>
      <PageHeader
        title="Visão Pedagógica"
        description="Matrículas, limite de cada turma e frequência (quem faltou)."
      />

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Turmas" value={classes.length} icon={School} tone="indigo" />
        <StatCard label="Alunos matriculados" value={totalEnrolled} icon={Users} tone="sky" />
        <StatCard label="Turmas lotadas" value={lotadas} icon={DoorOpen} tone="amber" />
        <StatCard label="Alunos com faltas" value={comFaltas} icon={UserX} tone="rose" />
      </div>

      {classes.length === 0 ? (
        <EmptyState icon={School} title="Nenhuma turma" description="Cadastre turmas no módulo Acadêmico." />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {classes.map((c) => {
            const lotada = c.maxStudents != null && c.enrolled >= c.maxStudents;
            return (
              <Card key={c.id}>
                <CardContent className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <Link href={`/dashboard/academico/turmas/${c.id}`} className="font-semibold text-slate-900 hover:text-indigo-700">
                        {c.name}
                      </Link>
                      <p className="truncate text-xs text-slate-500">
                        {[c.courseName, c.shift ? SHIFT_LABELS[c.shift] ?? c.shift : null, c.unitName].filter(Boolean).join(" · ") || "—"}
                      </p>
                    </div>
                    <Badge className={CLASS_STATUS_BADGE[c.status as ClassStatus]}>{classStatusLabel(c.status as ClassStatus)}</Badge>
                  </div>

                  {/* Matrículas x limite */}
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className={`inline-flex items-center gap-1 rounded-md px-2 py-1 font-medium ${lotada ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-700"}`}>
                      <Users className="h-3 w-3" /> {c.enrolled}
                      {c.maxStudents != null ? ` / ${c.maxStudents}` : ""} matriculados
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-slate-700">
                      <DoorOpen className="h-3 w-3" />
                      {c.maxStudents == null ? "Sem limite" : c.vagas === 0 ? "Sem vagas" : `${c.vagas} vaga(s)`}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-slate-700">
                      <ClipboardCheck className="h-3 w-3" /> {c.sessions} chamada(s)
                    </span>
                  </div>

                  {/* Quem faltou */}
                  <div>
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Faltas — {c.studentsWithAbsences} aluno(s)
                    </p>
                    {c.sessions === 0 ? (
                      <p className="text-sm text-slate-400">Nenhuma chamada registrada ainda.</p>
                    ) : c.absentees.length === 0 ? (
                      <p className="text-sm text-emerald-600">Nenhuma falta registrada. 🎉</p>
                    ) : (
                      <ul className="space-y-1">
                        {c.absentees.map((a) => (
                          <li key={a.studentId} className="flex items-center justify-between gap-2 text-sm">
                            <span className="truncate text-slate-700">
                              {a.studentName}
                              {a.justified > 0 && <span className="ml-1 text-xs text-slate-400">({a.justified} justificada{a.justified > 1 ? "s" : ""})</span>}
                            </span>
                            <span className={`inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold ${a.faltas >= 3 ? "bg-rose-100 text-rose-700" : "bg-slate-100 text-slate-600"}`}>
                              {a.faltas >= 3 && <AlertTriangle className="h-3 w-3" />}
                              {a.faltas} falta{a.faltas > 1 ? "s" : ""}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
