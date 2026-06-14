"use client";

import { useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { SOURCE_OPTIONS, STATUS_OPTIONS } from "@/lib/crm/labels";

export function CrmFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const [course, setCourse] = useState(searchParams.get("course") ?? "");

  function apply(patch: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v) params.set(k, v);
      else params.delete(k);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  const hasFilters = ["q", "course", "status", "source"].some((k) => searchParams.get(k));

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); apply({ q, course }); }}
      className="mb-4 flex flex-wrap items-end gap-2"
    >
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nome, telefone ou e-mail" className="pl-9 sm:w-56" />
      </div>
      <Input value={course} onChange={(e) => setCourse(e.target.value)} placeholder="Curso de interesse" className="sm:w-44" />
      <Select value={searchParams.get("status") ?? ""} onChange={(e) => apply({ status: e.target.value })} className="sm:w-44" aria-label="Status">
        <option value="">Todos os status</option>
        {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </Select>
      <Select value={searchParams.get("source") ?? ""} onChange={(e) => apply({ source: e.target.value })} className="sm:w-40" aria-label="Origem">
        <option value="">Todas as origens</option>
        {SOURCE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </Select>
      <Button type="submit" variant="outline">Buscar</Button>
      {hasFilters && (
        <Button type="button" variant="ghost" onClick={() => { setQ(""); setCourse(""); apply({ q: "", course: "", status: "", source: "" }); }}>
          <X className="h-4 w-4" /> Limpar
        </Button>
      )}
    </form>
  );
}
