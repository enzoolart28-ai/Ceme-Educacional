import Link from "next/link";
import { UsersRound } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function ResponsavelDashboard() {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
          <UsersRound className="h-6 w-6" />
        </div>
        <div>
          <p className="font-medium text-slate-800">Meus dependentes</p>
          <p className="text-sm text-slate-500">Acompanhe frequência, notas e boletim dos seus dependentes.</p>
        </div>
        <Link
          href="/dashboard/dependentes"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Ver meus dependentes
        </Link>
      </CardContent>
    </Card>
  );
}
