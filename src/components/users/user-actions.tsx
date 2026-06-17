"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Trash2, Power } from "lucide-react";
import {
  setUserRoleAction,
  setUserStatusAction,
  resetUserPasswordAction,
  deleteUserAction,
} from "@/app/actions/users";
import { ALL_ROLES, ROLE_LABELS } from "@/lib/auth/roles";
import { Select } from "@/components/ui/select";
import type { UserRole, UserStatus } from "@/types/models";

export function UserActions({
  profileId,
  userId,
  role,
  status,
  isSelf,
}: {
  profileId: string;
  userId: string | null;
  role: UserRole;
  status: UserStatus;
  isSelf: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function run(fn: () => Promise<{ error?: string }>) {
    startTransition(async () => {
      const r = await fn();
      if (r?.error) alert(r.error);
      router.refresh();
    });
  }

  if (isSelf) {
    return <span className="text-xs text-slate-400">Você</span>;
  }

  const btn = "inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium disabled:opacity-50";

  return (
    <div className="flex flex-wrap items-center justify-end gap-1.5">
      <Select
        value={role}
        disabled={isPending}
        onChange={(e) => run(() => setUserRoleAction({ profileId, role: e.target.value }))}
        aria-label="Perfil"
        className="h-8 w-40 text-xs"
      >
        {ALL_ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
      </Select>

      <button
        className={`${btn} ${status === "active" ? "bg-amber-100 text-amber-700 hover:bg-amber-200" : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"}`}
        disabled={isPending}
        onClick={() => run(() => setUserStatusAction({ profileId, status: status === "active" ? "inactive" : "active" }))}
      >
        <Power className="h-3 w-3" /> {status === "active" ? "Inativar" : "Ativar"}
      </button>

      <button
        className={`${btn} bg-slate-100 text-slate-600 hover:bg-slate-200`}
        disabled={isPending || !userId}
        onClick={() => {
          if (!userId) return;
          const pwd = window.prompt("Nova senha (mínimo 8 caracteres):");
          if (!pwd) return;
          if (pwd.length < 8) return alert("A senha deve ter ao menos 8 caracteres.");
          run(() => resetUserPasswordAction({ user_id: userId, password: pwd }));
        }}
      >
        <KeyRound className="h-3 w-3" /> Senha
      </button>

      <button
        className={`${btn} text-slate-400 hover:text-rose-600`}
        disabled={isPending || !userId}
        onClick={() => {
          if (!userId) return;
          if (!confirm("Excluir este usuário? Esta ação não pode ser desfeita.")) return;
          run(() => deleteUserAction({ profileId, user_id: userId }));
        }}
        aria-label="Excluir"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
