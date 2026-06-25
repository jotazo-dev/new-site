import { useState, useRef } from "react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ExternalLink, Pencil, Save, X, Upload, Trash2, Image, Plus, Map, FileText, User } from "lucide-react";
import { BioPageTab } from "@/components/admin/BioPageTab";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface PageRow {
  id: string;
  slug: string;
  title: string;
  meta_title: string;
  meta_description: string;
  og_image: string;
  active: boolean;
}

interface SitemapRow {
  id: string;
  path: string;
  priority: string;
  changefreq: string;
  active: boolean;
  sort_order: number;
}

async function uploadOgImage(file: File, slug: string): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const safeName = slug.replace(/\//g, "_").replace(/^_/, "") || "home";
  const path = `og/${safeName}.${ext}`;
  const { error } = await supabase.storage.from("site-assets").upload(path, file, { upsert: true });
  if (error) throw error;
  const { data: pub } = supabase.storage.from("site-assets").getPublicUrl(path);
  return pub.publicUrl;
}

const CHANGEFREQ_OPTIONS = ["always", "hourly", "daily", "weekly", "monthly", "yearly", "never"];
const PRIORITY_OPTIONS = ["1.0", "0.9", "0.8", "0.7", "0.6", "0.5", "0.4", "0.3", "0.2", "0.1", "0.0"];

