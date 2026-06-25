import { useEffect, useMemo, useRef, useState } from "react";
import {
  DndContext,
  type DragEndEvent,
  type DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  DragOverlay,
} from "@dnd-kit/core";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { KanbanColumn } from "./KanbanColumn";
import { LeadCard } from "./LeadCard";
import {
  STAGES,
  type CrmContact,
  type CrmLead,
  type CrmStage,
  groupLeadsByContact,
} from "./types";

interface KanbanBoardProps {
  leads: CrmLead[];
  onCardClick: (contact: CrmContact) => void;
  onWhatsApp: (lead: CrmLead) => void;
  onChanged: () => void;
}

export function KanbanBoard({ leads, onCardClick, onWhatsApp, onChanged }: KanbanBoardProps) {
  const { toast } = useToast();
  const [localLeads, setLocalLeads] = useState<CrmLead[]>(leads);
  const [activeId, setActiveId] = useState<string | null>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const pendingMoveRef = useRef<{ id: string; stage: CrmStage } | null>(null);

  useEffect(() => {
    setLocalLeads((prev) => {
      const pending = pendingMoveRef.current;
      if (!pending) return leads;
      const incoming = leads.find((l) => l.id === pending.id);
      if (incoming && incoming.stage === pending.stage) {
        pendingMoveRef.current = null;
        return leads;
      }
      return leads.map((l) => (l.id === pending.id ? { ...l, stage: pending.stage } : l));
    });
  }, [leads]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  // Group leads → contacts, then bucket contacts by stage of their primary lead
  const contacts = useMemo(() => groupLeadsByContact(localLeads), [localLeads]);

  const grouped = useMemo(() => {
    const map: Record<CrmStage, CrmContact[]> = {
      novo: [], em_contato: [], proposta: [], agendado: [], instalado: [], perdido: [],
    };
    for (const c of contacts) {
      (map[c.primary.stage] ||= []).push(c);
    }
    for (const s of STAGES) {
      map[s.id].sort(
        (a, b) => +new Date(b.primary.created_at) - +new Date(a.primary.created_at),
      );
    }
    return map;
  }, [contacts]);

  const activeContact = activeId ? contacts.find((c) => c.primary.id === activeId) ?? null : null;

  const handleDragStart = (e: DragStartEvent) => {
    setActiveId(String(e.active.id));
  };

  const handleDragEnd = async (e: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;
    const primaryLeadId = String(active.id);
    const contact = contacts.find((c) => c.primary.id === primaryLeadId);
    if (!contact) return;

    let targetStage = String(over.id) as CrmStage;
    const overContact = contacts.find((c) => c.primary.id === String(over.id));
    if (overContact) targetStage = overContact.primary.stage;

    if (!STAGES.find((s) => s.id === targetStage)) return;
    if (targetStage === contact.primary.stage) return;

    const leadId = contact.primary.id;
    pendingMoveRef.current = { id: leadId, stage: targetStage };
    setLocalLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, stage: targetStage } : l)));

    const { error } = await supabase.from("crm_leads").update({ stage: targetStage }).eq("id", leadId);
    if (error) {
      pendingMoveRef.current = null;
      toast({ title: "Erro ao mover lead", description: error.message, variant: "destructive" });
      setLocalLeads(leads);
      return;
    }
  };

  // ===== Horizontal drag-to-scroll =====
  const dragScrollRef = useRef<{
    armed: boolean;
    active: boolean;
    startX: number;
    startY: number;
    startScroll: number;
    fromColumnBody: HTMLElement | null;
  }>({
    armed: false,
    active: false,
    startX: 0,
    startY: 0,
    startScroll: 0,
    fromColumnBody: null,
  });

  const onMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest("[data-kanban-card]")) return;
    if (target.closest("button, a, input, textarea, select, [role='button']")) return;
    if (!scrollerRef.current) return;
    dragScrollRef.current = {
      armed: true,
      active: false,
      startX: e.clientX,
      startY: e.clientY,
      startScroll: scrollerRef.current.scrollLeft,
      fromColumnBody: target.closest("[data-kanban-column-body]") as HTMLElement | null,
    };
  };

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const s = dragScrollRef.current;
      if (!s.armed || !scrollerRef.current) return;
      const dx = e.clientX - s.startX;
      const dy = e.clientY - s.startY;

      if (!s.active) {
        if (Math.abs(dx) < 5 && Math.abs(dy) < 5) return;
        if (s.fromColumnBody && Math.abs(dy) > Math.abs(dx)) {
          const col = s.fromColumnBody;
          if (col.scrollHeight > col.clientHeight + 1) {
            s.armed = false;
            return;
          }
        }
        s.active = true;
        scrollerRef.current.style.cursor = "grabbing";
        document.body.style.userSelect = "none";
      }

      scrollerRef.current.scrollLeft = s.startScroll - dx;
    };
    const onUp = () => {
      const s = dragScrollRef.current;
      if (!s.armed) return;
      s.armed = false;
      s.active = false;
      if (scrollerRef.current) scrollerRef.current.style.cursor = "";
      document.body.style.userSelect = "";
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  const onWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (!scrollerRef.current) return;
    const target = e.target as HTMLElement;
    const colBody = target.closest("[data-kanban-column-body]") as HTMLElement | null;

    if (colBody) {
      const canScrollDown = colBody.scrollTop + colBody.clientHeight < colBody.scrollHeight - 1;
      const canScrollUp = colBody.scrollTop > 0;
      if ((e.deltaY > 0 && canScrollDown) || (e.deltaY < 0 && canScrollUp)) {
        return;
      }
    }
    if (e.deltaY !== 0) {
      e.preventDefault();
      scrollerRef.current.scrollLeft += e.deltaY;
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <div
        ref={scrollerRef}
        onMouseDown={onMouseDown}
        onWheel={onWheel}
        className="flex h-full min-h-0 flex-1 cursor-grab gap-4 overflow-x-auto overflow-y-hidden pb-2 select-none"
      >
        {STAGES.map((s) => (
          <KanbanColumn
            key={s.id}
            id={s.id}
            label={s.label}
            accent={s.accent}
            contacts={grouped[s.id]}
            onCardClick={onCardClick}
            onWhatsApp={onWhatsApp}
          />
        ))}
      </div>
      <DragOverlay dropAnimation={{ duration: 180, easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)" }}>
        {activeContact ? (
          <div className="rotate-2 opacity-95 shadow-2xl">
            <LeadCard contact={activeContact} onClick={() => {}} onWhatsApp={() => {}} dragOverlay />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
