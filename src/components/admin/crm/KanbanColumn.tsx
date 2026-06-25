import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { cn } from "@/lib/utils";
import { formatBRL } from "@/data/plans";
import { LeadCard } from "./LeadCard";
import type { CrmContact, CrmLead, CrmStage } from "./types";

interface KanbanColumnProps {
  id: CrmStage;
  label: string;
  accent: string;
  contacts: CrmContact[];
  onCardClick: (contact: CrmContact) => void;
  onWhatsApp: (lead: CrmLead) => void;
}

export function KanbanColumn({ id, label, accent, contacts, onCardClick, onWhatsApp }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id, data: { stage: id } });

  const totalCents = contacts.reduce((s, c) => s + c.primary.total_cents, 0);
  // "Cold" column indicator: any active stage with leads stale > 7d
  const now = Date.now();
  const day = 86400000;
  const hasStale =
    id !== "instalado" &&
    id !== "perdido" &&
    contacts.some((c) => now - new Date(c.primary.updated_at).getTime() > 7 * day);

  return (
    <div
      className={cn(
        "flex h-full w-72 shrink-0 flex-col rounded-2xl bg-muted/40 p-3 transition-colors",
        hasStale && "ring-1 ring-amber-500/40",
      )}
    >
      <header className="mb-3 shrink-0 space-y-1.5 px-1">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: accent }} />
            <h3 className="text-sm font-bold uppercase tracking-wide text-foreground">{label}</h3>
          </div>
          <span className="rounded-full bg-background px-2 py-0.5 text-xs font-semibold text-muted-foreground">
            {contacts.length}
          </span>
        </div>
        {totalCents > 0 && (
          <div className="text-[11px] font-medium text-muted-foreground">
            {formatBRL(totalCents)}<span className="opacity-60">/mês</span>
          </div>
        )}
      </header>

      <div
        ref={setNodeRef}
        data-kanban-column-body
        className={cn(
          "flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto overflow-x-hidden rounded-xl p-1 transition-colors",
          isOver && "bg-primary/5 ring-2 ring-primary/30",
        )}
      >
        <SortableContext items={contacts.map((c) => c.primary.id)} strategy={verticalListSortingStrategy}>
          {contacts.map((contact) => (
            <LeadCard
              key={contact.primary.id}
              contact={contact}
              onClick={() => onCardClick(contact)}
              onWhatsApp={(e) => {
                e.stopPropagation();
                onWhatsApp(contact.primary);
              }}
            />
          ))}
        </SortableContext>
        {contacts.length === 0 && (
          <div className="flex h-24 items-center justify-center rounded-lg border-2 border-dashed border-border/60 text-xs text-muted-foreground">
            Sem leads
          </div>
        )}
      </div>
    </div>
  );
}
