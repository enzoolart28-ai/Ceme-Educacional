"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { createAttendanceAction } from "@/app/actions/attendance";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Alert } from "@/components/ui/alert";

export function NewAttendanceForm({
  classId,
  subjects,
}: {
  classId: string;
  subjects: { id: string; name: string }[];
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [subjectId, setSubjectId] = useState("");
  const [date, setDate] = useState(today);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit() {
    if (!date) {
      setError("Informe a data.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await createAttendanceAction({
        class_id: classId,
        subject_id: subjectId || undefined,
        date,
        start_time: startTime || undefined,
        end_time: endTime || undefined,
      });
      if (result?.error) setError(result.error);
      // Em sucesso a action redireciona para a chamada.
    });
  }

  return (
    <div className="space-y-3">
      {error && <Alert tone="error">{error}</Alert>}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
        <div>
          <Label htmlFor="a_subject">Disciplina</Label>
          <Select id="a_subject" value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
            <option value="">Geral / sem disciplina</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="a_date">Data</Label>
          <Input id="a_date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="a_start">Início</Label>
          <Input id="a_start" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="a_end">Fim</Label>
          <Input id="a_end" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
        </div>
      </div>
      <Button onClick={submit} isLoading={isPending}>
        <Plus className="h-4 w-4" /> Nova chamada
      </Button>
    </div>
  );
}
