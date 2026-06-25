import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function CheckoutStepper({
  current,
  steps,
}: {
  current: number;
  steps?: { id: number; label: string }[];
}) {
  const list = steps ?? [
    { id: 1, label: "Revisão" },
    { id: 2, label: "Seus dados" },
    { id: 3, label: "Pagamento" },
    { id: 4, label: "Confirmação" },
  ];
  return (
    <ol className="flex w-full items-center justify-between gap-2 md:gap-4">
      {list.map((s, i) => {
        const done = current > s.id;
        const active = current === s.id;
        return (
          <li key={s.id} className="flex flex-1 items-center gap-2">
            <div
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold transition",
                done && "bg-primary border-primary text-primary-foreground",
                active && !done && "border-primary text-primary bg-primary/10",
                !done && !active && "border-border text-muted-foreground",
              )}
            >
              {done ? <Check className="h-4 w-4" /> : s.id}
            </div>
            <span className={cn("text-xs md:text-sm font-medium", active ? "text-foreground" : "text-muted-foreground")}>
              {s.label}
            </span>
            {i < list.length - 1 && <div className={cn("h-px flex-1", done ? "bg-primary" : "bg-border")} />}
          </li>
        );
      })}
    </ol>
  );
}
