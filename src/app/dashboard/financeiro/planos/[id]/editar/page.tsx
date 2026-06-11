import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requirePermission } from "@/lib/auth/session";
import { listCourses } from "@/lib/courses/queries";
import { getFinancialPlanById } from "@/lib/finance/queries";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { FinancialPlanForm } from "@/components/finance/financial-plan-form";

export default async function EditFinancialPlanPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermission("finance.manage");
  const { id } = await params;
  const [plan, courses] = await Promise.all([getFinancialPlanById(id), listCourses()]);
  if (!plan) notFound();

  return (
    <>
      <Link href="/dashboard/financeiro/planos">
        <Button variant="ghost" className="mb-4">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Button>
      </Link>
      <PageHeader title="Editar plano financeiro" description={plan.name} />
      <FinancialPlanForm
        mode="edit"
        planId={plan.id}
        courses={courses.map((course) => ({ id: course.id, name: course.name }))}
        defaultValues={{
          name: plan.name,
          course_id: plan.course_id ?? "",
          total_value: String(plan.total_value),
          installments: String(plan.installments),
          due_day: String(plan.due_day),
          discount_value: String(plan.discount_value),
          scholarship_percentage: String(plan.scholarship_percentage),
          notes: plan.notes ?? "",
        }}
      />
    </>
  );
}

