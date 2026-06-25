import { useEffect, useMemo, useState } from "react";
import { Calendar, Layers, MapPin, MessageCircle, Save, User as UserIcon, Copy, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { formatPhoneBR } from "@/lib/whatsapp";
import {
  buildLeadAddress,
  STAGES,
  type CrmContact,
  type CrmLead,
  type CrmStage,
  formatRelative,
  computeLtvCents,
  LTV_MONTHS,
} from "./types";
import { ActivityTimeline } from "./ActivityTimeline";
import { cn } from "@/lib/utils";

interface LeadDetailsDialogProps {
  contact: CrmContact | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onWhatsApp: (lead: CrmLead) => void;
  onUpdated: () => void;
}

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  if (!value) return null;
  const onCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button
      type="button"
      onClick={onCopy}
      className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
      title={`Copiar ${label}`}
    >
      {copied ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
    </button>
  );
}

export function LeadDetailsDialog({ contact, open, onOpenChange, onWhatsApp, onUpdated }: LeadDetailsDialogProps) {
  const { toast } = useToast();
  const [activeLeadId, setActiveLeadId] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [stage, setStage] = useState<CrmStage>("novo");
  const [nextActionAt, setNextActionAt] = useState<string>("");
  const [nextActionNote, setNextActionNote] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const activeLead = useMemo<CrmLead | null>(() => {
    if (!contact) return null;
    return contact.leads.find((l) => l.id === activeLeadId) || contact.primary;
  }, [contact, activeLeadId]);

  useEffect(() => {
    if (contact) setActiveLeadId(contact.primary.id);
  }, [contact]);

  useEffect(() => {
    if (activeLead) {
      setNotes(activeLead.notes || "");
      setStage(activeLead.stage);
      setNextActionAt(
        activeLead.next_action_at ? activeLead.next_action_at.slice(0, 16) : "",
      );
      setNextActionNote(activeLead.next_action_note || "");
    }
  }, [activeLead]);

  if (!contact || !activeLead) return null;

  const address = buildLeadAddress(activeLead);
  const isRepeat = contact.totalOrders > 1;
  const phoneDigits = (activeLead.customer_phone || "").replace(/\D/g, "");

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("crm_leads")
      .update({
        notes,
        stage,
        next_action_at: nextActionAt ? new Date(nextActionAt).toISOString() : null,
        next_action_note: nextActionNote,
      })
      .eq("id", activeLead.id);

    // Log note as activity if it changed
    if (!error && notes && notes !== activeLead.notes) {
      await supabase.from("crm_activities" as never).insert({
        lead_id: activeLead.id,
        type: "note",
        payload: { message: notes.slice(0, 200) },
      } as never);
    }

    setSaving(false);
    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Lead atualizado" });
    onUpdated();
    onOpenChange(false);
  };

  const handleDelete = async () => {
    if (!confirm("Excluir este pedido permanentemente?")) return;
    const { error } = await supabase.from("crm_leads").delete().eq("id", activeLead.id);
    if (error) {
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Pedido excluído" });
    onUpdated();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserIcon className="h-5 w-5 text-primary" />
            {activeLead.customer_name}
            {isRepeat && (
              <Badge className="gap-1 bg-primary text-primary-foreground">
                <Layers className="h-3 w-3" />
                {contact.totalOrders} pedidos
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription className="flex items-center gap-2">
            <Badge variant="outline">{activeLead.source === "whatsapp" ? "WhatsApp" : "Site"}</Badge>
            <span className="text-xs">
              <Calendar className="mr-1 inline h-3 w-3" />
              {new Date(activeLead.created_at).toLocaleString("pt-BR")}
            </span>
            {isRepeat && (
              <span
                className="text-xs text-primary"
                title={`LTV estimado: ${LTV_MONTHS} meses × mensalidade do pedido mais recente`}
              >
                · LTV {LTV_MONTHS}m {formatBRL(computeLtvCents(activeLead.total_cents))}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        {isRepeat && (
          <section className="rounded-xl border border-primary/30 bg-primary/5 p-3">
            <h4 className="mb-2 flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-primary">
              <Layers className="h-3 w-3" /> Pedidos deste contato ({contact.totalOrders})
            </h4>
            <div className="flex flex-wrap gap-2">
              {contact.leads.map((l) => {
                const stageLabel = STAGES.find((s) => s.id === l.stage)?.label || l.stage;
                const isActive = l.id === activeLead.id;
                return (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => setActiveLeadId(l.id)}
                    className={cn(
                      "rounded-lg border px-2 py-1 text-left text-xs transition-colors",
                      isActive
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background hover:bg-muted",
                    )}
                  >
                    <div className="font-semibold">{formatBRL(l.total_cents)}</div>
                    <div className={cn("text-[10px]", isActive ? "text-primary-foreground/80" : "text-muted-foreground")}>
                      {stageLabel} · {formatRelative(l.created_at)}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        <Tabs defaultValue="pedido" className="mt-2">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pedido">Pedido</TabsTrigger>
            <TabsTrigger value="atividades">Atividades</TabsTrigger>
            <TabsTrigger value="followup">Follow-up</TabsTrigger>
          </TabsList>

          <TabsContent value="pedido" className="space-y-5 pt-3">
            {/* Contato */}
            <section className="rounded-xl border border-border bg-muted/30 p-4">
              <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">Contato</h4>
              <dl className="grid gap-2 text-sm md:grid-cols-2">
                <div>
                  <dt className="text-xs text-muted-foreground">E-mail</dt>
                  <dd className="flex items-center font-medium">
                    {activeLead.customer_email || "—"}
                    {activeLead.customer_email && <CopyButton value={activeLead.customer_email} label="e-mail" />}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Telefone</dt>
                  <dd className="font-medium">
                    {activeLead.customer_phone ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <a href={`tel:+${phoneDigits}`} className="text-primary hover:underline">
                          {formatPhoneBR(activeLead.customer_phone)}
                        </a>
                        <CopyButton value={activeLead.customer_phone} label="telefone" />
                        <a
                          href={`https://wa.me/${phoneDigits.length === 11 ? "55" : ""}${phoneDigits}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-md border border-[#25D366]/40 bg-[#25D366]/10 px-2 py-0.5 text-xs font-medium text-[#1DA851] hover:bg-[#25D366]/20"
                        >
                          <MessageCircle className="h-3 w-3" />
                          WhatsApp
                        </a>
                      </div>
                    ) : (
                      "—"
                    )}
                  </dd>
                </div>
              </dl>
            </section>

            {/* Endereço */}
            <section className="rounded-xl border border-border bg-muted/30 p-4">
              <h4 className="mb-2 flex items-center gap-1 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                <MapPin className="h-3 w-3" /> Endereço de instalação
                {address && <CopyButton value={address} label="endereço" />}
              </h4>
              <p className="text-sm font-medium">{address || "—"}</p>
              {activeLead.cep && <p className="mt-1 text-xs text-muted-foreground">CEP {activeLead.cep}</p>}
            </section>

            {/* Itens */}
            <section className="rounded-xl border border-border bg-muted/30 p-4">
              <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">Pedido</h4>
              <ul className="space-y-1.5 text-sm">
                {activeLead.items.map((it, idx) => (
                  <li key={idx} className="flex items-start justify-between gap-2">
                    <span className="font-medium">
                      {it.plan_name}
                      {it.qty > 1 && ` × ${it.qty}`}
                    </span>
                    <span className={it.free_override ? "text-success" : "text-foreground"}>
                      {it.free_override ? "Grátis" : formatBRL(it.price_cents * (it.qty || 1))}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 space-y-1 border-t border-border/50 pt-3 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>{formatBRL(activeLead.subtotal_cents)}</span>
                </div>
                {activeLead.combo_discount_cents > 0 && (
                  <div className="flex justify-between text-success">
                    <span>Desconto combo {activeLead.coupon_code && `(${activeLead.coupon_code})`}</span>
                    <span>-{formatBRL(activeLead.combo_discount_cents)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-bold text-primary">
                  <span>Total</span>
                  <span>{formatBRL(activeLead.total_cents)}/mês</span>
                </div>
              </div>
            </section>

            <section>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Estágio deste pedido
              </label>
              <Select value={stage} onValueChange={(v) => setStage(v as CrmStage)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STAGES.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </section>

            <section>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Notas internas
              </label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                placeholder="Anotações sobre este pedido..."
              />
            </section>
          </TabsContent>

          <TabsContent value="atividades" className="pt-3">
            <ActivityTimeline leadId={activeLead.id} />
          </TabsContent>

          <TabsContent value="followup" className="space-y-4 pt-3">
            <section>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Próxima ação - data e hora
              </label>
              <Input
                type="datetime-local"
                value={nextActionAt}
                onChange={(e) => setNextActionAt(e.target.value)}
              />
            </section>
            <section>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Descrição da próxima ação
              </label>
              <Textarea
                value={nextActionNote}
                onChange={(e) => setNextActionNote(e.target.value)}
                rows={3}
                placeholder="Ex: Ligar para confirmar instalação..."
              />
            </section>
            {activeLead.next_action_at && (
              <p className="text-xs text-muted-foreground">
                Próxima ação atual: {new Date(activeLead.next_action_at).toLocaleString("pt-BR")}
                {new Date(activeLead.next_action_at).getTime() < Date.now() && (
                  <span className="ml-1 font-bold text-destructive">(vencida)</span>
                )}
              </p>
            )}
          </TabsContent>
        </Tabs>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDelete}
            className="border-destructive/40 text-destructive hover:border-destructive hover:bg-destructive hover:text-destructive-foreground"
          >
            Excluir pedido
          </Button>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onWhatsApp(activeLead)}
              className="gap-2 border-[#25D366]/40 text-[#1DA851] hover:border-[#25D366] hover:bg-[#25D366] hover:text-white"
            >
              <MessageCircle className="h-4 w-4" />
              WhatsApp
            </Button>
            <Button type="button" onClick={handleSave} disabled={saving} className="gap-2">
              <Save className="h-4 w-4" />
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
