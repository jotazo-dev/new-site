import * as React from "react";

import { cn } from "@/lib/utils";

export type SpeedGaugeVariant = "download" | "upload";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function formatMbps(value: number | undefined) {
  if (value === undefined || !Number.isFinite(value)) return "—";
  if (value >= 10) return value.toFixed(0);
  return value.toFixed(1);
}

const TICKS = [0, 10, 50, 100, 250, 500, 750, 1000];

export function SpeedGauge({
  className,
  label,
  valueMbps,
  maxMbps = 1000,
  running,
  variant = "download",
}: {
  className?: string;
  label: string;
  valueMbps: number | undefined;
  maxMbps?: number;
  running?: boolean;
  variant?: SpeedGaugeVariant;
}) {
  // Smooth animated value for the needle
  const [displayNormalized, setDisplayNormalized] = React.useState(0);
  const targetRef = React.useRef(0);
  const currentRef = React.useRef(0);
  const animFrameRef = React.useRef<number>();

  // Sweep animation when running but no data yet
  const showSweep = running && valueMbps === undefined;
  const sweepPhaseRef = React.useRef(0);

  React.useEffect(() => {
    if (!showSweep) {
      targetRef.current = valueMbps === undefined ? 0 : clamp(valueMbps / maxMbps, 0, 1);
    }
  }, [valueMbps, maxMbps, showSweep]);

  React.useEffect(() => {
    let lastTs: number | null = null;

    const tick = (ts: number) => {
      if (!lastTs) lastTs = ts;
      const dt = Math.min((ts - lastTs) / 1000, 0.1); // seconds, cap at 100ms
      lastTs = ts;

      if (showSweep) {
        // Smooth sine-wave sweep across the arc
        sweepPhaseRef.current += dt * 2.5;
        const t = (Math.sin(sweepPhaseRef.current) + 1) / 2; // 0..1
        currentRef.current = t * 0.75;
      } else {
        // Ease toward target with spring-like smoothing
        const target = targetRef.current;
        const diff = target - currentRef.current;
        const speed = Math.abs(diff) > 0.3 ? 6 : 4; // faster for big jumps
        currentRef.current += diff * Math.min(speed * dt, 1);
        // Snap when very close
        if (Math.abs(diff) < 0.001) currentRef.current = target;
      }

      setDisplayNormalized(currentRef.current);
      animFrameRef.current = requestAnimationFrame(tick);
    };

    animFrameRef.current = requestAnimationFrame(tick);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [showSweep]);

  // Geometry (viewBox 200x120)
  const cx = 100;
  const cy = 100;
  const r = 78;

  const angle = -180 + displayNormalized * 180; // -180..0
  const needleLen = r - 10;
  const rad = (Math.PI / 180) * angle;
  const nx = cx + Math.cos(rad) * needleLen;
  const ny = cy + Math.sin(rad) * needleLen;

  const color = variant === "download" ? "hsl(var(--accent))" : "hsl(var(--primary))";
  const glowId = `glow-${variant}`;
  const gradientId = `gauge-${variant}`;

  return (
    <div
      className={cn(
        "relative rounded-xl border border-background/15 bg-background/10 p-4",
        "backdrop-blur-sm",
        className,
      )}
      style={{ ["--gauge-color" as string]: color }}
    >
      <div className="flex items-baseline justify-between gap-3">
        <div className="text-xs font-semibold uppercase tracking-wide text-primary-foreground/80">{label}</div>
        <div className="text-[10px] text-primary-foreground/70">Mbps</div>
      </div>

      <div className="mt-2 grid grid-cols-1 gap-3">
        <div className="relative">
          <svg viewBox="0 0 200 120" className="h-[140px] w-full">
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="hsl(var(--primary-foreground) / 0.15)" />
                <stop offset="40%" stopColor="hsl(var(--primary-foreground) / 0.20)" />
                <stop offset="100%" stopColor="var(--gauge-color)" />
              </linearGradient>
              {/* Glow filter for running state */}
              <filter id={glowId} x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* background arc */}
            <path
              d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
              fill="none"
              stroke="hsl(var(--primary-foreground) / 0.18)"
              strokeWidth="14"
              strokeLinecap="round"
            />

            {/* colored arc */}
            <path
              d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
              fill="none"
              stroke={`url(#${gradientId})`}
              strokeWidth="14"
              strokeLinecap="round"
              pathLength={100}
              strokeDasharray={`${displayNormalized * 100} 100`}
              filter={running ? `url(#${glowId})` : undefined}
            />

            {/* ticks */}
            {TICKS.map((t) => {
              const a = -180 + (t / maxMbps) * 180;
              const rr1 = r + 10;
              const rr2 = r + 2;
              const tr = (Math.PI / 180) * a;
              const x1 = cx + Math.cos(tr) * rr1;
              const y1 = cy + Math.sin(tr) * rr1;
              const x2 = cx + Math.cos(tr) * rr2;
              const y2 = cy + Math.sin(tr) * rr2;
              return (
                <line
                  key={t}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="hsl(var(--primary-foreground) / 0.22)"
                  strokeWidth={2}
                />
              );
            })}

            {/* needle with glow when running */}
            <line
              x1={cx}
              y1={cy}
              x2={nx}
              y2={ny}
              stroke="hsl(var(--primary-foreground) / 0.85)"
              strokeWidth={3}
              strokeLinecap="round"
              filter={running ? `url(#${glowId})` : undefined}
            />
            <circle cx={cx} cy={cy} r={6} fill="hsl(var(--primary-foreground) / 0.9)" />

            {/* subtle glow ring while running */}
            {running && (
              <>
                <circle
                  cx={cx}
                  cy={cy}
                  r={14}
                  fill="none"
                  stroke="var(--gauge-color)"
                  strokeWidth={1.5}
                  opacity={0.4}
                >
                  <animate
                    attributeName="r"
                    values="10;22;10"
                    dur="1.5s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    values="0.4;0.1;0.4"
                    dur="1.5s"
                    repeatCount="indefinite"
                  />
                </circle>
                {/* Needle tip glow dot */}
                <circle
                  cx={nx}
                  cy={ny}
                  r={4}
                  fill="var(--gauge-color)"
                  opacity={0.6}
                  filter={`url(#${glowId})`}
                />
              </>
            )}
          </svg>

          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-baseline justify-center gap-2">
            <div className="text-3xl font-semibold tabular-nums tracking-tight text-primary-foreground">
              {formatMbps(valueMbps)}
            </div>
            <div className="text-xs text-primary-foreground/70">Mbps</div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2 text-[10px] text-primary-foreground/70">
          {TICKS.slice(0, 4).map((t) => (
            <div key={t} className="text-left tabular-nums">
              {t}
            </div>
          ))}
          {TICKS.slice(4).map((t) => (
            <div key={t} className="text-right tabular-nums">
              {t}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
