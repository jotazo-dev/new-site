import { ReactNode } from "react";
import { Info, AlertTriangle, Lightbulb, ShieldAlert, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "info" | "tip" | "warning" | "danger" | "success";

const variants: Record<
  Variant,
  { icon: typeof Info; bg: string; border: string; text: string; label: string }
> = {
  info: {
    icon: Info,
    bg: "bg-blue-500/5",
    border: "border-blue-500/30",
    text: "text-blue-700 dark:text-blue-300",
    label: "Informação",
  },
  tip: {
    icon: Lightbulb,
    bg: "bg-primary/5",
    border: "border-primary/30",
    text: "text-primary",
    label: "Dica",
  },
  warning: {
    icon: AlertTriangle,
    bg: "bg-amber-500/5",
    border: "border-amber-500/30",
    text: "text-amber-700 dark:text-amber-300",
    label: "Atenção",
  },
  danger: {
    icon: ShieldAlert,
    bg: "bg-destructive/5",
    border: "border-destructive/30",
    text: "text-destructive",
    label: "Importante",
  },
  success: {
    icon: CheckCircle2,
    bg: "bg-emerald-500/5",
    border: "border-emerald-500/30",
    text: "text-emerald-700 dark:text-emerald-300",
    label: "Pronto",
  },
};

interface HelpCalloutProps {
  variant?: Variant;
  title?: string;
  children: ReactNode;
}

export function HelpCallout({ variant = "info", title, children }: HelpCalloutProps) {
  const v = variants[variant];
  const Icon = v.icon;
  return (
    <aside
      className={cn(
        "not-prose my-5 flex gap-3 rounded-lg border-l-4 p-4 sm:p-5",
        v.bg,
        v.border,
      )}
      role="note"
    >
      <Icon className={cn("mt-0.5 h-5 w-5 shrink-0", v.text)} />
      <div className="min-w-0 flex-1">
        <p className={cn("text-sm font-semibold", v.text)}>{title ?? v.label}</p>
        <div className="mt-1 text-sm leading-relaxed text-foreground/90 [&_p]:my-1 [&_ul]:my-2 [&_ul]:ml-5 [&_ul]:list-disc [&_li]:my-0.5">
          {children}
        </div>
      </div>
    </aside>
  );
}
