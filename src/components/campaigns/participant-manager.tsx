"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Download, Trophy, Gift, Check, X } from "lucide-react";
import {
  saveParticipantAction,
  deleteParticipantAction,
  completeLevelAction,
  setEligibleAction,
  setWinnerAction,
} from "@/app/actions/campaigns";
import { PARTICIPANT_STATUS_OPTIONS, PARTICIPANT_STATUS_BADGE, participantStatusLabel } from "@/lib/campaigns/labels";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import type { CampaignLevel, CampaignParticipantStatus } from "@/types/models";
import type { ParticipantRow } from "@/lib/campaigns/queries";

function csvCell(v: unknown): string {
  const s = v == null ? "" : String(v);
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function ParticipantManager({
  campaignId,
  participants,
  levels,
}: {
  campaignId: string;
  participants: ParticipantRow[];
  levels: CampaignLevel[];
}) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Ranking: mais níveis concluídos, depois maior pontuação.
  const ranked = [...participants].sort(
    (a, b) => b.levelsCompleted - a.levelsCompleted || b.totalScore - a.totalScore,
  );

  function exportEligible() {
    const eligible = ranked.filter((p) => p.eligible_for_draw);
    const header = ["Nome", "Idade", "Telefone", "Responsável", "Escola", "Cidade", "Nível", "Níveis concluídos", "Pontuação"];
    const lines = eligible.map((p) =>
      [p.full_name, p.age ?? "", p.phone ?? "", p.guardian_name ?? "", p.school ?? "", p.city ?? "", p.current_level, p.levelsCompleted, p.totalScore]
        .map(csvCell).join(","),
    );
    const csv = "﻿" + [header.join(","), ...lines].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "elegiveis-sorteio.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  function toggle(fn: () => Promise<{ error?: string }>) {
    startTransition(async () => { await fn(); router.refresh(); });
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-slate-500">{participants.length} participante(s) · ranking por níveis concluídos</p>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={exportEligible}><Download className="h-4 w-4" /> Exportar elegíveis (CSV)</Button>
          {!adding && <Button onClick={() => setAdding(true)}><Plus className="h-4 w-4" /> Participante</Button>}
        </div>
      </div>

      {adding && <AddParticipant campaignId={campaignId} onClose={() => setAdding(false)} />}

      {ranked.length > 0 && (
        <Card className="divide-y divide-slate-100">
          {ranked.map((p, i) => (
            <div key={p.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <span className="w-6 text-center text-sm font-bold text-slate-400">{i + 1}º</span>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-slate-900">
                  {p.full_name} {p.is_winner && <Trophy className="ml-1 inline h-4 w-4 text-amber-500" />}
                </p>
                <p className="text-xs text-slate-500">
                  {[p.age ? `${p.age} anos` : null, p.school, p.city].filter(Boolean).join(" · ")}
                  {` · nível ${p.current_level} · ${p.levelsCompleted}/${levels.length} concluídos · ${p.totalScore} pts`}
                </p>
              </div>
              <Badge className={PARTICIPANT_STATUS_BADGE[p.status as CampaignParticipantStatus]}>
                {participantStatusLabel(p.status as CampaignParticipantStatus)}
              </Badge>
              <CompleteLevel participantId={p.id} campaignId={campaignId} levels={levels} />
              <button
                onClick={() => toggle(() => setEligibleAction({ id: p.id, campaignId, eligible: !p.eligible_for_draw }))}
                disabled={isPending}
                title="Elegível para sorteio"
                className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium ${p.eligible_for_draw ? "bg-indigo-100 text-indigo-800" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}
              >
                <Gift className="h-3 w-3" /> {p.eligible_for_draw ? "Elegível" : "Tornar elegível"}
              </button>
              <button
                onClick={() => toggle(() => setWinnerAction({ id: p.id, campaignId, isWinner: !p.is_winner }))}
                disabled={isPending}
                title="Ganhador"
                className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium ${p.is_winner ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}
              >
                <Trophy className="h-3 w-3" /> {p.is_winner ? "Ganhador" : "Marcar ganhador"}
              </button>
              <button
                onClick={() => { if (confirm("Excluir participante?")) toggle(() => deleteParticipantAction({ id: p.id, campaignId })); }}
                disabled={isPending}
                aria-label="Excluir"
                className="text-slate-400 hover:text-rose-600 disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}

function CompleteLevel({ participantId, campaignId, levels }: { participantId: string; campaignId: string; levels: CampaignLevel[] }) {
  const router = useRouter();
  const [levelId, setLevelId] = useState("");
  const [score, setScore] = useState("");
  const [isPending, startTransition] = useTransition();

  if (levels.length === 0) return null;
  return (
    <div className="flex items-center gap-1">
      <Select value={levelId} onChange={(e) => setLevelId(e.target.value)} className="h-8 w-32 text-xs" aria-label="Nível">
        <option value="">Concluir nível…</option>
        {levels.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
      </Select>
      <Input value={score} onChange={(e) => setScore(e.target.value)} placeholder="pts" inputMode="decimal" className="h-8 w-14 text-xs" aria-label="Pontuação" />
      <button
        onClick={() => {
          if (!levelId) return;
          startTransition(async () => {
            await completeLevelAction({ participant_id: participantId, level_id: levelId, campaign_id: campaignId, score });
            setLevelId(""); setScore(""); router.refresh();
          });
        }}
        disabled={isPending || !levelId}
        aria-label="Registrar conclusão"
        className="rounded-md bg-emerald-100 p-1.5 text-emerald-700 hover:bg-emerald-200 disabled:opacity-40"
      >
        <Check className="h-4 w-4" />
      </button>
    </div>
  );
}

function AddParticipant({ campaignId, onClose }: { campaignId: string; onClose: () => void }) {
  const router = useRouter();
  const [f, setF] = useState({ full_name: "", age: "", phone: "", father_name: "", mother_name: "", guardian_name: "", school: "", city: "", status: "inscrito" as CampaignParticipantStatus });
  const [msg, setMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF((p) => ({ ...p, [k]: e.target.value }));

  function save() {
    setMsg(null);
    startTransition(async () => {
      const r = await saveParticipantAction({ campaign_id: campaignId, ...f });
      if (r.error) setMsg(r.error);
      else { onClose(); router.refresh(); }
    });
  }

  return (
    <Card className="border-indigo-200">
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-slate-700">Novo participante</h4>
          <button onClick={onClose} aria-label="Fechar" className="text-slate-400 hover:text-slate-700"><X className="h-4 w-4" /></button>
        </div>
        {msg && <Alert tone="error">{msg}</Alert>}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="sm:col-span-2"><Label>Nome</Label><Input value={f.full_name} onChange={set("full_name")} /></div>
          <div><Label>Idade</Label><Input inputMode="numeric" value={f.age} onChange={set("age")} /></div>
          <div><Label>Telefone</Label><Input value={f.phone} onChange={set("phone")} /></div>
          <div><Label>Nome do pai</Label><Input value={f.father_name} onChange={set("father_name")} /></div>
          <div><Label>Nome da mãe</Label><Input value={f.mother_name} onChange={set("mother_name")} /></div>
          <div><Label>Responsável</Label><Input value={f.guardian_name} onChange={set("guardian_name")} /></div>
          <div><Label>Escola</Label><Input value={f.school} onChange={set("school")} /></div>
          <div><Label>Cidade</Label><Input value={f.city} onChange={set("city")} /></div>
          <div>
            <Label>Status</Label>
            <Select value={f.status} onChange={set("status")}>
              {PARTICIPANT_STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </Select>
          </div>
        </div>
        <Button onClick={save} isLoading={isPending}>Adicionar</Button>
      </CardContent>
    </Card>
  );
}
