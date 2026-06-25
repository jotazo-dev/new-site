import * as React from "react";
import { Check, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

export type SpeedTestStage =
  | "idle"
  | "starting"
  | "latency"
  | "download"
  | "upload"
  | "done"
  | "error";

const ORDER: Array<{ key: Exclude<SpeedTestStage, "idle" | "error">; label: string }> = [
  { key: "starting", label: "Início" },
  { key: "latency", label: "Latência" },
  { key: "download", label: "Download" },
  { key: "upload", label: "Upload" },
  { key: "done", label: "Finalizado" },
];

function stageIndex(stage: SpeedTestStage) {
  const idx = ORDER.findIndex((s) => s.key === stage);
  if (idx >= 0) return idx;
  if (stage === "idle") return -1;
  if (stage === "error") return -1;
  return -1;
}

export function SpeedTestStages({
  className,
  stage,
}: {
  className?: string;
  stage: SpeedTestStage;
}) {
  const current = stageIndex(stage);

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)} aria-label="Etapas do teste">
      {ORDER.map((s, i) => {
        const isDone = current > i;
        const isCurrent = current === i;

        return (
          <div
            key={s.key}
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs",
              "bg-background/10 text-primary-foreground/80 border-background/15",
              isDone && "text-primary-foreground",
              isCurrent && "border-background/25 bg-background/15 text-primary-foreground",
            )}
          >
            {isDone ? (
              <Check className="h-3.5 w-3.5" aria-hidden="true" />
            ) : isCurrent ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin motion-reduce:animate-none" aria-hidden="true" />
            ) : (
              <span className="h-3.5 w-3.5 rounded-full border border-background/20" aria-hidden="true" />
            )}
            <span>{s.label}</span>
          </div>
        );
      })}
    </div>
  );
}
