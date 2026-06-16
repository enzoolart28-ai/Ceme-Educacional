"use client";

import { useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { AT_PROCESS_STATUS_OPTIONS } from "@/lib/aula-teste/labels";

export function ReportFilters({ units }: { units: { id: string; name: string }[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [q, setQ] = useState(sp.get("q") ?? "");

  function setParams(next: Record<string, string>) {
    const params = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(next)) {
      if (v) params.set(k, v);
      else params.delete(k);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  const hasFilters = ["q", "discipline", "unit", "process"].some((k) => sp.get(k));

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <form
        onSubmit={(e) => { e.preventDefault(); setParams({ q }); }}
        className="flex items-center gap-2"
      >
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nome, vaga ou código" className="w-56 pl-8" />
        </div>
        <Button type="submit" variant="outline">Buscar</Button>
      </form>
      <Select value={sp.get("unit") ?? ""} onChange={(e) => setParams({ unit: e.target.value })} className="w-44" aria-label="Unidade">
        <option value="">Todas as unidades</option>
        {units.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
      </Select>
      <Select value={sp.get("process") ?? ""} onChange={(e) => setParams({ process: e.target.value })} className="w-52" aria-label="Situação">
        <option value="">Todas as situações</option>
        {AT_PROCESS_STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </Select>
      {hasFilters && (
        <Button variant="ghost" onClick={() => { setQ(""); router.push(pathname); }}>
          <X className="h-4 w-4" /> Limpar
        </Button>
      )}
    </div>
  );
}
