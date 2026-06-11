"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { X } from "lucide-react";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { DOCUMENT_TYPE_OPTIONS, DOCUMENT_STATUS_OPTIONS } from "@/lib/documents/labels";

export function DocumentFilters({
  students,
}: {
  students: { id: string; full_name: string }[];
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

  const hasFilters =
    !!searchParams.get("student") || !!searchParams.get("type") || !!searchParams.get("status");

  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
      <Select
        value={searchParams.get("student") ?? ""}
        onChange={(e) => apply({ student: e.target.value })}
        className="sm:w-56"
        aria-label="Aluno"
      >
        <option value="">Todos os alunos</option>
        {students.map((s) => (
          <option key={s.id} value={s.id}>{s.full_name}</option>
        ))}
      </Select>
      <Select
        value={searchParams.get("type") ?? ""}
        onChange={(e) => apply({ type: e.target.value })}
        className="sm:w-52"
        aria-label="Tipo"
      >
        <option value="">Todos os tipos</option>
        {DOCUMENT_TYPE_OPTIONS.map((o) => (
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
        {DOCUMENT_STATUS_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </Select>
      {hasFilters && (
        <Button type="button" variant="ghost" onClick={() => router.push(pathname)}>
          <X className="h-4 w-4" /> Limpar
        </Button>
      )}
    </div>
  );
}
