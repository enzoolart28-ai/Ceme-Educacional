"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { linkCourseSubjectAction } from "@/app/actions/courses";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Alert } from "@/components/ui/alert";

export function CourseDisciplineForm({
  courseId,
  subjects,
  modules,
  teachers,
}: {
  courseId: string;
  subjects: { id: string; name: string }[];
  modules: { id: string; name: string }[];
  teachers: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [subjectId, setSubjectId] = useState("");
  const [moduleId, setModuleId] = useState("");
  const [workload, setWorkload] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit() {
    if (!subjectId) {
      setError("Selecione uma disciplina.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await linkCourseSubjectAction({
        course_id: courseId,
        subject_id: subjectId,
        module_id: moduleId || undefined,
        workload_hours: workload || undefined,
        teacher_id: teacherId || undefined,
      });
      if (result.error) setError(result.error);
      else {
        setSubjectId("");
        setModuleId("");
        setWorkload("");
        setTeacherId("");
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-3">
      {error && <Alert tone="error">{error}</Alert>}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
        <div>
          <Label htmlFor="d_subject">Disciplina *</Label>
          <Select id="d_subject" value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
            <option value="">Selecione…</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="d_module">Módulo</Label>
          <Select id="d_module" value={moduleId} onChange={(e) => setModuleId(e.target.value)}>
            <option value="">Sem módulo</option>
            {modules.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="d_wh">Carga (h)</Label>
          <Input id="d_wh" type="number" value={workload} onChange={(e) => setWorkload(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="d_teacher">Professor</Label>
          <Select id="d_teacher" value={teacherId} onChange={(e) => setTeacherId(e.target.value)}>
            <option value="">—</option>
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </Select>
        </div>
      </div>
      <Button onClick={submit} isLoading={isPending}>
        <Plus className="h-4 w-4" /> Adicionar disciplina
      </Button>
    </div>
  );
}
