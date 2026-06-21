import { CheckCircle2, CircleAlert, MessageCircleMore, Webhook } from "lucide-react";
import { requirePermission } from "@/lib/auth/session";
import { getWhatsAppConfigStatus } from "@/lib/whatsapp/client";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { WhatsAppConnectionTest } from "@/components/whatsapp/connection-test";

function ConfigItem({ label, ready }: { label: string; ready: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-100 py-3 last:border-0">
      <span className="break-all text-sm text-slate-700">{label}</span>
      <Badge className={ready ? "shrink-0 bg-emerald-100 text-emerald-800" : "shrink-0 bg-amber-100 text-amber-800"}>
        {ready ? <CheckCircle2 className="mr-1 h-3 w-3" /> : <CircleAlert className="mr-1 h-3 w-3" />}
        {ready ? "Configurado" : "Pendente"}
      </Badge>
    </div>
  );
}

export default async function WhatsAppIntegrationPage() {
  await requirePermission("whatsapp.manage");
  const config = getWhatsAppConfigStatus();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "https://seu-dominio.com";
  const webhookUrl = `${appUrl}/api/webhooks/whatsapp`;
  const canTest = config.apiVersionConfigured
    && config.phoneNumberIdConfigured
    && config.accessTokenConfigured;

  return (
    <>
      <PageHeader
        title="Integracao WhatsApp"
        description="Canal oficial para mensagens, cobrancas e follow-ups."
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircleMore className="h-5 w-5" /> Credenciais Meta
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ConfigItem label="WHATSAPP_GRAPH_API_VERSION" ready={config.apiVersionConfigured} />
            <ConfigItem label="WHATSAPP_PHONE_NUMBER_ID" ready={config.phoneNumberIdConfigured} />
            <ConfigItem label="WHATSAPP_BUSINESS_ACCOUNT_ID" ready={config.businessAccountIdConfigured} />
            <ConfigItem label="WHATSAPP_ACCESS_TOKEN" ready={config.accessTokenConfigured} />
            <ConfigItem label="WHATSAPP_APP_SECRET" ready={config.appSecretConfigured} />
            <ConfigItem label="WHATSAPP_WEBHOOK_VERIFY_TOKEN" ready={config.verifyTokenConfigured} />
            <div className="mt-5"><WhatsAppConnectionTest disabled={!canTest} /></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Webhook className="h-5 w-5" /> Webhook
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-slate-600">
            <div>
              <p className="mb-2 font-medium text-slate-800">URL de retorno</p>
              <code className="block break-all rounded bg-slate-100 p-3 text-xs text-slate-800">{webhookUrl}</code>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="border-l-2 border-emerald-500 pl-3">
                <p className="text-xs text-slate-500">Assinatura</p>
                <p className="font-medium text-slate-800">Validada</p>
              </div>
              <div className="border-l-2 border-sky-500 pl-3">
                <p className="text-xs text-slate-500">Eventos repetidos</p>
                <p className="font-medium text-slate-800">Protegidos</p>
              </div>
            </div>
            <p>Campo do webhook: <code>messages</code></p>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Estrutura preparada</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Contatos", "Opt-in e vinculos com aluno, responsavel ou lead"],
              ["Modelos", "Templates e idiomas aprovados pela Meta"],
              ["Fila", "Agendamento com idempotencia e tentativas"],
              ["Historico", "Envio, entrega, leitura, falha e recebimento"],
            ].map(([title, text]) => (
              <div key={title} className="border-l-2 border-slate-200 pl-3">
                <p className="font-medium text-slate-900">{title}</p>
                <p className="mt-1 text-sm text-slate-500">{text}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
