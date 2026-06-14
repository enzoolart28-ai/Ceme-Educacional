"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Check, UserPlus, GraduationCap, Copy, Link2 } from "lucide-react";
import {
  deleteEventAction,
  setAttendanceAction,
  convertRegistrationToLeadAction,
  convertRegistrationToStudentAction,
} from "@/app/actions/events";
import { Button } from "@/components/ui/button";

export function EventDeleteButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();
  function remove() {
    if (!confirm("Excluir este evento e suas inscrições?")) return;
    startTransition(() => {
      void deleteEventAction({ id });
    });
  }
  return (
    <Button variant="danger" onClick={remove} isLoading={isPending}>
      <Trash2 className="h-4 w-4" /> Excluir
    </Button>
  );
}

export function AttendanceToggle({
  registrationId,
  eventId,
  attended,
}: {
  registrationId: string;
  eventId: string;
  attended: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  return (
    <button
      onClick={() =>
        startTransition(async () => {
          await setAttendanceAction({ registrationId, eventId, attended: !attended });
          router.refresh();
        })
      }
      disabled={isPending}
      className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium ${
        attended ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
      } disabled:opacity-50`}
    >
      <Check className="h-3 w-3" /> {attended ? "Presente" : "Marcar presença"}
    </button>
  );
}

export function RegistrationConvert({
  registrationId,
  eventId,
  convertedToLead,
  convertedToStudent,
}: {
  registrationId: string;
  eventId: string;
  convertedToLead: boolean;
  convertedToStudent: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  function toLead() {
    startTransition(async () => {
      const r = await convertRegistrationToLeadAction({ registrationId, eventId });
      if (r.error) setMsg(r.error);
      else router.refresh();
    });
  }
  function toStudent() {
    startTransition(async () => {
      const r = await convertRegistrationToStudentAction({ registrationId, eventId });
      if (r.error) setMsg(r.error);
      else router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-1">
      {convertedToLead ? (
        <span className="inline-flex items-center gap-1 text-xs text-amber-700"><UserPlus className="h-3 w-3" /> Lead</span>
      ) : (
        <button onClick={toLead} disabled={isPending} className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-amber-700 hover:bg-amber-50 disabled:opacity-50">
          <UserPlus className="h-3 w-3" /> → Lead
        </button>
      )}
      {convertedToStudent ? (
        <span className="inline-flex items-center gap-1 text-xs text-emerald-700"><GraduationCap className="h-3 w-3" /> Aluno</span>
      ) : (
        <button onClick={toStudent} disabled={isPending} className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-50 disabled:opacity-50">
          <GraduationCap className="h-3 w-3" /> → Aluno
        </button>
      )}
      {msg && <span className="text-xs text-rose-600">{msg}</span>}
    </div>
  );
}

export function PublicLink({ eventId }: { eventId: string }) {
  const [copied, setCopied] = useState(false);
  const url = typeof window !== "undefined" ? `${window.location.origin}/eventos/${eventId}` : `/eventos/${eventId}`;

  function copy() {
    void navigator.clipboard?.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
      <Link2 className="h-4 w-4 shrink-0 text-slate-400" />
      <a href={`/eventos/${eventId}`} target="_blank" rel="noopener noreferrer" className="min-w-0 flex-1 truncate text-indigo-700 hover:underline">
        Página pública de inscrição
      </a>
      <button onClick={copy} className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-900">
        <Copy className="h-3 w-3" /> {copied ? "Copiado!" : "Copiar link"}
      </button>
    </div>
  );
}
