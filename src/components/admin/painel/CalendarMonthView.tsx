import { cn } from "@/lib/utils";
import type { Atendimento } from "@/hooks/useRbxAtendimentos";
import { WEEKDAYS_MON_FIRST, mondayIndex, isSameDay } from "./dateUtils";
import { CalendarEventChip } from "./CalendarEventChip";

export function CalendarMonthView({
  anchor, atendimentos, onSelect,
}: {
  anchor: Date;
  atendimentos: Atendimento[];
  onSelect: (a: Atendimento) => void;
}) {
  const year = anchor.getFullYear();
  const month = anchor.getMonth();
  const today = new Date();

  const firstOfMonth = new Date(year, month, 1);
  const offset = mondayIndex(firstOfMonth);
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (Date | null)[] = Array(offset).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);

  const byDay = new Map<string, Atendimento[]>();
  for (const a of atendimentos) {
    if (!a.scheduledAt) continue;
    const d = new Date(a.scheduledAt);
    if (d.getMonth() !== month || d.getFullYear() !== year) continue;
    const k = String(d.getDate());
    const arr = byDay.get(k) || [];
    arr.push(a);
    byDay.set(k, arr);
  }
  for (const [, arr] of byDay) arr.sort((a, b) => (a.scheduledAt || "").localeCompare(b.scheduledAt || ""));

  return (
    <div className="grid grid-cols-7 gap-px bg-muted rounded-lg overflow-hidden">
      {WEEKDAYS_MON_FIRST.map((w) => (
        <div key={w} className="bg-muted py-2 text-center text-xs font-medium text-muted-foreground">{w}</div>
      ))}
      {cells.map((d, i) => {
        const items = d ? byDay.get(String(d.getDate())) || [] : [];
        const visible = items.slice(0, 3);
        const overflow = items.length - visible.length;
        const isToday = d && isSameDay(d, today);
        return (
          <div
            key={i}
            className={cn(
              "bg-background min-h-[110px] p-2 transition-colors hover:bg-accent/30 flex flex-col gap-1",
              !d && "bg-muted/40",
            )}
          >
            {d && (
              <div className="flex items-center justify-between">
                <span className={cn(
                  "inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium",
                  isToday && "bg-primary text-primary-foreground",
                )}>{d.getDate()}</span>
                {items.length > 0 && (
                  <span className="text-[10px] text-muted-foreground font-medium">{items.length}</span>
                )}
              </div>
            )}
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
  );
}
