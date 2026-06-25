import { useState, useEffect, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Loader2, RefreshCw, Search, Radio, Info, ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { AlgarCustomerDialog } from "./AlgarCustomerDialog";
import { AlgarLineDetail } from "./AlgarLineDetail";
import { formatMsisdn } from "./algarClient";


type Customer = {
  id: string | number;
  name: string;
  document: string;
  email: string;
  status: string;
  serviceStatus?: string;
  restriction?: string;
  iccid?: string;
  msisdn?: string;
  terminal?: string;
  serviceTerminal?: string;
  plan?: string;
  planSku?: string;
  operator?: string;
  networkName?: string;
  networkState?: string;
  networkCode?: string;
  subscriberType?: string;
  profileName?: string;
  cardType?: string;
  usage?: {
    current: number;
    total: number;
    days_left?: number;
    total_days?: number;
  };
  portingStatus?: string;
  portabilityData?: {
    activationDate?: string;
    portedNumber?: string;
    tempNumber?: string;
    scheduledDate?: string;
  };
  address?: any;
  sim?: any;
  device?: any;
  products?: any[];
  portability?: any;
  protocols?: any[];
  raw?: any;
};

const API_PAGE_SIZE = 100;

const STATUS_API_MAP: Record<string, string> = {
  ACTIVE: "active",
  INACTIVE: "cancelled",
};

const normalizeLineStatus = (service: any) => {
  const status = String(service?.status || "").toLowerCase();
  const restriction = String(service?.restriction || "none").toLowerCase();

  if (status === "cancelled" || service?.cancelledAt) return "INACTIVE";
  if (status === "suspended" || service?.suspendedAt || restriction === "suspended") return "SUSPENDED";
  if (status === "blocked" || service?.blockedAt || (restriction && restriction !== "none")) return "BLOCKED";
  if (status === "active" || service?.activatedAt) return "ACTIVE";
  return status ? status.toUpperCase() : "—";
};

const bytesToGb = (value: unknown) => {
  const n = Number(value || 0);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Number((n / 1024 / 1024 / 1024).toFixed(1));
};

export function AlgarCustomerPanel() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [totalItems, setTotalItems] = useState(0);
  const [apiTotalPages, setApiTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
  const [selectedPortability, setSelectedPortability] = useState<string[]>([]);
  const [selectedLine, setSelectedLine] = useState<Customer | null>(null);

  const PAGE_SIZE = 20;


  const statusOptions = [
    { id: "ACTIVE", label: "Ativo" },
    { id: "SUSPENDED", label: "Suspenso" },
    { id: "BLOCKED", label: "Bloqueado" },
    { id: "INACTIVE", label: "Cancelado" }
  ];

  const portabilityOptions = [
    { id: "in_progress", label: "Em andamento" },
    { id: "pending", label: "Pendente" },
    { id: "requested", label: "Solicitada" },
    { id: "authorizing", label: "Autorizando" },
    { id: "scheduled", label: "Programada" },
    { id: "conflict", label: "Conflito" }
  ];

  const toggleStatus = (id: string) => {
    setSelectedStatus(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const togglePortability = (id: string) => {
    setSelectedPortability(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  // Debounce de busca
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 400);
    return () => clearTimeout(t);
  }, [search]);

  async function loadCustomers() {
    setLoading(true);
    try {
      const { data: configData } = await supabase
        .from("integrations")
        .select("*")
        .eq("provider", "algar")
        .maybeSingle();

      const config = (configData?.config as any) || {};

      const selectedApiStatus = selectedStatus.length === 1 ? STATUS_API_MAP[selectedStatus[0]] : undefined;

      const fetchPage = async (apiPage: number) => {
        const queryParams: Record<string, any> = { page: apiPage, size: API_PAGE_SIZE };
        if (debouncedSearch) queryParams.q = debouncedSearch;
        if (selectedApiStatus) queryParams.status = selectedApiStatus;

        const { data, error } = await supabase.functions.invoke("algar-mvno-api", {
          body: {
            clientId: config.client_id,
            clientSecret: config.client_secret,
            baseUrl: config.base_url || "https://api.onmultitelco.com",
            environment: config.environment || "production",
            method: "GET",
            path: "/v2/mobilelines",
            queryParams,
            forceMock: false,
          },
        });

        console.log(`[Algar] /v2/mobilelines página ${apiPage}:`, data);
        if (error) throw error;
        if (!data?.ok) throw new Error(data?.data?.message || data?.error || "Falha ao carregar linhas móveis Algar");

        const payload = data.data;
        const lines: any[] = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.data)
          ? payload.data
          : Array.isArray(payload?.items)
          ? payload.items
          : [];

        return { lines, meta: payload?.meta || {} };
      };

      const firstPage = await fetchPage(1);
      const firstMeta = firstPage.meta;
      const pages = Math.max(1, Number(firstMeta.totalPages || 1));
      const allLines = [...firstPage.lines];

      for (let apiPage = 2; apiPage <= pages; apiPage += 1) {
        const nextPage = await fetchPage(apiPage);
        allLines.push(...nextPage.lines);
      }

      setTotalItems(Number(firstMeta.totalItems ?? allLines.length));
      setApiTotalPages(pages);

      const normalized: Customer[] = allLines.map((ml: any) => {
          const service = ml.service || {};
          const subscriber = service.subscriber || {};
          const representative = service.representative || {};
          const card = ml.card || {};
          const products = Array.isArray(service.products) ? service.products : [];
          const portabilities = Array.isArray(ml.portabilities) ? ml.portabilities : [];
          const latestPort = portabilities[0] || null;
          const usage = ml.usage || {};
          const register = ml.register || {};
          const mainProduct = products.find((p: any) => p.role === "main") || products[0] || {};
          const displayName = subscriber.name || representative.name || latestPort?.subscriber?.name || "—";
          const displayDocument = subscriber.document || representative.document || latestPort?.subscriber?.document || "";

          return {
            id: ml.id,
            name: displayName,
            document: displayDocument,
            email: subscriber.email || "",
            msisdn: ml.tn || "",
            iccid: card.iccid || "",
            terminal: ml.tn || "",
            serviceTerminal: service.terminal || "",
            status: normalizeLineStatus(service),
            serviceStatus: service.status || "",
            restriction: service.restriction || "none",
            plan: mainProduct.name || mainProduct.product?.name || "—",
            planSku: mainProduct.sku || "",
            operator: "Algar",
            networkName: register.networkName || "—",
            networkState: register.state || "offline",
            networkCode: register.networkCode || "",
            subscriberType: subscriber.type || "",
            profileName: service.profile?.name || "",
            cardType: card.type || "",
            portingStatus: latestPort?.status || "none",
            portabilityData: latestPort
              ? {
                  activationDate: latestPort.createdAt,
                  portedNumber: latestPort.tn,
                  tempNumber: latestPort.tnReplace,
                  scheduledDate: latestPort.window,
                }
              : undefined,
            usage: { current: bytesToGb(usage.usageTotal), total: bytesToGb(usage.quotaTotal) },
            address: service.address
              ? {
                  zipcode: service.address.zipCode,
                  street: service.address.streetName,
                  number: service.address.streetNumber,
                  complement: service.address.complement,
                  neighborhood: service.address.neighborhood,
                  city: service.address.city,
                  state: service.address.state,
                }
              : undefined,
            sim: card,
            products,
            portability: latestPort,
            raw: ml,
          };
        });

      setCustomers(normalized);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Erro ao conectar com API Algar");
      setCustomers([]);
      setTotalItems(0);
      setApiTotalPages(1);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setCurrentPage(1);
    loadCustomers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, selectedStatus.join(",")]);

  const filtered = useMemo(() => {
    return customers.filter(c => {
      const matchesStatus = selectedStatus.length === 0 || selectedStatus.includes(c.status);
      const matchesPortability =
        selectedPortability.length === 0 ||
        (c.portingStatus && selectedPortability.includes(c.portingStatus));
      return matchesStatus && matchesPortability;
    });
  }, [customers, selectedStatus, selectedPortability]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  
  const pageItems = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, currentPage]);

  if (selectedLine) {
    return <AlgarLineDetail line={selectedLine} onBack={() => setSelectedLine(null)} />;
  }

  return (

    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold tracking-tight">Linhas Móveis</h2>
        <p className="text-muted-foreground text-sm">Telefonia Móvel</p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Número, ICCID, nome, CPF/CNPJ, terminal ou notas"
            className="pl-10 h-11 bg-white border-muted shadow-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => loadCustomers()} disabled={loading} className="h-11">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          </Button>
          <AlgarCustomerDialog onSuccess={() => loadCustomers()} />
        </div>
      </div>

      <Collapsible open={isFiltersOpen} onOpenChange={setIsFiltersOpen} className="w-full space-y-4">
        <CollapsibleTrigger asChild>
          <div className="flex items-center justify-between cursor-pointer border-b pb-2 text-sm text-muted-foreground hover:text-foreground">
            <span>Filtro avançado</span>
            {isFiltersOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-6 pt-2">
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
            <div className="flex flex-wrap gap-2">
              {statusOptions.map(opt => (
                <Button
                  key={opt.id}
                  variant="outline"
                  size="sm"
                  onClick={() => toggleStatus(opt.id)}
                  className={cn(
                    "h-9 rounded-md px-4 border-muted transition-all",
                    selectedStatus.includes(opt.id) && "bg-primary text-primary-foreground border-primary hover:bg-primary/90"
                  )}
                >
                  {opt.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground">Portabilidade</h3>
            <div className="flex flex-wrap gap-2">
              {portabilityOptions.map(opt => (
                <Button
                  key={opt.id}
                  variant="outline"
                  size="sm"
                  onClick={() => togglePortability(opt.id)}
                  className={cn(
                    "h-9 rounded-md px-4 border-muted transition-all",
                    selectedPortability.includes(opt.id) && "bg-primary text-primary-foreground border-primary hover:bg-primary/90"
                  )}
                >
                  {opt.label}
                </Button>
              ))}
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      <Card className="rounded-xl border shadow-sm overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <TooltipProvider>
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="text-xs uppercase font-semibold">Número Móvel</TableHead>
                  <TableHead className="text-xs uppercase font-semibold">Assinante</TableHead>
                  <TableHead className="text-xs uppercase font-semibold">Serviço</TableHead>
                  <TableHead className="text-xs uppercase font-semibold">Rede</TableHead>
                  <TableHead className="text-xs uppercase font-semibold">Status</TableHead>
                </TableRow>
              </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                    <Loader2 className="inline mr-2 h-4 w-4 animate-spin" />
                    Carregando assinantes...
                  </TableCell>
                </TableRow>
              ) : pageItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                    Nenhum cliente encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                pageItems.map((c) => (
                  <TableRow 
                    key={c.id} 
                    className="hover:bg-muted/10 transition-colors cursor-pointer"
                    onClick={() => setSelectedLine(c)}
                  >

                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        <span className="font-bold text-sm">{c.msisdn ? formatMsisdn(c.msisdn) : "—"}</span>
                        <span className="text-[10px] text-muted-foreground font-mono">ICCID {c.iccid || "—"}</span>
                        {c.cardType && <span className="text-[10px] text-muted-foreground uppercase">{c.cardType}</span>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-0.5 min-w-[260px]">
                        <span className="text-sm font-medium uppercase">{c.name}</span>
                        <span className="text-[10px] text-muted-foreground font-mono">{c.document || "Documento não informado"}</span>
                        {c.subscriberType && <span className="text-[10px] text-muted-foreground uppercase">{c.subscriberType}</span>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="text-sm">{c.plan}</span>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {c.planSku || "SKU —"} {c.serviceTerminal ? `• Terminal ${c.serviceTerminal}` : ""}
                        </span>
                        {c.portingStatus === "requested" && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge variant="secondary" className="w-fit bg-orange-100 text-orange-600 hover:bg-orange-100 border-none text-[10px] h-5 cursor-help">
                                Portabilidade solicitada
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent className="p-3 max-w-xs">
                              <div className="space-y-1.5 text-xs">
                                <div className="flex items-center gap-1.5 font-semibold text-orange-700">
                                  <Info className="h-3.5 w-3.5" />
                                  Solicitação Enviada
                                </div>
                                <div className="grid grid-cols-1 gap-1">
                                  <p><span className="text-muted-foreground">Portado:</span> {c.portabilityData?.portedNumber}</p>
                                  <p><span className="text-muted-foreground">Temporário:</span> {c.portabilityData?.tempNumber}</p>
                                  <p><span className="text-muted-foreground">Status:</span> Aguardando análise da operadora.</p>
                                </div>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        )}
                        {c.portingStatus === "authorizing" && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge variant="secondary" className="w-fit bg-blue-100 text-blue-600 hover:bg-blue-100 border-none text-[10px] h-5 cursor-help">
                                Portabilidade autorizando
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent className="p-3 max-w-xs">
                              <div className="space-y-1.5 text-xs">
                                <div className="flex items-center gap-1.5 font-semibold text-blue-700">
                                  <Info className="h-3.5 w-3.5" />
                                  Em Autorização
                                </div>
                                <div className="grid grid-cols-1 gap-1">
                                  <p><span className="text-muted-foreground">Portado:</span> {c.portabilityData?.portedNumber}</p>
                                  <p><span className="text-muted-foreground">Temporário:</span> {c.portabilityData?.tempNumber}</p>
                                  <p><span className="text-muted-foreground">Status:</span> Operadora doadora autorizando a migração.</p>
                                </div>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        )}
                        {c.portingStatus === "scheduled" && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge variant="secondary" className="w-fit bg-green-100 text-green-700 hover:bg-green-100 border-none text-[10px] h-5 cursor-help">
                                Portabilidade programada
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent className="p-3 max-w-xs">
                              <div className="space-y-1.5 text-xs">
                                <div className="flex items-center gap-1.5 font-semibold text-foreground">
                                  <Info className="h-3.5 w-3.5" />
                                  Detalhes da Portabilidade
                                </div>
                                <div className="grid grid-cols-1 gap-1">
                                  <p><span className="text-muted-foreground">Ativado em:</span> {c.portabilityData?.activationDate}</p>
                                  <p><span className="text-muted-foreground">Portabilidade:</span> {c.portabilityData?.portedNumber} - {c.portabilityData?.tempNumber}</p>
                                  <p><span className="text-muted-foreground">Programado:</span> {c.portabilityData?.scheduledDate}</p>
                                </div>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        )}
                        {c.portingStatus === "conflict" && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge variant="secondary" className="w-fit bg-red-100 text-red-600 hover:bg-red-100 border-none text-[10px] h-5 cursor-help">
                                Portabilidade em conflito
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent className="p-3 max-w-xs">
                              <div className="space-y-1.5 text-xs">
                                <div className="flex items-center gap-1.5 font-semibold text-destructive">
                                  <Info className="h-3.5 w-3.5" />
                                  Conflito na Portabilidade
                                </div>
                                <div className="grid grid-cols-1 gap-1">
                                  <p><span className="text-muted-foreground">Portado:</span> {c.portabilityData?.portedNumber}</p>
                                  <p><span className="text-muted-foreground">Temporário:</span> {c.portabilityData?.tempNumber}</p>
                                  <p className="text-red-500 font-medium">Verifique os dados com o cliente.</p>
                                </div>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1.5 min-w-[140px]">
                        <div className="flex items-center gap-1.5">
                          <Radio className={cn("h-3 w-3", c.networkState === "online" ? "text-green-500" : "text-muted-foreground")} />
                          <span className="text-[11px] text-muted-foreground">{c.networkName}</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground uppercase">{c.networkState || "offline"}</span>
                        <span className="text-[10px] text-muted-foreground">{c.profileName || c.operator}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`border-none font-medium h-6 px-3 ${
                        c.status === "ACTIVE" 
                          ? "bg-green-100 text-green-700" 
                          : c.status === "SUSPENDED"
                          ? "bg-yellow-100 text-yellow-700"
                          : c.status === "BLOCKED"
                          ? "bg-orange-100 text-orange-700"
                          : "bg-red-100 text-red-700"
                      }`}>
                        {statusOptions.find(opt => opt.id === c.status)?.label || c.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
            </Table>
          </TooltipProvider>
        </div>
        
        {filtered.length > 0 && (
          <div className="flex flex-col md:flex-row items-center justify-between px-4 py-3 bg-muted/20 border-t gap-4">
            <div className="flex flex-col gap-1">
              <div className="text-xs text-muted-foreground">
                Mostrando <span className="font-medium">{Math.min(filtered.length, (currentPage - 1) * PAGE_SIZE + 1)}</span>-
                <span className="font-medium">{Math.min(filtered.length, currentPage * PAGE_SIZE)}</span> de <span className="font-medium">{filtered.length}</span> linhas
              </div>
              <div className="text-[10px] text-muted-foreground italic">
                Sincronizado: {apiTotalPages} página(s) da API ({totalItems} total no servidor)
              </div>
            </div>

            {totalPages > 1 && (
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="h-8 w-8 p-0"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                  </PaginationItem>
                  
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum = currentPage;
                    if (currentPage <= 3) pageNum = i + 1;
                    else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                    else pageNum = currentPage - 2 + i;
                    
                    if (pageNum <= 0 || pageNum > totalPages) return null;

                    return (
                      <PaginationItem key={pageNum}>
                        <Button
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(pageNum)}
                          className="h-8 w-8 p-0 text-xs"
                        >
                          {pageNum}
                        </Button>
                      </PaginationItem>
                    );
                  })}

                  <PaginationItem>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="h-8 w-8 p-0"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
