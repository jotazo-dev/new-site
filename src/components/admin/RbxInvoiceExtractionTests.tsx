import * as React from "react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { CheckCircle2, XCircle, FlaskConical, Loader2, ChevronDown, Play, Zap } from "lucide-react";
import { toast } from "sonner";

type TestResult = {
  id: string;
  service: string;
  description: string;
  passed: boolean;
  expected?: unknown;
  actual: unknown;
  raw?: unknown;
  error: string | null;
};

type TestResponse = {
  ok: boolean;
  mode: "mock" | "real";
  summary?: {
    total: number;
    passed: number;
    failed: number;
  };
  results: TestResult[];
};

const SERVICE_LABEL: Record<string, string> = {
  get_banking_billet: "PDF do boleto (get_banking_billet)",
  get_barcode: "Linha digitável (get_barcode)",
  get_pix_copia_cola: "PIX Copia e Cola (get_pix_copia_cola)",
  get_pix_qrcode: "QR Code PIX (get_pix_qrcode)",
};

function onlyDigits(v: string) {
  return (v || "").replace(/\D+/g, "");
}

function formatDoc(digits: string) {
  if (digits.length <= 11) {
    return digits
      .replace(/^(\d{3})(\d)/, "$1.$2")
      .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d)/, ".$1-$2")
      .slice(0, 14);
  }
  return digits
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2")
    .slice(0, 18);
}

function validateDoc(digits: string): { ok: boolean; type?: "CPF" | "CNPJ"; error?: string } {
  if (!digits) return { ok: false, error: "Informe o CPF ou CNPJ" };
  if (digits.length === 11) {
    if (/^(\d)\1{10}$/.test(digits)) return { ok: false, error: "CPF inválido" };
    return { ok: true, type: "CPF" };
  }
  if (digits.length === 14) {
    if (/^(\d)\1{13}$/.test(digits)) return { ok: false, error: "CNPJ inválido" };
    return { ok: true, type: "CNPJ" };
  }
  return { ok: false, error: "CPF deve ter 11 dígitos e CNPJ 14" };
}

