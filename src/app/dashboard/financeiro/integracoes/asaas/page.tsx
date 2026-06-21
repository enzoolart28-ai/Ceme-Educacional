import { CheckCircle2, CircleAlert, Landmark } from "lucide-react";
import { requirePermission } from "@/lib/auth/session";
import { getAsaasConfigStatus } from "@/lib/asaas/client";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AsaasConnectionTest } from "@/components/asaas/connection-test";

function ConfigItem({ label, ready }: { label: string; ready: boolean }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 py-3 last:border-0">
      <span className="text-sm text-slate-700">{label}</span>
      <Badge className={ready ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}>
        {ready ? <CheckCircle2 className="mr-1 h-3 w-3" /> : <CircleAlert className="mr-1 h-3 w-3" />}
        {ready ? "Configurado" : "Pendente"}
      </Badge>
    </div>
  );
}

export default async function AsaasIntegrationPage() {
  await requirePermission("finance.manage");
  const config = getAsaasConfigStatus();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "https://seu-dominio.com";
  const webhookUrl = `${appUrl}/api/webhooks/asaas`;

  return (
    <>
      <PageHeader title="Integracao Asaas" description="Boleto, Pix e baixa automatica das mensalidades." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Landmark className="h-5 w-5" /> Configuracao</CardTitle></CardHeader>
          <CardContent>
            <ConfigItem label="ASAAS_API_KEY" ready={config.apiKeyConfigured} />
            <ConfigItem label="ASAAS_WEBHOOK_TOKEN" ready={config.webhookTokenConfigured} />
            <ConfigItem label="Integracao pronta" ready={config.configured} />
            <p className="mt-4 text-sm text-slate-500">Ambiente atual: <strong>{config.environment}</strong></p>
            <p className="mt-1 break-all text-xs text-slate-400">API: {config.baseUrl}</p>
            <div className="mt-5"><AsaasConnectionTest disabled={!config.apiKeyConfigured} /></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Webhook</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-600">
            <p>Cadastre esta URL no painel do Asaas:</p>
            <code className="block break-all rounded bg-slate-100 p-3 text-xs text-slate-800">{webhookUrl}</code>
            <p>Use como token de autenticacao o mesmo valor configurado em <code>ASAAS_WEBHOOK_TOKEN</code>.</p>
            <p>Eventos recomendados: cobranca recebida, confirmada, vencida, estornada e excluida.</p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
