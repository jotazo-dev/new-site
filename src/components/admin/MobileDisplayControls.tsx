import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

async function getSetting(key: string): Promise<string | null> {
  const { data } = await supabase.from("site_settings").select("value").eq("key", key).maybeSingle();
  return data?.value || null;
}

async function upsertSetting(key: string, value: string) {
  const { data: existing } = await supabase.from("site_settings").select("id").eq("key", key).maybeSingle();
  if (existing) {
    await supabase.from("site_settings").update({ value }).eq("key", key);
  } else {
    await supabase.from("site_settings").insert({ key, value });
  }
}

interface Props {
  title: string;
  description: string;
  columnsKey: string;
  modeKey: string;
  defaultColumns?: "1" | "2";
  defaultMode?: "slide" | "grade";
}

export function MobileDisplayControls({
  title,
  description,
  columnsKey,
  modeKey,
  defaultColumns = "1",
  defaultMode = "slide",
}: Props) {
  const qc = useQueryClient();

  const { data: cols = defaultColumns } = useQuery({
    queryKey: ["site_settings", columnsKey],
    queryFn: async () => ((await getSetting(columnsKey)) as "1" | "2") || defaultColumns,
  });

  const { data: mode = defaultMode } = useQuery({
    queryKey: ["site_settings", modeKey],
    queryFn: async () => ((await getSetting(modeKey)) as "slide" | "grade") || defaultMode,
  });

  const colsMutation = useMutation({
    mutationFn: async (v: "1" | "2") => upsertSetting(columnsKey, v),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["site_settings"] });
      qc.invalidateQueries({ queryKey: ["site_settings_public"] });
      toast.success("Colunas no mobile atualizadas!");
    },
  });

  const modeMutation = useMutation({
    mutationFn: async (v: "slide" | "grade") => upsertSetting(modeKey, v),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["site_settings"] });
      qc.invalidateQueries({ queryKey: ["site_settings_public"] });
      toast.success("Modo mobile atualizado!");
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label className="text-base">Colunas no mobile</Label>
          <p className="text-xs text-muted-foreground mb-3">Quantos itens exibir por linha em celulares.</p>
          <div className="grid grid-cols-2 gap-3">
            {(["1", "2"] as const).map((c) => {
              const selected = cols === c;
              return (
                <button
                  key={c}
                  onClick={() => colsMutation.mutate(c)}
                  className={cn(
                    "relative rounded-xl border-2 p-3 transition-all text-left",
                    selected ? "border-primary ring-2 ring-primary/30" : "border-border hover:border-primary/40"
                  )}
                >
                  <div className={cn("grid gap-1.5 mx-auto max-w-[100px]", c === "1" ? "grid-cols-1" : "grid-cols-2")}>
                    {Array.from({ length: Number(c) }).map((_, i) => (
                      <div key={i} className="h-12 rounded bg-muted" />
                    ))}
                  </div>
                  <p className="text-center text-sm font-medium mt-2">{c} {c === "1" ? "coluna" : "colunas"}</p>
                  {selected && (
                    <span className="absolute top-2 right-2 h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs">✓</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <Label className="text-base">Modo de exibição no mobile</Label>
          <p className="text-xs text-muted-foreground mb-3">Carrossel deslizante ou grade estática.</p>
          <div className="grid grid-cols-2 gap-3">
            {([
              { key: "slide", label: "Slide", desc: "Carrossel" },
              { key: "grade", label: "Grade", desc: "Estático" },
            ] as const).map(({ key, label, desc }) => {
              const selected = mode === key;
              return (
                <button
                  key={key}
                  onClick={() => modeMutation.mutate(key)}
                  className={cn(
                    "relative rounded-xl border-2 p-3 transition-all text-left",
                    selected ? "border-primary ring-2 ring-primary/30" : "border-border hover:border-primary/40"
                  )}
                >
                  <div className="mx-auto max-w-[100px] h-12 rounded bg-muted flex items-center justify-center text-xs text-muted-foreground">
                    {key === "slide" ? "← →" : "▦"}
                  </div>
                  <p className="text-center text-sm font-medium mt-2">{label}</p>
                  <p className="text-center text-xs text-muted-foreground">{desc}</p>
                  {selected && (
                    <span className="absolute top-2 right-2 h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs">✓</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
