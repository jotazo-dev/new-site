import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCcw, Search, UserPlus } from "lucide-react";
import { toast } from "sonner";

type Row = {
  id: string;
  user_id: string;
  full_name: string;
  cpf_cnpj: string;
  phone: string | null;
  rbx_code: string | null;
  rbx_linked_at: string | null;
  last_login_at: string | null;
  created_at: string;
};

function maskDoc(d: string | null) {
  const s = (d || "").replace(/\D/g, "");
  if (s.length === 11) return `${s.slice(0,3)}.***.***-${s.slice(9)}`;
  if (s.length === 14) return `${s.slice(0,2)}.***.***/****-${s.slice(12)}`;
  return d || "—";
}

export function ContasSiteTab() {
  const [rows, setRows] = useState<Row[]>([]);
  const [orderCounts, setOrderCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "linked" | "unlinked">("all");
  const [search, setSearch] = useState("");

  const load = async () => {
    setLoading(true);
    let q = supabase.from("customer_profiles").select("*").order("created_at", { ascending: false }).limit(500);
    if (filter === "linked") q = q.not("rbx_code", "is", null);
    if (filter === "unlinked") q = q.is("rbx_code", null);
    const { data, error } = await q;
    if (error) toast.error(error.message);
    const list = (data ?? []) as Row[];
    setRows(list);

    // count orders per user
    if (list.length > 0) {
      const ids = list.map((r) => r.user_id);
      const { data: orders } = await supabase
        .from("checkout_orders")
        .select("user_id")
        .in("user_id", ids);
      const map: Record<string, number> = {};
      (orders ?? []).forEach((o: any) => {
        if (o.user_id) map[o.user_id] = (map[o.user_id] || 0) + 1;
      });
      setOrderCounts(map);
    }
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [filter]);

  const filtered = rows.filter((r) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      r.full_name?.toLowerCase().includes(s) ||
      r.cpf_cnpj?.includes(s.replace(/\D/g, "")) ||
      r.phone?.includes(s)
    );
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Buscar por nome, CPF, telefone…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as any)}
          className="rounded-md border border-border bg-background px-3 py-2 text-sm"
        >
          <option value="all">Todas as contas</option>
          <option value="linked">Vinculadas ao RBX</option>
          <option value="unlinked">Sem vínculo RBX</option>
        </select>
        <Button variant="outline" size="sm" onClick={load}><RefreshCcw className="mr-1.5 h-4 w-4" /> Atualizar</Button>
      </div>

      <Card className="overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center p-10 text-muted-foreground"><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Carregando…</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">
            <UserPlus className="h-10 w-10 mx-auto mb-3 opacity-40" />
            Nenhuma conta encontrada.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left">Nome</th>
                  <th className="px-4 py-3 text-left">CPF/CNPJ</th>
                  <th className="px-4 py-3 text-left">Telefone</th>
                  <th className="px-4 py-3 text-left">RBX</th>
                  <th className="px-4 py-3 text-right">Pedidos</th>
                  <th className="px-4 py-3 text-left">Último login</th>
                  <th className="px-4 py-3 text-left">Criada em</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{r.full_name}</td>
                    <td className="px-4 py-3 font-mono text-xs">{maskDoc(r.cpf_cnpj)}</td>
                    <td className="px-4 py-3 text-xs">{r.phone || "—"}</td>
                    <td className="px-4 py-3">
                      {r.rbx_code ? (
                        <Badge variant="outline" className="bg-green-500/15 text-green-700 border-green-200">#{r.rbx_code}</Badge>
                      ) : (
                        <Badge variant="outline" className="bg-gray-500/15 text-gray-600 border-gray-200">Não vinculado</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">{orderCounts[r.user_id] || 0}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{r.last_login_at ? new Date(r.last_login_at).toLocaleString("pt-BR") : "—"}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString("pt-BR")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
