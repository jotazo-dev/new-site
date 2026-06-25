import { Link, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import * as React from "react";
import { Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminSidebar } from "./AdminSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { initialsOf, nameToHsl } from "@/lib/crmAvatar";
import { LogOut, Wifi, ShieldAlert, Plus, User as UserIcon, ChevronDown, ShoppingCart, Smartphone, ListChecks, Users } from "lucide-react";

function AdminContentFallback() {
  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>
      <Skeleton className="h-10 w-full max-w-md" />
      <div className="rounded-xl border bg-card p-4 space-y-3">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    </div>
  );
}

export function AdminLayout() {
  const { isAdmin, canAccessAdmin, loading, signOut, user } = useAuth();
  const navigate = useNavigate();

  const { data: myProfile } = useQuery({
    queryKey: ["my_profile_navbar", user?.id],
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("profiles")
        .select("first_name, last_name, avatar_url")
        .eq("user_id", user!.id)
        .maybeSingle();
      return (data || null) as { first_name: string | null; last_name: string | null; avatar_url: string | null } | null;
    },
  });
  const fullName = [myProfile?.first_name, myProfile?.last_name].filter(Boolean).join(" ").trim();
  const displayName = fullName || user?.email || "";
  const avatarLabel = fullName || user?.email || "?";

  React.useEffect(() => {
    if (!loading && !canAccessAdmin) navigate("/admin/login", { replace: true });
  }, [loading, canAccessAdmin, navigate]);


  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(220,80%,15%)]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center animate-pulse">
            <Wifi className="h-5 w-5 text-white" />
          </div>
          <p className="text-white/70 text-sm">Verificando acesso...</p>
        </div>
      </div>
    );
  }

  if (!canAccessAdmin) {

    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(220,80%,15%)]">
        <div className="flex flex-col items-center gap-4 text-center">
          <ShieldAlert className="h-10 w-10 text-red-400" />
          <p className="text-white/80 text-sm">Sem permissão de administrador.</p>
          <Button variant="outline" size="sm" onClick={() => navigate("/admin/login", { replace: true })} className="text-white border-white/20 hover:bg-white/10">
            Voltar ao login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-muted/30">
        <AdminSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-16 flex items-center justify-between px-4 md:px-6 bg-gradient-to-r from-[hsl(var(--primary))] via-[hsl(218,90%,25%)] to-[hsl(220,80%,20%)] shadow-lg shadow-primary/20">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="text-white/80 hover:text-white hover:bg-white/10" />
            </div>
            <div className="flex items-center gap-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label="Criar"
                    className="h-9 w-9 text-white/70 hover:text-white hover:bg-white/10 border border-white/10"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuLabel className="text-xs text-muted-foreground">Criar</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => navigate("/admin/pedido")}>
                    <ShoppingCart className="h-4 w-4 mr-2" /> Novo pedido
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/admin/mvno/nova-linha")}>
                    <Smartphone className="h-4 w-4 mr-2" /> Nova linha MVNO
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="text-xs text-muted-foreground">Visualizar</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => navigate("/admin/mvno/ativacoes")}>
                    <ListChecks className="h-4 w-4 mr-2" /> Ver ativações
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/admin/clientes")}>
                    <Users className="h-4 w-4 mr-2" /> Meus clientes
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 rounded-full pl-1 pr-2 py-1 text-white/80 hover:text-white hover:bg-white/10 transition-colors" aria-label="Menu do usuário">
                    <Avatar className="h-8 w-8 ring-1 ring-white/20">
                      {myProfile?.avatar_url ? <AvatarImage src={myProfile.avatar_url} alt={displayName} /> : null}
                      <AvatarFallback className="text-[11px] font-semibold text-white" style={{ background: nameToHsl(avatarLabel) }}>
                        {initialsOf(avatarLabel)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs max-w-[160px] truncate hidden sm:inline">{displayName}</span>
                    <ChevronDown className="h-3.5 w-3.5 opacity-70 hidden sm:inline" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="font-normal">
                    <div className="text-sm font-medium truncate">{displayName}</div>
                    {fullName && user?.email && (
                      <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                    )}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("/admin/perfil")}>
                    <UserIcon className="h-4 w-4 mr-2" /> Meu perfil
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => signOut()}>
                    <LogOut className="h-4 w-4 mr-2" /> Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          <main className="flex-1 p-4 md:p-8 overflow-auto">
            <Suspense fallback={<AdminContentFallback />}>
              <Outlet />
            </Suspense>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
