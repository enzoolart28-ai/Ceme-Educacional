import Link from "next/link";
import { ArrowLeft, Building2, Scale, ListChecks } from "lucide-react";
import { requirePermission } from "@/lib/auth/session";
import {
  getAtSettings,
  getAtFileUrl,
  listAtCriteria,
  groupCriteriaBySection,
} from "@/lib/aula-teste/queries";
import { AT_WEIGHT_SECTIONS, type AtWeightSection } from "@/lib/aula-teste/labels";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { SettingsForm } from "@/components/aula-teste/settings-form";
import { WeightsForm } from "@/components/aula-teste/weights-form";
import { CriteriaManager } from "@/components/aula-teste/criteria-manager";

const DEFAULT_WEIGHTS: Record<AtWeightSection, number> = {
  curricular: 15,
  plano_aula: 15,
  didatica: 25,
  dominio: 20,
  professor_atual: 10,
  alunos: 10,
  pais: 5,
};

function SectionTitle({ icon: Icon, title, hint }: { icon: typeof Building2; title: string; hint: string }) {
  return (
    <div className="mb-3 flex items-start gap-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <h2 className="font-semibold text-slate-900">{title}</h2>
        <p className="text-xs text-slate-500">{hint}</p>
      </div>
    </div>
  );
}

export default async function AulaTesteConfigPage() {
  await requirePermission("aulateste.manage");
  const settings = await getAtSettings();
  const [logoUrl, criteria] = await Promise.all([
    getAtFileUrl(settings?.logo_path ?? null),
    listAtCriteria(),
  ]);
  const grouped = groupCriteriaBySection(criteria);

  const rawWeights = (settings?.default_weights ?? {}) as Record<string, number>;
  const weights = Object.fromEntries(
    AT_WEIGHT_SECTIONS.map((s) => [s, Number(rawWeights[s] ?? DEFAULT_WEIGHTS[s])]),
  ) as Record<AtWeightSection, number>;

  return (
    <>
      <Link href="/dashboard/aula-teste" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-4 w-4" /> Voltar para aula-teste
      </Link>
      <PageHeader
        title="Configurações da Aula-Teste"
        description="Cabeçalho institucional, pesos das avaliações e catálogo de critérios."
      />

      <div className="space-y-6">
        <Card>
          <CardContent>
            <SectionTitle icon={Building2} title="Identificação da instituição" hint="Aparece no cabeçalho e na capa do relatório." />
            <SettingsForm
              logoUrl={logoUrl}
              defaultValues={{
                institution_name: settings?.institution_name ?? "",
                cnpj: settings?.cnpj ?? "",
                address: settings?.address ?? "",
                phone: settings?.phone ?? "",
                email: settings?.email ?? "",
                sector: settings?.sector ?? "",
              }}
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <SectionTitle icon={Scale} title="Pesos das avaliações" hint="Definem a média ponderada da nota final. Editáveis." />
            <WeightsForm defaultWeights={weights} />
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <SectionTitle icon={ListChecks} title="Catálogo de critérios" hint="Critérios avaliados em cada seção. Adicione, edite ou desative." />
            <CriteriaManager grouped={grouped} />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
