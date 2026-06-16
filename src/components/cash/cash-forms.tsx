import {
  closeCashSessionAction,
  createCashMovementAction,
  openCashSessionAction,
  reviewCashSessionAction,
} from "@/app/actions/cash";
import { CASH_MOVEMENT_TYPE_OPTIONS } from "@/lib/cash/labels";
import { PAYMENT_METHOD_LABELS } from "@/lib/finance/labels";
import type { CashRegisterOption, CashSessionRow } from "@/lib/cash/queries";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

export function OpenCashSessionForm({ registers }: { registers: CashRegisterOption[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Abertura de caixa</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={openCashSessionAction} className="grid gap-3 md:grid-cols-2">
          <div>
            <Label htmlFor="cashRegisterId">Caixa</Label>
            <Select id="cashRegisterId" name="cashRegisterId" required>
              <option value="">Selecione</option>
              {registers.map((register) => (
                <option key={register.id} value={register.id}>
                  {register.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="unitId">Unidade</Label>
            <Select id="unitId" name="unitId">
              <option value="">Padrao do caixa</option>
              {registers
                .filter((register, index, arr) => register.unitId && arr.findIndex((r) => r.unitId === register.unitId) === index)
                .map((register) => (
                  <option key={register.unitId ?? register.id} value={register.unitId ?? ""}>
                    {register.unitName}
                  </option>
                ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="openingBalance">Saldo inicial</Label>
            <Input id="openingBalance" name="openingBalance" type="number" step="0.01" min="0" defaultValue="0" />
          </div>
          <div className="flex items-end">
            <Button type="submit">Abrir caixa</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export function CashMovementForm({ sessions }: { sessions: CashSessionRow[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Nova movimentacao</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={createCashMovementAction} className="grid gap-3 md:grid-cols-2">
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
            <Label htmlFor="movementType">Tipo</Label>
            <Select id="movementType" name="movementType" defaultValue="entry">
              {CASH_MOVEMENT_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="category">Categoria</Label>
            <Input id="category" name="category" required />
          </div>
          <div>
            <Label htmlFor="amount">Valor</Label>
            <Input id="amount" name="amount" type="number" step="0.01" min="0.01" required />
          </div>
          <div>
            <Label htmlFor="paymentMethod">Forma</Label>
            <Select id="paymentMethod" name="paymentMethod" defaultValue="cash">
              {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="attachmentUrl">Comprovante (URL)</Label>
            <Input id="attachmentUrl" name="attachmentUrl" type="url" />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="description">Descricao</Label>
            <Input id="description" name="description" />
          </div>
          <Button type="submit">Registrar movimentacao</Button>
        </form>
      </CardContent>
    </Card>
  );
}

export function CloseCashSessionForm({ sessions }: { sessions: CashSessionRow[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Fechamento de caixa</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={closeCashSessionAction} className="grid gap-3 md:grid-cols-2">
          <div>
            <Label htmlFor="cashSessionIdClose">Caixa aberto</Label>
            <Select id="cashSessionIdClose" name="cashSessionId" required>
              <option value="">Selecione</option>
              {sessions.map((session) => (
                <option key={session.id} value={session.id}>
                  {session.cashRegisterName}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="informedClosingBalance">Saldo contado</Label>
            <Input id="informedClosingBalance" name="informedClosingBalance" type="number" step="0.01" min="0" required />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="differenceReason">Justificativa da diferenca</Label>
            <Input id="differenceReason" name="differenceReason" />
          </div>
          <Button type="submit">Fechar caixa</Button>
        </form>
      </CardContent>
    </Card>
  );
}

export function ReviewCashSessionForm({ sessionId }: { sessionId: string }) {
  return (
    <form action={reviewCashSessionAction} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="cashSessionId" value={sessionId} />
      <Select name="status" defaultValue="approved" className="w-40">
        <option value="approved">Aprovar</option>
        <option value="rejected">Reprovar</option>
        <option value="under_review">Conferir novamente</option>
      </Select>
      <Input name="notes" placeholder="Observacao" className="w-56" required />
      <Button type="submit" size="sm">Salvar</Button>
    </form>
  );
}

