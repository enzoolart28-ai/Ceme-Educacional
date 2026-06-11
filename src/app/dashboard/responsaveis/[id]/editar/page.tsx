import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requirePermission } from "@/lib/auth/session";
import { getGuardianById } from "@/lib/guardians/queries";
import { PageHeader } from "@/components/ui/page-header";
import { GuardianForm } from "@/components/guardians/guardian-form";

export default async function EditarResponsavelPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requirePermission("guardians.manage");

  const g = await getGuardianById(id);
  if (!g) notFound();

  return (
    <>
      <Link
        href={`/dashboard/responsaveis/${id}`}
        className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar para o responsável
      </Link>
      <PageHeader title={`Editar: ${g.full_name}`} description="Atualize os dados do responsável." />
      <GuardianForm
        mode="edit"
        guardianId={id}
        defaultValues={{
          full_name: g.full_name,
          cpf: g.cpf ?? "",
          rg: g.rg ?? "",
          phone: g.phone ?? "",
          email: g.email ?? "",
          address: g.address ?? "",
          city: g.city ?? "",
          state: g.state ?? "",
          kinship: g.kinship ?? "",
          notes: g.notes ?? "",
        }}
      />
    </>
  );
}
