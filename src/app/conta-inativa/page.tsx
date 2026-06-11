import { UserX } from "lucide-react";
import { SignOutButton } from "@/components/layout/sign-out-button";

export default function ContaInativaPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-50 text-amber-500">
        <UserX className="h-8 w-8" />
      </div>
      <h1 className="mt-6 text-2xl font-bold text-slate-900">Conta inativa</h1>
      <p className="mt-2 max-w-md text-sm text-slate-500">
        Sua conta está desativada no momento. Entre em contato com a secretaria
        ou a administração para regularizar o acesso.
      </p>
      <div className="mt-6">
        <SignOutButton />
      </div>
    </main>
  );
}
