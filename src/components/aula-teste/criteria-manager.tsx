"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Check, X, Eye, EyeOff } from "lucide-react";
import { saveAtCriterionAction, toggleAtCriterionAction } from "@/app/actions/aula-teste";
import { AT_EVALUATION_TYPE_LABELS } from "@/lib/aula-teste/labels";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AtCriterion, AtEvaluationType } from "@/types/models";

const SECTIONS: AtEvaluationType[] = [
  "curricular",
  "plano_aula",
  "didatica",
  "dominio",
  "professor_atual",
  "comissao",
];

export function CriteriaManager({
  grouped,
}: {
  grouped: Record<AtEvaluationType, AtCriterion[]>;
}) {
  const [openSection, setOpenSection] = useState<AtEvaluationType | null>(null);

  return (
    <div className="space-y-3">
      {SECTIONS.map((section) => {
        const items = grouped[section] ?? [];
        const isOpen = openSection === section;
        return (
          <div key={section} className="rounded-lg border border-slate-200">
            <button
              type="button"
              onClick={() => setOpenSection(isOpen ? null : section)}
              className="flex w-full items-center justify-between px-4 py-3 text-left"
            >
              <span className="font-medium text-slate-800">{AT_EVALUATION_TYPE_LABELS[section]}</span>
              <span className="text-xs text-slate-400">{items.filter((i) => i.active).length} ativos · {items.length} total</span>
            </button>
            {isOpen && (
              <div className="border-t border-slate-100 px-4 py-3">
                <SectionCriteria section={section} items={items} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function SectionCriteria({ section, items }: { section: AtEvaluationType; items: AtCriterion[] }) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [isPending, startTransition] = useTransition();

  function add() {
    if (!draft.trim()) return;
    startTransition(async () => {
      await saveAtCriterionAction({ section, label: draft.trim() });
      setDraft(""); setAdding(false); router.refresh();
    });
  }
  function saveEdit(id: string) {
    if (!draft.trim()) return;
    startTransition(async () => {
      await saveAtCriterionAction({ id, section, label: draft.trim() });
      setEditingId(null); setDraft(""); router.refresh();
    });
  }
  function toggle(c: AtCriterion) {
    startTransition(async () => {
      await toggleAtCriterionAction({ id: c.id, active: !c.active });
      router.refresh();
    });
  }

  return (
    <div className="space-y-1.5">
      {items.map((c) => (
        <div key={c.id} className={`flex items-center gap-2 rounded-md px-2 py-1.5 ${c.active ? "" : "opacity-50"}`}>
          <span className="w-6 text-center text-xs text-slate-400">{c.order_index}</span>
          {editingId === c.id ? (
            <>
              <Input value={draft} onChange={(e) => setDraft(e.target.value)} className="h-8 flex-1" autoFocus />
              <button onClick={() => saveEdit(c.id)} disabled={isPending} className="rounded bg-emerald-100 p-1.5 text-emerald-700" aria-label="Salvar"><Check className="h-4 w-4" /></button>
              <button onClick={() => { setEditingId(null); setDraft(""); }} className="rounded bg-slate-100 p-1.5 text-slate-500" aria-label="Cancelar"><X className="h-4 w-4" /></button>
            </>
          ) : (
            <>
              <span className="flex-1 text-sm text-slate-700">{c.label}</span>
              <button onClick={() => { setEditingId(c.id); setDraft(c.label); }} className="text-slate-400 hover:text-indigo-600" aria-label="Editar"><Pencil className="h-4 w-4" /></button>
              <button onClick={() => toggle(c)} disabled={isPending} className="text-slate-400 hover:text-slate-700" aria-label={c.active ? "Desativar" : "Ativar"}>
                {c.active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </button>
            </>
          )}
        </div>
      ))}

      {adding ? (
        <div className="flex items-center gap-2 pt-1">
          <Input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Novo critério" className="h-8 flex-1" autoFocus />
          <button onClick={add} disabled={isPending} className="rounded bg-emerald-100 p-1.5 text-emerald-700" aria-label="Adicionar"><Check className="h-4 w-4" /></button>
          <button onClick={() => { setAdding(false); setDraft(""); }} className="rounded bg-slate-100 p-1.5 text-slate-500" aria-label="Cancelar"><X className="h-4 w-4" /></button>
        </div>
      ) : (
        <Button type="button" variant="ghost" onClick={() => { setAdding(true); setDraft(""); }} className="mt-1 h-8">
          <Plus className="h-4 w-4" /> Adicionar critério
        </Button>
      )}
    </div>
  );
}
