import {
  decideFinancialRequestAction,
  payFinancialRequestAction,
} from "@/app/actions/financial-requests";
import { PAYMENT_METHOD_LABELS } from "@/lib/finance/labels";
import type { CashSessionRow } from "@/lib/cash/queries";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

export function ManagerDecisionForm({ requestId }: { requestId: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Analise do Gestor</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={decideFinancialRequestAction} className="grid gap-3">
          <input type="hidden" name="requestId" value={requestId} />
          <div>
            <Label htmlFor="decision">Decisao</Label>
            <Select id="decision" name="decision" defaultValue="approved">
              <option value="approved">Aprovar</option>
              <option value="partially_approved">Aprovar parcialmente</option>
              <option value="rejected">Recusar</option>
              <option value="needs_information">Solicitar informacao</option>
              <option value="returned_for_correction">Devolver para correcao</option>
              <option value="forwarded_to_direction">Encaminhar para direcao</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="approvedAmount">Valor aprovado</Label>
            <Input id="approvedAmount" name="approvedAmount" type="number" step="0.01" min="0" />
          </div>
          <div>
            <Label htmlFor="reason">Justificativa / observacao</Label>
            <textarea
              id="reason"
              name="reason"
              required
              className="min-h-20 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <Button type="submit">Registrar decisao</Button>
        </form>
      </CardContent>
    </Card>
  );
}

export function PaymentRequestForm({
  requestId,
  sessions,
}: {
  requestId: string;
  sessions: CashSessionRow[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Pagamento pelo Financeiro</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={payFinancialRequestAction} className="grid gap-3">
          <input type="hidden" name="requestId" value={requestId} />
          <div>
            <Label htmlFor="cashSessionId">Caixa aberto</Label>
            <Select id="cashSessionId" name="cashSessionId" required>
              <option value="">Selecione</option>
              {sessions.map((session) => (
                <option key={session.id} value={session.id}>
                  {session.cashRegisterName} - {session.openedByName}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="paidAmount">Valor pago</Label>
            <Input id="paidAmount" name="paidAmount" type="number" step="0.01" min="0.01" required />
          </div>
          <div>
            <Label htmlFor="paymentMethod">Forma de pagamento</Label>
            <Select id="paymentMethod" name="paymentMethod" defaultValue="pix">
              {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="paymentProofUrl">Comprovante (URL)</Label>
            <Input id="paymentProofUrl" name="paymentProofUrl" type="url" required />
          </div>
          <div>
            <Label htmlFor="notes">Observacao</Label>
            <Input id="notes" name="notes" />
          </div>
          <Button type="submit">Registrar pagamento</Button>
        </form>
      </CardContent>
    </Card>
  );
}

