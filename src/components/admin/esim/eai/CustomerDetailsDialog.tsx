import { useEffect, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Copy,
  Loader2,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  Smartphone,
  User,
  QrCode,
} from "lucide-react";
import { toast } from "sonner";
import {
  brl,
  consumptionPercent,
  eaiCall,
  extractList,
  formatCpfCnpj,
  formatDate,
  formatMsisdn,
  gb,
  statusClasses,
  statusTone,
} from "./eaiClient";

type Props = {
  customerId: string | number | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
};

type LineExtra = {
  consumption?: any;
  detailed?: any;
  postPaid?: any;
  lineData?: any;
  loadingDetail?: boolean;
};

function copy(text: string) {
  navigator.clipboard.writeText(text).then(
    () => toast.success("Copiado"),
    () => toast.error("Falha ao copiar"),
  );
}

function Field({ label, value, mono = false }: { label: string; value: any; mono?: boolean }) {
  const display =
    value === null || value === undefined || value === ""
      ? "—"
      : typeof value === "object"
      ? JSON.stringify(value)
      : String(value);
  return (
    <div className="space-y-1">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={`text-sm ${mono ? "font-mono" : ""}`}>{display}</div>
    </div>
  );
}

function ConsumptionBar({
  label,
  used,
  total,
  unit = "mb",
}: {
  label: string;
  used: number | null | undefined;
  total: number | null | undefined;
  unit?: "mb" | "min" | "sms";
}) {
  const pct = consumptionPercent(used ?? 0, total ?? 0);
  const fmt = (v: number | null | undefined) => {
    if (v === null || v === undefined) return "—";
    if (unit === "mb") return gb(v);
    if (unit === "min") return `${v} min`;
    return `${v} SMS`;
  };
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium tabular-nums">
          {fmt(used)} <span className="text-muted-foreground">/ {fmt(total)}</span>
        </span>
      </div>
      <Progress value={pct} className="h-1.5" />
    </div>
  );
}

