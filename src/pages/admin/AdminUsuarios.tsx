import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCustomRoles } from "@/hooks/useCustomRoles";
import { ROLE_COLORS } from "@/config/adminSections";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { PermissionsDialog } from "@/components/admin/PermissionsDialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { Eye, EyeOff, Search, Shield, Trash2, KeyRound, UserCog } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AvatarUpload } from "@/components/admin/AvatarUpload";
import { UserProfileDialog } from "@/components/admin/UserProfileDialog";

export default function AdminUsuarios() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: roles } = useCustomRoles();

  const [changing, setChanging] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("user");
  const [newFirstName, setNewFirstName] = useState("");
  const [newLastName, setNewLastName] = useState("");
  const [newAvatarUrl, setNewAvatarUrl] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const [deleteTarget, setDeleteTarget] = useState<{ id: string; email: string } | null>(null);
  const [permDialogOpen, setPermDialogOpen] = useState(false);

  const [pwTarget, setPwTarget] = useState<{ id: string; email: string } | null>(null);
  const [pwValue, setPwValue] = useState("");
  const [pwShow, setPwShow] = useState(false);

  type AdminUser = { id: string; email: string; created_at: string; role: string; role_slug: string; first_name: string | null; last_name: string | null; avatar_url: string | null };
  const [profileTarget, setProfileTarget] = useState<AdminUser | null>(null);

  const { data: users, isLoading } = useQuery({
    queryKey: ["admin_users"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_admin_users");
      if (error) throw error;
      return (data || []) as unknown as AdminUser[];
    },
  });

  const roleBySlug = useMemo(() => {
    const map: Record<string, { label: string; color: string }> = {};
    for (const r of roles || []) map[r.slug] = { label: r.label, color: r.color };
    return map;
  }, [roles]);

  function roleBadge(slug: string) {
    const r = roleBySlug[slug] || { label: slug, color: "blue" };
    return <Badge variant="outline" className={ROLE_COLORS[r.color] || ROLE_COLORS.blue}>{r.label}</Badge>;
  }

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    return users.filter((u) => {
      const matchesSearch = !searchTerm || u.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = roleFilter === "all" || u.role_slug === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, searchTerm, roleFilter]);

  const roleMutation = useMutation({
    mutationFn: async ({ userId, slug }: { userId: string; slug: string }) => {
      const { error } = await supabase.rpc("set_user_role_slug", {
        _target_user_id: userId,
        _new_slug: slug,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin_users"] });
      toast({ title: "Nível atualizado com sucesso" });
      setChanging(null);
    },
    onError: (e: Error) => {
      toast({ title: "Erro ao atualizar nível", description: e.message, variant: "destructive" });
      setChanging(null);
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await supabase.functions.invoke("create-user", {
        body: {
          email: newEmail.trim(),
          password: newPassword,
          role_slug: newRole,
          first_name: newFirstName.trim() || null,
          last_name: newLastName.trim() || null,
          avatar_url: newAvatarUrl,
        },
      });
      if (res.error) throw new Error(res.error.message);
      if (res.data?.error) throw new Error(res.data.error);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin_users"] });
      toast({ title: "Usuário criado com sucesso" });
      resetDialog();
    },
    onError: (e: Error) => {
      toast({ title: "Erro ao criar usuário", description: e.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await supabase.functions.invoke("delete-user", {
        body: { user_id: userId },
      });
      if (res.error) throw new Error(res.error.message);
      if (res.data?.error) throw new Error(res.data.error);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin_users"] });
      toast({ title: "Usuário excluído com sucesso" });
      setDeleteTarget(null);
    },
    onError: (e: Error) => {
      toast({ title: "Erro ao excluir usuário", description: e.message, variant: "destructive" });
      setDeleteTarget(null);
    },
  });

  const passwordMutation = useMutation({
    mutationFn: async ({ userId, password }: { userId: string; password: string }) => {
      const res = await supabase.functions.invoke("update-user-password", {
        body: { user_id: userId, password },
      });
      if (res.error) throw new Error(res.error.message);
      if (res.data?.error) throw new Error(res.data.error);
    },
    onSuccess: () => {
      toast({ title: "Senha alterada com sucesso" });
      setPwTarget(null);
      setPwValue("");
      setPwShow(false);
    },
    onError: (e: Error) => {
      toast({ title: "Erro ao alterar senha", description: e.message, variant: "destructive" });
    },
  });

  const resetDialog = () => {
    setDialogOpen(false);
    setNewEmail("");
    setNewPassword("");
    setNewRole("user");
    setNewFirstName("");
    setNewLastName("");
    setNewAvatarUrl(null);
    setShowPassword(false);
  };

  const handleRoleChange = (userId: string, slug: string) => {
    if (userId === user?.id) {
      toast({ title: "Você não pode alterar seu próprio nível", variant: "destructive" });
      return;
    }
    setChanging(userId);
    roleMutation.mutate({ userId, slug });
  };

  const handleCreate = () => {
    if (!newEmail.trim()) {
      toast({ title: "Informe o email", variant: "destructive" });
      return;
    }
    if (newPassword.length < 6) {
      toast({ title: "A senha deve ter pelo menos 6 caracteres", variant: "destructive" });
      return;
    }
    createMutation.mutate();
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Usuários"
        subtitle="Gerencie os usuários e seus níveis de permissão"
        onNew={() => setDialogOpen(true)}
        newLabel="Novo Usuário"
        extraActions={
          <Button
            variant="outline"
            onClick={() => setPermDialogOpen(true)}
            className="border-primary/30 text-primary hover:bg-primary/10"
          >
            <Shield className="h-4 w-4 mr-1" /> Níveis & Permissões
          </Button>
        }
      />

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Filtrar por nível" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {(roles || []).map((r) => (
              <SelectItem key={r.slug} value={r.slug}>{r.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-xl border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuário</TableHead>
              <TableHead>Nível</TableHead>
              <TableHead>Criado em</TableHead>
              <TableHead className="w-[200px]">Alterar Nível</TableHead>
              <TableHead className="w-[60px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                </TableRow>
              ))}
            {filteredUsers.map((u) => {
              const fullName = [u.first_name, u.last_name].filter(Boolean).join(" ");
              const initials = (u.first_name?.[0] || u.email?.[0] || "?").toUpperCase()
                + (u.last_name?.[0] ? u.last_name[0].toUpperCase() : "");
              return (
                <TableRow key={u.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        {u.avatar_url ? <AvatarImage src={u.avatar_url} alt={fullName || u.email} /> : null}
                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                          {initials.slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="font-medium leading-tight truncate">
                          {fullName || <span className="text-muted-foreground italic">Sem nome</span>}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">{u.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{roleBadge(u.role_slug)}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(u.created_at).toLocaleDateString("pt-BR")}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={u.role_slug}
                      onValueChange={(v) => handleRoleChange(u.id, v)}
                      disabled={u.id === user?.id || changing === u.id}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(roles || []).map((r) => (
                          <SelectItem key={r.slug} value={r.slug}>{r.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-primary"
                      title="Editar perfil (nome e foto)"
                      onClick={() => setProfileTarget(u)}
                    >
                      <UserCog className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-primary"
                      title="Alterar senha"
                      onClick={() => { setPwTarget({ id: u.id, email: u.email }); setPwValue(""); setPwShow(false); }}
                    >
                      <KeyRound className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      disabled={u.id === user?.id}
                      onClick={() => setDeleteTarget({ id: u.id, email: u.email })}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
            {!isLoading && filteredUsers.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  {users?.length ? "Nenhum usuário encontrado com os filtros aplicados" : "Nenhum usuário encontrado"}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={(o) => { if (!o) resetDialog(); else setDialogOpen(true); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Usuário</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-xs text-muted-foreground mb-2 block">Foto de perfil</Label>
              <AvatarUpload
                userId={`new-user-${user?.id || "admin"}`}
                value={newAvatarUrl}
                onChange={setNewAvatarUrl}
                fallback={(newFirstName?.[0] || newEmail?.[0] || "?").toUpperCase()}
                size="md"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="new-first">Primeiro nome</Label>
                <Input
                  id="new-first"
                  value={newFirstName}
                  onChange={(e) => setNewFirstName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="new-last">Sobrenome</Label>
                <Input
                  id="new-last"
                  value={newLastName}
                  onChange={(e) => setNewLastName(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-email">Email</Label>
              <Input
                id="new-email"
                type="email"
                placeholder="usuario@exemplo.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">Senha</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Mínimo 6 caracteres"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Nível</Label>
              <Select value={newRole} onValueChange={setNewRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(roles || []).map((r) => (
                    <SelectItem key={r.slug} value={r.slug}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetDialog}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending ? "Criando..." : "Criar Usuário"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir usuário</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir <strong>{deleteTarget?.email}</strong>? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <PermissionsDialog open={permDialogOpen} onOpenChange={setPermDialogOpen} />

      <UserProfileDialog
        open={!!profileTarget}
        onOpenChange={(o) => { if (!o) setProfileTarget(null); }}
        user={profileTarget}
      />

      <Dialog open={!!pwTarget} onOpenChange={(o) => { if (!o) { setPwTarget(null); setPwValue(""); setPwShow(false); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Alterar senha</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Usuário: <strong className="text-foreground">{pwTarget?.email}</strong>
            </p>
            <div className="space-y-2">
              <Label htmlFor="pw-new">Nova senha</Label>
              <div className="relative">
                <Input
                  id="pw-new"
                  type={pwShow ? "text" : "password"}
                  placeholder="Mínimo 6 caracteres"
                  value={pwValue}
                  onChange={(e) => setPwValue(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setPwShow(!pwShow)}
                >
                  {pwShow ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPwTarget(null)}>Cancelar</Button>
            <Button
              onClick={() => {
                if (pwValue.length < 6) {
                  toast({ title: "A senha deve ter pelo menos 6 caracteres", variant: "destructive" });
                  return;
                }
                if (pwTarget) passwordMutation.mutate({ userId: pwTarget.id, password: pwValue });
              }}
              disabled={passwordMutation.isPending}
            >
              {passwordMutation.isPending ? "Salvando..." : "Salvar nova senha"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
