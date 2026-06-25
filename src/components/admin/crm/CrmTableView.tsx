import { useMemo, useState } from "react";
import { ArrowUpDown, MessageCircle } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatBRL } from "@/data/plans";
import { cn } from "@/lib/utils";
import { STAGES, type CrmContact, type CrmLead, type CrmStage, formatRelative } from "./types";

interface CrmTableViewProps {
  contacts: CrmContact[];
  onCardClick: (contact: CrmContact) => void;
  onWhatsApp: (lead: CrmLead) => void;
}

type SortKey = "created_at" | "name" | "city" | "total" | "stage";

export function CrmTableView({ contacts, onCardClick, onWhatsApp }: CrmTableViewProps) {
  const { toast } = useToast();
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const sorted = useMemo(() => {
    const arr = [...contacts];
    arr.sort((a, b) => {
      const la = a.primary;
      const lb = b.primary;
      let cmp = 0;
      if (sortKey === "created_at") cmp = +new Date(la.created_at) - +new Date(lb.created_at);
      else if (sortKey === "name") cmp = la.customer_name.localeCompare(lb.customer_name);
      else if (sortKey === "city") cmp = (la.city || "").localeCompare(lb.city || "");
      else if (sortKey === "total") cmp = la.total_cents - lb.total_cents;
      else if (sortKey === "stage") cmp = la.stage.localeCompare(lb.stage);
      return sortDir === "asc" ? cmp : -cmp;
    });
    return arr;
  }, [contacts, sortKey, sortDir]);

  const toggleSort = (k: SortKey) => {
    if (sortKey === k) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(k);
      setSortDir("desc");
    }
  };

  const SortHeader = ({ k, children }: { k: SortKey; children: React.ReactNode }) => (
    <button
      type="button"
      onClick={() => toggleSort(k)}
      className={cn(
        "inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wide hover:text-foreground",
        sortKey === k ? "text-foreground" : "text-muted-foreground",
      )}
    >
      {children}
      <ArrowUpDown className="h-3 w-3" />
    </button>
  );

  const updateStage = async (leadId: string, stage: CrmStage) => {
    const { error } = await supabase.from("crm_leads").update({ stage }).eq("id", leadId);
    if (error) toast({ title: "Erro ao atualizar", description: error.message, variant: "destructive" });
  };

  return (
    <div className="overflow-auto rounded-2xl border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead><SortHeader k="created_at">Data</SortHeader></TableHead>
            <TableHead><SortHeader k="name">Cliente</SortHeader></TableHead>
            <TableHead>Contato</TableHead>
            <TableHead><SortHeader k="city">Cidade</SortHeader></TableHead>
            <TableHead><SortHeader k="total">Total</SortHeader></TableHead>
            <TableHead><SortHeader k="stage">Estágio</SortHeader></TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((c) => {
            const l = c.primary;
            const isRepeat = c.totalOrders > 1;
            return (
              <TableRow
                key={c.key}
                className="cursor-pointer hover:bg-muted/40"
                onClick={() => onCardClick(c)}
              >
                <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                  {formatRelative(l.created_at)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{l.customer_name}</span>
                    {isRepeat && (
                      <Badge variant="outline" className="border-primary/40 bg-primary/10 text-[10px] text-primary">
                        {c.totalOrders}x
                      </Badge>
                    )}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {l.source === "whatsapp" ? "WhatsApp" : "Site"}
                  </div>
                </TableCell>
                <TableCell className="text-xs">
                  {l.customer_phone || "—"}
                  {l.customer_email && <div className="text-muted-foreground">{l.customer_email}</div>}
                </TableCell>
                <TableCell className="text-xs">
                  {l.city ? `${l.city}${l.uf ? "/" + l.uf : ""}` : "—"}
                </TableCell>
                <TableCell className="font-semibold text-primary">{formatBRL(l.total_cents)}</TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Select value={l.stage} onValueChange={(v) => updateStage(l.id, v as CrmStage)}>
                    <SelectTrigger className="h-8 w-[140px] text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STAGES.map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onWhatsApp(l)}
                    className="h-8 w-8 p-0 text-[#1DA851] hover:bg-[#25D366]/10"
                  >
                    <MessageCircle className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
          {sorted.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="py-8 text-center text-sm text-muted-foreground">
                Nenhum lead encontrado com os filtros atuais.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
