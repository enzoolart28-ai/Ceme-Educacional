import { Users, AlertTriangle } from "lucide-react";
import { requireRole, getProfile, MANAGEMENT_ROLES } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { listUsers } from "@/lib/users/queries";
import {
  ROLE_LABELS,
  ROLE_BADGE_CLASSES,
  STATUS_LABELS,
  STATUS_BADGE_CLASSES,
} from "@/lib/auth/roles";
import { formatDate } from "@/lib/utils";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { UserCreateForm } from "@/components/users/user-create-form";
import { UserActions } from "@/components/users/user-actions";
import type { UserRole, UserStatus } from "@/types/models";

export default async function UsuariosPage() {
  const me = await requireRole(MANAGEMENT_ROLES);
  const profile = await getProfile();
  const canManage = profile ? hasPermission(profile.role, "users.manage") : false;
  const { users, error } = await listUsers();

  return (
    <>
      <PageHeader
        title="Usuários"
        description="Gerencie contas, perfis e permissões dos usuários do sistema."
      />

      {canManage && <UserCreateForm />}

      {error ? (
        <Card className="border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div className="space-y-1 text-sm">
              <p className="font-medium text-amber-900">
                Não foi possível carregar a lista de usuários.
              </p>
              <p className="text-amber-800">
                Os usuários <strong>não foram apagados</strong> — esta tela usa a chave de
                servidor (SUPABASE_SERVICE_ROLE_KEY) para ler os perfis, e ela está
                indisponível ou incorreta no ambiente. Corrija essa variável e refaça o deploy.
              </p>
              <p className="text-xs text-amber-700">Detalhe técnico: {error}</p>
            </div>
          </div>
        </Card>
      ) : users.length === 0 ? (
        <EmptyState icon={Users} title="Nenhum usuário" description="Crie o primeiro usuário acima." />
      ) : (
        <Card className="divide-y divide-slate-100">
          {users.map((u) => (
            <div key={u.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-slate-900">{u.full_name || "—"}</p>
                <p className="truncate text-xs text-slate-500">{u.email}</p>
              </div>
              <Badge className={ROLE_BADGE_CLASSES[u.role as UserRole]}>{ROLE_LABELS[u.role as UserRole]}</Badge>
              <Badge className={STATUS_BADGE_CLASSES[u.status as UserStatus]}>{STATUS_LABELS[u.status as UserStatus]}</Badge>
              <span className="hidden text-xs text-slate-400 sm:inline">
                {u.last_access_at ? `Acesso: ${formatDate(u.last_access_at)}` : "Nunca acessou"}
              </span>
              {canManage && (
                <UserActions
                  profileId={u.id}
                  userId={u.user_id}
                  role={u.role as UserRole}
                  status={u.status as UserStatus}
                  isSelf={u.id === me.id}
                />
              )}
            </div>
          ))}
        </Card>
      )}
    </>
  );
}
