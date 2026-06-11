import { requireAuth } from "@/lib/auth/session";
import { formatDateTime } from "@/lib/utils";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RoleBadge, StatusBadge } from "@/components/ui/badge";
import { ProfileForm } from "@/components/profile/profile-form";

export default async function PerfilPage() {
  const profile = await requireAuth();

  return (
    <>
      <PageHeader
        title="Meu Perfil"
        description="Visualize e edite suas informações pessoais."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Resumo da conta (somente leitura) */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Conta</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="text-slate-500">E-mail</p>
              <p className="font-medium text-slate-900">{profile.email}</p>
            </div>
            <div>
              <p className="text-slate-500">Perfil de acesso</p>
              <div className="mt-1">
                <RoleBadge role={profile.role} />
              </div>
            </div>
            <div>
              <p className="text-slate-500">Status</p>
              <div className="mt-1">
                <StatusBadge status={profile.status} />
              </div>
            </div>
            <div>
              <p className="text-slate-500">Último acesso</p>
              <p className="font-medium text-slate-900">
                {formatDateTime(profile.last_access_at)}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Edição dos dados pessoais */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Dados pessoais</CardTitle>
          </CardHeader>
          <CardContent>
            <ProfileForm
              defaultValues={{
                full_name: profile.full_name,
                phone: profile.phone ?? "",
              }}
            />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
