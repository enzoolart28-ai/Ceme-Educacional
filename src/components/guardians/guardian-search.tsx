"use client";

import { useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function GuardianSearch() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(searchParams.get("q") ?? "");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    router.push(q ? `${pathname}?q=${encodeURIComponent(q)}` : pathname);
  }

  return (
    <form onSubmit={submit} className="mb-4 flex gap-2">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por nome, CPF, telefone ou e-mail"
          className="pl-9"
        />
      </div>
      <Button type="submit" variant="outline">
        Buscar
      </Button>
      {searchParams.get("q") && (
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            setQ("");
            router.push(pathname);
          }}
        >
          <X className="h-4 w-4" /> Limpar
        </Button>
      )}
    </form>
  );
}
