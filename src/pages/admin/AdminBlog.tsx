import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { ArrowLeft, Plus, Pencil, Trash2, Search, Bold, Italic, Heading2, List, Link2, Eye, ExternalLink, Code, Image, ListOrdered, Quote, Upload, X, Loader2, Undo2, Redo2, Sparkles, RefreshCw } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

type BlogPost = {
  id: string;
  title: string;
  slug: string;
  category: string;
  category_icon: string;
  image_url: string;
  excerpt: string;
  content: string;
  date_label: string;
  read_time: string;
  sort_order: number;
  active: boolean;
  created_at: string;
  author_first_name: string;
  author_last_name: string;
  author_instagram: string;
  author_avatar_url: string;
};

const emptyPost: Partial<BlogPost> = {
  title: "", slug: "", category: "", category_icon: "Globe", image_url: "",
  excerpt: "", content: "", date_label: "", read_time: "", sort_order: 0, active: true,
  author_first_name: "", author_last_name: "", author_instagram: "", author_avatar_url: "",
};

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const ICONS = ["Globe", "Shield", "Wifi", "Lock", "Newspaper", "Zap"];

function dateToInputValue(label: string): string {
  if (!label) return "";
  const months: Record<string, string> = { jan: "01", fev: "02", mar: "03", abr: "04", mai: "05", jun: "06", jul: "07", ago: "08", set: "09", out: "10", nov: "11", dez: "12" };
  // Try parsing "dd de mmm. de yyyy" or "dd mmm yyyy" patterns
  const clean = label.toLowerCase().replace(/\./g, "").replace(/ de /g, " ");
  const parts = clean.split(/\s+/);
  if (parts.length >= 3) {
    const day = parts[0].padStart(2, "0");
    const mon = months[parts[1].slice(0, 3)] || "01";
    const year = parts[parts.length - 1];
    if (year.length === 4) return `${year}-${mon}-${day}`;
  }
  return "";
}
const CATEGORIES = ["Tecnologia", "Segurança", "Internet", "Dicas", "Notícias", "Novidades"];

function CoverImageUpload({ imageUrl, onImageChange, title, slug, showAI = true }: { imageUrl: string; onImageChange: (url: string) => void; title?: string; slug?: string; showAI?: boolean }) {
  const [uploading, setUploading] = React.useState(false);
  const [aiGeneratingCover, setAiGeneratingCover] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  async function handleAIGenerate() {
    if (!title?.trim()) {
      toast.error("Preencha o título do artigo antes de gerar a capa com IA.");
      return;
    }
    setAiGeneratingCover(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-blog-cover", {
        body: { title, slug: slug || slugify(title || "") },
      });
      if (error) throw error;
      if (data?.url) {
        onImageChange(data.url);
        toast.success("Capa gerada com IA!");
      } else if (data?.error) {
        throw new Error(data.error);
      }
    } catch (err: any) {
      toast.error(err.message || "Erro ao gerar capa com IA");
    } finally {
      setAiGeneratingCover(false);
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const nameSlug = slug || slugify(title || "") || Date.now().toString();
      const path = `covers/jotazo-telecom-${nameSlug}-cover.${ext}`;
      const { error } = await supabase.storage.from("blog-images").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from("blog-images").getPublicUrl(path);
      onImageChange(publicUrl);
      toast.success("Imagem enviada!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao enviar imagem");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-2">
      <Label className="text-xs">Imagem de capa</Label>
      {imageUrl ? (
        <div className="relative group rounded-lg overflow-hidden">
          <img src={imageUrl} alt="Capa" className="w-full h-32 object-cover rounded-lg" />
          <button
            type="button"
            onClick={() => onImageChange("")}
            className="absolute top-1.5 right-1.5 rounded-full bg-destructive/80 p-1 text-white opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ) : (
        <div className={showAI ? "flex gap-2" : ""}>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading || aiGeneratingCover}
            className={`flex ${showAI ? "flex-1" : "w-full"} items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-muted/30 p-4 text-xs text-muted-foreground hover:border-primary/50 hover:bg-muted/50 transition-colors`}
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {uploading ? "Enviando..." : showAI ? "Upload" : "Clique para enviar imagem"}
          </button>
          {showAI && (
            <button
              type="button"
              onClick={handleAIGenerate}
              disabled={aiGeneratingCover || uploading}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg border-2 border-dashed border-primary/40 bg-primary/5 p-4 text-xs text-primary hover:border-primary hover:bg-primary/10 transition-colors"
            >
              {aiGeneratingCover ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {aiGeneratingCover ? "Gerando..." : "✨ Gerar com IA"}
            </button>
          )}
        </div>
      )}
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
    </div>
  );
}

