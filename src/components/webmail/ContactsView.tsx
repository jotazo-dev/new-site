import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Users, Plus, Search, Star, Tag, Mail, Phone, Building2, Trash2, Pencil,
  X, Folder, MoreVertical,
} from "lucide-react";
import { webmailApi } from "@/lib/webmail";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";

export type WmContact = {
  id?: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  notes: string;
  category: string;
  favorite: boolean;
  label_ids: string[];
  last_interaction_at?: string | null;
};

export type WmLabel = { id: string; name: string; color: string; sort_order: number };
export type WmCategory = { id: string; name: string; color: string; sort_order: number };

const EMPTY_CONTACT: WmContact = {
  name: "", email: "", phone: "", company: "", notes: "", category: "",
  favorite: false, label_ids: [],
};

const COLOR_PRESETS = ["#3b82f6", "#22c55e", "#f97316", "#ef4444", "#a855f7", "#eab308", "#06b6d4", "#64748b"];

function friendlyError(e: any) {
  const m = String(e?.message || e || "").toLowerCase();
  if (m.includes("unauthorized")) return "Sessão expirada. Faça login novamente.";
  if (m.includes("network") || m.includes("fetch")) return "Sem conexão com o servidor.";
  return e?.message || "Algo deu errado.";
}

export default function ContactsView({
  onCompose,
}: {
  onCompose: (to: string) => void;
}) {
  const [loading, setLoading] = useState(true);
  const [contacts, setContacts] = useState<WmContact[]>([]);
  const [labels, setLabels] = useState<WmLabel[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [categoryItems, setCategoryItems] = useState<WmCategory[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<{ kind: "all" | "favorites" | "category" | "label"; value?: string }>({ kind: "all" });

  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<WmContact>(EMPTY_CONTACT);

  const [labelsOpen, setLabelsOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const r = await webmailApi.contacts({ action: "list" });
      setContacts(r.contacts || []);
      setLabels(r.labels || []);
      setCategories(r.categories || []);
      setCategoryItems(r.categoryItems || []);
    } catch (e) {
      toast.error("Não foi possível carregar os contatos", { description: friendlyError(e) });
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    let list = contacts;
    if (filter.kind === "favorites") list = list.filter(c => c.favorite);
    else if (filter.kind === "category") list = list.filter(c => c.category === filter.value);
    else if (filter.kind === "label" && filter.value) list = list.filter(c => c.label_ids.includes(filter.value!));
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.company.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q),
      );
    }
    return list;
  }, [contacts, filter, query]);

  const labelById = useMemo(() => Object.fromEntries(labels.map(l => [l.id, l])), [labels]);

  function openNew() { setEditing(EMPTY_CONTACT); setEditorOpen(true); }
  function openEdit(c: WmContact) { setEditing({ ...c, label_ids: [...c.label_ids] }); setEditorOpen(true); }

  async function saveContact(c: WmContact) {
    try {
      await webmailApi.contacts({ action: "upsert", contact: c, label_ids: c.label_ids });
      toast.success(c.id ? "Contato atualizado" : "Contato criado");
      setEditorOpen(false);
      load();
    } catch (e) {
      toast.error("Não foi possível salvar", { description: friendlyError(e) });
    }
  }

  async function removeContact(id: string) {
    if (!confirm("Excluir este contato?")) return;
    try {
      await webmailApi.contacts({ action: "delete", id });
      toast.success("Contato excluído");
      load();
    } catch (e) {
      toast.error("Não foi possível excluir", { description: friendlyError(e) });
    }
  }

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Sidebar */}
      <aside className="hidden md:flex w-60 shrink-0 border-r flex-col">
        <div className="h-14 border-b flex items-center px-3 shrink-0">
          <span className="flex-1 text-sm font-semibold">Contatos</span>
        </div>
        <div className="p-3 flex flex-col gap-3 flex-1 min-h-0">
          <Button onClick={openNew} className="gap-2"><Plus className="w-4 h-4" /> Novo contato</Button>
          <ScrollArea className="flex-1">
            <div className="flex flex-col gap-0.5">
              <SideItem icon={Users} label="Todos" count={contacts.length}
                active={filter.kind === "all"} onClick={() => setFilter({ kind: "all" })} />
              <SideItem icon={Star} label="Favoritos" count={contacts.filter(c => c.favorite).length}
                active={filter.kind === "favorites"} onClick={() => setFilter({ kind: "favorites" })} />

              <SideTitle right={
                <button className="text-xs text-primary hover:underline" onClick={() => setCategoriesOpen(true)}>Gerenciar</button>
              }>Categorias</SideTitle>
              {categories.length === 0 && <p className="text-xs text-muted-foreground px-3 py-1">Nenhuma</p>}
              {categories.map(cat => {
                const item = categoryItems.find(ci => ci.name === cat);
                const color = item?.color || "#64748b";
                const active = filter.kind === "category" && filter.value === cat;
                return (
                  <button key={cat}
                    onClick={() => setFilter({ kind: "category", value: cat })}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition ${
                      active ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted"
                    }`}>
                    <Folder className="w-4 h-4 shrink-0" style={{ color }} />
                    <span className="flex-1 truncate">{cat}</span>
                    <span className="text-xs text-muted-foreground">
                      {contacts.filter(c => c.category === cat).length}
                    </span>
                  </button>
                );
              })}

              <SideTitle right={
                <button className="text-xs text-primary hover:underline" onClick={() => setLabelsOpen(true)}>Gerenciar</button>
              }>Etiquetas</SideTitle>
              {labels.length === 0 && <p className="text-xs text-muted-foreground px-3 py-1">Nenhuma</p>}
              {labels.map(l => (
                <button key={l.id}
                  onClick={() => setFilter({ kind: "label", value: l.id })}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition ${
                    filter.kind === "label" && filter.value === l.id ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted"
                  }`}>
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: l.color }} />
                  <span className="flex-1 truncate">{l.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {contacts.filter(c => c.label_ids.includes(l.id)).length}
                  </span>
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>
      </aside>

      {/* List */}
      <section className="flex-1 flex flex-col min-w-0">
        <div className="h-14 border-b flex items-center gap-2 px-3 shrink-0">
          <div className="relative flex-1 max-w-xl">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nome, e-mail, empresa…" className="pl-9 h-9" />
          </div>
          <Button onClick={openNew} size="sm" className="gap-2 md:hidden"><Plus className="w-4 h-4" /></Button>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4">
            {loading ? (
              <p className="text-sm text-muted-foreground">Carregando…</p>
            ) : filtered.length === 0 ? (
              <div className="h-[60vh] grid place-items-center text-center text-muted-foreground">
                <div>
                  <Users className="w-14 h-14 mx-auto mb-3 opacity-20" />
                  <p className="text-sm">{contacts.length === 0 ? "Nenhum contato ainda." : "Nenhum contato encontrado."}</p>
                  {contacts.length === 0 && (
                    <Button onClick={openNew} className="mt-4 gap-2"><Plus className="w-4 h-4" /> Adicionar contato</Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="grid gap-2">
                {filtered.map(c => (
                  <ContactRow key={c.id} contact={c} labels={c.label_ids.map(id => labelById[id]).filter(Boolean)}
                    onEdit={() => openEdit(c)}
                    onDelete={() => removeContact(c.id!)}
                    onEmail={() => onCompose(c.email)}
                  />
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </section>

      <ContactDialog
        open={editorOpen} onOpenChange={setEditorOpen}
        value={editing} labels={labels} categories={categories}
        onSave={saveContact}
      />
      <LabelsDialog
        open={labelsOpen} onOpenChange={setLabelsOpen}
        labels={labels} onChanged={load}
      />
      <CategoriesDialog
        open={categoriesOpen} onOpenChange={setCategoriesOpen}
        categoryItems={categoryItems} usedCounts={Object.fromEntries(categories.map(c => [c, contacts.filter(x => x.category === c).length]))}
        onChanged={load}
      />
    </div>
  );
}

function SideTitle({ children, right }: { children: any; right?: any }) {
  return (
    <div className="flex items-center mt-3 mb-1 px-3">
      <span className="text-[11px] uppercase tracking-wide font-semibold text-muted-foreground flex-1">{children}</span>
      {right}
    </div>
  );
}

function SideItem({ icon: Icon, label, count, active, onClick }:
  { icon: any; label: string; count: number; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-left transition ${
        active ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted"
      }`}>
      <Icon className="w-4 h-4 shrink-0" />
      <span className="flex-1 truncate">{label}</span>
      <span className="text-xs text-muted-foreground">{count}</span>
    </button>
  );
}

function ContactRow({ contact, labels, onEdit, onDelete, onEmail }: {
  contact: WmContact; labels: WmLabel[];
  onEdit: () => void; onDelete: () => void; onEmail: () => void;
}) {
  const initial = (contact.name || contact.email || "?").trim().charAt(0).toUpperCase();
  return (
    <div className="group flex items-center gap-3 p-3 rounded-xl border bg-card hover:bg-muted/40 transition cursor-pointer"
      onClick={onEdit}>
      <div className="w-10 h-10 rounded-full grid place-items-center bg-primary/10 text-primary font-semibold shrink-0">
        {initial}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium truncate">{contact.name || contact.email || "(sem nome)"}</span>
          {contact.favorite && <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400 shrink-0" />}
          {contact.category && <Badge variant="secondary" className="text-[10px]">{contact.category}</Badge>}
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground mt-0.5">
          {contact.email && <span className="flex items-center gap-1 truncate"><Mail className="w-3 h-3" />{contact.email}</span>}
          {contact.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{contact.phone}</span>}
          {contact.company && <span className="flex items-center gap-1 truncate"><Building2 className="w-3 h-3" />{contact.company}</span>}
        </div>
        {labels.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {labels.map(l => (
              <span key={l.id} className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full border"
                style={{ borderColor: l.color, color: l.color }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: l.color }} />
                {l.name}
              </span>
            ))}
          </div>
        )}
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={(e) => e.stopPropagation()}>
            <MoreVertical className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
          {contact.email && (
            <DropdownMenuItem onClick={onEmail}><Mail className="w-4 h-4 mr-2" /> Enviar e-mail</DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={onEdit}><Pencil className="w-4 h-4 mr-2" /> Editar</DropdownMenuItem>
          <DropdownMenuItem onClick={onDelete} className="text-destructive">
            <Trash2 className="w-4 h-4 mr-2" /> Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function ContactDialog({ open, onOpenChange, value, labels, categories, onSave }: {
  open: boolean; onOpenChange: (v: boolean) => void;
  value: WmContact; labels: WmLabel[]; categories: string[];
  onSave: (c: WmContact) => void;
}) {
  const [c, setC] = useState<WmContact>(value);
  useEffect(() => { setC(value); }, [value, open]);

  const toggleLabel = (id: string) => {
    setC(prev => ({ ...prev, label_ids: prev.label_ids.includes(id) ? prev.label_ids.filter(x => x !== id) : [...prev.label_ids, id] }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{c.id ? "Editar contato" : "Novo contato"}</DialogTitle>
          <DialogDescription>Informações do contato e organização por categoria/etiquetas.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Nome</Label><Input value={c.name} onChange={(e) => setC({ ...c, name: e.target.value })} /></div>
            <div><Label>E-mail</Label><Input type="email" value={c.email} onChange={(e) => setC({ ...c, email: e.target.value })} /></div>
            <div><Label>Telefone</Label><Input value={c.phone} onChange={(e) => setC({ ...c, phone: e.target.value })} /></div>
            <div><Label>Empresa</Label><Input value={c.company} onChange={(e) => setC({ ...c, company: e.target.value })} /></div>
          </div>
          <div>
            <Label>Categoria</Label>
            <Input list="wm-contact-categories" value={c.category}
              onChange={(e) => setC({ ...c, category: e.target.value })}
              placeholder="Ex.: Cliente, Fornecedor, Pessoal" />
            <datalist id="wm-contact-categories">
              {categories.map(cat => <option key={cat} value={cat} />)}
            </datalist>
          </div>
          <div>
            <Label>Etiquetas</Label>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {labels.length === 0 && <span className="text-xs text-muted-foreground">Crie etiquetas pelo botão "Gerenciar" na barra lateral.</span>}
              {labels.map(l => {
                const on = c.label_ids.includes(l.id);
                return (
                  <button key={l.id} type="button" onClick={() => toggleLabel(l.id)}
                    className={`inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full border transition ${
                      on ? "text-white" : "hover:bg-muted"
                    }`}
                    style={on ? { background: l.color, borderColor: l.color } : { borderColor: l.color, color: l.color }}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: on ? "#fff" : l.color }} />
                    {l.name}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <Label>Notas</Label>
            <Textarea rows={3} value={c.notes} onChange={(e) => setC({ ...c, notes: e.target.value })} />
          </div>
          <div className="flex items-center gap-2">
            <Switch id="fav" checked={c.favorite} onCheckedChange={(v) => setC({ ...c, favorite: v })} />
            <Label htmlFor="fav" className="cursor-pointer">Marcar como favorito</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={() => onSave(c)}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function LabelsDialog({ open, onOpenChange, labels, onChanged }: {
  open: boolean; onOpenChange: (v: boolean) => void;
  labels: WmLabel[]; onChanged: () => void;
}) {
  const [name, setName] = useState("");
  const [color, setColor] = useState(COLOR_PRESETS[0]);
  const [busy, setBusy] = useState(false);

  async function addLabel() {
    if (!name.trim()) return;
    setBusy(true);
    try {
      await webmailApi.contacts({ action: "label.upsert", label: { name: name.trim(), color } });
      setName(""); setColor(COLOR_PRESETS[0]);
      onChanged();
    } catch (e) {
      toast.error("Não foi possível criar a etiqueta", { description: friendlyError(e) });
    } finally { setBusy(false); }
  }

  async function removeLabel(id: string) {
    if (!confirm("Excluir esta etiqueta?")) return;
    try {
      await webmailApi.contacts({ action: "label.delete", id });
      onChanged();
    } catch (e) {
      toast.error("Não foi possível excluir", { description: friendlyError(e) });
    }
  }

  async function renameLabel(l: WmLabel, newName: string, newColor: string) {
    try {
      await webmailApi.contacts({ action: "label.upsert", label: { id: l.id, name: newName, color: newColor } });
      onChanged();
    } catch (e) {
      toast.error("Não foi possível atualizar", { description: friendlyError(e) });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Tag className="w-4 h-4" /> Etiquetas</DialogTitle>
          <DialogDescription>Crie e edite etiquetas para organizar seus contatos.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Label>Nova etiqueta</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: VIP, Lead, Família…" />
            </div>
            <ColorPicker value={color} onChange={setColor} />
            <Button onClick={addLabel} disabled={busy || !name.trim()}>Adicionar</Button>
          </div>

          <div className="divide-y border rounded-lg max-h-72 overflow-auto">
            {labels.length === 0 && <p className="p-3 text-sm text-muted-foreground">Nenhuma etiqueta criada.</p>}
            {labels.map(l => (
              <LabelEditableRow key={l.id} label={l} onSave={renameLabel} onDelete={() => removeLabel(l.id)} />
            ))}
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function LabelEditableRow({ label, onSave, onDelete }: {
  label: WmLabel; onSave: (l: WmLabel, name: string, color: string) => void; onDelete: () => void;
}) {
  const [name, setName] = useState(label.name);
  const [color, setColor] = useState(label.color);
  const dirty = name !== label.name || color !== label.color;
  return (
    <div className="flex items-center gap-2 p-2">
      <ColorPicker value={color} onChange={setColor} />
      <Input value={name} onChange={(e) => setName(e.target.value)} className="h-8" />
      {dirty && <Button size="sm" onClick={() => onSave(label, name, color)}>Salvar</Button>}
      <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={onDelete}>
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  );
}

function ColorPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen(o => !o)}
        className="w-8 h-8 rounded-md border" style={{ background: value }} aria-label="Cor" />
      {open && (
        <div className="absolute z-50 top-full mt-1 right-0 bg-popover border rounded-lg p-2 grid grid-cols-4 gap-1 shadow-lg">
          {COLOR_PRESETS.map(c => (
            <button key={c} type="button" onClick={() => { onChange(c); setOpen(false); }}
              className="w-6 h-6 rounded" style={{ background: c, outline: c === value ? "2px solid hsl(var(--ring))" : undefined }} />
          ))}
        </div>
      )}
    </div>
  );
}

function CategoriesDialog({ open, onOpenChange, categoryItems, usedCounts, onChanged }: {
  open: boolean; onOpenChange: (v: boolean) => void;
  categoryItems: WmCategory[]; usedCounts: Record<string, number>; onChanged: () => void;
}) {
  const [name, setName] = useState("");
  const [color, setColor] = useState(COLOR_PRESETS[7]);
  const [busy, setBusy] = useState(false);

  async function addCategory() {
    if (!name.trim()) return;
    setBusy(true);
    try {
      await webmailApi.contacts({ action: "category.upsert", category: { name: name.trim(), color } });
      setName(""); setColor(COLOR_PRESETS[7]);
      onChanged();
    } catch (e) {
      toast.error("Não foi possível criar a categoria", { description: friendlyError(e) });
    } finally { setBusy(false); }
  }

  async function removeCategory(c: WmCategory) {
    const used = usedCounts[c.name] || 0;
    const msg = used > 0
      ? `Excluir "${c.name}"? ${used} contato(s) ficarão sem categoria.`
      : `Excluir a categoria "${c.name}"?`;
    if (!confirm(msg)) return;
    try {
      await webmailApi.contacts({ action: "category.delete", id: c.id });
      onChanged();
    } catch (e) {
      toast.error("Não foi possível excluir", { description: friendlyError(e) });
    }
  }

  async function saveCategory(c: WmCategory, newName: string, newColor: string) {
    try {
      await webmailApi.contacts({ action: "category.upsert", category: { id: c.id, name: newName, color: newColor } });
      onChanged();
    } catch (e) {
      toast.error("Não foi possível atualizar", { description: friendlyError(e) });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Folder className="w-4 h-4" /> Categorias</DialogTitle>
          <DialogDescription>Crie listas e categorias para agrupar contatos (ex.: Clientes, Fornecedores, Família).</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Label>Nova categoria</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Clientes, Fornecedor…"
                onKeyDown={(e) => { if (e.key === "Enter") addCategory(); }} />
            </div>
            <ColorPicker value={color} onChange={setColor} />
            <Button onClick={addCategory} disabled={busy || !name.trim()}>Adicionar</Button>
          </div>

          <div className="divide-y border rounded-lg max-h-72 overflow-auto">
            {categoryItems.length === 0 && <p className="p-3 text-sm text-muted-foreground">Nenhuma categoria criada.</p>}
            {categoryItems.map(c => (
              <CategoryEditableRow key={c.id} category={c} used={usedCounts[c.name] || 0}
                onSave={saveCategory} onDelete={() => removeCategory(c)} />
            ))}
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CategoryEditableRow({ category, used, onSave, onDelete }: {
  category: WmCategory; used: number;
  onSave: (c: WmCategory, name: string, color: string) => void; onDelete: () => void;
}) {
  const [name, setName] = useState(category.name);
  const [color, setColor] = useState(category.color);
  const dirty = name !== category.name || color !== category.color;
  return (
    <div className="flex items-center gap-2 p-2">
      <ColorPicker value={color} onChange={setColor} />
      <Input value={name} onChange={(e) => setName(e.target.value)} className="h-8" />
      <span className="text-xs text-muted-foreground tabular-nums shrink-0 w-10 text-right">{used}</span>
      {dirty && <Button size="sm" onClick={() => onSave(category, name, color)}>Salvar</Button>}
      <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={onDelete}>
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  );
}
