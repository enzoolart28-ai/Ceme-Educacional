"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { saveLevelAction, deleteLevelAction } from "@/app/actions/campaigns";
import { DIFFICULTY_OPTIONS, DIFFICULTY_BADGE, difficultyLabel } from "@/lib/campaigns/labels";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import type { CampaignLevel, CampaignLevelDifficulty } from "@/types/models";

export function LevelManager({ campaignId, levels }: { campaignId: string; levels: CampaignLevel[] }) {
  const [editing, setEditing] = useState<CampaignLevel | "new" | null>(null);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{levels.length} nível(is)</p>
        {editing === null && (
          <Button variant="outline" onClick={() => setEditing("new")}><Plus className="h-4 w-4" /> Nível</Button>
        )}
      </div>

      {levels.length > 0 && (
        <Card className="divide-y divide-slate-100">
          {levels.map((l) => (
            <div key={l.id} className="flex items-center gap-3 px-4 py-2.5">
              <span className="w-6 text-center text-sm font-medium text-slate-400">{l.order_index}</span>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-slate-900">{l.name}</p>
                {l.description && <p className="truncate text-xs text-slate-500">{l.description}</p>}
              </div>
              <Badge className={DIFFICULTY_BADGE[l.difficulty as CampaignLevelDifficulty]}>
                {difficultyLabel(l.difficulty as CampaignLevelDifficulty)}
              </Badge>
              <button onClick={() => setEditing(l)} aria-label="Editar" className="text-slate-400 hover:text-indigo-600"><Pencil className="h-4 w-4" /></button>
              <LevelDelete id={l.id} campaignId={campaignId} />
            </div>
          ))}
        </Card>
      )}

      {editing !== null && (
        <LevelEditor
          key={editing === "new" ? "new" : editing.id}
          campaignId={campaignId}
          level={editing === "new" ? null : editing}
          nextOrder={levels.length + 1}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}

function LevelDelete({ id, campaignId }: { id: string; campaignId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  return (
    <button
      onClick={() => {
        if (!confirm("Excluir este nível?")) return;
        startTransition(async () => { await deleteLevelAction({ id, campaignId }); router.refresh(); });
      }}
      disabled={isPending}
      aria-label="Excluir"
      className="text-slate-400 hover:text-rose-600 disabled:opacity-50"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}

function LevelEditor({
  campaignId,
  level,
  nextOrder,
  onClose,
}: {
  campaignId: string;
  level: CampaignLevel | null;
  nextOrder: number;
  onClose: () => void;
}) {
  const router = useRouter();
  const [name, setName] = useState(level?.name ?? "");
  const [description, setDescription] = useState(level?.description ?? "");
  const [difficulty, setDifficulty] = useState<CampaignLevelDifficulty>(level?.difficulty ?? "facil");
  const [order, setOrder] = useState(String(level?.order_index ?? nextOrder));
  const [msg, setMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function save() {
    setMsg(null);
    startTransition(async () => {
      const r = await saveLevelAction({ id: level?.id, campaign_id: campaignId, name, description, difficulty, order_index: order });
      if (r.error) setMsg(r.error);
      else { onClose(); router.refresh(); }
    });
  }

  return (
    <Card className="border-indigo-200">
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-slate-700">{level ? "Editar nível" : "Novo nível"}</h4>
          <button onClick={onClose} aria-label="Fechar" className="text-slate-400 hover:text-slate-700"><X className="h-4 w-4" /></button>
        </div>
        {msg && <Alert tone="error">{msg}</Alert>}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          <div className="sm:col-span-2">
            <Label htmlFor="l_name">Nome</Label>
            <Input id="l_name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="l_diff">Dificuldade</Label>
            <Select id="l_diff" value={difficulty} onChange={(e) => setDifficulty(e.target.value as CampaignLevelDifficulty)}>
              {DIFFICULTY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </Select>
          </div>
          <div>
            <Label htmlFor="l_order">Ordem</Label>
            <Input id="l_order" inputMode="numeric" value={order} onChange={(e) => setOrder(e.target.value)} />
          </div>
        </div>
        <div>
          <Label htmlFor="l_desc">Descrição</Label>
          <Input id="l_desc" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <Button onClick={save} isLoading={isPending}>Salvar nível</Button>
      </CardContent>
    </Card>
  );
}
