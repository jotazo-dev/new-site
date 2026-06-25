import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

type Ev = {
  id: string;
  created_at: string;
  source: string | null;
  cielo_status: number | null;
  payload: any;
};

export function VendaTimeline({ orderId }: { orderId: string }) {
  const [events, setEvents] = useState<Ev[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("checkout_events")
        .select("id, created_at, source, cielo_status, payload")
        .eq("order_id", orderId)
        .order("created_at", { ascending: false })
        .limit(100);
      if (!cancelled) {
        setEvents((data ?? []) as Ev[]);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [orderId]);

  if (loading) {
    return <div className="flex items-center text-sm text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Carregando timeline…</div>;
  }
  if (events.length === 0) {
    return <div className="text-sm text-muted-foreground">Sem eventos registrados.</div>;
  }
  return (
    <ol className="relative border-l border-border pl-4 space-y-3">
      {events.map((e) => (
        <li key={e.id}>
          <div className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full bg-primary" />
          <div className="text-xs text-muted-foreground">{new Date(e.created_at).toLocaleString("pt-BR")}</div>
          <div className="text-sm font-medium">
            {e.source || "evento"}
            {e.cielo_status !== null && e.cielo_status !== undefined && (
              <span className="ml-2 text-xs text-muted-foreground">status Cielo: {e.cielo_status}</span>
            )}
          </div>
          {e.payload && Object.keys(e.payload).length > 0 && (
            <pre className="mt-1 max-h-40 overflow-auto rounded bg-muted/40 p-2 text-[11px] leading-snug">
              {JSON.stringify(e.payload, null, 2)}
            </pre>
          )}
        </li>
      ))}
    </ol>
  );
}
