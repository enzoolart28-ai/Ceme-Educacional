"use client";

import { useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function ParticipantFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [f, setF] = useState({
    minAge: sp.get("minAge") ?? "",
    maxAge: sp.get("maxAge") ?? "",
    school: sp.get("school") ?? "",
    city: sp.get("city") ?? "",
    level: sp.get("level") ?? "",
  });

  function apply() {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(f)) if (v) params.set(k, v);
    router.push(`${pathname}?${params.toString()}`);
  }

  const hasFilters = ["minAge", "maxAge", "school", "city", "level"].some((k) => sp.get(k));

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); apply(); }}
      className="mb-3 flex flex-wrap items-end gap-2"
    >
      <div><label className="mb-1 block text-xs text-slate-500">Idade mín.</label><Input inputMode="numeric" value={f.minAge} onChange={(e) => setF((p) => ({ ...p, minAge: e.target.value }))} className="w-20" /></div>
      <div><label className="mb-1 block text-xs text-slate-500">Idade máx.</label><Input inputMode="numeric" value={f.maxAge} onChange={(e) => setF((p) => ({ ...p, maxAge: e.target.value }))} className="w-20" /></div>
      <div><label className="mb-1 block text-xs text-slate-500">Escola</label><Input value={f.school} onChange={(e) => setF((p) => ({ ...p, school: e.target.value }))} className="w-40" /></div>
      <div><label className="mb-1 block text-xs text-slate-500">Cidade</label><Input value={f.city} onChange={(e) => setF((p) => ({ ...p, city: e.target.value }))} className="w-36" /></div>
      <div><label className="mb-1 block text-xs text-slate-500">Nível</label><Input inputMode="numeric" value={f.level} onChange={(e) => setF((p) => ({ ...p, level: e.target.value }))} className="w-16" /></div>
      <Button type="submit" variant="outline">Filtrar</Button>
      {hasFilters && (
        <Button type="button" variant="ghost" onClick={() => { setF({ minAge: "", maxAge: "", school: "", city: "", level: "" }); router.push(pathname); }}>
          <X className="h-4 w-4" /> Limpar
        </Button>
      )}
    </form>
  );
}
