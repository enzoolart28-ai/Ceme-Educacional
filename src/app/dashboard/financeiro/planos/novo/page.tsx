import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requirePermission } from "@/lib/auth/session";
import { listCourses } from "@/lib/courses/queries";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { FinancialPlanForm } from "@/components/finance/financial-plan-form";

export default async function NewFinancialPlanPage() {
  await requirePermission("finance.manage");
  const courses = await listCourses();

  return (
    <>
      <Link href="/dashboard/financeiro/planos">
        <Button variant="ghost" className="mb-4">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Button>
      </Link>
      <PageHeader title="Novo plano financeiro" description="Cadastre valores e condições." />
      <FinancialPlanForm
        mode="create"
        courses={courses.map((course) => ({ id: course.id, name: course.name }))}
        defaultValues={{
          name: "",
          course_id: "",
          total_value: "",
          installments: "1",
          due_day: "10",
          discount_value: "0",
          scholarship_percentage: "0",
          notes: "",
        }}
      />
    </>
  );
}

