import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Loader2, Plus, Pencil, Trash2, Lock } from "lucide-react";
import { ADMIN_SECTIONS, ROLE_COLORS, ROLE_COLOR_OPTIONS } from "@/config/adminSections";
import { useCustomRoles, type CustomRole } from "@/hooks/useCustomRoles";

type PermMap = Record<string, Record<string, boolean>>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function PermissionsDialog({ open, onOpenChange }: Props) {
  const qc = useQueryClient();
  const { data: roles, isLoading: rolesLoading } = useCustomRoles();

  // ----- Permissions matrix -----
  const { data: perms, isLoading: permsLoading } = useQuery({
    queryKey: ["role_permissions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("role_permissions")
        .select("role_slug, section, allowed");
      if (error) throw error;
      const map: PermMap = {};
      for (const row of data || []) {
        const slug = row.role_slug as string;
        if (!slug) continue;
        if (!map[slug]) map[slug] = {};
        map[slug][row.section] = row.allowed;
      }
      return map;
    },
    enabled: open,
  });

  const [localPerms, setLocalPerms] = useState<PermMap | null>(null);
  const [permsDirty, setPermsDirty] = useState(false);
  const displayPerms = localPerms ?? perms ?? {};

  const togglePerm = (slug: string, section: string) => {
    if (slug === "admin") return;
    const next: PermMap = { ...displayPerms };
    next[slug] = { ...(next[slug] || {}), [section]: !next[slug]?.[section] };
    setLocalPerms(next);
    setPermsDirty(true);
  };

  const savePerms = useMutation({
    mutationFn: async () => {
      if (!localPerms || !roles) return;
      const editable = roles.filter((r) => r.slug !== "admin");
      // Upsert each (role_slug, section)
      for (const role of editable) {
        for (const s of ADMIN_SECTIONS) {
          const allowed = localPerms[role.slug]?.[s.key] ?? false;
          // Try update first
          const { data: existing } = await supabase
            .from("role_permissions")
            .select("id")
            .eq("role_slug", role.slug)
            .eq("section", s.key)
            .maybeSingle();
          if (existing) {
            const { error } = await supabase
              .from("role_permissions")
              .update({ allowed })
              .eq("id", existing.id);
            if (error) throw error;
          } else {
            // Insert with enum fallback ('user' for custom roles)
            const enumRole = (["admin", "moderator", "user"].includes(role.slug)
              ? role.slug
              : "user") as "admin" | "moderator" | "user";
            const { error } = await supabase
              .from("role_permissions")
              .insert({ role: enumRole, role_slug: role.slug, section: s.key, allowed });
            if (error) throw error;
          }
        }
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["role_permissions"] });
      qc.invalidateQueries({ queryKey: ["role_permissions_v2"] });
      toast({ title: "Permissões salvas com sucesso" });
      setPermsDirty(false);
      setLocalPerms(null);
    },
    onError: (e: Error) => {
      toast({ title: "Erro ao salvar permissões", description: e.message, variant: "destructive" });
    },
  });

  // ----- Roles management -----
  const [editingRole, setEditingRole] = useState<CustomRole | null>(null);
  const [showRoleForm, setShowRoleForm] = useState(false);
  const [formLabel, setFormLabel] = useState("");
  const [formSlug, setFormSlug] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formColor, setFormColor] = useState("blue");
  const [slugTouched, setSlugTouched] = useState(false);
  const [deleteRole, setDeleteRole] = useState<CustomRole | null>(null);

  useEffect(() => {
    if (!showRoleForm) {
      setFormLabel(""); setFormSlug(""); setFormDescription(""); setFormColor("blue"); setSlugTouched(false);
      setEditingRole(null);
    }
  }, [showRoleForm]);

  const openEdit = (r: CustomRole) => {
    setEditingRole(r);
    setFormLabel(r.label);
    setFormSlug(r.slug);
    setFormDescription(r.description);
    setFormColor(r.color);
    setSlugTouched(true);
    setShowRoleForm(true);
  };

  const saveRole = useMutation({
    mutationFn: async () => {
      const slug = (formSlug || slugify(formLabel)).trim();
      if (!formLabel.trim()) throw new Error("Informe o nome");
      if (!slug) throw new Error("Slug inválido");
      const payload = {
        label: formLabel.trim(),
        slug,
        description: formDescription.trim(),
        color: formColor,
      };
      if (editingRole) {
        // System roles: only allow editing label/description/color, not slug
        const update = editingRole.is_system
          ? { label: payload.label, description: payload.description, color: payload.color }
          : payload;
        const { error } = await supabase.from("custom_roles").update(update).eq("id", editingRole.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("custom_roles").insert({ ...payload, is_system: false });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["custom_roles"] });
      qc.invalidateQueries({ queryKey: ["role_permissions"] });
      toast({ title: editingRole ? "Nível atualizado" : "Nível criado" });
      setShowRoleForm(false);
    },
    onError: (e: Error) => {
      toast({ title: "Erro ao salvar nível", description: e.message, variant: "destructive" });
    },
  });

  const deleteRoleMutation = useMutation({
    mutationFn: async () => {
      if (!deleteRole) return;
      // Check if any user uses this slug
      const { data: count } = await supabase.rpc("count_users_by_role_slug", { _slug: deleteRole.slug });
      if ((count as unknown as number) > 0) {
        throw new Error(`Existem ${count} usuário(s) usando este nível. Reatribua antes de excluir.`);
      }
      // Delete permissions first
      await supabase.from("role_permissions").delete().eq("role_slug", deleteRole.slug);
      const { error } = await supabase.from("custom_roles").delete().eq("id", deleteRole.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["custom_roles"] });
      qc.invalidateQueries({ queryKey: ["role_permissions"] });
      toast({ title: "Nível excluído" });
      setDeleteRole(null);
    },
    onError: (e: Error) => {
      toast({ title: "Erro ao excluir", description: e.message, variant: "destructive" });
      setDeleteRole(null);
    },
  });

  const handleClose = (o: boolean) => {
    if (!o) {
      setLocalPerms(null);
      setPermsDirty(false);
      setShowRoleForm(false);
      setEditingRole(null);
    }
    onOpenChange(o);
  };

  const editableRoles = useMemo(() => (roles || []).filter((r) => r.slug !== "admin"), [roles]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Níveis & Permissões</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="permissions" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="self-start">
            <TabsTrigger value="permissions">Permissões</TabsTrigger>
            <TabsTrigger value="roles">Níveis</TabsTrigger>
          </TabsList>

          {/* PERMISSIONS MATRIX */}
          <TabsContent value="permissions" className="flex-1 overflow-auto mt-3">
            {permsLoading || rolesLoading ? (
              <div className="space-y-2 py-2">
                {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-9 w-full" />)}
              </div>
            ) : (
              <div className="overflow-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-background z-10">
                    <tr className="border-b">
                      <th className="text-left py-2 px-3 font-medium text-muted-foreground">Seção</th>
                      {(roles || []).map((r) => (
                        <th key={r.slug} className="text-center py-2 px-3 font-medium text-muted-foreground whitespace-nowrap">
                          <Badge variant="outline" className={ROLE_COLORS[r.color] || ROLE_COLORS.blue}>
                            {r.label}
                          </Badge>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {ADMIN_SECTIONS.map((s) => (
                      <tr key={s.key} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                        <td className="py-2.5 px-3 font-medium">{s.label}</td>
                        {(roles || []).map((r) => (
                          <td key={r.slug} className="text-center py-2.5 px-3">
                            {r.slug === "admin" ? (
                              <Checkbox checked disabled className="opacity-50" />
                            ) : (
                              <Checkbox
                                checked={displayPerms?.[r.slug]?.[s.key] ?? false}
                                onCheckedChange={() => togglePerm(r.slug, s.key)}
                              />
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="flex justify-end gap-2 pt-3 sticky bottom-0 bg-background border-t mt-3">
              <Button variant="outline" onClick={() => handleClose(false)}>Cancelar</Button>
              <Button onClick={() => savePerms.mutate()} disabled={!permsDirty || savePerms.isPending}>
                {savePerms.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                Salvar Permissões
              </Button>
            </div>
          </TabsContent>

          {/* ROLES MANAGEMENT */}
          <TabsContent value="roles" className="flex-1 overflow-auto mt-3 space-y-3">
            {!showRoleForm ? (
              <>
                <div className="flex justify-between items-center">
                  <p className="text-sm text-muted-foreground">
                    Crie níveis personalizados (ex: Vendedor, Suporte) e edite os níveis padrão.
                  </p>
                  <Button size="sm" onClick={() => setShowRoleForm(true)}>
                    <Plus className="h-4 w-4 mr-1" /> Novo Nível
                  </Button>
                </div>
                <div className="rounded-lg border divide-y">
                  {(roles || []).map((r) => (
                    <div key={r.id} className="flex items-center justify-between p-3 hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className={ROLE_COLORS[r.color] || ROLE_COLORS.blue}>
                          {r.label}
                        </Badge>
                        <div>
                          <div className="text-sm font-medium flex items-center gap-2">
                            {r.slug}
                            {r.is_system && (
                              <span className="inline-flex items-center text-[10px] uppercase tracking-wider text-muted-foreground gap-1">
                                <Lock className="h-3 w-3" /> Sistema
                              </span>
                            )}
                          </div>
                          {r.description && (
                            <div className="text-xs text-muted-foreground">{r.description}</div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(r)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {!r.is_system && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => setDeleteRole(r)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                  {!rolesLoading && (roles || []).length === 0 && (
                    <div className="p-6 text-center text-sm text-muted-foreground">Nenhum nível cadastrado</div>
                  )}
                </div>
              </>
            ) : (
              <div className="space-y-4 max-w-md">
                <h3 className="font-semibold">{editingRole ? `Editar: ${editingRole.label}` : "Novo Nível"}</h3>
                <div className="space-y-2">
                  <Label>Nome</Label>
                  <Input
                    value={formLabel}
                    placeholder="Ex: Vendedor"
                    onChange={(e) => {
                      setFormLabel(e.target.value);
                      if (!slugTouched) setFormSlug(slugify(e.target.value));
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Slug (identificador único)</Label>
                  <Input
                    value={formSlug}
                    placeholder="ex: vendedor"
                    disabled={editingRole?.is_system}
                    onChange={(e) => {
                      setSlugTouched(true);
                      setFormSlug(slugify(e.target.value));
                    }}
                  />
                  {editingRole?.is_system && (
                    <p className="text-xs text-muted-foreground">Slug de níveis do sistema não pode ser alterado.</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Input
                    value={formDescription}
                    placeholder="Opcional"
                    onChange={(e) => setFormDescription(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Cor do badge</Label>
                  <Select value={formColor} onValueChange={setFormColor}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLE_COLOR_OPTIONS.map((c) => (
                        <SelectItem key={c} value={c}>
                          <span className="flex items-center gap-2">
                            <Badge variant="outline" className={ROLE_COLORS[c]}>{c}</Badge>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={() => setShowRoleForm(false)}>Cancelar</Button>
                  <Button onClick={() => saveRole.mutate()} disabled={saveRole.isPending}>
                    {saveRole.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                    {editingRole ? "Salvar" : "Criar"}
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <AlertDialog open={!!deleteRole} onOpenChange={(o) => { if (!o) setDeleteRole(null); }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir nível</AlertDialogTitle>
              <AlertDialogDescription>
                Excluir o nível <strong>{deleteRole?.label}</strong>? Suas permissões serão removidas. Usuários atribuídos a este nível bloqueiam a exclusão.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => deleteRoleMutation.mutate()}
                disabled={deleteRoleMutation.isPending}
              >
                {deleteRoleMutation.isPending ? "Excluindo..." : "Excluir"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  );
}
