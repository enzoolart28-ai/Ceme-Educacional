import Link from "next/link";
import { Wallet } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function FinanceiroDashboard() {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
          <Wallet className="h-6 w-6" />
        </div>
        <div>
          <p className="font-medium text-slate-800">Financeiro</p>
          <p className="text-sm text-slate-500">Cobranças, planos e relatórios financeiros estão no módulo Financeiro.</p>
        </div>
        <Link
          href="/dashboard/financeiro"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Abrir Financeiro
        </Link>
      </CardContent>
    </Card>
  );
}
