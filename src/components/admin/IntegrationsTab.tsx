import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Trash2, Plug, Webhook, KeyRound, Settings2, Pencil, Zap, Loader2, CheckCircle2, XCircle } from "lucide-react";

type Integration = {
  id: string;
  name: string;
  provider: string;
  category: string;
  config: Record<string, string>;
  active: boolean;
  sort_order: number;
};

const CATEGORIES = [
  { value: "api_externa", label: "API Externa" },
  { value: "conector", label: "Conector de Terceiros" },
];

const PROVIDERS = [
  { value: "whatsapp_business", label: "WhatsApp Business API", icon: "💬" },
  { value: "payment_gateway", label: "Gateway de Pagamento", icon: "💳" },
  { value: "crm", label: "CRM", icon: "📊" },
  { value: "erp", label: "ERP", icon: "🏢" },
  { value: "email_marketing", label: "Email Marketing", icon: "📧" },
  { value: "sms_gateway", label: "SMS Gateway", icon: "📱" },
  { value: "webhook", label: "Webhook Personalizado", icon: "🔗" },
  { value: "outro", label: "Outro", icon: "⚙️" },
];

function getProviderInfo(provider: string) {
  return PROVIDERS.find((p) => p.value === provider) ?? { value: provider, label: provider, icon: "⚙️" };
}

const emptyForm = {
  name: "",
  provider: "",
  category: "api_externa",
  config: {} as Record<string, string>,
};

