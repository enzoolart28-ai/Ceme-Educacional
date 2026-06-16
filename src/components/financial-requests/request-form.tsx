import { createFinancialRequestAction } from "@/app/actions/financial-requests";
import { PAYMENT_METHOD_LABELS } from "@/lib/finance/labels";
import { FINANCIAL_REQUEST_PRIORITY_OPTIONS } from "@/lib/financial-requests/labels";
import type { DepartmentOption } from "@/lib/management/queries";
import type { CashRegisterOption } from "@/lib/cash/queries";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

export function FinancialRequestForm({
  departments,
  units,
}: {
  departments: DepartmentOption[];
  units: CashRegisterOption[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Nova solicitacao de saida</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={createFinancialRequestAction} className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <Label htmlFor="title">Titulo</Label>
            <Input id="title" name="title" required />
          </div>
          <div>
            <Label htmlFor="requestedAmount">Valor solicitado</Label>
            <Input id="requestedAmount" name="requestedAmount" type="number" step="0.01" min="0.01" required />
          </div>
          <div>
            <Label htmlFor="requiredDate">Data necessaria</Label>
            <Input id="requiredDate" name="requiredDate" type="date" />
          </div>
          <div>
            <Label htmlFor="departmentId">Setor</Label>
            <Select id="departmentId" name="departmentId">
              <option value="">Nao informado</option>
              {departments.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="unitId">Unidade</Label>
            <Select id="unitId" name="unitId">
              <option value="">Nao informada</option>
              {units
                .filter((unit, index, arr) => unit.unitId && arr.findIndex((u) => u.unitId === unit.unitId) === index)
                .map((unit) => (
                  <option key={unit.unitId ?? unit.id} value={unit.unitId ?? ""}>
                    {unit.unitName ?? unit.name}
                  </option>
                ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="expenseCategory">Categoria</Label>
            <Input id="expenseCategory" name="expenseCategory" placeholder="Compra de material" required />
          </div>
          <div>
            <Label htmlFor="desiredPaymentMethod">Forma desejada</Label>
            <Select id="desiredPaymentMethod" name="desiredPaymentMethod" defaultValue="pix">
              {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="beneficiaryName">Fornecedor / beneficiario</Label>
            <Input id="beneficiaryName" name="beneficiaryName" />
          </div>
          <div>
            <Label htmlFor="beneficiaryDocument">CPF/CNPJ</Label>
            <Input id="beneficiaryDocument" name="beneficiaryDocument" />
          </div>
          <div>
            <Label htmlFor="priority">Prioridade</Label>
            <Select id="priority" name="priority" defaultValue="media">
              {FINANCIAL_REQUEST_PRIORITY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="attachmentUrl">Anexo / orcamento (URL)</Label>
            <Input id="attachmentUrl" name="attachmentUrl" type="url" />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="justification">Justificativa</Label>
            <textarea
              id="justification"
              name="justification"
              required
              className="min-h-24 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="description">Descricao detalhada</Label>
            <textarea
              id="description"
              name="description"
              className="min-h-20 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="flex gap-2 md:col-span-2">
            <Button type="submit" name="submit" value="false" variant="secondary">
              Salvar rascunho
            </Button>
            <Button type="submit" name="submit" value="true">
              Enviar solicitacao
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

