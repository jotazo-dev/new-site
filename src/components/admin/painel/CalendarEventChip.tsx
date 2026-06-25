import type { Atendimento } from "@/hooks/useRbxAtendimentos";
import { STATUS_META } from "./atendimentoStatus";

function formatHour(iso: string | null) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  } catch { return ""; }
}

export function CalendarEventChip({
  atendimento, onClick, dense = false,
}: {
  atendimento: Atendimento;
  onClick: () => void;
  dense?: boolean;
}) {
  const meta = STATUS_META[atendimento.status];
  const reason = atendimento.reason || atendimento.type;
  const tech = atendimento.technician;

  return (
    <button
      onClick={onClick}
      className={`group flex items-start gap-1.5 text-left rounded px-1.5 py-1 hover:bg-accent/60 transition-colors min-w-0 w-full ${
        dense ? "text-[11px]" : "text-xs"
      }`}
      title={`${atendimento.customerName} — ${atendimento.type}${reason ? ` · ${reason}` : ""}${tech ? ` · ${tech}` : ""}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full shrink-0 mt-1.5 ${meta.dot}`} />
      <div className="flex-1 min-w-0 space-y-0.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="font-mono text-muted-foreground shrink-0">{formatHour(atendimento.scheduledAt)}</span>
          {atendimento.customerCode && (
            <span className="font-mono text-[10px] text-muted-foreground shrink-0">#{atendimento.customerCode}</span>
          )}
          <span className="truncate font-medium">{atendimento.customerName}</span>
        </div>
        {!dense && reason && (
          <div className="truncate text-muted-foreground pl-[3.25rem]">{reason}</div>
        )}
        {!dense && tech && (
          <div className="truncate text-muted-foreground/80 pl-[3.25rem]">👤 {tech}</div>
        )}
      </div>
    </button>
  );
}
