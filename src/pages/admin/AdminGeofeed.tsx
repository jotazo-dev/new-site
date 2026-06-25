import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { DraggableTable } from "@/components/admin/DraggableTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { TableCell } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Plus, Pencil, Trash2, Eye, Copy, ExternalLink, Globe, Download } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "@/hooks/use-toast";

type GeofeedPrefix = {
  id: string;
  prefix: string;
  country: string;
  region: string;
  city: string;
  postal: string;
  notes: string;
  active: boolean;
  sort_order: number;
};

const FUNCTIONS_BASE = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1`;
// URL canônica declarada no LACNIC: arquivo estático em public/geofeed.csv
const GEOFEED_URL = "https://jotazo.com.br/geofeed.csv";
// URL dinâmica (Edge Function) usada apenas para visualização em tempo real
const GEOFEED_PREVIEW_URL = `${FUNCTIONS_BASE}/geofeed`;

// Validação básica de CIDR IPv4/IPv6
function isValidCIDR(value: string): boolean {
  const v = value.trim();
  // IPv4 CIDR
  const v4 = /^((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\/(3[0-2]|[12]?\d)$/;
  // IPv6 CIDR (relaxed)
  const v6 = /^[0-9a-fA-F:]+\/(12[0-8]|1[01]\d|\d?\d)$/;
  return v4.test(v) || v6.test(v);
}

const emptyForm = {
  prefix: "",
  country: "BR",
  region: "BR-CE",
  city: "",
  postal: "",
  notes: "",
};

export default function AdminGeofeed() {
  const qc = useQueryClient();
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<GeofeedPrefix | null>(null);
  const [form, setForm] = React.useState(emptyForm);
  const [previewOpen, setPreviewOpen] = React.useState(false);
  const [previewContent, setPreviewContent] = React.useState("");
  const [loadingPreview, setLoadingPreview] = React.useState(false);

  const { data: prefixes = [], isLoading } = useQuery({
    queryKey: ["geofeed_prefixes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("geofeed_prefixes")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return data as GeofeedPrefix[];
    },
  });

  const upsert = useMutation({
    mutationFn: async () => {
      if (!isValidCIDR(form.prefix)) {
        throw new Error("Prefixo CIDR inválido. Use formato como 200.150.0.0/22");
      }
      const payload = {
        prefix: form.prefix.trim(),
        country: form.country.trim().toUpperCase(),
        region: form.region.trim().toUpperCase(),
        city: form.city.trim(),
        postal: form.postal.trim(),
        notes: form.notes.trim(),
      };
      if (editing) {
        const { error } = await supabase
          .from("geofeed_prefixes")
          .update(payload)
          .eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("geofeed_prefixes")
          .insert({ ...payload, sort_order: prefixes.length });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["geofeed_prefixes"] });
      setOpen(false);
      toast({ title: "Salvo!" });
    },
    onError: (err: Error) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  const toggle = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from("geofeed_prefixes").update({ active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["geofeed_prefixes"] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("geofeed_prefixes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["geofeed_prefixes"] });
      toast({ title: "Removido!" });
    },
  });

  const reorder = useMutation({
    mutationFn: async (items: { id: string; sort_order: number }[]) => {
      for (const item of items) {
        await supabase.from("geofeed_prefixes").update({ sort_order: item.sort_order }).eq("id", item.id);
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["geofeed_prefixes"] }),
  });

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (p: GeofeedPrefix) => {
    setEditing(p);
    setForm({
      prefix: p.prefix,
      country: p.country,
      region: p.region,
      city: p.city,
      postal: p.postal,
      notes: p.notes,
    });
    setOpen(true);
  };

  const handlePreview = async () => {
    setLoadingPreview(true);
    setPreviewOpen(true);
    try {
      const res = await fetch(GEOFEED_PREVIEW_URL);
      const text = await res.text();
      setPreviewContent(text);
    } catch (err) {
      setPreviewContent(`Erro ao carregar: ${(err as Error).message}`);
    } finally {
      setLoadingPreview(false);
    }
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(GEOFEED_URL);
    toast({ title: "URL copiada!" });
  };

  const handleDownload = async () => {
    try {
      const activePrefixes = prefixes
        .filter((p) => p.active)
        .sort((a, b) => a.sort_order - b.sort_order);

      const today = new Date().toISOString().slice(0, 10);
      const header = [
        "# Jotazo Telecom - IP Geolocation Feed (RFC 8805)",
        "# Format: prefix,country,region,city,postal",
        `# Generated: ${today}`,
        "# Contact: contato@jotazo.com.br",
        "# Canonical URL: https://jotazo.com.br/geofeed.csv",
      ].join("\n");

      const rows = activePrefixes
        .map((p) => `${p.prefix},${p.country},${p.region},${p.city},${p.postal}`)
        .join("\n");

      const csv = `${header}\n${rows}\n`;

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "geofeed.csv";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "geofeed.csv gerado!",
        description: `${activePrefixes.length} prefixos. Envie o arquivo no chat e peça "atualize o public/geofeed.csv".`,
      });
    } catch (err) {
      toast({
        title: "Erro ao gerar CSV",
        description: (err as Error).message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="GEOFEED"
        subtitle="Publique a geolocalização real dos seus blocos de IP (RFC 8805) para que CDNs como Google, Netflix e Cloudflare entreguem conteúdo na região correta dos seus clientes."
      />

      {/* Card explicativo */}
      <Card className="p-6 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
        <div className="flex items-start gap-4">
          <div className="rounded-xl bg-primary/10 p-3 shrink-0">
            <Globe className="h-6 w-6 text-primary" />
          </div>
          <div className="space-y-3 flex-1">
            <div>
              <h3 className="font-semibold text-base mb-1">URL pública do seu GEOFEED</h3>
              <div className="flex items-center gap-2 flex-wrap">
                <code className="bg-background px-3 py-1.5 rounded-md text-xs border break-all">
                  {GEOFEED_URL}
                </code>
                <Button size="sm" variant="outline" onClick={copyUrl}>
                  <Copy className="h-3.5 w-3.5 mr-1" /> Copiar
                </Button>
                <Button size="sm" variant="outline" onClick={handlePreview}>
                  <Eye className="h-3.5 w-3.5 mr-1" /> Visualizar CSV
                </Button>
                <Button size="sm" variant="outline" asChild>
                  <a href={GEOFEED_URL} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3.5 w-3.5 mr-1" /> Abrir
                  </a>
                </Button>
                <Button size="sm" onClick={handleDownload} className="gap-1">
                  <Download className="h-3.5 w-3.5" /> Regenerar geofeed.csv
                </Button>
              </div>
            </div>

            <div className="text-sm text-muted-foreground space-y-2 pt-2 border-t border-border/50">
              <p className="font-medium text-foreground pt-2">Próximos passos no LACNIC:</p>
              <ol className="list-decimal list-inside space-y-1 text-xs">
                <li>Acesse o painel do LACNIC com a conta detentora do(s) bloco(s).</li>
                <li>
                  Edite o objeto <code className="bg-muted px-1 rounded">inetnum</code> e
                  adicione o atributo:{" "}
                  <code className="bg-muted px-1 rounded">geofeed: {GEOFEED_URL}</code>
                </li>
                <li>Aguarde 24–72h para que CDNs (Google, Netflix, MaxMind, IPInfo) descubram e consumam o feed.</li>
                <li>Opcional: assine o feed via RPKI (RFC 9092) para maior confiança dos consumidores.</li>
              </ol>
            </div>
          </div>
        </div>
      </Card>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Prefixos publicados</h2>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" /> Novo prefixo
        </Button>
      </div>

      <DraggableTable
        data={prefixes}
        columns={["Prefixo (CIDR)", "Localização", "Observações", "Status"]}
        colSpan={4}
        isLoading={isLoading}
        onReorder={(items) => reorder.mutate(items)}
        renderRow={(p: GeofeedPrefix) => (
          <>
            <TableCell className="font-mono text-sm">{p.prefix}</TableCell>
            <TableCell className="text-sm">
              {[p.city, p.region, p.country].filter(Boolean).join(" · ")}
            </TableCell>
            <TableCell className="text-xs text-muted-foreground max-w-xs truncate">
              {p.notes || "—"}
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <Switch
                  checked={p.active}
                  onCheckedChange={(active) => toggle.mutate({ id: p.id, active })}
                />
                <StatusBadge active={p.active} />
              </div>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-1 justify-end">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button size="icon" variant="ghost" onClick={() => openEdit(p)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Editar</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        if (confirm(`Remover prefixo ${p.prefix}?`)) remove.mutate(p.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Remover</TooltipContent>
                </Tooltip>
              </div>
            </TableCell>
          </>
        )}
      />

      {/* Dialog de edição/criação */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar prefixo" : "Novo prefixo"}</DialogTitle>
            <DialogDescription>
              Declare o bloco de IP e a localização real onde ele atende.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Prefixo CIDR *</Label>
              <Input
                value={form.prefix}
                onChange={(e) => setForm({ ...form, prefix: e.target.value })}
                placeholder="ex: 200.150.0.0/22"
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground mt-1">
                IPv4 ou IPv6 com máscara (ex: 200.150.0.0/22 ou 2804:abc::/32).
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>País (ISO 3166-1)</Label>
                <Input
                  value={form.country}
                  onChange={(e) => setForm({ ...form, country: e.target.value })}
                  placeholder="BR"
                  maxLength={2}
                />
              </div>
              <div>
                <Label>Região (ISO 3166-2)</Label>
                <Input
                  value={form.region}
                  onChange={(e) => setForm({ ...form, region: e.target.value })}
                  placeholder="BR-CE"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Cidade</Label>
                <Input
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  placeholder="Fortaleza"
                />
              </div>
              <div>
                <Label>CEP (opcional)</Label>
                <Input
                  value={form.postal}
                  onChange={(e) => setForm({ ...form, postal: e.target.value })}
                  placeholder="60000-000"
                />
              </div>
            </div>

            <div>
              <Label>Observações internas</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Bloco usado para clientes residenciais da Aldeota — não publicado no CSV"
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={() => upsert.mutate()} disabled={upsert.isPending}>
              {upsert.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview do CSV */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Preview do geofeed.csv</DialogTitle>
            <DialogDescription>Conteúdo exato servido na URL pública.</DialogDescription>
          </DialogHeader>
          <pre className="bg-muted rounded-md p-4 text-xs font-mono overflow-auto max-h-96 whitespace-pre">
            {loadingPreview ? "Carregando..." : previewContent}
          </pre>
        </DialogContent>
      </Dialog>
    </div>
  );
}
