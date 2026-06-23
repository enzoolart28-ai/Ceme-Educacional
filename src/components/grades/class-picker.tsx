"use client";

import { useRouter } from "next/navigation";
import { SearchableSelect } from "@/components/ui/searchable-select";

export function ClassPicker({
  classes,
  value,
}: {
  classes: { id: string; name: string }[];
  value: string;
}) {
  const router = useRouter();
  return (
    <div className="max-w-sm">
      <SearchableSelect
        options={classes.map((c) => ({ value: c.id, label: c.name }))}
        value={value}
        onChange={(id) => router.push(`/dashboard/avaliacoes/diario?turma=${id}`)}
        placeholder="Escolha a turma…"
        ariaLabel="Turma"
      />
    </div>
  );
}