export function CustomerDetailsDialog({ customerId, open, onOpenChange }: Props) {
  const [loading, setLoading] = useState(false);
  const [customer, setCustomer] = useState<any>(null);
  const [lines, setLines] = useState<any[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [extras, setExtras] = useState<Record<string, LineExtra>>({});
  const cacheRef = useRef<Map<string, { customer: any; lines: any[] }>>(new Map());

  async function load(force = false) {
    if (!customerId) return;
    const key = String(customerId);
    if (!force && cacheRef.current.has(key)) {
      const c = cacheRef.current.get(key)!;
      setCustomer(c.customer);
      setLines(c.lines);
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    setExtras({});
    const [custRes, linesRes] = await Promise.all([
      eaiCall<any>(`/rest/service_eai/customers/${encodeURIComponent(key)}`),
      eaiCall<any>(`/rest/service_eai/mvno_lines`, {
        query: { personId: key, "pagination.limit": 100, "pagination.page": 1 },
      }),
    ]);

    const cust = custRes.ok ? (custRes.json?.customer ?? custRes.json?.data ?? custRes.json) : null;
    const linesArr = linesRes.ok ? (extractList(linesRes) as any[]) : [];

    if (!custRes.ok && !linesRes.ok) {
      setErrorMsg("Não foi possível carregar os dados do cliente.");
    }
    setCustomer(cust);
    setLines(linesArr);
    cacheRef.current.set(key, { customer: cust, lines: linesArr });

    // Fetch aggregate consumption per line in parallel
    if (linesArr.length > 0) {
      const results = await Promise.allSettled(
        linesArr.map((l: any) =>
          eaiCall<any>(`/rest/service_eai/mvno_lines/${encodeURIComponent(String(l.id))}/consumption`),
        ),
      );
      const next: Record<string, LineExtra> = {};
      results.forEach((r, i) => {
        const lid = String(linesArr[i].id);
        next[lid] = {
          ...(extras[lid] || {}),
          consumption: r.status === "fulfilled" && r.value.ok ? r.value.json : null,
        };
      });
      setExtras((prev) => ({ ...prev, ...next }));
    }
    setLoading(false);
  }

  useEffect(() => {
    if (open && customerId) load(false);
    if (!open) {
      setCustomer(null);
      setLines([]);
      setExtras({});
      setErrorMsg(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, customerId]);

  async function loadLineDetail(lineId: string) {
    if (extras[lineId]?.detailed !== undefined && extras[lineId]?.postPaid !== undefined) return;
    setExtras((p) => ({ ...p, [lineId]: { ...(p[lineId] || {}), loadingDetail: true } }));
    const [detRes, ppRes, lineRes] = await Promise.all([
      eaiCall<any>(
        `/rest/service_eai/mvno_lines/${encodeURIComponent(lineId)}/detailed_consumption`,
      ),
      eaiCall<any>(`/rest/service_eai/mvno_lines/${encodeURIComponent(lineId)}/post_paid`, {
        query: { onlyPending: true },
      }),
      eaiCall<any>(`/rest/service_eai/mvno_lines/${encodeURIComponent(lineId)}`),
    ]);
    setExtras((p) => ({
      ...p,
      [lineId]: {
        ...(p[lineId] || {}),
        detailed: detRes.ok ? detRes.json : null,
        postPaid: ppRes.ok ? ppRes.json : null,
        lineData: lineRes.ok ? (lineRes.json?.data ?? lineRes.json) : null,
        loadingDetail: false,
      },
    }));
  }

  const addresses: any[] = Array.isArray(customer?.addresses) ? customer.addresses : [];
  const contacts: any[] = Array.isArray(customer?.contacts) ? customer.contacts : [];

  const displayName =
    customer?.name || customer?.legalName || customer?.razaoSocial || "Cliente";
  const status = customer?.status || customer?.active;
  const tone = statusTone(typeof status === "boolean" ? (status ? "active" : "inactive") : status);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col rounded-2xl">
        <DialogHeader className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center text-lg font-semibold">
                {String(displayName).trim().charAt(0).toUpperCase() || "?"}
              </div>
              <div>
                <DialogTitle className="text-xl">{displayName}</DialogTitle>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  {status && (
                    <Badge variant="outline" className={statusClasses(tone)}>
                      {String(status)}
                    </Badge>
                  )}
                  {customer?.cpfCnpj && (
                    <Badge variant="secondary" className="font-mono text-xs">
                      {formatCpfCnpj(customer.cpfCnpj)}
                    </Badge>
                  )}
                  {customer?.type && <Badge variant="outline">{String(customer.type)}</Badge>}
                  {customer?.typeTelecom && (
                    <Badge variant="outline">{String(customer.typeTelecom)}</Badge>
                  )}
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => load(true)}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              <span className="ml-2">Atualizar</span>
            </Button>
          </div>
        </DialogHeader>

        {errorMsg && (
          <div className="rounded-xl border border-destructive/40 bg-destructive/5 text-destructive text-sm p-3">
            {errorMsg}
          </div>
        )}

        <div className="flex-1 overflow-y-auto -mx-6 px-6">
          {loading && !customer ? (
            <div className="space-y-3 py-4">
              <Skeleton className="h-8 w-1/3" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : (
            <Tabs defaultValue="perfil" className="mt-2">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="perfil">
                  <User className="h-3.5 w-3.5 mr-1.5" /> Perfil
                </TabsTrigger>
                <TabsTrigger value="enderecos">
                  <MapPin className="h-3.5 w-3.5 mr-1.5" /> Endereços
                </TabsTrigger>
                <TabsTrigger value="contatos">
                  <Phone className="h-3.5 w-3.5 mr-1.5" /> Contatos
                </TabsTrigger>
                <TabsTrigger value="linhas">
                  <Smartphone className="h-3.5 w-3.5 mr-1.5" /> Linhas ({lines.length})
                </TabsTrigger>
                <TabsTrigger value="raw">Raw</TabsTrigger>
              </TabsList>

              <TabsContent value="perfil" className="pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="ID" value={customer?.id} mono />
                  <Field label="Nome" value={customer?.name} />
                  <Field label="Razão social / Legal" value={customer?.legalName} />
                  <Field label="CPF/CNPJ" value={formatCpfCnpj(customer?.cpfCnpj)} mono />
                  <Field label="RG / IE" value={customer?.rgIe} />
                  <Field label="E-mail" value={customer?.email} />
                  <Field label="Telefone" value={customer?.phone} />
                  <Field label="Nascimento" value={formatDate(customer?.birthdate)} />
                  <Field label="Tipo (PF/PJ)" value={customer?.type} />
                  <Field label="Tipo Telecom" value={customer?.typeTelecom} />
                  <Field label="Status" value={customer?.status} />
                  <Field label="Criado em" value={formatDate(customer?.createdAt)} />
                  <Field label="Atualizado em" value={formatDate(customer?.updatedAt)} />
                </div>
              </TabsContent>

              <TabsContent value="enderecos" className="pt-4 space-y-3">
                {addresses.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum endereço cadastrado.</p>
                ) : (
                  addresses.map((a, i) => (
                    <div key={i} className="rounded-xl border p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium">
                          {a.label || a.type || `Endereço ${i + 1}`}
                        </div>
                        {a.zipCode && (
                          <Badge variant="secondary" className="font-mono">
                            {a.zipCode}
                          </Badge>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <Field label="Logradouro" value={a.street || a.address} />
                        <Field label="Número" value={a.number} />
                        <Field label="Complemento" value={a.complement} />
                        <Field label="Bairro" value={a.neighborhood || a.district} />
                        <Field
                          label="Cidade"
                          value={a.city?.name || a.cityName || a.city}
                        />
                        <Field
                          label="UF"
                          value={a.state?.uf || a.state?.name || a.uf || a.state}
                        />
                        <Field label="País" value={a.country?.name || a.country || "BR"} />
                        <Field label="Tipo" value={a.type} />
                      </div>
                    </div>
                  ))
                )}
              </TabsContent>

              <TabsContent value="contatos" className="pt-4">
                {contacts.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum contato cadastrado.</p>
                ) : (
                  <div className="rounded-xl border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Valor</TableHead>
                          <TableHead>Observação</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {contacts.map((c, i) => (
                          <TableRow key={i}>
                            <TableCell>{c.type || "—"}</TableCell>
                            <TableCell className="font-mono text-xs">
                              {c.value || c.contact || "—"}
                            </TableCell>
                            <TableCell>{c.note || c.observation || "—"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="linhas" className="pt-4">
                {lines.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhuma linha vinculada.</p>
                ) : (
                  <Accordion
                    type="single"
                    collapsible
                    onValueChange={(v) => v && loadLineDetail(v)}
                  >
                    {lines.map((l: any) => {
                      const lid = String(l.id);
                      const ex = extras[lid] || {};
                      const cons = ex.consumption?.consumption || ex.consumption || {};
                      const data = cons.data || cons.dataConsumption || {};
                      const voice = cons.voice || cons.voiceConsumption || {};
                      const sms = cons.sms || cons.smsConsumption || {};
                      const lineStatus =
                        l.status || l.lineStatus || (l.active ? "active" : "inactive");
                      return (
                        <AccordionItem key={lid} value={lid} className="border rounded-xl mb-2 px-4">
                          <AccordionTrigger className="hover:no-underline">
                            <div className="flex flex-1 flex-wrap items-center gap-3 pr-3">
                              <span className="font-mono text-sm font-medium">
                                {formatMsisdn(l.msisdn)}
                              </span>
                              <Badge
                                variant="outline"
                                className={statusClasses(statusTone(String(lineStatus)))}
                              >
                                {String(lineStatus)}
                              </Badge>
                              {l.plan?.name && (
                                <Badge variant="secondary" className="text-xs">
                                  {l.plan.name}
                                </Badge>
                              )}
                              {l.recurrence && (
                                <span className="text-xs text-muted-foreground">
                                  {String(l.recurrence)}
                                </span>
                              )}
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="space-y-4 pt-2">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              <Field label="ID Linha" value={l.id} mono />
                              <div className="space-y-1">
                                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                                  ICCID
                                </div>
                                <div className="flex items-center gap-1.5 text-sm font-mono">
                                  {l.iccid || "—"}
                                  {l.iccid && (
                                    <button
                                      onClick={() => copy(l.iccid)}
                                      className="p-1 rounded hover:bg-muted"
                                    >
                                      <Copy className="h-3 w-3" />
                                    </button>
                                  )}
                                </div>
                              </div>
                              <Field label="IMSI" value={l.imsi} mono />
                              <Field label="Plano" value={l.plan?.name || l.planId} />
                              <Field label="Recorrência" value={l.recurrence} />
                              <Field label="Criada em" value={formatDate(l.createdAt)} />
                              <Field label="Ativada em" value={formatDate(l.activatedAt)} />
                              <Field label="Vence dia" value={l.dueDay} />
                              <Field label="Tipo cobrança" value={l.billingType} />
                            </div>

                            {(() => {
                              // Função para buscar recursivamente uma string que comece com "LPA:"
                              const findLpaCode = (obj: any): string | null => {
                                if (!obj) return null;
                                if (typeof obj === "string" && obj.startsWith("LPA:")) return obj;
                                if (typeof obj === "object") {
                                  for (const key in obj) {
                                    const result = findLpaCode(obj[key]);
                                    if (result) return result;
                                  }
                                }
                                return null;
                              };

                              const lineData = ex.lineData || {};
                              const lpaFromScan = findLpaCode(lineData) || findLpaCode(l);

                              const activationCode = 
                                lpaFromScan ||
                                (lineData.line || {}).qrCode ||
                                lineData.qrCode ||
                                lineData.qr_code ||
                                lineData.activation_code || 
                                lineData.lpa || 
                                lineData.qr_code_url || 
                                lineData.esimActivationCode || 
                                lineData.activationCode ||
                                (lineData.eSimData || {}).activationCode ||
                                (lineData.eSimData || {}).lpa ||
                                (lineData.eSimData || {}).qrCode ||
                                lineData.voucherCode ||
                                lineData.activationData ||
                                l.qrCode ||
                                l.activationCode;

                              if (!activationCode) {
                                return (
                                  <div className="rounded-xl border border-dashed p-4 text-center">
                                    <p className="text-xs text-muted-foreground">
                                      Dados de ativação eSIM não encontrados para esta linha. 
                                      {ex.loadingDetail && <span className="ml-1 animate-pulse">(Carregando...)</span>}
                                    </p>
                                    {!ex.loadingDetail && !ex.lineData && (
                                      <p className="text-[10px] text-muted-foreground/60 mt-1">
                                        Expandir a linha deve carregar os detalhes automaticamente.
                                      </p>
                                    )}
                                  </div>
                                );
                              }

                              return (
                                <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-4">
                                  <div className="flex items-center gap-2 text-sm font-semibold text-primary uppercase tracking-wide">
                                    <QrCode className="h-4 w-4" />
                                    QR Code de Ativação (eSIM)
                                  </div>
                                  <div className="flex flex-col md:flex-row gap-6 items-center">
                                    <div className="bg-white p-3 rounded-xl border shadow-sm">
                                      <QRCodeSVG 
                                        value={activationCode} 
                                        size={180}
                                        level="H"
                                        includeMargin
                                      />
                                    </div>
                                    <div className="flex-1 space-y-3">
                                      <div className="space-y-1">
                                        <p className="text-xs text-muted-foreground font-medium uppercase">Código de Ativação (LPA)</p>
                                        <div className="flex items-center gap-2 p-2 bg-muted/50 rounded border text-xs font-mono break-all relative group">
                                          {activationCode}
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={() => copy(activationCode)}
                                          >
                                            <Copy className="h-3 w-3" />
                                          </Button>
                                        </div>
                                      </div>
                                      <div className="text-[11px] text-muted-foreground leading-relaxed">
                                        Aponte a câmera do dispositivo para o QR Code acima para iniciar a instalação do eSIM. 
                                        Caso necessário, utilize o código de ativação manualmente nas configurações de rede do celular.
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })()}

                            <div className="space-y-3 rounded-xl bg-muted/40 p-4">
                              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                Consumo
                              </div>
                              <ConsumptionBar
                                label="Dados"
                                used={data.used ?? data.consumed ?? data.usedMb}
                                total={data.total ?? data.totalMb ?? data.limit}
                              />
                              <ConsumptionBar
                                label="Voz"
                                unit="min"
                                used={voice.used ?? voice.consumed}
                                total={voice.total ?? voice.limit}
                              />
                              <ConsumptionBar
                                label="SMS"
                                unit="sms"
                                used={sms.used ?? sms.consumed}
                                total={sms.total ?? sms.limit}
                              />
                            </div>

                            {ex.loadingDetail ? (
                              <Skeleton className="h-20 w-full" />
                            ) : (
                              <>
                                {ex.postPaid && (
                                  <div className="rounded-xl border p-4 space-y-2">
                                    <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                      Pós-pago pendente
                                    </div>
                                    <div className="text-sm">
                                      Total:{" "}
                                      <span className="font-semibold">
                                        {brl(
                                          ex.postPaid?.totalPending ??
                                            ex.postPaid?.total ??
                                            0,
                                        )}
                                      </span>
                                    </div>
                                    {Array.isArray(ex.postPaid?.charges) &&
                                      ex.postPaid.charges.length > 0 && (
                                        <Table>
                                          <TableHeader>
                                            <TableRow>
                                              <TableHead>Data</TableHead>
                                              <TableHead>Descrição</TableHead>
                                              <TableHead className="text-right">Valor</TableHead>
                                            </TableRow>
                                          </TableHeader>
                                          <TableBody>
                                            {ex.postPaid.charges.map((ch: any, i: number) => (
                                              <TableRow key={i}>
                                                <TableCell className="text-xs">
                                                  {formatDate(ch.date || ch.dueDate)}
                                                </TableCell>
                                                <TableCell className="text-xs">
                                                  {ch.description || ch.name || "—"}
                                                </TableCell>
                                                <TableCell className="text-right text-xs">
                                                  {brl(ch.value)}
                                                </TableCell>
                                              </TableRow>
                                            ))}
                                          </TableBody>
                                        </Table>
                                      )}
                                  </div>
                                )}

                                {ex.detailed && (
                                  <div className="rounded-xl border overflow-hidden">
                                    <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground bg-muted/30">
                                      Sessões detalhadas
                                    </div>
                                    {(() => {
                                      const sessions =
                                        ex.detailed?.sessions ||
                                        ex.detailed?.consumptions ||
                                        ex.detailed?.data ||
                                        [];
                                      const arr = Array.isArray(sessions) ? sessions : [];
                                      if (arr.length === 0) {
                                        return (
                                          <p className="text-xs text-muted-foreground p-4">
                                            Nenhuma sessão registrada.
                                          </p>
                                        );
                                      }
                                      return (
                                        <Table>
                                          <TableHeader>
                                            <TableRow>
                                              <TableHead>Data</TableHead>
                                              <TableHead>Tipo</TableHead>
                                              <TableHead>Destino</TableHead>
                                              <TableHead className="text-right">
                                                Qtd
                                              </TableHead>
                                            </TableRow>
                                          </TableHeader>
                                          <TableBody>
                                            {arr.slice(0, 50).map((s: any, i: number) => (
                                              <TableRow key={i}>
                                                <TableCell className="text-xs">
                                                  {formatDate(s.date || s.startedAt)}
                                                </TableCell>
                                                <TableCell className="text-xs">
                                                  {s.type || s.kind || "—"}
                                                </TableCell>
                                                <TableCell className="text-xs">
                                                  {s.destination || s.number || "—"}
                                                </TableCell>
                                                <TableCell className="text-right text-xs tabular-nums">
                                                  {s.dataMb
                                                    ? gb(s.dataMb)
                                                    : s.duration
                                                    ? `${s.duration}`
                                                    : s.amount || "—"}
                                                </TableCell>
                                              </TableRow>
                                            ))}
                                          </TableBody>
                                        </Table>
                                      );
                                    })()}
                                  </div>
                                )}
                              </>
                            )}
                          </AccordionContent>
                        </AccordionItem>
                      );
                    })}
                  </Accordion>
                )}
              </TabsContent>

              <TabsContent value="raw" className="pt-4">
                <pre className="text-xs bg-muted/40 rounded-xl p-4 overflow-auto max-h-[60vh]">
{JSON.stringify({ customer, lines, extras }, null, 2)}
                </pre>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