export default function AdminBlog() {
  const qc = useQueryClient();
  const [view, setView] = React.useState<"list" | "editor">("list");
  const [form, setForm] = React.useState<Partial<BlogPost>>(emptyPost);
  const [search, setSearch] = React.useState("");
  const [filterCat, setFilterCat] = React.useState("all");
  const [filterStatus, setFilterStatus] = React.useState("all");
  const [showPreview, setShowPreview] = React.useState(false);
  const editorRef = React.useRef<HTMLDivElement>(null);
  const inlineImageRef = React.useRef<HTMLInputElement>(null);
  const [aiDialogOpen, setAiDialogOpen] = React.useState(false);
  const [aiInstructions, setAiInstructions] = React.useState("");
  const [aiGenerating, setAiGenerating] = React.useState(false);
  const [aiProgress, setAiProgress] = React.useState({ stage: "", percent: 0 });
  const [inlineUploading, setInlineUploading] = React.useState(false);
  const [selectionPopover, setSelectionPopover] = React.useState<{ open: boolean; x: number; y: number; html: string; range: Range | null }>({ open: false, x: 0, y: 0, html: "", range: null });
  const [regenInstructions, setRegenInstructions] = React.useState("");
  const [regenLoading, setRegenLoading] = React.useState(false);

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["admin-blog"],
    queryFn: async () => {
      const { data, error } = await supabase.from("blog_posts").select("*").order("sort_order");
      if (error) throw error;
      return data as unknown as BlogPost[];
    },
  });

  const save = useMutation({
    mutationFn: async (item: Partial<BlogPost>) => {
      if (!item.title?.trim()) throw new Error("Título é obrigatório");
      if (!item.slug?.trim()) throw new Error("Slug não foi gerado — verifique o título");
      const content = editorRef.current?.innerHTML || item.content || "";
      const payload = { ...item, content, slug: slugify(item.title!) };
      if (payload.id) {
        const { error } = await supabase.from("blog_posts").update(payload as any).eq("id", payload.id);
        if (error) throw error;
      } else {
        const { id, ...rest } = payload;
        const { error } = await supabase.from("blog_posts").insert(rest as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-blog"] });
      toast.success("Artigo salvo!");
      setView("list");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("blog_posts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-blog"] }); toast.success("Removido!"); },
    onError: (e: any) => toast.error(e.message),
  });

  const filtered = posts.filter((p) => {
    if (search && !p.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterCat !== "all" && p.category !== filterCat) return false;
    if (filterStatus === "active" && !p.active) return false;
    if (filterStatus === "inactive" && p.active) return false;
    return true;
  });

  const categories = [...new Set(posts.map((p) => p.category).filter(Boolean))];

  function openEditor(post?: BlogPost) {
    if (post) {
      setForm({ ...post });
      setTimeout(() => { if (editorRef.current) editorRef.current.innerHTML = post.content || ""; }, 50);
    } else {
      setForm({ ...emptyPost });
      setTimeout(() => { if (editorRef.current) editorRef.current.innerHTML = ""; }, 50);
    }
    setShowPreview(false);
    setView("editor");
  }

  function execCmd(cmd: string, value?: string) {
    document.execCommand(cmd, false, value);
    editorRef.current?.focus();
  }

  function insertLink() {
    const url = prompt("URL do link:");
    if (url) execCmd("createLink", url);
  }

  function insertImage() {
    inlineImageRef.current?.click();
  }

  async function handleInlineImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setInlineUploading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const nameSlug = form.slug || slugify(form.title || "") || Date.now().toString();
      const path = `inline/jotazo-telecom-${nameSlug}-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("blog-images").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from("blog-images").getPublicUrl(path);
      editorRef.current?.focus();
      document.execCommand("insertImage", false, publicUrl);
      toast.success("Imagem inserida!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao enviar imagem");
    } finally {
      setInlineUploading(false);
      if (inlineImageRef.current) inlineImageRef.current.value = "";
    }
  }

  async function uploadFileInline(file: File) {
    setInlineUploading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const nameSlug = form.slug || slugify(form.title || "") || Date.now().toString();
      const path = `inline/jotazo-telecom-${nameSlug}-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("blog-images").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from("blog-images").getPublicUrl(path);
      editorRef.current?.focus();
      document.execCommand("insertImage", false, publicUrl);
      toast.success("Imagem inserida!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao enviar imagem");
    } finally {
      setInlineUploading(false);
    }
  }

  function handleEditorDrop(e: React.DragEvent) {
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      e.preventDefault();
      uploadFileInline(file);
    }
  }

  const handleTitleChange = (title: string) => {
    setForm((f) => ({ ...f, title, slug: slugify(title) }));
  };

  async function handleAIGenerate() {
    if (!form.title?.trim()) {
      toast.error("Preencha o título do artigo antes de gerar com IA");
      return;
    }
    setAiGenerating(true);
    setAiProgress({ stage: "Preparando geração...", percent: 5 });

    const stages = [
      { stage: "Analisando título e palavras-chave...", percent: 10, delay: 2000 },
      { stage: "Gerando texto do artigo...", percent: 20, delay: 4000 },
      { stage: "Estruturando seções e SEO...", percent: 35, delay: 3000 },
      { stage: "Finalizando texto...", percent: 50, delay: 3000 },
      { stage: "Gerando imagem 1/3 com IA...", percent: 55, delay: 5000 },
      { stage: "Fazendo upload da imagem 1/3...", percent: 65, delay: 2000 },
      { stage: "Gerando imagem 2/3 com IA...", percent: 70, delay: 5000 },
      { stage: "Fazendo upload da imagem 2/3...", percent: 80, delay: 2000 },
      { stage: "Gerando imagem 3/3 com IA...", percent: 85, delay: 5000 },
      { stage: "Fazendo upload da imagem 3/3...", percent: 92, delay: 2000 },
      { stage: "Finalizando artigo...", percent: 96, delay: 3000 },
    ];

    let cancelled = false;
    const progressPromise = (async () => {
      for (const s of stages) {
        if (cancelled) break;
        await new Promise((r) => setTimeout(r, s.delay));
        if (!cancelled) setAiProgress({ stage: s.stage, percent: s.percent });
      }
    })();

    try {
      const { data, error } = await supabase.functions.invoke("generate-blog-article", {
        body: { title: form.title.trim(), instructions: aiInstructions.trim() || undefined, slug: form.slug },
      });
      cancelled = true;
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (data?.html) {
        setAiProgress({ stage: "Concluído!", percent: 100 });
        if (editorRef.current) editorRef.current.innerHTML = data.html;
        setForm((f) => ({
          ...f,
          content: data.html,
          excerpt: data.excerpt || f.excerpt,
          read_time: data.readTime || f.read_time,
        }));
        toast.success("Artigo gerado com sucesso!");
        setAiDialogOpen(false);
        setAiInstructions("");
      }
    } catch (err: any) {
      cancelled = true;
      toast.error(err.message || "Erro ao gerar artigo com IA");
    } finally {
      setAiGenerating(false);
      setAiProgress({ stage: "", percent: 0 });
    }
  }

  function handleEditorMouseUp() {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !editorRef.current) {
      return;
    }
    const range = sel.getRangeAt(0);
    // Check selection is inside editor
    if (!editorRef.current.contains(range.commonAncestorContainer)) return;
    const selectedText = sel.toString().trim();
    if (selectedText.length < 10) return;

    // Get selected HTML
    const fragment = range.cloneContents();
    const tempDiv = document.createElement("div");
    tempDiv.appendChild(fragment);
    const selectedHtml = tempDiv.innerHTML;

    // Position popup near selection
    const rect = range.getBoundingClientRect();
    const editorRect = editorRef.current.getBoundingClientRect();
    const x = rect.left - editorRect.left + rect.width / 2;
    const y = rect.top - editorRect.top - 8;

    setSelectionPopover({ open: true, x, y, html: selectedHtml, range });
    setRegenInstructions("");
  }

  async function handleRegenerateSection() {
    if (!selectionPopover.html || !selectionPopover.range) return;
    setRegenLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("regenerate-blog-section", {
        body: {
          selectedHtml: selectionPopover.html,
          instructions: regenInstructions.trim() || undefined,
          articleTitle: form.title?.trim() || undefined,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (data?.html) {
        // Replace the selected range with new HTML
        const range = selectionPopover.range;
        range.deleteContents();
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = data.html;
        const frag = document.createDocumentFragment();
        while (tempDiv.firstChild) {
          frag.appendChild(tempDiv.firstChild);
        }
        range.insertNode(frag);
        toast.success("Seção regenerada com sucesso!");
        setSelectionPopover({ open: false, x: 0, y: 0, html: "", range: null });
        setRegenInstructions("");
      }
    } catch (err: any) {
      toast.error(err.message || "Erro ao regenerar seção");
    } finally {
      setRegenLoading(false);
    }
  }

  // === LIST VIEW ===
  if (view === "list") {
    return (
      <div className="space-y-6">
        <AdminPageHeader title="Blog" subtitle="Gerencie os artigos do blog" onNew={() => openEditor()} newLabel="Novo Artigo" />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar por título..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={filterCat} onValueChange={setFilterCat}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Categoria" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-32"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="active">Ativos</SelectItem>
              <SelectItem value="inactive">Inativos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Carregando...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">Nenhum artigo encontrado.</div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((post) => (
              <div key={post.id} className={`group rounded-xl border border-border bg-card overflow-hidden shadow-sm hover:shadow-md transition-shadow ${!post.active ? "opacity-60" : ""}`}>
                {post.image_url && (
                  <div className="h-40 overflow-hidden relative">
                    <img src={post.image_url} alt={post.title} className="h-full w-full object-cover" />
                    {!post.active && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <span className="text-white text-xs font-bold uppercase tracking-wider bg-black/60 px-3 py-1 rounded">Rascunho</span>
                      </div>
                    )}
                  </div>
                )}
                <div className="p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    {post.category && (
                      <Badge variant="secondary" className="text-[10px]">{post.category}</Badge>
                    )}
                    <StatusBadge active={post.active} />
                  </div>
                  <h3 className="font-semibold text-sm leading-tight line-clamp-2">{post.title}</h3>
                  {post.excerpt && <p className="text-xs text-muted-foreground line-clamp-2">{post.excerpt}</p>}
                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <div className="flex items-center gap-1.5">
                      {post.author_avatar_url && (
                        <img src={post.author_avatar_url} alt="" className="h-4 w-4 rounded-full object-cover" />
                      )}
                      <span className="text-[10px] text-muted-foreground">
                        {post.author_first_name ? `${post.author_first_name} ${post.author_last_name}`.trim() : post.date_label}
                      </span>
                      {post.author_first_name && post.date_label && (
                        <span className="text-[10px] text-muted-foreground">· {post.date_label}</span>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                            <a href={`/blog/${post.slug}`} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Ver no site</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditor(post)}>
                            <Pencil className="h-3 w-3" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Editar</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { if (confirm("Remover artigo?")) remove.mutate(post.id); }}>
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Excluir</TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // === EDITOR VIEW ===
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => setView("list")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h2 className="text-lg font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            {form.id ? "Editar Artigo" : "Novo Artigo"}
          </h2>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setShowPreview(!showPreview)}>
          <Eye className="h-3.5 w-3.5" />
          {showPreview ? "Editor" : "Preview"}
        </Button>
        <Button
          size="sm"
          className="bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(218,80%,35%)] text-white"
          onClick={() => save.mutate(form)}
          disabled={save.isPending}
        >
          {save.isPending ? "Salvando..." : "Salvar"}
        </Button>
      </div>

      {showPreview ? (
        /* PREVIEW */
        <div className="rounded-xl border border-border bg-card p-6 max-w-3xl mx-auto space-y-6">
          {form.image_url && (
            <img src={form.image_url} alt={form.title} className="w-full h-64 object-cover rounded-xl" />
          )}
          {form.category && (
            <Badge className="bg-primary/90 text-primary-foreground">{form.category}</Badge>
          )}
          <h1 className="text-2xl font-bold">{form.title || "Sem título"}</h1>
          <div className="flex gap-4 text-xs text-muted-foreground">
            {form.date_label && <span>{form.date_label}</span>}
            {form.read_time && <span>{form.read_time} de leitura</span>}
          </div>
          {form.excerpt && <p className="text-muted-foreground italic border-l-4 border-primary/30 pl-4">{form.excerpt}</p>}
          <div
            className="prose prose-sm max-w-none dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: editorRef.current?.innerHTML || form.content || "" }}
          />
        </div>
      ) : (
        /* EDITOR */
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          {/* Main content */}
          <div className="space-y-4">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Título</Label>
              <Input value={form.title || ""} onChange={(e) => handleTitleChange(e.target.value)} placeholder="Título do artigo" className="text-lg font-semibold" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Slug <span className="text-[10px] text-muted-foreground/60">(gerado automaticamente do título)</span></Label>
              <Input value={form.slug || ""} readOnly className="font-mono text-xs bg-muted/50 cursor-not-allowed" />
              {form.title && !form.slug && <p className="text-[10px] text-destructive">Digite um título para gerar o slug.</p>}
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Conteúdo</Label>
              {/* Toolbar */}
              <div className="flex flex-wrap gap-0.5 rounded-t-lg border border-b-0 border-border bg-muted/50 p-1.5">
                {[
                  { icon: Undo2, cmd: () => execCmd("undo"), title: "Desfazer" },
                  { icon: Redo2, cmd: () => execCmd("redo"), title: "Refazer" },
                  null,
                  { icon: Bold, cmd: () => execCmd("bold"), title: "Negrito" },
                  { icon: Italic, cmd: () => execCmd("italic"), title: "Itálico" },
                  { icon: Heading2, cmd: () => execCmd("formatBlock", "h2"), title: "Subtítulo" },
                  { icon: Quote, cmd: () => execCmd("formatBlock", "blockquote"), title: "Citação" },
                  { icon: List, cmd: () => execCmd("insertUnorderedList"), title: "Lista" },
                  { icon: ListOrdered, cmd: () => execCmd("insertOrderedList"), title: "Lista numerada" },
                  { icon: Link2, cmd: insertLink, title: "Link" },
                  { icon: Image, cmd: insertImage, title: inlineUploading ? "Enviando..." : "Imagem" },
                  { icon: Code, cmd: () => execCmd("formatBlock", "pre"), title: "Código" },
                  null,
                  { icon: Sparkles, cmd: () => setAiDialogOpen(true), title: "Gerar com IA" },
                ].map((item, idx) => {
                  if (!item) return <div key={idx} className="w-px h-5 bg-border mx-1" />;
                  const { icon: Icon, cmd, title } = item;
                  const isAI = title === "Gerar com IA";
                  return (
                  <Tooltip key={title}>
                    <TooltipTrigger asChild>
                      <Button type="button" variant="ghost" size="icon" className={`h-7 w-7 ${isAI ? "text-primary hover:text-primary" : ""}`} onMouseDown={(e) => { e.preventDefault(); cmd(); }}>
                        <Icon className="h-3.5 w-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{title}</TooltipContent>
                  </Tooltip>
                  );
                })}
              </div>
              <input ref={inlineImageRef} type="file" accept="image/*" className="hidden" onChange={handleInlineImageUpload} />
              {inlineUploading && (
                <div className="flex items-center gap-2 px-3 py-1.5 text-xs text-muted-foreground bg-muted/50 border border-t-0 border-border">
                  <Loader2 className="h-3 w-3 animate-spin" /> Enviando imagem...
                </div>
              )}
              {/* Editor area wrapper (relative for popover positioning) */}
              <div className="relative">
                <div
                  ref={editorRef}
                  contentEditable
                  className="min-h-[400px] rounded-b-lg border border-border bg-background p-4 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-ring prose prose-sm max-w-none dark:prose-invert [&_img]:max-w-full [&_img]:rounded-lg"
                  onDrop={handleEditorDrop}
                  onDragOver={(e) => { if (e.dataTransfer.types.includes("Files")) e.preventDefault(); }}
                  onPaste={(e) => {
                    const items = e.clipboardData?.items;
                    if (!items) return;
                    for (const item of Array.from(items)) {
                      if (item.type.startsWith("image/")) {
                        e.preventDefault();
                        const file = item.getAsFile();
                        if (file) uploadFileInline(file);
                        return;
                      }
                    }
                  }}
                  onInput={() => {/* content is read from ref on save */}}
                  onMouseUp={handleEditorMouseUp}
                />

                {/* Selection Regeneration Popover */}
                {selectionPopover.open && (
                  <div
                    className="absolute z-50 w-80 rounded-xl border border-border bg-card shadow-xl p-4 space-y-3"
                    style={{
                      left: `${Math.max(0, Math.min(selectionPopover.x - 160, (editorRef.current?.offsetWidth || 400) - 320))}px`,
                      top: `${selectionPopover.y}px`,
                      transform: "translateY(-100%)",
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                        <Sparkles className="h-3.5 w-3.5" />
                        Regenerar seção com IA
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5"
                        onClick={() => setSelectionPopover({ open: false, x: 0, y: 0, html: "", range: null })}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="text-[10px] text-muted-foreground bg-muted/50 rounded-md p-2 max-h-16 overflow-hidden line-clamp-3">
                      {selectionPopover.html.replace(/<[^>]*>/g, "").slice(0, 150)}...
                    </div>
                    <Textarea
                      value={regenInstructions}
                      onChange={(e) => setRegenInstructions(e.target.value)}
                      placeholder="Ex: reescreva com foco em velocidade, adicione dados estatísticos..."
                      rows={2}
                      className="text-xs"
                      disabled={regenLoading}
                      onMouseDown={(e) => e.stopPropagation()}
                    />
                    {regenLoading && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Loader2 className="h-3 w-3 animate-spin text-primary" />
                        Regenerando...
                      </div>
                    )}
                    <Button
                      size="sm"
                      onClick={handleRegenerateSection}
                      disabled={regenLoading}
                      className="w-full gap-1.5 bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(218,80%,35%)] text-white text-xs"
                    >
                      {regenLoading ? (
                        <><Loader2 className="h-3 w-3 animate-spin" /> Regenerando...</>
                      ) : (
                        <><RefreshCw className="h-3 w-3" /> Regenerar Seção</>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-card p-4 space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Metadados</h3>
              <div className="space-y-1">
                <Label className="text-xs">Categoria</Label>
                <Select value={form.category || ""} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Ícone da categoria</Label>
                <Select value={form.category_icon || ""} onValueChange={(v) => setForm({ ...form, category_icon: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                  <SelectContent>
                    {ICONS.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <CoverImageUpload
                imageUrl={form.image_url || ""}
                onImageChange={(url) => setForm({ ...form, image_url: url })}
                title={form.title}
                slug={form.slug}
              />
              <div className="space-y-1">
                <Label className="text-xs">Data de publicação</Label>
                <Input
                  type="date"
                  value={dateToInputValue(form.date_label || "")}
                  onChange={(e) => {
                    const d = e.target.value;
                    if (!d) { setForm({ ...form, date_label: "" }); return; }
                    const formatted = new Date(d + "T12:00:00-03:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric", timeZone: "America/Sao_Paulo" });
                    setForm({ ...form, date_label: formatted });
                  }}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Tempo de leitura (minutos)</Label>
                <Input
                  type="number"
                  min={1}
                  value={parseInt(form.read_time || "0") || ""}
                  onChange={(e) => {
                    const v = e.target.value;
                    setForm({ ...form, read_time: v ? `${v} min` : "" });
                  }}
                  placeholder="5"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Ordem</Label>
                <Input type="number" value={form.sort_order ?? 0} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} />
              </div>
              <div className="flex items-center gap-2 pt-2">
                <Switch checked={form.active ?? true} onCheckedChange={(v) => setForm({ ...form, active: v })} />
                <Label className="text-xs">Ativo</Label>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-4 space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Autor</h3>
              <div className="space-y-1">
                <Label className="text-xs">Avatar</Label>
                {form.author_avatar_url ? (
                  <div className="flex items-center gap-3">
                    <div className="relative group">
                      <img src={form.author_avatar_url} alt="Avatar" className="h-14 w-14 rounded-full object-cover border border-border" />
                      <button type="button" onClick={() => setForm({ ...form, author_avatar_url: "" })} className="absolute -top-1 -right-1 rounded-full bg-destructive/80 p-0.5 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <CoverImageUpload
                    imageUrl=""
                    onImageChange={(url) => setForm({ ...form, author_avatar_url: url })}
                    showAI={false}
                  />
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Nome</Label>
                  <Input value={form.author_first_name || ""} onChange={(e) => setForm({ ...form, author_first_name: e.target.value })} placeholder="Nome" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Sobrenome</Label>
                  <Input value={form.author_last_name || ""} onChange={(e) => setForm({ ...form, author_last_name: e.target.value })} placeholder="Sobrenome" />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Instagram</Label>
                <Input value={form.author_instagram || ""} onChange={(e) => setForm({ ...form, author_instagram: e.target.value })} placeholder="@usuario" />
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-4 space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Resumo</h3>
              <Textarea value={form.excerpt || ""} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} rows={4} placeholder="Resumo curto do artigo..." />
            </div>
          </div>
        </div>
      )}

      {/* AI Generation Dialog */}
      <Dialog open={aiDialogOpen} onOpenChange={setAiDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Gerar artigo com IA
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Título do artigo</Label>
              <p className="text-sm font-medium">{form.title || "Sem título"}</p>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Instruções adicionais (opcional)</Label>
              <Textarea
                value={aiInstructions}
                onChange={(e) => setAiInstructions(e.target.value)}
                placeholder="Ex: foque em fibra óptica, mencione vantagens do 5G..."
                rows={3}
                disabled={aiGenerating}
              />
            </div>
            {aiGenerating && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
                  <Loader2 className="h-4 w-4 animate-spin text-primary flex-shrink-0" />
                  <span>{aiProgress.stage || "Preparando..."}</span>
                </div>
                <Progress value={aiProgress.percent} className="h-2" />
                <p className="text-xs text-muted-foreground text-center">{aiProgress.percent}%</p>
              </div>
            )}
            <Button
              onClick={handleAIGenerate}
              disabled={aiGenerating || !form.title?.trim()}
              className="w-full bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(218,80%,35%)] text-white gap-2"
            >
              {aiGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Gerar Artigo
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
