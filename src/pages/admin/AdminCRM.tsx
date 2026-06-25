import { useEffect, useMemo, useRef, useState } from "react";
import { LayoutGrid, Table2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

import { Button } from "@/components/ui/button";
import { KanbanBoard } from "@/components/admin/crm/KanbanBoard";
import { LeadDetailsDialog } from "@/components/admin/crm/LeadDetailsDialog";
import { CrmFilters, applyPeriod, DEFAULT_FILTERS, type CrmFilterState } from "@/components/admin/crm/CrmFilters";
import { CrmTableView } from "@/components/admin/crm/CrmTableView";
import {
  type CrmContact,
  type CrmLead,
  groupLeadsByContact,
} from "@/components/admin/crm/types";
import { buildWhatsAppCheckoutUrl } from "@/lib/whatsapp";
import { buildLeadAddress } from "@/components/admin/crm/types";
import { downloadLeadsCsv } from "@/lib/crmExport";
import { useKanbanShortcuts } from "@/hooks/useKanbanShortcuts";
import { cn } from "@/lib/utils";

const VIEW_KEY = "crm-view-mode";
const FILTERS_KEY = "crm-filters";

export default function AdminCRM() {
  const [leads, setLeads] = useState<CrmLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<CrmFilterState>(() => {
    try {
      const saved = localStorage.getItem(FILTERS_KEY);
      return saved ? { ...DEFAULT_FILTERS, ...JSON.parse(saved) } : DEFAULT_FILTERS;
    } catch {
      return DEFAULT_FILTERS;
    }
  });
  const [viewMode, setViewMode] = useState<"kanban" | "table">(() => {
    return (localStorage.getItem(VIEW_KEY) as "kanban" | "table") || "kanban";
  });
  const [selectedContact, setSelectedContact] = useState<CrmContact | null>(null);
  const [open, setOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    localStorage.setItem(FILTERS_KEY, JSON.stringify(filters));
  }, [filters]);

  useEffect(() => {
    localStorage.setItem(VIEW_KEY, viewMode);
  }, [viewMode]);

  const fetchLeads = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("crm_leads")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setLeads(data as unknown as CrmLead[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchLeads();
    const channel = supabase
      .channel("crm_leads_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "crm_leads" }, (payload) => {
        setLeads((prev) => {
          if (payload.eventType === "INSERT") {
            const row = payload.new as CrmLead;
            if (prev.some((l) => l.id === row.id)) return prev;
            return [row, ...prev];
          }
          if (payload.eventType === "UPDATE") {
            const row = payload.new as CrmLead;
            return prev.map((l) => (l.id === row.id ? { ...l, ...row } : l));
          }
          if (payload.eventType === "DELETE") {
            const oldRow = payload.old as { id?: string };
            if (!oldRow?.id) return prev;
            return prev.filter((l) => l.id !== oldRow.id);
          }
          return prev;
        });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useKanbanShortcuts({
    onFocusSearch: () => searchRef.current?.focus(),
    onEscape: () => open && setOpen(false),
  });

  // Cities for filter dropdown
  const cityOptions = useMemo(() => {
    const set = new Set<string>();
    for (const l of leads) {
      if (l.city) set.add(l.city);
    }
    return Array.from(set).sort();
  }, [leads]);

  // Apply all filters
  const filtered = useMemo(() => {
    let arr = applyPeriod(leads, filters.period);
    const q = filters.search.trim().toLowerCase();
    arr = arr.filter((l) => {
      if (filters.source !== "all" && l.source !== filters.source) return false;
      if (filters.city !== "all" && l.city !== filters.city) return false;
      if (q) {
        const matches =
          l.customer_name.toLowerCase().includes(q) ||
          (l.customer_phone || "").toLowerCase().includes(q) ||
          (l.customer_email || "").toLowerCase().includes(q) ||
          (l.city || "").toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });

    if (filters.onlyRepeat) {
      const contacts = groupLeadsByContact(arr);
      const keepIds = new Set<string>();
      for (const c of contacts) {
        if (c.totalOrders > 1) c.leads.forEach((l) => keepIds.add(l.id));
      }
      arr = arr.filter((l) => keepIds.has(l.id));
    }
    return arr;
  }, [leads, filters]);

  const filteredContacts = useMemo(() => groupLeadsByContact(filtered), [filtered]);

  const handleWhatsApp = (lead: CrmLead) => {
    const fakeItems = lead.items.map((it) => ({
      plan: {
        id: it.plan_id,
        name: it.plan_name,
        category: it.category,
        priceCents: it.price_cents,
      } as never,
      qty: it.qty || 1,
    }));
    const url = buildWhatsAppCheckoutUrl({
      items: fakeItems as never,
      totalCents: lead.total_cents,
      customerName: lead.customer_name,
      customerPhone: lead.customer_phone || undefined,
      cep: lead.cep,
      address: buildLeadAddress(lead),
      couponCode: lead.coupon_code || undefined,
      comboDiscountCents: lead.combo_discount_cents,
    });
    window.open(url, "_blank");

    // Log activity (best-effort)
    void supabase.from("crm_activities" as never).insert({
      lead_id: lead.id,
      type: "whatsapp",
      payload: {},
    } as never);
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col gap-4 md:h-[calc(100vh-10rem)]">

      <CrmFilters
        filters={filters}
        onChange={setFilters}
        searchRef={searchRef}
        totalLeads={leads.length}
        filteredLeads={filtered}
        cityOptions={cityOptions}
        onExport={() => downloadLeadsCsv(filtered)}
      />

      <div className="flex items-center gap-2">
        <div className="inline-flex items-center rounded-lg border border-border bg-card p-0.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewMode("kanban")}
            className={cn(
              "h-8 gap-2 rounded-md",
              viewMode === "kanban" && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
            )}
          >
            <LayoutGrid className="h-4 w-4" />
            Kanban
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewMode("table")}
            className={cn(
              "h-8 gap-2 rounded-md",
              viewMode === "table" && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
            )}
          >
            <Table2 className="h-4 w-4" />
            Tabela
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Atalhos: <kbd className="rounded border border-border bg-muted px-1">/</kbd> buscar ·{" "}
          <kbd className="rounded border border-border bg-muted px-1">Esc</kbd> fechar
        </p>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-border bg-card p-10 text-center text-muted-foreground">
          Carregando leads…
        </div>
      ) : viewMode === "kanban" ? (
        <div className="min-h-0 flex-1">
          <KanbanBoard
            leads={filtered}
            onCardClick={(c) => {
              setSelectedContact(c);
              setOpen(true);
            }}
            onWhatsApp={handleWhatsApp}
            onChanged={fetchLeads}
          />
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-auto">
          <CrmTableView
            contacts={filteredContacts}
            onCardClick={(c) => {
              setSelectedContact(c);
              setOpen(true);
            }}
            onWhatsApp={handleWhatsApp}
          />
        </div>
      )}

      <LeadDetailsDialog
        contact={selectedContact}
        open={open}
        onOpenChange={setOpen}
        onWhatsApp={handleWhatsApp}
        onUpdated={fetchLeads}
      />
    </div>
  );
}
