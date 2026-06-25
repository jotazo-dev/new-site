import { Wifi, WifiOff, Signal, Thermometer, Clock, Router, RefreshCw, ChevronDown, MessageCircle, Activity, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useMinhaContaEquipment, type Equipment, type Authentication } from "@/hooks/useMinhaContaEquipment";

function maskUsuarioDoc(u: string): string {
  const digits = u.replace(/\D+/g, "");
  if (digits.length === 11 && digits === u) return `${digits.slice(0, 3)}•••••${digits.slice(-2)}`;
  if (digits.length === 14 && digits === u) return `${digits.slice(0, 2)}•••••••${digits.slice(-2)}`;
  return u;
}

function dedupeAuth(items: Authentication[]): Authentication[] {
  const seen = new Set<string>();
  const out: Authentication[] = [];
  for (const a of items) {
    const key = [a.usuario, a.mac, a.nas, a.porta].map(v => (v || "").trim().toLowerCase()).join("|");
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(a);
  }
  return out;
}

function AuthList({ items, tone = "neutral", compact = false }: { items: Authentication[]; tone?: "neutral" | "amber"; compact?: boolean }) {
  const list = dedupeAuth(items);
  if (!list.length) return null;
  const wrap = tone === "amber"
    ? "bg-white/70 border border-amber-200/70"
    : "bg-muted/40 border border-border";
  return (
    <div className={`${wrap} rounded-2xl p-4 space-y-3`}>
      <div className="flex items-center gap-2">
        <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center">
          <KeyRound className="h-3.5 w-3.5" />
        </div>
        <div>
          <div className="text-xs font-semibold text-foreground leading-tight">
            {list.length > 1 ? `${list.length} acessos provisionados` : "Acesso provisionado"}
          </div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wide">PPPoE / Autenticação</div>
        </div>
      </div>
      <ul className="divide-y divide-border/60">
        {list.map((a, idx) => {
          const showPorta = !compact && a.porta && !/^\(todas\)$/i.test(a.porta);
          const showNas = !compact && a.nas && !/^\(todos\)$/i.test(a.nas) && !/central\s+assinante/i.test(a.nas);
          const showContrato = !compact && a.contrato;
          return (
            <li key={a.id} className={`text-sm ${idx === 0 ? "pt-0" : "pt-3"} ${idx === list.length - 1 ? "pb-0" : "pb-3"}`}>
              <div className="flex items-center justify-between gap-2">
                <div className="font-mono text-foreground text-[13px] break-all">{maskUsuarioDoc(a.usuario) || "—"}</div>
                {a.mac && (
                  <span className="shrink-0 font-mono text-[10px] px-2 py-0.5 rounded-md bg-muted text-muted-foreground border border-border">
                    <span className="font-sans not-italic text-muted-foreground/70 mr-1">MAC</span>{a.mac}
                  </span>
                )}
              </div>
              {(showNas || showPorta || showContrato) && (
                <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
                  {showNas && <span>NAS <span className="font-mono text-foreground/70">{a.nas}</span></span>}
                  {showPorta && <span>Porta <span className="font-mono text-foreground/70">{a.porta}</span></span>}
                  {showContrato && <span>Contrato {a.contrato}</span>}
                </div>
              )}
              {a.observacao && <div className="mt-1 text-[11px] text-muted-foreground/80 italic">{a.observacao}</div>}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function formatTempo(min: number | null): string {
  if (min == null || !isFinite(min) || min <= 0) return "—";
  const d = Math.floor(min / 1440);
  const h = Math.floor((min % 1440) / 60);
  const m = min % 60;
  const parts: string[] = [];
  if (d) parts.push(`${d}d`);
  if (h) parts.push(`${h}h`);
  if (!d && m) parts.push(`${m}min`);
  return parts.join(" ") || `${min}min`;
}

function relativeFromColeta(iso: string): string {
  if (!iso) return "—";
  // RBX returns "YYYY-MM-DD HH:MM:SS"
  const t = Date.parse(iso.replace(" ", "T"));
  if (!isFinite(t)) return iso;
  const diff = Math.max(0, Math.floor((Date.now() - t) / 60000));
  if (diff < 1) return "agora";
  if (diff < 60) return `há ${diff} min`;
  const h = Math.floor(diff / 60);
  if (h < 24) return `há ${h}h`;
  return `há ${Math.floor(h / 24)}d`;
}

function sinalStatus(s: number | null): { label: string; color: string } {
  if (s == null) return { label: "—", color: "bg-muted text-muted-foreground" };
  if (s >= -25) return { label: "Excelente", color: "bg-[#25D366]/15 text-[#15803d]" };
  if (s >= -27) return { label: "Bom", color: "bg-[#25D366]/15 text-[#15803d]" };
  if (s >= -28) return { label: "Atenção", color: "bg-amber-100 text-amber-700" };
  return { label: "Ruim", color: "bg-red-100 text-red-700" };
}

function tempStatus(t: number | null): { label: string; color: string } {
  if (t == null) return { label: "—", color: "bg-muted text-muted-foreground" };
  if (t < 60) return { label: "OK", color: "bg-[#25D366]/15 text-[#15803d]" };
  if (t < 70) return { label: "Alta", color: "bg-amber-100 text-amber-700" };
  return { label: "Crítica", color: "bg-red-100 text-red-700" };
}

function Metric({ icon: Icon, label, value, badge }: { icon: any; label: string; value: string; badge?: { label: string; color: string } }) {
  return (
    <div className="bg-muted/50 border border-border rounded-xl p-4 flex flex-col gap-2">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4" />
        <span className="text-xs font-medium">{label}</span>
      </div>
      <div className="text-2xl font-bold text-foreground leading-none">{value}</div>
      {badge && (
        <span className={`inline-flex w-fit px-2 py-0.5 rounded-full text-[11px] font-semibold ${badge.color}`}>
          {badge.label}
        </span>
      )}
    </div>
  );
}

function EquipmentCard({ eq }: { eq: Equipment }) {
  const sinal = sinalStatus(eq.sinal);
  const temp = tempStatus(eq.temperatura);
  return (
    <div className="space-y-4">
      {/* Plano */}
      {(() => {
        const desc = (eq.contratoDescricao || "").trim();
        const num = (eq.contratoNumero || "").trim();
        // Tenta extrair o nome do plano da descrição removendo o prefixo "Contrato N -"
        const planoNome = num
          ? desc.replace(new RegExp(`^\\s*contrato\\s*${num}\\s*[-–:]?\\s*`, "i"), "").trim() || desc
          : desc;
        return (
          <div className="bg-muted/50 border border-border rounded-xl p-4 space-y-3">
            <div>
              <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Plano contratado</div>
              <div className="mt-1 text-base font-bold text-foreground">{planoNome || "—"}</div>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-1 border-t border-border/60">
              <div>
                <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Contrato</div>
                <div className="mt-0.5 text-sm font-mono font-semibold text-foreground">{num || "—"}</div>
              </div>
              <div>
                <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Plano</div>
                <div className="mt-0.5 text-sm font-semibold text-foreground truncate" title={planoNome}>{planoNome || "—"}</div>
              </div>
            </div>
            {desc && desc !== planoNome && (
              <div className="pt-1 border-t border-border/60">
                <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Descrição completa</div>
                <div className="mt-0.5 text-xs text-muted-foreground">{desc}</div>
              </div>
            )}
          </div>
        );
      })()}

      {/* Métricas */}
      <div className="grid grid-cols-2 gap-3">
        <Metric
          icon={Signal}
          label="Sinal óptico"
          value={eq.sinal != null ? `${eq.sinal.toFixed(2)} dBm` : "—"}
          badge={sinal}
        />
        <Metric
          icon={Thermometer}
          label="Temperatura"
          value={eq.temperatura != null ? `${eq.temperatura}°C` : "—"}
          badge={temp}
        />
        {eq.ccq != null && eq.ccq > 0 && (
          <Metric icon={Activity} label="CCQ" value={`${eq.ccq}%`} />
        )}
        <Metric
          icon={Clock}
          label="Tempo on-line"
          value={formatTempo(eq.tempoConectadoMinutos)}
        />
      </div>

      {/* Equipamento */}
      <div className="bg-muted/50 border border-border rounded-xl p-4">
        <div className="flex items-center gap-2 text-muted-foreground mb-2">
          <Router className="h-4 w-4" />
          <span className="text-xs font-medium uppercase tracking-wide">Equipamento</span>
        </div>
        <div className="text-sm font-semibold text-foreground">{eq.equipamentoDescricao || "—"}</div>
        {eq.equipamentoSerial && (
          <div className="text-xs text-muted-foreground font-mono mt-1">Serial: {eq.equipamentoSerial}</div>
        )}
      </div>

      {/* Detalhes técnicos */}
      {(eq.nasSigla || eq.nasIp) && (
        <details className="bg-muted/30 border border-border rounded-xl group">
          <summary className="px-4 py-3 cursor-pointer flex items-center justify-between text-sm font-medium text-foreground list-none">
            <span>Detalhes da rede</span>
            <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
          </summary>
          <div className="px-4 pb-4 grid grid-cols-2 gap-3 text-xs">
            {eq.nasSigla && <div><div className="text-muted-foreground">NAS</div><div className="font-mono">{eq.nasSigla}</div></div>}
            {eq.nasIp && <div><div className="text-muted-foreground">IP NAS</div><div className="font-mono">{eq.nasIp}</div></div>}
            {eq.nasSlot && <div><div className="text-muted-foreground">Slot</div><div className="font-mono">{eq.nasSlot}</div></div>}
            {eq.nasPorta && <div><div className="text-muted-foreground">Porta</div><div className="font-mono">{eq.nasPorta}</div></div>}
          </div>
        </details>
      )}
    </div>
  );
}

export function ConexaoView() {
  const { loading, loaded, error, online, equipments, authentications, refetch } = useMinhaContaEquipment();
  const first = equipments[0];
  const showVerifying = !loaded;
  const lastCheck = loaded ? new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : null;
  const statusLabel = showVerifying ? "Verificando..." : online ? "Conectado" : "Sem leitura no momento";
  const statusIcon = showVerifying ? <RefreshCw className="h-6 w-6 animate-spin" /> : online ? <Wifi className="h-6 w-6" /> : <WifiOff className="h-6 w-6" />;
  const statusBg = showVerifying
    ? "bg-primary/10 text-primary"
    : online
      ? "bg-[#25D366]/15 text-[#15803d]"
      : "bg-amber-100 text-amber-700";

  return (
    <div className="space-y-5">
      {/* Header status */}
      <div className="bg-muted/50 border border-border rounded-xl p-5 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`h-12 w-12 rounded-full flex items-center justify-center shrink-0 ${statusBg}`}>
            {statusIcon}
          </div>
          <div className="min-w-0">
            <div className="text-lg font-bold text-foreground leading-tight">{statusLabel}</div>
            <div className="text-xs text-muted-foreground">
              {showVerifying
                ? "Consultando seu equipamento…"
                : first?.ultimaColeta
                  ? `Última leitura ${relativeFromColeta(first.ultimaColeta)}`
                  : "Sem leituras recentes da operadora"}
            </div>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={refetch} disabled={loading} aria-label="Atualizar">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">{error}</div>
      )}

      {showVerifying && (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-24 bg-muted/40 rounded-xl animate-pulse" />)}
        </div>
      )}

      {loaded && !online && !error && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 space-y-3">
          <div className="flex items-start gap-3">
            <div className="h-9 w-9 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <WifiOff className="h-4 w-4" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-amber-900">Não conseguimos ler seu equipamento agora</p>
              <p className="text-xs text-amber-800 leading-relaxed">
                Isso geralmente significa que o monitoramento está em manutenção — <strong>não quer dizer que sua internet está fora</strong>.
                Se você está navegando normalmente, está tudo certo.
              </p>
              <p className="text-xs text-amber-800 leading-relaxed">
                Se estiver <strong>sem internet</strong>, fale com nosso suporte:
              </p>
            </div>
          </div>
          <Button
            className="w-full bg-[#25D366] hover:bg-[#25D366]/90 text-white"
            onClick={() => window.open("https://wa.me/551535423000", "_blank")}
          >
            <MessageCircle className="h-4 w-4 mr-2" /> Falar no WhatsApp
          </Button>
          {lastCheck && (
            <p className="text-[11px] text-amber-700/70 text-center">Última verificação às {lastCheck}</p>
          )}
          {authentications.length > 0 && (
            <>
              <p className="text-[11px] text-amber-800/80 pt-1">
                Seu acesso está provisionado na nossa rede. A telemetria volta assim que o monitoramento concluir a próxima coleta.
              </p>
              <AuthList items={authentications} tone="amber" />
            </>
          )}
        </div>
      )}

      {equipments.map((eq, i) => (
        <EquipmentCard key={eq.equipamentoId || i} eq={eq} />
      ))}

      {loaded && online && dedupeAuth(authentications).length > 0 && (
        <details className="bg-muted/30 border border-border rounded-xl group">
          <summary className="px-4 py-3 cursor-pointer flex items-center justify-between text-sm font-medium text-foreground list-none">
            <span className="flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-muted-foreground" />
              Acessos PPPoE
              <span className="text-[10px] text-muted-foreground font-normal">({dedupeAuth(authentications).length})</span>
            </span>
            <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
          </summary>
          <div className="px-4 pb-4">
            <AuthList items={authentications} compact />
          </div>
        </details>
      )}

      {/* Ação secundária de atualizar no final */}
      {loaded && (
        <div className="flex justify-end pt-1">
          <Button variant="ghost" size="sm" onClick={refetch} disabled={loading} aria-label="Atualizar dados">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} /> Atualizar dados
          </Button>
        </div>
      )}
    </div>
  );
}