export function InvoiceExtractionTests() {
  const [data, setData] = React.useState<TestResponse | null>(null);
  const [docId, setDocId] = React.useState("");
  const digits = onlyDigits(docId);
  const docValidation = validateDoc(digits);

  const run = useMutation({
    mutationFn: async ({ mode, document }: { mode: "mock" | "real"; document?: string }) => {
      const { data, error } = await supabase.functions.invoke("rbx-test-invoice-extraction", {
        body: { mode, document },
      });
      if (error) throw error;
      return { ...(data as TestResponse), mode } as TestResponse;
    },
    onSuccess: (res) => {
      setData(res);
      const label = res.mode === "real" ? "REAL" : "MOCK";
      if (res.ok) toast.success(`Teste ${label} concluído com sucesso`);
      else toast.error(`Falha no teste ${label}: ${(res as any).error || "erro desconhecido"}`);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const grouped = React.useMemo(() => {
    if (!data || !Array.isArray(data.results)) return null;
    const map = new Map<string, TestResult[]>();
    for (const r of data.results) {
      const arr = map.get(r.service) || [];
      arr.push(r);
      map.set(r.service, arr);
    }
    return map;
  }, [data]);

  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle
          className="flex items-center gap-2 text-base"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center">
            <FlaskConical className="h-4 w-4 text-white" />
          </div>
          Testes de integração — 2ª via de fatura
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4 p-4 border rounded-xl bg-muted/30">
          <div className="space-y-2">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-500" /> Teste MOCK (Seguro)
            </h4>
            <p className="text-xs text-muted-foreground">
              Valida a lógica de extração contra payloads estáticos documentados. Não chama a RBX real.
            </p>
            <Button
              onClick={() => run.mutate({ mode: "mock" })}
              disabled={run.isPending}
              variant="secondary"
              size="sm"
              className="w-full sm:w-auto"
            >
              {run.isPending && data?.mode === "mock" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />
              ) : (
                <Play className="h-3.5 w-3.5 mr-2" />
              )}
              Rodar cenários mockados
            </Button>
          </div>

          <div className="h-px bg-border my-4" />

          <div className="space-y-2">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <Play className="h-4 w-4 text-emerald-500" /> Teste REAL (Live)
            </h4>
            <p className="text-xs text-muted-foreground">
              Chama a API RBX v1/v2 real. Localiza o cliente pelo CPF/CNPJ e utiliza a primeira fatura em aberto encontrada para validar a extração v2.
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                placeholder="CPF ou CNPJ do cliente"
                value={docId}
                onChange={(e) => setDocId(formatDoc(onlyDigits(e.target.value)))}
                inputMode="numeric"
                maxLength={18}
                className="max-w-[250px]"
              />
              <Button
                onClick={() => {
                  if (!docValidation.ok) {
                    toast.error(docValidation.error || "Documento inválido");
                    return;
                  }
                  run.mutate({ mode: "real", document: digits });
                }}
                disabled={run.isPending || !docValidation.ok}
                variant="outline"
                size="sm"
              >
                {run.isPending && data?.mode === "real" ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />
                ) : (
                  <Zap className="h-3.5 w-3.5 mr-2" />
                )}
                Testar com RBX real
              </Button>
            </div>
            {docId && (
              <p className="text-[11px] text-muted-foreground">
                {docValidation.ok
                  ? `${docValidation.type} válido — ${digits.length} dígitos serão enviados`
                  : docValidation.error}
              </p>
            )}
          </div>
        </div>

        {data && (
          <div className="space-y-3 mt-6">
            <div
              className={`rounded-lg border p-3 text-sm font-medium flex items-center gap-2 ${
                data.ok
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                  : "bg-red-50 border-red-200 text-red-800"
              }`}
            >
              {data.ok ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              ) : (
                <XCircle className="h-4 w-4 text-red-600" />
              )}
              Modo: <span className="uppercase font-bold">{data.mode}</span>
              {" • "}
              {(data as any).error
                ? (data as any).error
                : data.summary
                ? `${data.summary.passed} de ${data.summary.total} cenários passaram`
                : data.ok ? "Todos os serviços responderam com sucesso" : "Alguns serviços falharam"}
            </div>

            {grouped &&
              Array.from(grouped.entries()).map(([service, tests]) => {
                const allOk = tests.every((t) => t.passed);
                return (
                  <div key={service} className="border rounded-lg overflow-hidden">
                    <div
                      className={`px-3 py-2 text-xs font-semibold flex items-center justify-between ${
                        allOk
                          ? "bg-emerald-50 text-emerald-800"
                          : "bg-red-50 text-red-800"
                      }`}
                    >
                      <span className="uppercase tracking-wide">{SERVICE_LABEL[service] || service}</span>
                      <Badge variant={allOk ? "default" : "destructive"} className="text-[10px]">
                        {tests.filter((t) => t.passed).length}/{tests.length}
                      </Badge>
                    </div>
                    <div className="divide-y">
                      {tests.map((t) => (
                        <details key={t.id} className="group">
                          <summary className="px-3 py-2 text-sm flex items-center gap-2 cursor-pointer hover:bg-muted/40 list-none">
                            {t.passed ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-600 shrink-0" />
                            )}
                            <span className="flex-1 truncate">{t.description}</span>
                            <code className="text-[10px] text-muted-foreground">{t.id}</code>
                            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground group-open:rotate-180 transition-transform" />
                          </summary>
                          <div className="px-3 pb-3 pt-1 text-xs space-y-2 bg-muted/20">
                            {t.error && (
                              <div className="text-red-700">Erro: {t.error}</div>
                            )}
                            {t.expected && (
                              <div>
                                <div className="font-semibold text-muted-foreground mb-0.5">Esperado</div>
                                <pre className="bg-white border rounded p-2 overflow-auto max-h-40 whitespace-pre-wrap break-all">
                                  {JSON.stringify(t.expected, null, 2)}
                                </pre>
                              </div>
                            )}
                            <div>
                              <div className="font-semibold text-muted-foreground mb-0.5">Extraído (Actual)</div>
                              <pre
                                className={`border rounded p-2 overflow-auto max-h-40 whitespace-pre-wrap break-all ${
                                  t.passed ? "bg-white" : "bg-red-50 border-red-200"
                                }`}
                              >
                                {JSON.stringify(t.actual, null, 2)}
                              </pre>
                            </div>
                            {t.raw && (
                              <div>
                                <div className="font-semibold text-muted-foreground mb-0.5">Resposta Bruta (Raw JSON)</div>
                                <pre className="bg-white/50 border rounded p-2 overflow-auto max-h-60 whitespace-pre-wrap break-all italic text-muted-foreground">
                                  {JSON.stringify(t.raw, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        </details>
                      ))}
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
