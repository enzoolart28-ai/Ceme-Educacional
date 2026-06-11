"use client";

import { useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { STUDENT_STATUS_OPTIONS } from "@/lib/students/labels";

export function StudentFilters({
  courses,
  classes,
}: {
  courses: { id: string; name: string }[];
  classes: { id: string; name: string }[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [q, setQ] = useState(searchParams.get("q") ?? "");

  function apply(patch: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(patch)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  function clearAll() {
    setQ("");
    router.push(pathname);
  }

  const hasFilters =
    !!searchParams.get("q") ||
    !!searchParams.get("status") ||
    !!searchParams.get("classId") ||
    !!searchParams.get("courseId");

  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          apply({ q });
        }}
        className="flex flex-1 gap-2"
      >
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nome, CPF ou telefone"
            className="pl-9"
          />
        </div>
        <Button type="submit" variant="outline">
          Buscar
        </Button>
      </form>

      <Select
        value={searchParams.get("status") ?? ""}
        onChange={(e) => apply({ status: e.target.value })}
        className="sm:w-44"
        aria-label="Status"
      >
        <option value="">Todos os status</option>
        {STUDENT_STATUS_OPTIONS.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </Select>

      <Select
        value={searchParams.get("courseId") ?? ""}
        onChange={(e) => apply({ courseId: e.target.value, classId: "" })}
        className="sm:w-44"
        aria-label="Curso"
      >
        <option value="">Todos os cursos</option>
        {courses.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </Select>

      <Select
        value={searchParams.get("classId") ?? ""}
        onChange={(e) => apply({ classId: e.target.value })}
        className="sm:w-44"
        aria-label="Turma"
      >
        <option value="">Todas as turmas</option>
        {classes.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </Select>

      {hasFilters && (
        <Button type="button" variant="ghost" onClick={clearAll}>
          <X className="h-4 w-4" /> Limpar
        </Button>
      )}
    </div>
  );
}
