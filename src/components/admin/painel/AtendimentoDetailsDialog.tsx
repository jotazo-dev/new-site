import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Clock, MapPin, Phone, User, Wrench, FileText, Hash, Mail, IdCard, Smartphone } from "lucide-react";
import type { Atendimento } from "@/hooks/useRbxAtendimentos";
import { STATUS_META } from "./atendimentoStatus";

function formatDateTime(iso: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("pt-BR", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch { return "—"; }
}

export function AtendimentoDetailsDialog({
  atendimento, open, onOpenChange,
}: {
  atendimento: Atendimento | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  if (!atendimento) return null;
  const meta = STATUS_META[atendimento.status];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] p-0 gap-0 flex flex-col overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
          <DialogTitle className="flex items-center gap-2 text-base pr-8">
            <span className={`h-2.5 w-2.5 rounded-full ${meta.dot}`} />
            <span>Atendimento</span>
            <span className="font-mono text-sm text-muted-foreground">{atendimento.protocol}</span>
          </DialogTitle>
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <Badge variant="outline" className={`${meta.chip} border`}>
              {atendimento.statusLabel || meta.label}
            </Badge>
            <Badge variant="outline">{atendimento.type}</Badge>
            {atendimento.reason && <Badge variant="secondary">{atendimento.reason}</Badge>}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Cliente */}
          <Section title="Cliente">
            <Field icon={<User className="h-4 w-4" />} label="Nome" value={atendimento.customerName} />
            <Field icon={<Hash className="h-4 w-4" />} label="ID interno" value={atendimento.id} mono />
            {atendimento.customerDocument && (
              <Field icon={<IdCard className="h-4 w-4" />} label="CPF / CNPJ" value={atendimento.customerDocument} />
            )}
            {atendimento.customerPhone && (
              <Field icon={<Phone className="h-4 w-4" />} label="Telefone" value={atendimento.customerPhone} />
            )}
            {atendimento.customerPhone2 && (
              <Field icon={<Smartphone className="h-4 w-4" />} label="Celular" value={atendimento.customerPhone2} />
            )}
            {atendimento.customerEmail && (
              <Field icon={<Mail className="h-4 w-4" />} label="Email" value={atendimento.customerEmail} full />
            )}
            {atendimento.address && (
              <Field icon={<MapPin className="h-4 w-4" />} label="Endereço" value={atendimento.address} full />
            )}
          </Section>

          {/* Agendamento */}
          <Section title="Agendamento">
            <Field
              icon={<CalendarDays className="h-4 w-4" />}
              label="Data agendada"
              value={formatDateTime(atendimento.scheduledAt)}
            />
            <Field
              icon={<Clock className="h-4 w-4" />}
              label="Aberto em"
              value={formatDateTime(atendimento.openedAt)}
            />
            {atendimento.technician && (
              <Field
                icon={<Wrench className="h-4 w-4" />}
                label="Técnico"
                value={atendimento.technician}
              />
            )}
          </Section>

          {/* Descrição */}
          {atendimento.description && (
            <Section title="Descrição" icon={<FileText className="h-4 w-4" />}>
              <p className="text-sm whitespace-pre-wrap leading-relaxed text-foreground/90">
                {atendimento.description}
              </p>
            </Section>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Section({
  title, icon, children,
}: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section>
      <h4 className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
        {icon}
        {title}
      </h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-lg border bg-muted/30 p-3">
        {children}
      </div>
    </section>
  );
}

function Field({
  icon, label, value, mono, full,
}: { icon: React.ReactNode; label: string; value: string; mono?: boolean; full?: boolean }) {
  return (
    <div className={`flex items-start gap-2 ${full ? "sm:col-span-2" : ""}`}>
      <span className="text-muted-foreground mt-0.5 shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
        <div className={mono ? "font-mono text-xs break-all" : "text-sm break-words"}>{value}</div>
      </div>
    </div>
  );
}
