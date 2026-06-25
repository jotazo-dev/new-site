import { useEffect, useState } from "react";
import { Activity, ArrowRight, MessageSquare, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { STAGES, formatRelative } from "./types";

export interface CrmActivity {
  id: string;
  lead_id: string;
  type: string;
  payload: Record<string, unknown>;
  actor_id: string | null;
  created_at: string;
}

interface ActivityTimelineProps {
  leadId: string;
}

const stageLabel = (id: string) => STAGES.find((s) => s.id === id)?.label || id;

export function ActivityTimeline({ leadId }: ActivityTimelineProps) {
  const [activities, setActivities] = useState<CrmActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    (async () => {
      const { data } = await supabase
        .from("crm_activities" as never)
        .select("*")
        .eq("lead_id", leadId)
        .order("created_at", { ascending: false });
      if (mounted) {
        setActivities((data as CrmActivity[]) || []);
        setLoading(false);
      }
    })();

    const channel = supabase
      .channel(`crm_activities_${leadId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "crm_activities", filter: `lead_id=eq.${leadId}` },
        (payload) => {
          setActivities((prev) => [payload.new as CrmActivity, ...prev]);
        },
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [leadId]);

  if (loading) {
    return <div className="py-6 text-center text-xs text-muted-foreground">Carregando histórico…</div>;
  }

  if (activities.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
        Nenhuma atividade registrada ainda.
      </div>
    );
  }

  return (
    <ol className="relative space-y-3 border-l-2 border-border pl-4">
      {activities.map((a) => {
        const Icon =
          a.type === "stage_change"
            ? ArrowRight
            : a.type === "note"
              ? MessageSquare
              : a.type === "follow_up"
                ? Calendar
                : Activity;

        let label = "Atividade";
        if (a.type === "stage_change") {
          const from = stageLabel(String(a.payload.from || ""));
          const to = stageLabel(String(a.payload.to || ""));
          label = `${from} → ${to}`;
        } else if (a.type === "note") {
          label = String(a.payload.message || "Nota adicionada");
        } else if (a.type === "follow_up") {
          label = `Follow-up: ${String(a.payload.message || "")}`;
        } else if (a.type === "whatsapp") {
          label = "Contato via WhatsApp";
        }

        return (
          <li key={a.id} className="relative">
            <span className="absolute -left-[22px] top-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-card bg-primary text-primary-foreground">
              <Icon className="h-2.5 w-2.5" />
            </span>
            <div className="rounded-lg border border-border bg-muted/30 p-2.5">
              <p className="text-sm font-medium text-foreground">{label}</p>
              <p className="mt-0.5 text-[10px] text-muted-foreground">
                {formatRelative(a.created_at)} · {new Date(a.created_at).toLocaleString("pt-BR")}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
