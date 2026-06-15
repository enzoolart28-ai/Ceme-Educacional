"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { X } from "lucide-react";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  ALERT_TYPE_OPTIONS,
  ALERT_PRIORITY_OPTIONS,
  ALERT_STATUS_OPTIONS,
} from "@/lib/alerts/labels";

export function AlertFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(sp.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`${pathname}?${params.toString()}`);
  }

  const hasFilters = ["priority", "type", "status"].some((k) => sp.get(k));

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <Select value={sp.get("priority") ?? ""} onChange={(e) => setParam("priority", e.target.value)} className="w-44" aria-label="Prioridade">
        <option value="">Todas as prioridades</option>
        {ALERT_PRIORITY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </Select>
      <Select value={sp.get("type") ?? ""} onChange={(e) => setParam("type", e.target.value)} className="w-56" aria-label="Tipo">
        <option value="">Todos os tipos</option>
        {ALERT_TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </Select>
      <Select value={sp.get("status") ?? ""} onChange={(e) => setParam("status", e.target.value)} className="w-44" aria-label="Status">
        <option value="">Todos os status</option>
        {ALERT_STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </Select>
      {hasFilters && (
        <Button variant="ghost" onClick={() => router.push(pathname)}>
          <X className="h-4 w-4" /> Limpar
        </Button>
      )}
    </div>
  );
}
