import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requirePermission } from "@/lib/auth/session";
import { PageHeader } from "@/components/ui/page-header";
import { GuardianForm } from "@/components/guardians/guardian-form";

export default async function NovoResponsavelPage() {
  await requirePermission("guardians.manage");

  return (
    <>
      <Link
        href="/dashboard/responsaveis"
        className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar para responsáveis
      </Link>
      <PageHeader title="Novo responsável" description="Cadastre um novo responsável." />
      <GuardianForm
        mode="create"
        defaultValues={{
          full_name: "",
          cpf: "",
          rg: "",
          phone: "",
          email: "",
          address: "",
          city: "",
          state: "",
          kinship: "",
          notes: "",
        }}
      />
    </>
  );
}
