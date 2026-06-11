import Link from "next/link";
import { Plus, Receipt } from "lucide-react";
import { requireRole, FINANCE_ROLES } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { listClasses, listUnits } from "@/lib/classes/queries";
import { listCourses } from "@/lib/courses/queries";
import { listStudents } from "@/lib/students/queries";
import { listInvoices } from "@/lib/finance/queries";
import { formatDateOnly, formatMoney } from "@/lib/finance/format";
import { INVOICE_STATUS, PAYMENT_METHOD_LABELS, type InvoiceStatus } from "@/lib/finance/labels";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/ui/data-table";
import { InvoiceFilters } from "@/components/finance/invoice-filters";
import { InvoiceStatusBadge } from "@/components/finance/invoice-status-badge";
import type { InvoiceFilters as InvoiceFilterValues, InvoiceRow } from "@/lib/finance/queries";

function statusFrom(value?: string): InvoiceStatus | undefined {
  return value && (INVOICE_STATUS as readonly string[]).includes(value)
    ? (value as InvoiceStatus)
    : undefined;
}

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{
    studentId?: string;
    courseId?: string;
    classId?: string;
    unitId?: string;
    status?: string;
    dueFrom?: string;
    dueTo?: string;
  }>;
}) {
  const profile = await requireRole(FINANCE_ROLES);
  const canManage = hasPermission(profile.role, "finance.manage");
  const sp = await searchParams;
  const filters: InvoiceFilterValues = {
    studentId: sp.studentId || undefined,
    courseId: sp.courseId || undefined,
    classId: sp.classId || undefined,
    unitId: sp.unitId || undefined,
    status: statusFrom(sp.status),
    dueFrom: sp.dueFrom || undefined,
    dueTo: sp.dueTo || undefined,
  };

  const [invoices, students, courses, classes, units] = await Promise.all([
    listInvoices(filters),
    listStudents(),
    listCourses(),
    listClasses(),
    listUnits(),
  ]);

  const columns: Column<InvoiceRow>[] = [
    {
      header: "Aluno",
      cell: (invoice) => (
        <Link
          href={`/dashboard/financeiro/cobrancas/${invoice.id}`}
          className="font-medium text-indigo-700 hover:underline"
        >
          {invoice.studentName}
        </Link>
      ),
    },
    { header: "Curso", cell: (invoice) => invoice.courseName ?? "—" },
    { header: "Turma", cell: (invoice) => invoice.className ?? "—" },
    { header: "Unidade", cell: (invoice) => invoice.unitName ?? "—" },
    { header: "Vencimento", cell: (invoice) => formatDateOnly(invoice.due_date) },
    { header: "Valor final", cell: (invoice) => formatMoney(invoice.final_value) },
    { header: "Pago", cell: (invoice) => formatMoney(invoice.paidAmount) },
    {
      header: "Forma",
      cell: (invoice) =>
        invoice.latestPaymentMethod
          ? PAYMENT_METHOD_LABELS[invoice.latestPaymentMethod]
          : "—",
    },
    { header: "Status", cell: (invoice) => <InvoiceStatusBadge status={invoice.status} /> },
  ];

  return (
    <>
      <PageHeader
        title="Cobranças"
        description="Mensalidades, inadimplência, pagamentos e baixas."
        action={
          canManage ? (
            <Link href="/dashboard/financeiro/cobrancas/gerar">
              <Button>
                <Plus className="h-4 w-4" /> Gerar mensalidades
              </Button>
            </Link>
          ) : undefined
        }
      />
      <InvoiceFilters
        filters={filters}
        students={students.map((student) => ({ id: student.id, full_name: student.full_name }))}
        courses={courses.map((course) => ({ id: course.id, name: course.name }))}
        classes={classes.map((item) => ({ id: item.id, name: item.name }))}
        units={units.map((unit) => ({ id: unit.id, name: unit.name }))}
      />
      <p className="mb-3 text-sm text-slate-500">
        {invoices.length} cobrança(s) encontrada(s)
      </p>
      <DataTable
        columns={columns}
        data={invoices}
        getRowKey={(invoice) => invoice.id}
        emptyIcon={Receipt}
        emptyTitle="Nenhuma cobrança encontrada"
        emptyDescription="Ajuste os filtros ou gere novas mensalidades."
      />
    </>
  );
}
