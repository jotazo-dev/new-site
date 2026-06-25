import { useMemo } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CalendarDays, Clock, MapPin, Phone, User, Wrench, FileText, Hash, Mail,
  IdCard, Smartphone, KeyRound, FileSignature, Cpu, Globe, StickyNote,
  Receipt, MessageCircle, Copy,
} from "lucide-react";
import type { Atendimento } from "@/hooks/useRbxAtendimentos";
import { STATUS_META } from "@/components/admin/painel/atendimentoStatus";
import { parseRbxDescription } from "./parseRbxDescription";
import { toast } from "@/hooks/use-toast";

function formatDateTime(iso: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("pt-BR", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch { return "—"; }
}

function onlyDigits(s: string) { return (s || "").replace(/\D/g, ""); }

function copy(text: string, label = "Copiado") {
  navigator.clipboard?.writeText(text).then(() => {
    toast({ title: label, description: text });
  });
}

export function AgendaAtendimentoDialog({
  atendimento, open, onOpenChange,
}: {
  atendimento: Atendimento | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const parsed = useMemo(
    () => parseRbxDescription(atendimento?.description),
    [atendimento?.description],
  );

  if (!atendimento) return null;
  const meta = STATUS_META[atendimento.status];
  const phoneDigits = onlyDigits(atendimento.customerPhone || "");
  const phone2Digits = onlyDigits(atendimento.customerPhone2 || "");
  const mapsUrl = atendimento.address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(atendimento.address)}`
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[88vh] p-0 gap-0 flex flex-col overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
          <DialogTitle className="flex items-center gap-2 text-base pr-8">
            <span className={`h-2.5 w-2.5 rounded-full ${meta.dot}`} />
            <span>Atendimento</span>
            <span className="font-mono text-sm text-muted-foreground">{atendimento.protocol}</span>
          </DialogTitle>
          <DialogDescription className="sr-only">
            Detalhes operacionais do atendimento {atendimento.protocol}
          </DialogDescription>
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
          <Section title="Cliente" icon={<User className="h-4 w-4" />}>
            <Field icon={<User className="h-4 w-4" />} label="Nome" value={atendimento.customerName}
              actions={<CopyBtn text={atendimento.customerName} />} />
            <Field icon={<Hash className="h-4 w-4" />} label="ID interno" value={atendimento.id} mono />
            {atendimento.customerCode && (
              <Field icon={<Hash className="h-4 w-4" />} label="Código cliente"
                value={atendimento.customerCode} mono
                actions={<CopyBtn text={atendimento.customerCode} />} />
            )}
            {atendimento.customerDocument && (
              <Field icon={<IdCard className="h-4 w-4" />} label="CPF / CNPJ"
                value={atendimento.customerDocument}
                actions={<CopyBtn text={atendimento.customerDocument} />} />
            )}
            {atendimento.customerPhone && (
              <Field
                icon={<Phone className="h-4 w-4" />}
                label="Telefone"
                value={atendimento.customerPhone}
                actions={
                  <div className="flex gap-1">
                    <CopyBtn text={atendimento.customerPhone} />
                    <a
                      href={`https://wa.me/55${phoneDigits}`}
                      target="_blank" rel="noreferrer"
                      className="inline-flex items-center justify-center h-6 w-6 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                      title="Abrir WhatsApp"
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                    </a>
                  </div>
                }
              />
            )}
            {atendimento.customerPhone2 && (
              <Field
                icon={<Smartphone className="h-4 w-4" />}
                label="Celular"
                value={atendimento.customerPhone2}
                actions={
                  <div className="flex gap-1">
                    <CopyBtn text={atendimento.customerPhone2} />
                    <a
                      href={`https://wa.me/55${phone2Digits}`}
                      target="_blank" rel="noreferrer"
                      className="inline-flex items-center justify-center h-6 w-6 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                      title="Abrir WhatsApp"
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                    </a>
                  </div>
                }
              />
            )}
            {atendimento.customerEmail && (
              <Field icon={<Mail className="h-4 w-4" />} label="Email"
                value={atendimento.customerEmail} full
                actions={<CopyBtn text={atendimento.customerEmail} />} />
            )}
            {atendimento.address && (
              <Field
                icon={<MapPin className="h-4 w-4" />} label="Endereço"
                value={atendimento.address} full
                actions={
                  <div className="flex gap-1">
                    <CopyBtn text={atendimento.address} />
                    {mapsUrl && (
                      <a
                        href={mapsUrl} target="_blank" rel="noreferrer"
                        className="inline-flex items-center justify-center h-6 w-6 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                        title="Abrir no Google Maps"
                      >
                        <MapPin className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                }
              />
            )}
          </Section>

          {/* Agendamento */}
          <Section title="Agendamento" icon={<CalendarDays className="h-4 w-4" />}>
            <Field icon={<CalendarDays className="h-4 w-4" />} label="Data agendada"
              value={formatDateTime(atendimento.scheduledAt)} />
            <Field icon={<Clock className="h-4 w-4" />} label="Aberto em"
              value={formatDateTime(atendimento.openedAt)} />
            {atendimento.technician && (
              <Field icon={<Wrench className="h-4 w-4" />} label="Técnico"
                value={atendimento.technician} />
            )}
          </Section>

          {/* Contratos / Plano */}
          {parsed.contratos.length > 0 && (
            <Section title="Contratos / Planos" icon={<FileSignature className="h-4 w-4" />}>
              {parsed.contratos.map((c, i) => (
                <SubCard key={i}>
                  {c.contrato && <Mini label="Contrato" value={c.contrato} mono />}
                  {c.plano && <Mini label="Plano" value={c.plano} full />}
                  {c.qos && <Mini label="QoS" value={c.qos} />}
                  {c.assinatura && <Mini label="Assinatura" value={c.assinatura} />}
                  {c.inicio && <Mini label="Início" value={c.inicio} />}
                  {c.leituraVenc && <Mini label="Leitura/Venc." value={c.leituraVenc} />}
                </SubCard>
              ))}
            </Section>
          )}

          {/* Autenticações */}
          {parsed.auths.length > 0 && (
            <Section title="Autenticações" icon={<KeyRound className="h-4 w-4" />}>
              {parsed.auths.map((a, i) => (
                <SubCard key={i}>
                  {a.login && (
                    <Mini label="Login" value={a.login} mono full
                      actions={<CopyBtn text={a.login} />} />
                  )}
                  {a.senha && (
                    <Mini label="Senha" value={a.senha} mono
                      actions={<CopyBtn text={a.senha} />} />
                  )}
                  {a.mac && (
                    <Mini label="MAC" value={a.mac} mono
                      actions={<CopyBtn text={a.mac} />} />
                  )}
                  {a.nas && <Mini label="NAS" value={a.nas} />}
                  {a.porta && <Mini label="Porta" value={a.porta} />}
                  {a.obs && <Mini label="Obs" value={a.obs} full />}
                </SubCard>
              ))}
            </Section>
          )}

          {/* Equipamentos */}
          {parsed.equipamentos.length > 0 && (
            <Section title="Equipamentos" icon={<Cpu className="h-4 w-4" />}>
              {parsed.equipamentos.map((e, i) => (
                <SubCard key={i}>
                  {e.origem && <Mini label="Origem" value={e.origem} />}
                  {e.equipamento && <Mini label="Equipamento" value={e.equipamento} full />}
                </SubCard>
              ))}
            </Section>
          )}

          {/* IPs */}
          {parsed.ips.length > 0 && (
            <Section title="IPs cadastrados" icon={<Globe className="h-4 w-4" />}>
              {parsed.ips.map((ip, i) => (
                <SubCard key={i}>
                  {ip.ip && <Mini label="IP" value={ip.ip} mono full />}
                  {ip.gateway && <Mini label="Gateway" value={ip.gateway} mono />}
                  {ip.mac && <Mini label="MAC" value={ip.mac} mono />}
                  {ip.obs && <Mini label="Obs" value={ip.obs} full />}
                </SubCard>
              ))}
            </Section>
          )}

          {/* Observações */}
          {parsed.observacoes && (
            <Section title="Observações" icon={<StickyNote className="h-4 w-4" />} bare>
              <p className="text-sm whitespace-pre-wrap leading-relaxed text-foreground/90 rounded-lg border bg-muted/30 p-3">
                {parsed.observacoes}
              </p>
            </Section>
          )}

          {/* Documentos em aberto */}
          {parsed.documentos.length > 0 && (
            <Section title="Documentos em aberto" icon={<Receipt className="h-4 w-4" />} bare>
              <div className="rounded-lg border bg-muted/30 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr className="text-xs uppercase text-muted-foreground">
                      <th className="text-left font-medium px-3 py-2">Documento</th>
                      <th className="text-left font-medium px-3 py-2">Vencimento</th>
                      <th className="text-right font-medium px-3 py-2">Valor</th>
                      <th className="text-left font-medium px-3 py-2">Origem</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsed.documentos.map((d, i) => (
                      <tr key={i} className="border-t">
                        <td className="px-3 py-2 font-mono text-xs">{d.numero || "—"}</td>
                        <td className="px-3 py-2">{d.vencimento || "—"}</td>
                        <td className="px-3 py-2 text-right font-medium">{d.valor || "—"}</td>
                        <td className="px-3 py-2 text-xs text-muted-foreground">{d.origem || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {parsed.documentosResumo && (
                  <div className="px-3 py-2 text-xs font-medium border-t bg-muted/40">
                    {parsed.documentosResumo}
                  </div>
                )}
              </div>
            </Section>
          )}

          {/* Intro / Resumo do chamado */}
          {parsed.intro && (
            <Section title="Resumo do chamado" icon={<FileText className="h-4 w-4" />} bare>
              <p className="text-sm whitespace-pre-wrap leading-relaxed text-foreground/90 rounded-lg border bg-muted/30 p-3">
                {parsed.intro}
              </p>
            </Section>
          )}

          {/* Fallback: descrição bruta se não conseguimos parsear */}
          {!parsed.intro && !parsed.observacoes && parsed.contratos.length === 0 &&
           parsed.auths.length === 0 && parsed.documentos.length === 0 &&
           atendimento.description && (
            <Section title="Descrição" icon={<FileText className="h-4 w-4" />} bare>
              <p className="text-sm whitespace-pre-wrap leading-relaxed text-foreground/90 rounded-lg border bg-muted/30 p-3">
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
  title, icon, children, bare,
}: { title: string; icon?: React.ReactNode; children: React.ReactNode; bare?: boolean }) {
  return (
    <section>
      <h4 className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
        {icon}{title}
      </h4>
      {bare ? (
        children
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-lg border bg-muted/30 p-3">
          {children}
        </div>
      )}
    </section>
  );
}

function SubCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-2 rounded-md border bg-background p-3">
      {children}
    </div>
  );
}

function Field({
  icon, label, value, mono, full, actions,
}: {
  icon: React.ReactNode; label: string; value: string;
  mono?: boolean; full?: boolean; actions?: React.ReactNode;
}) {
  return (
    <div className={`flex items-start gap-2 ${full ? "sm:col-span-2" : ""}`}>
      <span className="text-muted-foreground mt-0.5 shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] uppercase tracking-wide text-muted-foreground flex items-center justify-between gap-2">
          <span>{label}</span>
          {actions}
        </div>
        <div className={mono ? "font-mono text-xs break-all" : "text-sm break-words"}>{value}</div>
      </div>
    </div>
  );
}

function Mini({
  label, value, mono, full, actions,
}: {
  label: string; value: string;
  mono?: boolean; full?: boolean; actions?: React.ReactNode;
}) {
  return (
    <div className={full ? "sm:col-span-2" : ""}>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground flex items-center justify-between gap-2">
        <span>{label}</span>
        {actions}
      </div>
      <div className={mono ? "font-mono text-xs break-all" : "text-sm break-words"}>{value}</div>
    </div>
  );
}

function CopyBtn({ text }: { text: string }) {
  return (
    <Button
      type="button" variant="ghost" size="icon"
      className="h-6 w-6 text-muted-foreground hover:text-foreground"
      onClick={(e) => { e.stopPropagation(); copy(text); }}
      title="Copiar"
    >
      <Copy className="h-3 w-3" />
    </Button>
  );
}
