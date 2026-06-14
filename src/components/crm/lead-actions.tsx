"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Send, GraduationCap, Trash2, CheckCircle2 } from "lucide-react";
import {
  setLeadStatusAction,
  addInteractionAction,
  convertLeadAction,
  deleteLeadAction,
} from "@/app/actions/crm";
import { STATUS_OPTIONS, INTERACTION_TYPE_OPTIONS } from "@/lib/crm/labels";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import type { LeadStatus, LeadInteractionType } from "@/types/models";

const textareaClass =
  "flex w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500";

export function LeadStatusSelect({ id, status }: { id: string; status: LeadStatus }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  return (
    <Select
      value={status}
      disabled={isPending}
      aria-label="Status do lead"
      className="w-auto"
      onChange={(e) =>
        startTransition(async () => {
          await setLeadStatusAction({ id, status: e.target.value });
          router.refresh();
        })
      }
    >
      {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </Select>
  );
}

export function InteractionForm({ leadId }: { leadId: string }) {
  const router = useRouter();
  const [type, setType] = useState<LeadInteractionType>("ligacao");
  const [description, setDescription] = useState("");
  const [next, setNext] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit() {
    setMsg(null);
    startTransition(async () => {
      const result = await addInteractionAction({
        lead_id: leadId,
        interaction_type: type,
        description,
        next_contact_at: next ? `${next}:00-03:00` : "",
      });
      if (result.error) setMsg(result.error);
      else {
        setDescription("");
        setNext("");
        router.refresh();
      }
    });
  }

  return (
    <Card>
      <CardContent className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-700">Registrar atendimento</h3>
        {msg && <Alert tone="error">{msg}</Alert>}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="i_type">Tipo</Label>
            <Select id="i_type" value={type} onChange={(e) => setType(e.target.value as LeadInteractionType)}>
              {INTERACTION_TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </Select>
          </div>
          <div>
            <Label htmlFor="i_next">Agendar retorno (opcional)</Label>
            <input id="i_next" type="datetime-local" value={next} onChange={(e) => setNext(e.target.value)} className="flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm" />
          </div>
        </div>
        <div>
          <Label htmlFor="i_desc">Descrição</Label>
          <textarea id="i_desc" rows={2} className={textareaClass} value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <Button onClick={submit} isLoading={isPending}>
          <Send className="h-4 w-4" /> Registrar
        </Button>
      </CardContent>
    </Card>
  );
}

export function ConvertLead({
  leadId,
  classes,
  convertedStudentId,
}: {
  leadId: string;
  classes: { id: string; name: string }[];
  convertedStudentId: string | null;
}) {
  const router = useRouter();
  const [classId, setClassId] = useState("");
  const [msg, setMsg] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  if (convertedStudentId) {
    return (
      <Card>
        <CardContent className="flex items-center gap-2 text-sm text-emerald-700">
          <CheckCircle2 className="h-5 w-5" /> Lead já convertido em aluno.
        </CardContent>
      </Card>
    );
  }

  function convert() {
    setMsg(null);
    startTransition(async () => {
      const result = await convertLeadAction({ leadId, classId: classId || undefined });
      if (result.error) setMsg({ tone: "error", text: result.error });
      else {
        setMsg({ tone: "success", text: "Convertido com sucesso!" });
        router.refresh();
      }
    });
  }

  return (
    <Card>
      <CardContent className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-700">Converter em aluno</h3>
        {msg && <Alert tone={msg.tone}>{msg.text}</Alert>}
        <div>
          <Label htmlFor="conv_class">Matricular em uma turma (opcional)</Label>
          <Select id="conv_class" value={classId} onChange={(e) => setClassId(e.target.value)}>
            <option value="">Só criar o aluno (sem turma)</option>
            {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
        </div>
        <Button onClick={convert} isLoading={isPending}>
          <GraduationCap className="h-4 w-4" /> {classId ? "Converter em matrícula" : "Converter em aluno"}
        </Button>
      </CardContent>
    </Card>
  );
}

export function LeadDeleteButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();
  function remove() {
    if (!confirm("Excluir este lead? (somente admin)")) return;
    startTransition(() => {
      void deleteLeadAction({ id });
    });
  }
  return (
    <Button variant="danger" onClick={remove} isLoading={isPending}>
      <Trash2 className="h-4 w-4" /> Excluir
    </Button>
  );
}
