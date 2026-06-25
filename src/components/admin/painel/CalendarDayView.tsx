import { cn } from "@/lib/utils";
import type { Atendimento } from "@/hooks/useRbxAtendimentos";
import { addDays, formatDayLong, isSameDay } from "./dateUtils";
import { STATUS_META } from "./atendimentoStatus";

const HOURS = Array.from({ length: 17 }, (_, i) => i + 6); // 06..22

function hourOf(iso: string | null): number | null {
  if (!iso) return null;
  try { return new Date(iso).getHours(); } catch { return null; }
}
function formatHour(iso: string | null) {
  if (!iso) return "";
  try { return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }); }
  catch { return ""; }
}

function AtendimentoButton({ a, onSelect }: { a: Atendimento; onSelect: (a: Atendimento) => void }) {
  const meta = STATUS_META[a.status];
  const reason = a.reason || a.type;
  const tech = a.technician;
  return (
    <button
      onClick={() => onSelect(a)}
      className={cn(
        "w-full text-left text-sm rounded-md border px-3 py-2 hover:bg-accent/40 transition-colors",
        meta.chip,
      )}
    >
      <div className="flex items-center gap-2 min-w-0">
        <span className={`h-2 w-2 rounded-full shrink-0 ${meta.dot}`} />
        <span className="font-mono text-xs shrink-0">{formatHour(a.scheduledAt)}</span>
        {a.customerCode && (
          <span className="font-mono text-[10px] text-muted-foreground shrink-0">#{a.customerCode}</span>
        )}
        <span className="font-medium truncate">{a.customerName}</span>
      </div>
      {reason && (
        <div className="truncate text-xs text-muted-foreground pl-[3.75rem] mt-0.5">{reason}</div>
      )}
      {tech && (
        <div className="truncate text-xs text-muted-foreground/80 pl-[3.75rem]">👤 {tech}</div>
      )}
    </button>
  );
}

function DayColumn({
  date, atendimentos, onSelect,
}: {
  date: Date;
  atendimentos: Atendimento[];
  onSelect: (a: Atendimento) => void;
}) {
  const today = new Date();
  const isToday = isSameDay(date, today);

  const dayItems = atendimentos.filter(
    (a) => a.scheduledAt && isSameDay(new Date(a.scheduledAt), date),
  ).sort((a, b) => (a.scheduledAt || "").localeCompare(b.scheduledAt || ""));

  const byHour = new Map<number, Atendimento[]>();
  const others: Atendimento[] = [];
  for (const a of dayItems) {
    const h = hourOf(a.scheduledAt);
    if (h === null || h < 6 || h > 22) { others.push(a); continue; }
    const arr = byHour.get(h) || [];
    arr.push(a);
    byHour.set(h, arr);
  }

  return (
    <div className="space-y-3">
      <div
        className={cn(
          "rounded-md border px-3 py-2 text-sm font-semibold capitalize",
          isToday ? "bg-primary text-primary-foreground border-primary" : "bg-muted/40",
        )}
      >
        {formatDayLong(date)}
      </div>

      <div className="rounded-lg border overflow-hidden">
        {HOURS.map((h) => {
          const items = byHour.get(h) || [];
          const isNow = isToday && today.getHours() === h;
          return (
            <div
              key={h}
              className={cn(
                "grid grid-cols-[56px_1fr] border-b last:border-b-0 min-h-[56px]",
                isNow && "border-t-2 border-t-primary",
              )}
            >
              <div className="bg-muted/40 text-[11px] font-mono text-muted-foreground px-2 py-2 border-r">
                {String(h).padStart(2, "0")}:00
              </div>
              <div className="p-2 flex flex-col gap-1.5">
                {items.length === 0 && <span className="text-[11px] text-muted-foreground/50">—</span>}
                {items.map((a) => (
                  <AtendimentoButton key={a.id} a={a} onSelect={onSelect} />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {others.length > 0 && (
        <div className="rounded-lg border p-3">
          <div className="text-xs font-medium text-muted-foreground mb-2">Outros horários</div>
          <div className="flex flex-col gap-1.5">
            {others.map((a) => (
              <AtendimentoButton key={a.id} a={a} onSelect={onSelect} />
            ))}
          </div>
        </div>
      )}

      {dayItems.length === 0 && (
        <p className="text-center text-xs text-muted-foreground py-2">Nenhum atendimento neste dia.</p>
      )}
    </div>
  );
}

export function CalendarDayView({
  anchor, atendimentos, onSelect,
}: {
  anchor: Date;
  atendimentos: Atendimento[];
  onSelect: (a: Atendimento) => void;
}) {
  const next = addDays(anchor, 1);
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <DayColumn date={anchor} atendimentos={atendimentos} onSelect={onSelect} />
      <DayColumn date={next} atendimentos={atendimentos} onSelect={onSelect} />
    </div>
  );
}
