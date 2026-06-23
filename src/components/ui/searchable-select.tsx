"use client";

// =============================================================================
// SearchableSelect — combobox com busca por digitação
// =============================================================================
// Substitui um <select> nativo quando a lista é grande (ex.: escolher aluno).
// Acessível por teclado básico: abre/fecha, filtra e seleciona com o mouse.
// =============================================================================
import { useEffect, useRef, useState } from "react";
import { ChevronsUpDown, Check, Search } from "lucide-react";
import { cn } from "@/lib/utils";

/** Normaliza para busca: minúsculas e sem acentos (faixa de diacríticos U+0300–U+036F). */
const norm = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

export interface SelectOption {
  value: string;
  label: string;
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Selecione…",
  ariaLabel,
  className,
}: {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  ariaLabel?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  const selected = options.find((o) => o.value === value);
  const q = norm(query.trim());
  const filtered = q ? options.filter((o) => norm(o.label).includes(q)) : options;

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <button
        type="button"
        aria-label={ariaLabel}
        onClick={() => setOpen((v) => !v)}
        className="flex h-10 w-full items-center justify-between rounded-lg border border-slate-300 bg-white px-3 text-left text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
      >
        <span className={cn("truncate", !selected && "text-slate-400")}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-slate-400" />
      </button>

      {open && (
        <div className="absolute z-20 mt-1 w-full rounded-lg border border-slate-200 bg-white shadow-lg">
          <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-2">
            <Search className="h-4 w-4 shrink-0 text-slate-400" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar nome…"
              className="w-full text-sm text-slate-900 focus:outline-none"
            />
          </div>
          <ul className="max-h-60 overflow-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-sm text-slate-400">Nenhum resultado.</li>
            ) : (
              filtered.map((o) => (
                <li key={o.value}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(o.value);
                      setOpen(false);
                      setQuery("");
                    }}
                    className={cn(
                      "flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-slate-50",
                      o.value === value && "bg-indigo-50 text-indigo-700",
                    )}
                  >
                    <span className="truncate">{o.label}</span>
                    {o.value === value && <Check className="h-4 w-4 shrink-0" />}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