function SitemapTab() {
  const queryClient = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [newRow, setNewRow] = useState({ path: "", priority: "0.5", changefreq: "monthly" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<SitemapRow>>({});

  const { data: rows, isLoading } = useQuery({
    queryKey: ["admin_sitemap_pages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sitemap_pages")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return data as SitemapRow[];
    },
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const path = newRow.path.startsWith("/") ? newRow.path : `/${newRow.path}`;
      const maxOrder = rows?.length ? Math.max(...rows.map((r) => r.sort_order)) + 1 : 0;
      const { error } = await supabase.from("sitemap_pages").insert({
        path,
        priority: newRow.priority,
        changefreq: newRow.changefreq,
        sort_order: maxOrder,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_sitemap_pages"] });
      toast.success("Rota adicionada ao sitemap!");
      setAdding(false);
      setNewRow({ path: "", priority: "0.5", changefreq: "monthly" });
    },
    onError: (e: any) => toast.error(e.message?.includes("unique") ? "Essa rota já existe no sitemap" : "Erro ao adicionar"),
  });

  const updateMutation = useMutation({
    mutationFn: async (row: Partial<SitemapRow> & { id: string }) => {
      const { id, ...rest } = row;
      const { error } = await supabase.from("sitemap_pages").update(rest).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_sitemap_pages"] });
      toast.success("Rota atualizada!");
      setEditingId(null);
    },
    onError: () => toast.error("Erro ao salvar"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("sitemap_pages").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_sitemap_pages"] });
      toast.success("Rota removida do sitemap!");
    },
    onError: () => toast.error("Erro ao remover"),
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from("sitemap_pages").update({ active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_sitemap_pages"] });
    },
  });

  const startEdit = (row: SitemapRow) => {
    setEditingId(row.id);
    setEditData({ priority: row.priority, changefreq: row.changefreq });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Gerencie as rotas estáticas que aparecem no sitemap. Posts do blog ativos são adicionados automaticamente.
        </p>
        <Button size="sm" className="gap-1.5" onClick={() => setAdding(true)} disabled={adding}>
          <Plus className="h-3.5 w-3.5" /> Adicionar rota
        </Button>
      </div>

      <div className="rounded-xl border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Rota</TableHead>
              <TableHead className="w-[120px]">Prioridade</TableHead>
              <TableHead className="w-[140px]">Frequência</TableHead>
              <TableHead className="w-[100px] text-center">Status</TableHead>
              <TableHead className="w-[120px] text-center">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {adding && (
              <TableRow>
                <TableCell>
                  <Input
                    value={newRow.path}
                    onChange={(e) => setNewRow((r) => ({ ...r, path: e.target.value }))}
                    placeholder="/nova-rota"
                    className="h-8 text-xs font-mono"
                  />
                </TableCell>
                <TableCell>
                  <Select value={newRow.priority} onValueChange={(v) => setNewRow((r) => ({ ...r, priority: v }))}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PRIORITY_OPTIONS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Select value={newRow.changefreq} onValueChange={(v) => setNewRow((r) => ({ ...r, changefreq: v }))}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CHANGEFREQ_OPTIONS.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell />
                <TableCell>
                  <div className="flex items-center justify-center gap-1">
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600" onClick={() => addMutation.mutate()} disabled={!newRow.path.trim()}>
                      <Save className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setAdding(false)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )}
            {isLoading &&
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 5 }).map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))}
            {rows?.map((row) => {
              const isEditing = editingId === row.id;
              return (
                <TableRow key={row.id}>
                  <TableCell>
                    <Badge variant="secondary" className="font-mono text-xs">{row.path}</Badge>
                  </TableCell>
                  <TableCell>
                    {isEditing ? (
                      <Select value={editData.priority ?? row.priority} onValueChange={(v) => setEditData((d) => ({ ...d, priority: v }))}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {PRIORITY_OPTIONS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    ) : (
                      <span className="text-xs text-muted-foreground">{row.priority}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {isEditing ? (
                      <Select value={editData.changefreq ?? row.changefreq} onValueChange={(v) => setEditData((d) => ({ ...d, changefreq: v }))}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {CHANGEFREQ_OPTIONS.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    ) : (
                      <span className="text-xs text-muted-foreground">{row.changefreq}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Switch checked={row.active} onCheckedChange={(val) => toggleActive.mutate({ id: row.id, active: val })} />
                      <StatusBadge active={row.active} />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-1">
                      {isEditing ? (
                        <>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600" onClick={() => updateMutation.mutate({ id: row.id, ...editData })}>
                            <Save className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditingId(null)}>
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => startEdit(row)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Editar</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => deleteMutation.mutate(row.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Remover</TooltipContent>
                          </Tooltip>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export default function AdminPaginas() {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<PageRow>>({});
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: pages, isLoading } = useQuery({
    queryKey: ["admin_pages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pages")
        .select("*")
        .order("slug");
      if (error) throw error;
      return data as PageRow[];
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (row: Partial<PageRow> & { id: string }) => {
      const { id, ...rest } = row;
      const { error } = await supabase.from("pages").update(rest).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_pages"] });
      toast.success("Página atualizada!");
      setEditingId(null);
    },
    onError: () => toast.error("Erro ao salvar"),
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from("pages").update({ active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_pages"] });
      toast.success("Status atualizado!");
    },
  });

  const startEdit = (page: PageRow) => {
    setEditingId(page.id);
    setEditData({ meta_title: page.meta_title, meta_description: page.meta_description, og_image: page.og_image });
  };

  const saveEdit = () => {
    if (!editingId) return;
    updateMutation.mutate({ id: editingId, ...editData });
  };

  const validateDimensions = (file: File): Promise<{ width: number; height: number }> => {
    return new Promise((resolve) => {
      const img = new window.Image();
      img.onload = () => {
        resolve({ width: img.naturalWidth, height: img.naturalHeight });
        URL.revokeObjectURL(img.src);
      };
      img.onerror = () => {
        resolve({ width: 0, height: 0 });
        URL.revokeObjectURL(img.src);
      };
      img.src = URL.createObjectURL(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingId) return;
    const page = pages?.find((p) => p.id === editingId);
    if (!page) return;

    const { width, height } = await validateDimensions(file);
    if (width > 0 && (width !== 1200 || height !== 630)) {
      toast.warning(
        `Dimensões detectadas: ${width}×${height}px. O recomendado para OG Image é 1200×630px.`,
        { duration: 6000 }
      );
    }

    setUploading(true);
    try {
      const url = await uploadOgImage(file, page.slug);
      setEditData((d) => ({ ...d, og_image: url }));
      toast.success("Imagem enviada!");
    } catch {
      toast.error("Erro ao enviar imagem");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Páginas" subtitle="Gerencie as páginas públicas do site, status e SEO" />
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

      <Tabs defaultValue="seo" className="w-full">
        <TabsList className="bg-muted/50 flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="seo" className="gap-1.5 text-xs sm:text-sm">
            <FileText className="h-3.5 w-3.5" /> SEO
          </TabsTrigger>
          <TabsTrigger value="sitemap" className="gap-1.5 text-xs sm:text-sm">
            <Map className="h-3.5 w-3.5" /> Sitemap
          </TabsTrigger>
          <TabsTrigger value="bio" className="gap-1.5 text-xs sm:text-sm">
            <User className="h-3.5 w-3.5" /> Página Bio
          </TabsTrigger>
        </TabsList>

        <TabsContent value="seo" className="mt-6">
          <div className="rounded-xl border bg-card shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Meta Title</TableHead>
                  <TableHead>Meta Description</TableHead>
                  <TableHead>OG Image</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="w-[120px] text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading &&
                  Array.from({ length: 4 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 7 }).map((_, j) => (
                        <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>
                      ))}
                    </TableRow>
                  ))}
                {pages?.map((page) => {
                  const isEditing = editingId === page.id;
                  const currentOg = isEditing ? (editData.og_image ?? "") : page.og_image;
                  return (
                    <TableRow key={page.id}>
                      <TableCell className="font-medium">{page.title}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="font-mono text-xs">{page.slug}</Badge>
                      </TableCell>
                      <TableCell className="max-w-[200px]">
                        {isEditing ? (
                          <Input
                            value={editData.meta_title ?? ""}
                            onChange={(e) => setEditData((d) => ({ ...d, meta_title: e.target.value }))}
                            placeholder="Meta title"
                            className="h-8 text-xs"
                          />
                        ) : (
                          <span className="text-xs text-muted-foreground truncate block">
                            {page.meta_title || "—"}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="max-w-[250px]">
                        {isEditing ? (
                          <Textarea
                            value={editData.meta_description ?? ""}
                            onChange={(e) => setEditData((d) => ({ ...d, meta_description: e.target.value }))}
                            placeholder="Meta description"
                            className="text-xs min-h-[60px]"
                          />
                        ) : (
                          <span className="text-xs text-muted-foreground truncate block">
                            {page.meta_description || "—"}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="max-w-[180px]">
                        {isEditing ? (
                          <div className="space-y-2">
                            {currentOg ? (
                              <div className="relative group">
                                <img src={currentOg} alt="OG" className="h-16 w-auto rounded border object-cover" />
                                <Button
                                  size="icon"
                                  variant="destructive"
                                  className="absolute -top-2 -right-2 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={() => setEditData((d) => ({ ...d, og_image: "" }))}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            ) : null}
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs gap-1"
                              disabled={uploading}
                              onClick={() => fileRef.current?.click()}
                            >
                              <Upload className="h-3 w-3" />
                              {uploading ? "Enviando…" : "Upload"}
                            </Button>
                          </div>
                        ) : (
                          currentOg ? (
                            <img src={currentOg} alt="OG" className="h-10 w-auto rounded border object-cover" />
                          ) : (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Image className="h-3 w-3" /> —
                            </span>
                          )
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Switch
                            checked={page.active}
                            onCheckedChange={(val) => toggleActive.mutate({ id: page.id, active: val })}
                          />
                          <StatusBadge active={page.active} />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          {isEditing ? (
                            <>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600" onClick={saveEdit}>
                                    <Save className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Salvar</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditingId(null)}>
                                    <X className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Cancelar</TooltipContent>
                              </Tooltip>
                            </>
                          ) : (
                            <>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => startEdit(page)}>
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Editar SEO</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <a href={page.slug} target="_blank" rel="noopener noreferrer">
                                    <Button size="icon" variant="ghost" className="h-8 w-8">
                                      <ExternalLink className="h-4 w-4" />
                                    </Button>
                                  </a>
                                </TooltipTrigger>
                                <TooltipContent>Abrir página</TooltipContent>
                              </Tooltip>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="sitemap" className="mt-6">
          <SitemapTab />
        </TabsContent>

        <TabsContent value="bio" className="mt-6">
          <BioPageTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
