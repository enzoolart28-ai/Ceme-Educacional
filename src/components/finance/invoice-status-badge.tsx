import { Badge } from "@/components/ui/badge";
import { INVOICE_STATUS_LABELS, type InvoiceStatus } from "@/lib/finance/labels";

const classes: Record<InvoiceStatus, string> = {
  paid: "bg-emerald-100 text-emerald-800",
  open: "bg-sky-100 text-sky-800",
  overdue: "bg-red-100 text-red-800",
  partial: "bg-amber-100 text-amber-800",
  cancelled: "bg-slate-200 text-slate-700",
  renegotiated: "bg-violet-100 text-violet-800",
};

export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  return <Badge className={classes[status]}>{INVOICE_STATUS_LABELS[status]}</Badge>;
}

