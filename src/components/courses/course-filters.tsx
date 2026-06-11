"use client";

import { useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  MODALITY_OPTIONS,
  TYPE_OPTIONS,
  COURSE_STATUS_OPTIONS,
} from "@/lib/courses/labels";

export function CourseFilters() {
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

  const hasFilters =
    !!searchParams.get("q") ||
    !!searchParams.get("modality") ||
    !!searchParams.get("type") ||
    !!searchParams.get("status");

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
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por nome do curso"
          className="pl-9"
        />
      </div>
      <Select
        value={searchParams.get("modality") ?? ""}
        onChange={(e) => apply({ modality: e.target.value })}
        className="sm:w-44"
        aria-label="Modalidade"
      >
        <option value="">Todas as modalidades</option>
        {MODALITY_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </Select>
      <Select
        value={searchParams.get("type") ?? ""}
        onChange={(e) => apply({ type: e.target.value })}
        className="sm:w-44"
        aria-label="Tipo"
      >
        <option value="">Todos os tipos</option>
        {TYPE_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </Select>
      <Select
        value={searchParams.get("status") ?? ""}
        onChange={(e) => apply({ status: e.target.value })}
        className="sm:w-44"
        aria-label="Status"
      >
        <option value="">Todos os status</option>
        {COURSE_STATUS_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
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
