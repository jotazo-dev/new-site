import { cn } from "@/lib/utils";
import type { Atendimento } from "@/hooks/useRbxAtendimentos";
import { addDays, isSameDay, toISODate, WEEKDAYS_MON_FIRST, startOfWeekMonday } from "./dateUtils";
import { CalendarEventChip } from "./CalendarEventChip";

export function CalendarWeekView({
  anchor, atendimentos, onSelect,
}: {
  anchor: Date;
  atendimentos: Atendimento[];
  onSelect: (a: Atendimento) => void;
}) {
  const today = new Date();
  const start = startOfWeekMonday(anchor);
  const days: Date[] = Array.from({ length: 7 }, (_, i) => addDays(start, i));

  const byDay = new Map<string, Atendimento[]>();
  for (const a of atendimentos) {
    if (!a.scheduledAt) continue;
    const k = toISODate(new Date(a.scheduledAt));
    const arr = byDay.get(k) || [];
    arr.push(a);
    byDay.set(k, arr);
  }
  for (const [, arr] of byDay) arr.sort((a, b) => (a.scheduledAt || "").localeCompare(b.scheduledAt || ""));

  return (
    <div className="grid grid-cols-7 gap-px bg-muted rounded-lg overflow-hidden">
      {days.map((d, i) => (
        <div key={`h-${i}`} className="bg-muted py-2 px-2 text-center">
          <div className="text-[11px] font-medium text-muted-foreground">{WEEKDAYS_MON_FIRST[i]}</div>
          <div className={cn(
            "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold mt-1",
            isSameDay(d, today) && "bg-primary text-primary-foreground",
          )}>{d.getDate()}</div>
        </div>
      ))}
      {days.map((d, i) => {
        const items = byDay.get(toISODate(d)) || [];
        return (
          <div
            key={`c-${i}`}
            className="bg-background min-h-[420px] p-2 flex flex-col gap-1 overflow-y-auto"
          >
            {items.length === 0 && (
              <span className="text-[11px] text-muted-foreground text-center mt-4">—</span>
            )}
            {items.map((a) => (
              <CalendarEventChip key={a.id} atendimento={a} onClick={() => onSelect(a)} />
            ))}
          </div>
        );
      })}
    </div>
  );
}
