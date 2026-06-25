import * as React from "react";
import SpeedTest from "@cloudflare/speedtest";
import personComputerImg from "@/assets/jotazo-telecom-person-computer.webp";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";

import { SpeedGauge } from "@/components/home/SpeedGauge";
import { SpeedTestStages, type SpeedTestStage } from "@/components/home/SpeedTestStages";

// Measurements: latency first, then ALL downloads, then ALL uploads
const MAIN_MEASUREMENTS = [
  { type: "latency", numPackets: 1 },
  { type: "latency", numPackets: 20 },
  { type: "download", bytes: 1e5, count: 1, bypassMinDuration: true },
  { type: "download", bytes: 1e5, count: 9 },
  { type: "download", bytes: 1e6, count: 8 },
  { type: "download", bytes: 1e7, count: 6 },
  { type: "download", bytes: 2.5e7, count: 4 },
  { type: "download", bytes: 1e8, count: 3 },
  { type: "download", bytes: 2.5e8, count: 2 },
  { type: "upload", bytes: 1e5, count: 8 },
  { type: "upload", bytes: 1e6, count: 6 },
  { type: "upload", bytes: 1e7, count: 4 },
  { type: "upload", bytes: 2.5e7, count: 4 },
  { type: "upload", bytes: 5e7, count: 3 },
] as const;



type IpInfo = {
  ip: string | null;
  org: string | null;
  city: string | null;
  region: string | null;
  country: string | null;
};

function safeNumber(value: unknown): number | undefined {
  const n = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  return Number.isFinite(n) ? n : undefined;
}

function formatMetric(value: number | undefined, suffix: string, digits = 1) {
  if (value === undefined) return "—";
  // Reduce decimals for Mbps-like values
  const d = value >= 10 ? 0 : digits;
  return `${value.toFixed(d)}${suffix}`;
}

function pickLatestMbpsFromPoints(points: any[] | undefined): number | undefined {
  if (!Array.isArray(points) || points.length === 0) return undefined;
  const last = points[points.length - 1];
  const bps = safeNumber(last?.bps) ?? safeNumber(last?.bandwidth);
  if (bps === undefined) return undefined;
  return bps / 1e6;
}

function mapStageFromType(type: unknown): SpeedTestStage {
  if (type === "latency") return "latency";
  if (type === "download") return "download";
  if (type === "upload") return "upload";
  return "starting";
}

async function fetchIpInfo(): Promise<IpInfo | null> {
  const base = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const apikey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;
  if (!base || !apikey) return null;

  const res = await fetch(`${base}/functions/v1/ipinfo`, {
    method: "GET",
    headers: {
      apikey,
    },
  });

  if (!res.ok) {
    await res.text().catch(() => "");
    return null;
  }

  return (await res.json()) as IpInfo;
}

