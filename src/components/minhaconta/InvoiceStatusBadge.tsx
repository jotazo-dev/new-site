import { cn } from "@/lib/utils";

type Status = "paid" | "open" | "overdue" | "future";

const STYLES: Record<Status, string> = {
  paid: "bg-green-100 text-green-700 border-green-200",
  open: "bg-blue-100 text-blue-700 border-blue-200",
  overdue: "bg-red-100 text-red-700 border-red-200",
  future: "bg-muted text-muted-foreground border-border",
};

export function InvoiceStatusBadge({ status, label }: { status: Status; label: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium", STYLES[status])}>
      {label}
    </span>
  );
}
