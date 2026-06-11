"use client";

import { useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { SHIFT_OPTIONS } from "@/lib/academic/labels";
import { CLASS_STATUS_OPTIONS } from "@/lib/classes/labels";

interface Option {
  id: string;
  name: string;
}

export function ClassFilters({
  courses,
  teachers,
  units,
}: {
  courses: Option[];
  teachers: Option[];
  units: Option[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(searchParams.get("q") ?? "");

  function apply(patch: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v) params.set(k, v);
      else params.delete(k);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  const hasFilters = ["q", "courseId", "teacherId", "unitId", "shift", "status"].some((k) =>
    searchParams.get(k),
  );

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        apply({ q });
      }}
      className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end"
    >
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nome da turma" className="pl-9" />
      </div>
      <Select value={searchParams.get("courseId") ?? ""} onChange={(e) => apply({ courseId: e.target.value })} className="sm:w-40" aria-label="Curso">
        <option value="">Todos os cursos</option>
        {courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
      </Select>
      <Select value={searchParams.get("teacherId") ?? ""} onChange={(e) => apply({ teacherId: e.target.value })} className="sm:w-40" aria-label="Professor">
        <option value="">Todos os professores</option>
        {teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
      </Select>
      <Select value={searchParams.get("unitId") ?? ""} onChange={(e) => apply({ unitId: e.target.value })} className="sm:w-40" aria-label="Unidade">
        <option value="">Todas as unidades</option>
        {units.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
      </Select>
      <Select value={searchParams.get("shift") ?? ""} onChange={(e) => apply({ shift: e.target.value })} className="sm:w-36" aria-label="Turno">
        <option value="">Todos os turnos</option>
        {SHIFT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </Select>
      <Select value={searchParams.get("status") ?? ""} onChange={(e) => apply({ status: e.target.value })} className="sm:w-40" aria-label="Status">
        <option value="">Todos os status</option>
        {CLASS_STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </Select>
      <Button type="submit" variant="outline">Buscar</Button>
      {hasFilters && (
        <Button type="button" variant="ghost" onClick={() => { setQ(""); router.push(pathname); }}>
          <X className="h-4 w-4" /> Limpar
        </Button>
      )}
    </form>
  );
}
