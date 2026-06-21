"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { Copy, ExternalLink, Landmark, QrCode } from "lucide-react";
import { createAsaasChargeAction } from "@/app/actions/asaas";
import type { AsaasChargeRow } from "@/lib/asaas/charges";
import type { AsaasBillingType } from "@/lib/asaas/types";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function AsaasChargeCard({
  invoiceId,
  charge,
  configured,
}: {
  invoiceId: string;
  charge: AsaasChargeRow | null;
  configured: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function generate(type: AsaasBillingType) {
    setError(null);
    startTransition(async () => {
      const result = await createAsaasChargeAction(invoiceId, type);
      if (result.error) setError(result.error);
      else window.location.reload();
    });
  }

  async function copyPix() {
    if (!charge?.pixPayload) return;
    await navigator.clipboard.writeText(charge.pixPayload);
    setCopied(true);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Landmark className="h-5 w-5" /> Cobranca Asaas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && <Alert tone="error">{error}</Alert>}
        {!configured && (
          <Alert tone="warning">Configure a chave e o token do Asaas antes de gerar cobrancas.</Alert>
        )}

        {!charge ? (
          <div className="grid gap-2 sm:grid-cols-3">
            <Button type="button" variant="outline" disabled={!configured} isLoading={isPending} onClick={() => generate("BOLETO")}>
              Gerar boleto
            </Button>
            <Button type="button" variant="outline" disabled={!configured} isLoading={isPending} onClick={() => generate("PIX")}>
              <QrCode className="h-4 w-4" /> Gerar Pix
            </Button>
            <Button type="button" disabled={!configured} isLoading={isPending} onClick={() => generate("UNDEFINED")}>
              Boleto + Pix
            </Button>
          </div>
        ) : (
          <div className="space-y-3 text-sm">
            <div className="grid gap-2 sm:grid-cols-2">
              <p><span className="font-medium">Status:</span> {charge.status}</p>
              <p><span className="font-medium">Ambiente:</span> {charge.environment}</p>
              <p><span className="font-medium">Forma:</span> {charge.billingType}</p>
              <p><span className="font-medium">ID Asaas:</span> {charge.paymentId}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {charge.invoiceUrl && (
                <a href={charge.invoiceUrl} target="_blank" rel="noreferrer">
                  <Button type="button" variant="outline"><ExternalLink className="h-4 w-4" /> Abrir cobranca</Button>
                </a>
              )}
              {charge.bankSlipUrl && (
                <a href={charge.bankSlipUrl} target="_blank" rel="noreferrer">
                  <Button type="button" variant="outline"><ExternalLink className="h-4 w-4" /> Abrir boleto</Button>
                </a>
              )}
              {charge.pixPayload && (
                <Button type="button" variant="outline" onClick={copyPix}>
                  <Copy className="h-4 w-4" /> {copied ? "Pix copiado" : "Copiar Pix"}
                </Button>
              )}
            </div>
            {charge.pixEncodedImage && (
              <Image
                src={`data:image/png;base64,${charge.pixEncodedImage}`}
                alt="QR Code Pix da cobranca"
                width={180}
                height={180}
                unoptimized
              />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