export function IntegrationsTab() {
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [form, setForm] = React.useState(emptyForm);
  const [configFields, setConfigFields] = React.useState<{ key: string; value: string }[]>([]);
  const [isTesting, setIsTesting] = React.useState(false);
  const [testResult, setTestResult] = React.useState<{ ok: boolean; message: string } | null>(null);

  const { data: integrations = [], isLoading } = useQuery({
    queryKey: ["admin-integrations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("integrations")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as Integration[];
    },
  });

  const upsertMutation = useMutation({
    mutationFn: async () => {
      const configObj: Record<string, string> = {};
      configFields.forEach((f) => {
        if (f.key.trim()) configObj[f.key.trim()] = f.value;
      });

      const payload = {
        name: form.name,
        provider: form.provider,
        category: form.category,
        config: configObj,
      };

      if (editingId) {
        const { error } = await supabase
          .from("integrations")
          .update(payload as any)
          .eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("integrations")
          .insert(payload as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-integrations"] });
      toast.success(editingId ? "Integração atualizada!" : "Integração criada!");
      closeDialog();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase
        .from("integrations")
        .update({ active } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-integrations"] }),
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("integrations").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-integrations"] });
      toast.success("Integração removida!");
    },
    onError: (e: any) => toast.error(e.message),
  });

  async function handleTest() {
    setIsTesting(true);
    setTestResult(null);
    try {
      const configObj: Record<string, string> = {};
      configFields.forEach((f) => {
        if (f.key.trim()) configObj[f.key.trim()] = f.value;
      });
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const res = await fetch(`https://${projectId}.supabase.co/functions/v1/test-integration`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: form.provider, config: configObj }),
      });
      const data = await res.json();
      setTestResult(data);
    } catch (e: any) {
      setTestResult({ ok: false, message: e.message || "Erro desconhecido" });
    } finally {
      setIsTesting(false);
    }
  }

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setConfigFields([{ key: "", value: "" }]);
    setTestResult(null);
    setDialogOpen(true);
  }

  function openEdit(item: Integration) {
    setEditingId(item.id);
    setForm({
      name: item.name,
      provider: item.provider,
      category: item.category,
      config: item.config,
    });
    const entries = Object.entries(item.config || {});
    setConfigFields(entries.length ? entries.map(([key, value]) => ({ key, value })) : [{ key: "", value: "" }]);
    setTestResult(null);
    setDialogOpen(true);
  }

  function closeDialog() {
    setDialogOpen(false);
    setEditingId(null);
    setForm(emptyForm);
    setConfigFields([{ key: "", value: "" }]);
  }

  function addConfigField() {
    setConfigFields((prev) => [...prev, { key: "", value: "" }]);
  }

  function removeConfigField(idx: number) {
    setConfigFields((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateConfigField(idx: number, field: "key" | "value", val: string) {
    setConfigFields((prev) => prev.map((f, i) => (i === idx ? { ...f, [field]: val } : f)));
  }

  const canSave = form.name.trim() && form.provider;

  const apis = integrations.filter((i) => i.category === "api_externa");
  const connectors = integrations.filter((i) => i.category === "conector");

  if (isLoading) {
    return <div className="py-10 text-center text-muted-foreground">Carregando integrações...</div>;
  }

  return (
    <div className="space-y-6">
      {/* APIs Externas */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center justify-between text-base" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(218,80%,35%)] flex items-center justify-center">
                <KeyRound className="h-4 w-4 text-white" />
              </div>
              APIs Externas
            </div>
            <Button size="sm" variant="outline" className="gap-1" onClick={openCreate}>
              <Plus className="h-3.5 w-3.5" /> Adicionar
            </Button>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Gerencie tokens, chaves de API e webhooks de serviços externos.
          </p>
        </CardHeader>
        <CardContent>
          {apis.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Nenhuma API externa configurada.</p>
          ) : (
            <div className="space-y-3">
              {apis.map((item) => (
                <IntegrationRow
                  key={item.id}
                  item={item}
                  onToggle={(active) => toggleMutation.mutate({ id: item.id, active })}
                  onEdit={() => openEdit(item)}
                  onDelete={() => deleteMutation.mutate(item.id)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Conectores */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center justify-between text-base" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(218,80%,35%)] flex items-center justify-center">
                <Plug className="h-4 w-4 text-white" />
              </div>
              Conectores de Terceiros
            </div>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Integre com CRMs, ERPs e plataformas de atendimento.
          </p>
        </CardHeader>
        <CardContent>
          {connectors.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Nenhum conector configurado.</p>
          ) : (
            <div className="space-y-3">
              {connectors.map((item) => (
                <IntegrationRow
                  key={item.id}
                  item={item}
                  onToggle={(active) => toggleMutation.mutate({ id: item.id, active })}
                  onEdit={() => openEdit(item)}
                  onDelete={() => deleteMutation.mutate(item.id)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Integração" : "Nova Integração"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Nome</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ex: WhatsApp Business API"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Provedor</Label>
                <Select value={form.provider} onValueChange={(v) => setForm({ ...form, provider: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {PROVIDERS.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.icon} {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Categoria</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Config key-value pairs */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">Configurações (chave → valor)</Label>
                <Button type="button" variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={addConfigField}>
                  <Plus className="h-3 w-3" /> Campo
                </Button>
              </div>
              {configFields.map((cf, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <Input
                    className="flex-1"
                    placeholder="Chave (ex: api_key)"
                    value={cf.key}
                    onChange={(e) => updateConfigField(idx, "key", e.target.value)}
                  />
                  <Input
                    className="flex-1"
                    placeholder="Valor"
                    value={cf.value}
                    onChange={(e) => updateConfigField(idx, "value", e.target.value)}
                    type={cf.key.toLowerCase().includes("token") || cf.key.toLowerCase().includes("secret") ? "password" : "text"}
                  />
                  {configFields.length > 1 && (
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => removeConfigField(idx)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              ))}
              <p className="text-[11px] text-muted-foreground">
                Campos com "token" ou "secret" no nome serão mascarados automaticamente.
              </p>
            </div>

            {/* Test result */}
            {testResult && (
              <div className={`flex items-start gap-2 rounded-lg border p-3 text-sm ${testResult.ok ? "border-green-500/30 bg-green-500/5 text-green-700" : "border-destructive/30 bg-destructive/5 text-destructive"}`}>
                {testResult.ok ? <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" /> : <XCircle className="h-4 w-4 mt-0.5 shrink-0" />}
                <span>{testResult.message}</span>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1 gap-1.5"
                disabled={!canSave || isTesting}
                onClick={handleTest}
              >
                {isTesting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
                {isTesting ? "Testando..." : "Testar conexão"}
              </Button>
              <Button className="flex-1" disabled={!canSave || upsertMutation.isPending} onClick={() => upsertMutation.mutate()}>
                {upsertMutation.isPending ? "Salvando..." : editingId ? "Atualizar" : "Criar integração"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function IntegrationRow({
  item,
  onToggle,
  onEdit,
  onDelete,
}: {
  item: Integration;
  onToggle: (active: boolean) => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const info = getProviderInfo(item.provider);
  const configCount = Object.keys(item.config || {}).length;

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border bg-card p-3">
      <div className="flex items-center gap-3 min-w-0">
        <span className="text-xl">{info.icon}</span>
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold">{item.name}</div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-muted-foreground">{info.label}</span>
            {configCount > 0 && (
              <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded-full text-muted-foreground">
                {configCount} campo{configCount > 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <Switch checked={item.active} onCheckedChange={onToggle} />
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onEdit}>
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={onDelete}>
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
