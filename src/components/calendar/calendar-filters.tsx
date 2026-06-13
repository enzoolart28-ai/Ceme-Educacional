"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { X } from "lucide-react";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { EVENT_TYPE_OPTIONS } from "@/lib/calendar/labels";

interface Option {
  id: string;
  name: string;
}

export function CalendarFilters({
  classes,
  courses,
  units,
  teachers,
}: {
  classes: Option[];
  courses: Option[];
  units: Option[];
  teachers: Option[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function apply(patch: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v) params.set(k, v);
      else params.delete(k);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  const hasFilters = ["type", "course", "class", "teacher", "unit"].some((k) => searchParams.get(k));

  return (
    <div className="mb-4 flex flex-wrap items-end gap-2">
      <Select value={searchParams.get("type") ?? ""} onChange={(e) => apply({ type: e.target.value })} className="sm:w-44" aria-label="Tipo">
        <option value="">Todos os tipos</option>
        {EVENT_TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </Select>
      <Select value={searchParams.get("course") ?? ""} onChange={(e) => apply({ course: e.target.value })} className="sm:w-40" aria-label="Curso">
        <option value="">Curso</option>
        {courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
      </Select>
      <Select value={searchParams.get("class") ?? ""} onChange={(e) => apply({ class: e.target.value })} className="sm:w-40" aria-label="Turma">
        <option value="">Turma</option>
        {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
      </Select>
      <Select value={searchParams.get("teacher") ?? ""} onChange={(e) => apply({ teacher: e.target.value })} className="sm:w-40" aria-label="Professor">
        <option value="">Professor</option>
        {teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
      </Select>
      <Select value={searchParams.get("unit") ?? ""} onChange={(e) => apply({ unit: e.target.value })} className="sm:w-40" aria-label="Unidade">
        <option value="">Unidade</option>
        {units.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
      </Select>
      {hasFilters && (
        <Button type="button" variant="ghost" onClick={() => apply({ type: "", course: "", class: "", teacher: "", unit: "" })}>
          <X className="h-4 w-4" /> Limpar
        </Button>
      )}
    </div>
  );
}
