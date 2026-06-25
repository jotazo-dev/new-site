import { useRef } from "react";
import { useCountUp, useInView } from "@/hooks/useCountUp";

type Stat = { value: number; suffix: string; prefix?: string; label: string };

const STATS: Stat[] = [
  { value: 15, suffix: "ms", prefix: "<", label: "Ping médio" },
  { value: 1, suffix: "Gbps", label: "Simétrico" },
  { value: 99, suffix: "%", label: "Uptime garantido" },
  { value: 24, suffix: "/7", label: "Suporte gamer" },
];

function StatCard({ stat, inView }: { stat: Stat; inView: boolean }) {
  const v = useCountUp(stat.value, 1400, inView);
  return (
    <div className="flex flex-col items-center justify-center text-center">
      <div className="font-display text-4xl font-extrabold tracking-tight text-white md:text-5xl">
        <span className="text-accent">{stat.prefix}</span>
        {v}
        <span className="ml-0.5 text-accent">{stat.suffix}</span>
      </div>
      <div className="mt-1 text-xs font-semibold uppercase tracking-wider text-white/60">
        {stat.label}
      </div>
    </div>
  );
}

export function GamerStats() {
  const { ref, inView } = useInView<HTMLDivElement>(0.3);
  return (
    <section
      ref={ref}
      className="relative overflow-hidden rounded-[20px] border border-white/10 bg-gradient-to-r from-[hsl(218,90%,12%)] via-[hsl(220,80%,10%)] to-[hsl(218,90%,12%)] px-6 py-10 md:py-12"
    >
      <div aria-hidden className="pointer-events-none absolute -top-20 left-1/2 h-48 w-[60%] -translate-x-1/2 rounded-full bg-accent/20 blur-3xl" />
      <div className="relative grid grid-cols-2 gap-6 md:grid-cols-4">
        {STATS.map((s) => (
          <StatCard key={s.label} stat={s} inView={inView} />
        ))}
      </div>
    </section>
  );
}
