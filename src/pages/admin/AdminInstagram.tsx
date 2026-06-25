import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Eye, EyeOff, RefreshCcw, CheckCircle2, AlertTriangle, Save, Plug } from "lucide-react";
import { toast } from "@/hooks/use-toast";

type Settings = {
  id: string;
  active: boolean;
  access_token: string;
  business_account_id: string;
  token_expires_at: string | null;
  post_count: number;
  layout: string;
  columns_desktop: number;
  columns_mobile: number;
  aspect_ratio: string;
  show_caption: boolean;
  show_type_icon: boolean;
  title: string;
  subtitle: string;
  profile_url: string;
  cta_label: string;
  cache_minutes: number;
};

export default function AdminInstagram() {
  const qc = useQueryClient();
  const [form, setForm] = useState<Settings | null>(null);
  const [showToken, setShowToken] = useState(false);
  const [testing, setTesting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-instagram-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("instagram_settings" as any)
        .select("*")
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as Settings;
    },
  });

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  const saveMut = useMutation({
    mutationFn: async (payload: Settings) => {
      const { error } = await supabase
        .from("instagram_settings" as any)
        .update(payload)
        .eq("id", payload.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Configurações salvas" });
      qc.invalidateQueries({ queryKey: ["admin-instagram-settings"] });
      qc.invalidateQueries({ queryKey: ["instagram-public-settings"] });
      qc.invalidateQueries({ queryKey: ["instagram-feed"] });
    },
    onError: (e: any) => toast({ title: "Erro ao salvar", description: e.message, variant: "destructive" }),
  });

  if (isLoading || !form) {
    return (
      <div className="p-6">
        <AdminPageHeader title="Instagram" subtitle="Configurações do feed do Instagram exibido em /sobre" />
        <div className="mt-6 text-sm text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  const set = (patch: Partial<Settings>) => setForm({ ...form, ...patch });

  const handleTest = async () => {
    setTesting(true);
    try {
      const { data: res, error } = await supabase.functions.invoke("instagram-feed?action=test", {
        body: { access_token: form.access_token, business_account_id: form.business_account_id },
      });
      if (error) throw error;
      if ((res as any).ok) {
        toast({ title: "Conexão OK", description: `Token válido. ${(res as any).sample_count} item(s) retornado(s).` });
      } else {
        toast({ title: "Falha na conexão", description: (res as any).error || "Erro desconhecido", variant: "destructive" });
      }
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    } finally {
      setTesting(false);
    }
  };

  const handleRefreshToken = async () => {
    setRefreshing(true);
    try {
      const { data: res, error } = await supabase.functions.invoke("instagram-feed?action=refresh_token", { body: {} });
      if (error) throw error;
      if ((res as any).ok) {
        toast({ title: "Token renovado", description: `Expira em: ${new Date((res as any).expires_at).toLocaleDateString()}` });
        qc.invalidateQueries({ queryKey: ["admin-instagram-settings"] });
      } else {
        toast({ title: "Falha ao renovar", description: (res as any).error, variant: "destructive" });
      }
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    } finally {
      setRefreshing(false);
    }
  };

  const daysToExpire = form.token_expires_at
    ? Math.round((new Date(form.token_expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className="p-6 space-y-6">
      <AdminPageHeader
        title="Instagram"
        subtitle="Configure o feed do Instagram exibido na página Sobre"
        extraActions={
          <Button onClick={() => saveMut.mutate(form)} disabled={saveMut.isPending}>
            <Save className="mr-2 h-4 w-4" />
            {saveMut.isPending ? "Salvando..." : "Salvar"}
          </Button>
        }
      />

      {/* Conexão */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plug className="h-5 w-5" /> Conexão
          </CardTitle>
          <CardDescription>Credenciais da API do Instagram Graph.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label className="text-sm">Seção ativa no site</Label>
              <p className="text-xs text-muted-foreground">Quando desativada, a seção não aparece em /sobre.</p>
            </div>
            <Switch checked={form.active} onCheckedChange={(v) => set({ active: v })} />
          </div>

          <div>
            <Label>Access Token (Long-Lived)</Label>
            <div className="flex gap-2">
              <Input
                type={showToken ? "text" : "password"}
                value={form.access_token}
                onChange={(e) => set({ access_token: e.target.value })}
                placeholder="EAAB... ou IGQ..."
              />
              <Button type="button" variant="outline" size="icon" onClick={() => setShowToken((v) => !v)}>
                {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            {daysToExpire !== null && (
              <p className={`mt-1 text-xs ${daysToExpire < 10 ? "text-destructive" : "text-muted-foreground"}`}>
                {daysToExpire < 0
                  ? "Token expirado"
                  : `Expira em ${daysToExpire} dia${daysToExpire === 1 ? "" : "s"}`}
              </p>
            )}
          </div>

          <div>
            <Label>Instagram Business Account ID</Label>
            <Input
              value={form.business_account_id}
              onChange={(e) => set({ business_account_id: e.target.value })}
              placeholder="178414xxxxxxxxxx"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" onClick={handleTest} disabled={testing}>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              {testing ? "Testando..." : "Testar conexão"}
            </Button>
            <Button type="button" variant="outline" onClick={handleRefreshToken} disabled={refreshing}>
              <RefreshCcw className="mr-2 h-4 w-4" />
              {refreshing ? "Renovando..." : "Renovar token (60d)"}
            </Button>
          </div>

          <Accordion type="single" collapsible>
            <AccordionItem value="howto">
              <AccordionTrigger className="text-sm">
                <span className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" /> Como obter o token e o ID
                </span>
              </AccordionTrigger>
              <AccordionContent className="text-sm space-y-2 text-muted-foreground">
                <p>1. Converta a conta do Instagram em <b>Profissional</b> (Criador ou Empresa) e conecte a uma Página do Facebook.</p>
                <p>2. Em <a className="underline" target="_blank" rel="noreferrer" href="https://developers.facebook.com/apps">developers.facebook.com/apps</a> crie um app e adicione o produto <b>Instagram Graph API</b>.</p>
                <p>3. Use o <a className="underline" target="_blank" rel="noreferrer" href="https://developers.facebook.com/tools/explorer/">Graph API Explorer</a> para gerar um <b>User Access Token</b> com escopos <code>instagram_basic</code>, <code>pages_show_list</code> e <code>business_management</code>.</p>
                <p>4. Troque por um <b>Long-Lived Token</b> (válido por 60 dias) usando <code>oauth/access_token?grant_type=fb_exchange_token</code>.</p>
                <p>5. Pegue o <b>Instagram Business Account ID</b> via <code>GET /me/accounts</code> seguido de <code>GET /{`{page-id}`}?fields=instagram_business_account</code>.</p>
                <p>6. Cole o token e o ID acima, clique em <b>Testar conexão</b> e ative a seção.</p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      {/* Layout */}
      <Card>
        <CardHeader>
          <CardTitle>Layout</CardTitle>
          <CardDescription>Como os posts são apresentados.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Tipo de layout</Label>
              <Select value={form.layout} onValueChange={(v) => set({ layout: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="grid">Grade</SelectItem>
                  <SelectItem value="carousel">Carrossel</SelectItem>
                  <SelectItem value="masonry">Mosaico</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Proporção da imagem</Label>
              <Select value={form.aspect_ratio} onValueChange={(v) => set({ aspect_ratio: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="square">Quadrado (1:1)</SelectItem>
                  <SelectItem value="portrait">Retrato (4:5)</SelectItem>
                  <SelectItem value="landscape">Paisagem (16:9)</SelectItem>
                  <SelectItem value="original">Original</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Quantidade de posts: <b>{form.post_count}</b></Label>
            <Slider min={1} max={12} step={1} value={[form.post_count]} onValueChange={([v]) => set({ post_count: v })} />
          </div>
          <div>
            <Label>Colunas no desktop: <b>{form.columns_desktop}</b></Label>
            <Slider min={2} max={6} step={1} value={[form.columns_desktop]} onValueChange={([v]) => set({ columns_desktop: v })} />
          </div>
          <div>
            <Label>Colunas no mobile: <b>{form.columns_mobile}</b></Label>
            <Slider min={1} max={3} step={1} value={[form.columns_mobile]} onValueChange={([v]) => set({ columns_mobile: v })} />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <Label>Mostrar legenda no hover</Label>
            <Switch checked={form.show_caption} onCheckedChange={(v) => set({ show_caption: v })} />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <Label>Mostrar ícone do tipo (foto/vídeo/carrossel)</Label>
            <Switch checked={form.show_type_icon} onCheckedChange={(v) => set({ show_type_icon: v })} />
          </div>
        </CardContent>
      </Card>

      {/* Conteúdo */}
      <Card>
        <CardHeader>
          <CardTitle>Conteúdo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Título da seção</Label>
            <Input value={form.title} onChange={(e) => set({ title: e.target.value })} />
          </div>
          <div>
            <Label>Subtítulo</Label>
            <Input value={form.subtitle} onChange={(e) => set({ subtitle: e.target.value })} />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>URL do perfil</Label>
              <Input value={form.profile_url} onChange={(e) => set({ profile_url: e.target.value })} />
            </div>
            <div>
              <Label>Rótulo do botão</Label>
              <Input value={form.cta_label} onChange={(e) => set({ cta_label: e.target.value })} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cache */}
      <Card>
        <CardHeader>
          <CardTitle>Cache</CardTitle>
          <CardDescription>Por quanto tempo o feed é mantido em cache no servidor.</CardDescription>
        </CardHeader>
        <CardContent>
          <Label>Minutos de cache: <b>{form.cache_minutes}</b></Label>
          <Slider min={5} max={120} step={5} value={[form.cache_minutes]} onValueChange={([v]) => set({ cache_minutes: v })} />
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={() => saveMut.mutate(form)} disabled={saveMut.isPending} size="lg">
          <Save className="mr-2 h-4 w-4" />
          {saveMut.isPending ? "Salvando..." : "Salvar configurações"}
        </Button>
      </div>
    </div>
  );
}