export function SpeedTestSection({ className }: { className?: string }) {
  const [running, setRunning] = React.useState(false);
  const [status, setStatus] = React.useState<string>("Pronto para iniciar");
  const [stage, setStage] = React.useState<SpeedTestStage>("idle");
  

  const [downloadMbps, setDownloadMbps] = React.useState<number | undefined>();
  const [uploadMbps, setUploadMbps] = React.useState<number | undefined>();
  const [latencyMs, setLatencyMs] = React.useState<number | undefined>();
  const [jitterMs, setJitterMs] = React.useState<number | undefined>();
  

  const [downloadLiveMbps, setDownloadLiveMbps] = React.useState<number | undefined>();
  const [uploadLiveMbps, setUploadLiveMbps] = React.useState<number | undefined>();

  const [ipInfo, setIpInfo] = React.useState<IpInfo | null>(null);

  const resetResults = React.useCallback(() => {
    setDownloadMbps(undefined);
    setUploadMbps(undefined);
    setLatencyMs(undefined);
    setJitterMs(undefined);
  }, []);

  const runTest = React.useCallback(() => {
    if (running) return;

    resetResults();
    setRunning(true);
    setStage("starting");
    setStatus("Iniciando teste...");

    // Fetch IP/ISP/City in parallel (best-effort, never blocks the test)
    fetchIpInfo()
      .then((data) => {
        if (data) setIpInfo(data);
      })
      .catch(() => {
        // ignore
      });

    const applySummary = (summary: any) => {
      // getSummary() returns download/upload in bps; convert to Mbps
      const rawD = safeNumber(summary.download) ?? safeNumber(summary.down);
      const rawU = safeNumber(summary.upload) ?? safeNumber(summary.up);
      const dMbps = safeNumber(summary.downloadMbps) ?? safeNumber(summary.downMbps) ?? (rawD !== undefined ? rawD / 1e6 : undefined);
      const uMbps = safeNumber(summary.uploadMbps) ?? safeNumber(summary.upMbps) ?? (rawU !== undefined ? rawU / 1e6 : undefined);
      const l = safeNumber(summary.latency) ?? safeNumber(summary.latencyMs) ?? safeNumber(summary.ping);
      const j = safeNumber(summary.jitter) ?? safeNumber(summary.jitterMs);
      if (dMbps !== undefined) setDownloadMbps(dMbps);
      if (uMbps !== undefined) setUploadMbps(uMbps);
      if (l !== undefined) setLatencyMs(l);
      if (j !== undefined) setJitterMs(j);

      return { d: dMbps, u: uMbps, l, j };
    };

    // Stage 1: everything except packet loss
    try {
      const engine = new SpeedTest({ autoStart: true, measurements: [...MAIN_MEASUREMENTS] as any });

      engine.onResultsChange = (results: any) => {
        try {
          // Update stage (latency/download/upload) without blocking UI
          const nextStage = mapStageFromType(results?.type);
          setStage(nextStage);

          // Live gauge values (prefer points)
          const dlLive = pickLatestMbpsFromPoints(results?.getDownloadBandwidthPoints?.());
          const ulLive = pickLatestMbpsFromPoints(results?.getUploadBandwidthPoints?.());
          if (dlLive !== undefined) setDownloadLiveMbps(dlLive);
          if (ulLive !== undefined) setUploadLiveMbps(ulLive);

          const summary = results?.getSummary?.() ?? {};
          const { d, u } = applySummary(summary);

          // Fallback for live values when points are not available yet
          if (downloadLiveMbps === undefined && d !== undefined) setDownloadLiveMbps(d);
          if (uploadLiveMbps === undefined && u !== undefined) setUploadLiveMbps(u);

          setStatus("Medindo conexão...");
        } catch {
          // ignore
        }
      };

      engine.onFinish = (results: any) => {
        const summary = results?.getSummary?.() ?? {};
        applySummary(summary);
        setStage("done");
        setStatus("Teste finalizado");
        setRunning(false);
      };

      engine.onError = (_error: any) => {
        setRunning(false);
        setStage("error");
        setStatus("Falha ao rodar o teste");

        toast({
          title: "Não foi possível medir agora",
          description: "Verifique sua conexão ou tente novamente. Bloqueadores de anúncios e limites de rede podem interferir.",
          variant: "destructive",
        });
      };
    } catch {
      setRunning(false);
      setStage("error");
      setStatus("Falha ao iniciar");

      toast({
        title: "Erro ao iniciar o teste",
        description: "Seu navegador pode não suportar alguns requisitos do teste. Tente atualizar a página.",
        variant: "destructive",
      });
    }
  }, [resetResults, running, downloadLiveMbps, uploadLiveMbps]);

  const hasAnyResult =
    downloadMbps !== undefined ||
    uploadMbps !== undefined ||
    latencyMs !== undefined ||
    jitterMs !== undefined;

  const gaugeDownload = running ? downloadLiveMbps ?? downloadMbps : downloadMbps;
  const gaugeUpload = running ? uploadLiveMbps ?? uploadMbps : uploadMbps;

  return (
    <section
      aria-labelledby="speedtest-title"
      className={cn("relative overflow-hidden rounded-2xl border bg-[image:var(--gradient-speedtest)]", className)}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,hsl(var(--background)/0.14),transparent_55%)]" />
      <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[radial-gradient(circle,hsl(var(--accent)/0.30),transparent_60%)] blur-2xl" />

      <div className="relative grid gap-6 p-6 md:grid-cols-12 md:gap-8 md:p-10">
        <header className="space-y-4 md:col-span-5">
          <h2 id="speedtest-title" className="text-3xl font-semibold tracking-tight text-primary-foreground">
            Veja sua internet na prática
          </h2>

          <p className="max-w-prose text-sm text-primary-foreground/90 md:text-base">
            Medimos <strong>download</strong>, <strong>upload</strong>, <strong>latência</strong> e <strong>jitter</strong>.
          </p>

          <div className="overflow-hidden rounded-lg">
            <img
              src={personComputerImg}
              alt="Pessoa usando computador para testar velocidade"
              className="h-56 w-full object-cover"
              loading="lazy"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={runTest} disabled={running} className="bg-accent text-accent-foreground hover:bg-accent/90">
              {running ? "Rodando..." : hasAnyResult ? "Repetir teste" : "Iniciar teste"}
            </Button>
            <div className="text-xs text-primary-foreground/80" aria-live="polite">
              {status}
            </div>
          </div>
        </header>

        <div className="md:col-span-7">
          <Card className="border-background/20 bg-background/10 text-primary-foreground shadow-sm">
            <CardContent className="p-6">
              <div className="grid gap-5">
                <div className="grid gap-3">
                  <SpeedTestStages stage={stage} />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border border-background/15 bg-background/10 p-4">
                    <div className="text-xs font-semibold text-primary-foreground/80">DOWNLOAD</div>
                    <div className="mt-2 text-2xl font-semibold tabular-nums">{formatMetric(downloadMbps, " Mbps", 1)}</div>
                  </div>

                  <div className="rounded-lg border border-background/15 bg-background/10 p-4">
                    <div className="text-xs font-semibold text-primary-foreground/80">UPLOAD</div>
                    <div className="mt-2 text-2xl font-semibold tabular-nums">{formatMetric(uploadMbps, " Mbps", 1)}</div>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border border-background/15 bg-background/10 p-4">
                    <div className="text-xs font-semibold text-primary-foreground/80">Ping</div>
                    <div className="mt-2 text-xl font-semibold tabular-nums">{formatMetric(latencyMs, " ms", 0)}</div>
                  </div>

                  <div className="rounded-lg border border-background/15 bg-background/10 p-4">
                    <div className="text-xs font-semibold text-primary-foreground/80">Jitter</div>
                    <div className="mt-2 text-xl font-semibold tabular-nums">{formatMetric(jitterMs, " ms", 0)}</div>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <SpeedGauge
                    label="Download"
                    valueMbps={gaugeDownload}
                    maxMbps={1000}
                    running={running && (stage === "download" || stage === "latency" || stage === "starting")}
                    variant="download"
                  />
                  <SpeedGauge
                    label="Upload"
                    valueMbps={gaugeUpload}
                    maxMbps={500}
                    running={running && stage === "upload"}
                    variant="upload"
                  />
                </div>

                <div className="rounded-lg border border-background/15 bg-background/10 p-4">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div>
                      <div className="text-[10px] font-semibold uppercase tracking-wide text-primary-foreground/70">Provedor</div>
                      <div className="mt-1 text-sm text-primary-foreground/90">{ipInfo?.org ?? "—"}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-semibold uppercase tracking-wide text-primary-foreground/70">IP</div>
                      <div className="mt-1 text-sm text-primary-foreground/90 tabular-nums">{ipInfo?.ip ?? "—"}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-semibold uppercase tracking-wide text-primary-foreground/70">Cidade</div>
                      <div className="mt-1 text-sm text-primary-foreground/90">{ipInfo?.city ?? "—"}</div>
                    </div>
                  </div>
                  <div className="mt-2 text-[11px] text-primary-foreground/70">
                    {ipInfo?.region || ipInfo?.country ? (
                      <span>
                        {ipInfo?.region ?? ""}
                        {ipInfo?.region && ipInfo?.country ? " • " : ""}
                        {ipInfo?.country ?? ""}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
