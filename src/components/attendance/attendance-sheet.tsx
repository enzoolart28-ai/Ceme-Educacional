"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { saveAttendanceAction } from "@/app/actions/attendance";
import {
  RECORD_STATUS_ORDER,
  RECORD_STATUS_LABELS,
  RECORD_STATUS_ACTIVE,
  RECORD_STATUS_SHORT,
} from "@/lib/attendance/labels";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import type { AttendanceRecordStatus } from "@/types/models";
import type { RosterEntry } from "@/lib/attendance/queries";

interface RowState {
  status: AttendanceRecordStatus;
  observation: string;
}

export function AttendanceSheet({
  attendanceId,
  classId,
  roster,
  canManage,
}: {
  attendanceId: string;
  classId: string;
  roster: RosterEntry[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [rows, setRows] = useState<Record<string, RowState>>(
    Object.fromEntries(
      roster.map((r) => [r.studentId, { status: r.status, observation: r.observation }]),
    ),
  );
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  function setStatus(studentId: string, status: AttendanceRecordStatus) {
    setRows((prev) => ({ ...prev, [studentId]: { ...prev[studentId], status } }));
  }
  function setObs(studentId: string, observation: string) {
    setRows((prev) => ({ ...prev, [studentId]: { ...prev[studentId], observation } }));
  }

  function save() {
    setMessage(null);
    startTransition(async () => {
      const records = roster.map((r) => ({
        student_id: r.studentId,
        status: rows[r.studentId].status,
        observation: rows[r.studentId].observation,
      }));
      const result = await saveAttendanceAction(attendanceId, classId, records);
      if (result.error) setMessage({ tone: "error", text: result.error });
      else {
        setMessage({ tone: "success", text: "Chamada salva com sucesso." });
        router.refresh();
      }
    });
  }

  if (roster.length === 0) {
    return (
      <Card className="p-6 text-center text-sm text-slate-500">
        Nenhum aluno na turma. Vincule alunos à turma antes de fazer a chamada.
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {message && <Alert tone={message.tone}>{message.text}</Alert>}

      <Card className="divide-y divide-slate-100">
        {roster.map((r) => {
          const st = rows[r.studentId];
          return (
            <div key={r.studentId} className="p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <span className="font-medium text-slate-900">{r.fullName}</span>
                <div className="flex flex-wrap gap-1.5">
                  {RECORD_STATUS_ORDER.map((s) => {
                    const active = st.status === s;
                    return (
                      <button
                        key={s}
                        type="button"
                        disabled={!canManage}
                        onClick={() => setStatus(r.studentId, s)}
                        title={RECORD_STATUS_LABELS[s]}
                        className={cn(
                          "rounded-md px-2.5 py-1 text-xs font-semibold transition-colors disabled:opacity-60",
                          active
                            ? RECORD_STATUS_ACTIVE[s]
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200",
                        )}
                      >
                        <span className="sm:hidden">{RECORD_STATUS_SHORT[s]}</span>
                        <span className="hidden sm:inline">{RECORD_STATUS_LABELS[s]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <input
                type="text"
                value={st.observation}
                disabled={!canManage}
                onChange={(e) => setObs(r.studentId, e.target.value)}
                placeholder="Observação (opcional)"
                className="mt-2 w-full rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:bg-slate-50"
              />
            </div>
          );
        })}
      </Card>

      {canManage && (
        <Button onClick={save} isLoading={isPending}>
          <Save className="h-4 w-4" /> Salvar chamada
        </Button>
      )}
    </div>
  );
}
