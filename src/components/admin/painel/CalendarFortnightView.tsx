import { cn } from "@/lib/utils";
import type { Atendimento } from "@/hooks/useRbxAtendimentos";
import { addDays, isSameDay, toISODate, WEEKDAYS_MON_FIRST } from "./dateUtils";
import { CalendarEventChip } from "./CalendarEventChip";

export function CalendarFortnightView({
  anchor, atendimentos, onSelect,
}: {
  anchor: Date;
  atendimentos: Atendimento[];
  onSelect: (a: Atendimento) => void;
}) {
  const today = new Date();
  const days: Date[] = Array.from({ length: 15 }, (_, i) => addDays(anchor, i));

  const byDay = new Map<string, Atendimento[]>();
  for (const a of atendimentos) {
    if (!a.scheduledAt) continue;
    const k = toISODate(new Date(a.scheduledAt));
    const arr = byDay.get(k) || [];
    arr.push(a);
    byDay.set(k, arr);
  }
  for (const [, arr] of byDay) arr.sort((a, b) => (a.scheduledAt || "").localeCompare(b.scheduledAt || ""));

  // First column header label = weekday of first day (Mon-first)
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-7 gap-px bg-muted rounded-lg overflow-hidden">
        {days.slice(0, 7).map((d, i) => (
          <div key={i} className="bg-muted py-2 text-center text-xs font-medium text-muted-foreground">
            {WEEKDAYS_MON_FIRST[(d.getDay() + 6) % 7]}
          </div>
        ))}
        {days.map((d, i) => {
          const items = byDay.get(toISODate(d)) || [];
          const visible = items.slice(0, 3);
          const overflow = items.length - visible.length;
          const isToday = isSameDay(d, today);
          return (
            <div
              key={i}
              className="bg-background min-h-[120px] p-2 flex flex-col gap-1 hover:bg-accent/30 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className={cn(
                  "inline-flex h-7 px-2 items-center justify-center rounded-full text-xs font-medium gap-1",
                  isToday && "bg-primary text-primary-foreground",
                )}>
                  <span className="text-[10px] opacity-70">{d.getDate().toString().padStart(2, "0")}/{(d.getMonth() + 1).toString().padStart(2, "0")}</span>
                </span>
                {items.length > 0 && (
                  <span className="text-[10px] text-muted-foreground font-medium">{items.length}</span>
                )}
              </div>
              {visible.map((a) => (
                <CalendarEventChip key={a.id} atendimento={a} onClick={() => onSelect(a)} dense />
              ))}
              {overflow > 0 && (
                <span className="text-[10px] text-muted-foreground font-medium px-1">+ {overflow} mais</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
