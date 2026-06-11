"use client";

import { useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { TEACHER_STATUS_OPTIONS } from "@/lib/teachers/labels";

export function TeacherFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const [area, setArea] = useState(searchParams.get("area") ?? "");

  function apply(patch: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v) params.set(k, v);
      else params.delete(k);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  const hasFilters =
    !!searchParams.get("q") || !!searchParams.get("area") || !!searchParams.get("status");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        apply({ q, area });
      }}
      className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end"
    >
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por nome, CPF ou e-mail"
          className="pl-9"
        />
      </div>
      <Input
        value={area}
        onChange={(e) => setArea(e.target.value)}
        placeholder="Área de atuação"
        className="sm:w-48"
      />
      <Select
        value={searchParams.get("status") ?? ""}
        onChange={(e) => apply({ status: e.target.value })}
        className="sm:w-44"
        aria-label="Status"
      >
        <option value="">Todos os status</option>
        {TEACHER_STATUS_OPTIONS.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </Select>
      <Button type="submit" variant="outline">
        Buscar
      </Button>
      {hasFilters && (
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            setQ("");
            setArea("");
            router.push(pathname);
          }}
        >
          <X className="h-4 w-4" /> Limpar
        </Button>
      )}
    </form>
  );
}
