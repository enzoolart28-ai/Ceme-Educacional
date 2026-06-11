import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SemPermissaoPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-500">
        <ShieldAlert className="h-8 w-8" />
      </div>
      <h1 className="mt-6 text-2xl font-bold text-slate-900">Acesso negado</h1>
      <p className="mt-2 max-w-md text-sm text-slate-500">
        Seu perfil não tem permissão para acessar esta página. Caso acredite que
        isso é um engano, fale com a administração do sistema.
      </p>
      <Link href="/dashboard" className="mt-6">
        <Button>Voltar ao painel</Button>
      </Link>
    </main>
  );
}
