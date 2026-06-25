import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Save, Upload, Trash2, ImageIcon, ExternalLink, Plus, ArrowUp, ArrowDown } from "lucide-react";

interface BioSettings {
  id: string;
  avatar_url: string;
  title: string;
  description: string;
  instagram_url: string;
  facebook_url: string;
  youtube_url: string;
  tiktok_url: string;
  whatsapp_url: string;
  footer_text: string;
}

interface BioCard {
  id: string;
  image_url: string;
  link_url: string;
  alt: string;
  sort_order: number;
  active: boolean;
}

async function uploadBioImage(file: File, folder: "avatar" | "cards"): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `bio/${folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("site-assets").upload(path, file, { upsert: true });
  if (error) throw error;
  const { data } = supabase.storage.from("site-assets").getPublicUrl(path);
  return data.publicUrl;
}

export function BioPageTab() {
  const queryClient = useQueryClient();
  const avatarRef = useRef<HTMLInputElement>(null);
  const cardFileRef = useRef<HTMLInputElement>(null);
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCardId, setUploadingCardId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<BioSettings>>({});

  const { data: settings, isLoading: loadingSettings } = useQuery({
    queryKey: ["admin_bio_settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("bio_settings" as any).select("*").limit(1).maybeSingle();
      if (error) throw error;
      return data as unknown as BioSettings | null;
    },
  });

  const { data: cards, isLoading: loadingCards } = useQuery({
    queryKey: ["admin_bio_cards"],
    queryFn: async () => {
      const { data, error } = await supabase.from("bio_cards" as any).select("*").order("sort_order");
      if (error) throw error;
      return data as unknown as BioCard[];
    },
  });

  useEffect(() => {
    if (settings) setForm(settings);
  }, [settings]);

  const saveSettings = useMutation({
    mutationFn: async (payload: Partial<BioSettings>) => {
      if (!settings?.id) {
        const { error } = await supabase.from("bio_settings" as any).insert(payload as any);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("bio_settings" as any).update(payload).eq("id", settings.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_bio_settings"] });
      queryClient.invalidateQueries({ queryKey: ["bio_settings"] });
      toast.success("Configurações salvas!");
    },
    onError: () => toast.error("Erro ao salvar"),
  });

  const updateCard = useMutation({
    mutationFn: async (row: Partial<BioCard> & { id: string }) => {
      const { id, ...rest } = row;
      const { error } = await supabase.from("bio_cards" as any).update(rest).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_bio_cards"] });
      queryClient.invalidateQueries({ queryKey: ["bio_cards"] });
    },
    onError: () => toast.error("Erro ao atualizar card"),
  });

  const addCard = useMutation({
    mutationFn: async () => {
      const max = cards?.length ? Math.max(...cards.map((c) => c.sort_order)) : 0;
      const { error } = await supabase.from("bio_cards" as any).insert({
        sort_order: max + 1,
        alt: `Espaço ${max + 1}`,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_bio_cards"] });
      queryClient.invalidateQueries({ queryKey: ["bio_cards"] });
      toast.success("Card adicionado!");
    },
  });

  const deleteCard = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("bio_cards" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_bio_cards"] });
      queryClient.invalidateQueries({ queryKey: ["bio_cards"] });
      toast.success("Card removido!");
    },
  });

  const moveCard = (card: BioCard, dir: -1 | 1) => {
    if (!cards) return;
    const idx = cards.findIndex((c) => c.id === card.id);
    const swap = cards[idx + dir];
    if (!swap) return;
    updateCard.mutate({ id: card.id, sort_order: swap.sort_order });
    updateCard.mutate({ id: swap.id, sort_order: card.sort_order });
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const url = await uploadBioImage(file, "avatar");
      setForm((f) => ({ ...f, avatar_url: url }));
      toast.success("Avatar enviado! Clique em Salvar.");
    } catch {
      toast.error("Erro ao enviar avatar");
    } finally {
      setUploadingAvatar(false);
      if (avatarRef.current) avatarRef.current.value = "";
    }
  };

  const handleCardImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingCardId) return;
    setUploadingCardId(editingCardId);
    try {
      const url = await uploadBioImage(file, "cards");
      await updateCard.mutateAsync({ id: editingCardId, image_url: url });
      toast.success("Imagem enviada!");
    } catch {
      toast.error("Erro ao enviar imagem");
    } finally {
      setUploadingCardId(null);
      setEditingCardId(null);
      if (cardFileRef.current) cardFileRef.current.value = "";
    }
  };

  return (
    <div className="space-y-8">
      <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
      <input ref={cardFileRef} type="file" accept="image/*" className="hidden" onChange={handleCardImageUpload} />

      {/* Header info */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Gerencie o conteúdo da página pública{" "}
          <a href="/bio" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
            /bio <ExternalLink className="h-3 w-3" />
          </a>
        </p>
      </div>

      {/* Profile + socials */}
      <div className="rounded-xl border bg-card p-6 shadow-sm space-y-6">
        <h3 className="text-base font-semibold">Perfil & Redes Sociais</h3>

        {loadingSettings ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <div className="grid gap-6 md:grid-cols-[160px_1fr]">
            {/* Avatar */}
            <div className="space-y-2">
              <Label>Foto de perfil</Label>
              <div className="relative h-32 w-32 overflow-hidden rounded-full border-4 border-primary bg-muted">
                {form.avatar_url ? (
                  <img src={form.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                    <ImageIcon className="h-8 w-8" />
                  </div>
                )}
              </div>
              <div className="flex gap-1">
                <Button size="sm" variant="outline" className="h-8 text-xs gap-1" onClick={() => avatarRef.current?.click()} disabled={uploadingAvatar}>
                  <Upload className="h-3 w-3" /> {uploadingAvatar ? "Enviando…" : "Upload"}
                </Button>
                {form.avatar_url && (
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => setForm((f) => ({ ...f, avatar_url: "" }))}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>

            {/* Fields */}
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="bio-title">Título</Label>
                  <Input id="bio-title" value={form.title ?? ""} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="bio-footer">Texto de rodapé</Label>
                  <Input id="bio-footer" value={form.footer_text ?? ""} onChange={(e) => setForm((f) => ({ ...f, footer_text: e.target.value }))} />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="bio-desc">Descrição</Label>
                <Textarea id="bio-desc" rows={2} value={form.description ?? ""} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  { key: "instagram_url", label: "Instagram URL" },
                  { key: "facebook_url", label: "Facebook URL" },
                  { key: "youtube_url", label: "YouTube URL" },
                  { key: "tiktok_url", label: "TikTok URL" },
                  { key: "whatsapp_url", label: "WhatsApp URL (https://wa.me/…)" },
                ].map(({ key, label }) => (
                  <div key={key} className="space-y-1.5">
                    <Label htmlFor={`bio-${key}`}>{label}</Label>
                    <Input
                      id={`bio-${key}`}
                      placeholder="https://…"
                      value={(form as any)[key] ?? ""}
                      onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                    />
                  </div>
                ))}
              </div>

              <div className="flex justify-end">
                <Button onClick={() => saveSettings.mutate(form)} disabled={saveSettings.isPending} className="gap-1.5">
                  <Save className="h-4 w-4" /> Salvar configurações
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Cards */}
      <div className="rounded-xl border bg-card shadow-sm">
        <div className="flex items-center justify-between border-b p-4">
          <div>
            <h3 className="text-base font-semibold">Cards de imagens clicáveis</h3>
            <p className="text-xs text-muted-foreground">Os cards aparecem na ordem definida abaixo. Apenas cards ativos são exibidos.</p>
          </div>
          <Button size="sm" className="gap-1.5" onClick={() => addCard.mutate()}>
            <Plus className="h-3.5 w-3.5" /> Adicionar card
          </Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Ordem</TableHead>
              <TableHead className="w-[140px]">Imagem</TableHead>
              <TableHead>Link (URL)</TableHead>
              <TableHead className="w-[200px]">Texto alt</TableHead>
              <TableHead className="w-[100px] text-center">Status</TableHead>
              <TableHead className="w-[120px] text-center">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loadingCards &&
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-10 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))}
            {cards?.map((card, idx) => (
              <TableRow key={card.id}>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button size="icon" variant="ghost" className="h-7 w-7" disabled={idx === 0} onClick={() => moveCard(card, -1)}>
                      <ArrowUp className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7" disabled={idx === (cards?.length ?? 0) - 1} onClick={() => moveCard(card, 1)}>
                      <ArrowDown className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {card.image_url ? (
                      <img src={card.image_url} alt={card.alt} className="h-12 w-20 rounded border object-cover" />
                    ) : (
                      <div className="flex h-12 w-20 items-center justify-center rounded border bg-muted text-muted-foreground">
                        <ImageIcon className="h-4 w-4" />
                      </div>
                    )}
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      disabled={uploadingCardId === card.id}
                      onClick={() => {
                        setEditingCardId(card.id);
                        cardFileRef.current?.click();
                      }}
                    >
                      <Upload className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </TableCell>
                <TableCell>
                  <Input
                    defaultValue={card.link_url}
                    placeholder="https://…"
                    className="h-8 text-xs"
                    onBlur={(e) => e.target.value !== card.link_url && updateCard.mutate({ id: card.id, link_url: e.target.value })}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    defaultValue={card.alt}
                    placeholder="Descrição da imagem"
                    className="h-8 text-xs"
                    onBlur={(e) => e.target.value !== card.alt && updateCard.mutate({ id: card.id, alt: e.target.value })}
                  />
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-2">
                    <Switch checked={card.active} onCheckedChange={(val) => updateCard.mutate({ id: card.id, active: val })} />
                    <StatusBadge active={card.active} />
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-center">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => deleteCard.mutate(card.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Remover card</TooltipContent>
                    </Tooltip>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {!loadingCards && cards?.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-8">
                  Nenhum card cadastrado. Clique em "Adicionar card" para começar.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
