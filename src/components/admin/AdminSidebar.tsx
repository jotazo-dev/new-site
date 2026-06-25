import {
  LayoutDashboard,
  FileText,
  Palette,
  Newspaper,
  Megaphone,
  MapPin,
  Settings,
  Wifi,
  FileStack,
  Users,
  Globe,
  BarChart3,
  Kanban,
  FileUser,
  Briefcase,
  CalendarRange,
  Instagram,
  Ticket,
  Smartphone,
  FileSignature,
  Wrench,
  ChevronRight,
  Plug,
  Server,
  Zap,
  Plus,
  UserCog,
  Database,
  Link2,
  ShoppingBag,
} from "lucide-react";
import { useLocation, Link } from "react-router-dom";
import { forwardRef, useCallback, useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useAdminBranding } from "@/hooks/useAdminBranding";
import { useAuth } from "@/hooks/useAuth";
import { ADMIN_PAGE_PRELOAD } from "@/admin/lazyAdminPages";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

type LeafItem = { title: string; url: string; icon: any; section: string };
type GroupItem = { title: string; icon: any; group: true; children: LeafItem[] };
type Item = LeafItem | GroupItem;

const items: Item[] = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard, section: "dashboard" },
  { title: "Painel", url: "/admin/painel", icon: CalendarRange, section: "painel" },
  { title: "CRM", url: "/admin/crm", icon: Kanban, section: "crm" },
  { title: "Vendas", url: "/admin/vendas", icon: ShoppingBag, section: "vendas" },
  { title: "Clientes", url: "/admin/clientes", icon: Users, section: "clientes" },
  { title: "Planos", url: "/admin/planos", icon: FileText, section: "planos" },
  { title: "MVNO", url: "/admin/mvno", icon: Smartphone, section: "esim" },
  { title: "Integrações", url: "/admin/integracoes", icon: Plug, section: "configuracoes" },
  {
    title: "Ferramentas",
    icon: Wrench,
    group: true,
    children: [
      { title: "Propostas", url: "/admin/propostas", icon: FileSignature, section: "propostas" },
      { title: "Páginas", url: "/admin/paginas", icon: FileStack, section: "paginas" },
      { title: "Marketing", url: "/admin/marketing", icon: Ticket, section: "marketing" },
      { title: "Anúncios", url: "/admin/anuncios", icon: Megaphone, section: "anuncios" },
      { title: "Instagram", url: "/admin/instagram", icon: Instagram, section: "instagram" },
      { title: "Blog", url: "/admin/blog", icon: Newspaper, section: "blog" },
      { title: "Analytics", url: "/admin/analytics", icon: BarChart3, section: "analytics" },
      { title: "Cobertura", url: "/admin/cobertura", icon: MapPin, section: "cobertura" },
      { title: "GEOFEED", url: "/admin/geofeed", icon: Globe, section: "geofeed" },
      { title: "Vagas", url: "/admin/vagas", icon: Briefcase, section: "vagas" },
      { title: "Currículos", url: "/admin/curriculos", icon: FileUser, section: "curriculos" },
      { title: "Personalização", url: "/admin/personalizacao", icon: Palette, section: "personalizacao" },
      { title: "Banco de Dados", url: "/admin/banco-dados", icon: Database, section: "banco_dados" },
    ],
  },
  { title: "Usuários", url: "/admin/usuarios", icon: Users, section: "usuarios" },
  { title: "Configurações", url: "/admin/configuracoes", icon: Settings, section: "configuracoes" },
  { title: "Meu Perfil", url: "/admin/perfil", icon: UserCog, section: "__profile__" },
];

const SidebarLink = forwardRef<
  HTMLAnchorElement,
  { to: string; className?: string; children: React.ReactNode }
>(({ to, className, children, ...props }, ref) => {
  const preload = useCallback(() => {
    const fn = ADMIN_PAGE_PRELOAD[to];
    if (fn) fn();
  }, [to]);
  return (
    <Link
      ref={ref}
      to={to}
      className={className}
      onMouseEnter={preload}
      onFocus={preload}
      onTouchStart={preload}
      {...props}
    >
      {children}
    </Link>
  );
});
SidebarLink.displayName = "SidebarLink";

export function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { user } = useAuth();

  const { data: currentUserRole } = useQuery({
    queryKey: ["current_user_role", user?.id],
    queryFn: async () => {
      if (!user) return { role: "user", slug: "user" };
      const { data } = await supabase
        .from("user_roles")
        .select("role, role_slug")
        .eq("user_id", user.id)
        .maybeSingle();
      return {
        role: data?.role || "user",
        slug: (data as any)?.role_slug || data?.role || "user",
      };
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  const { data: permissions } = useQuery({
    queryKey: ["role_permissions_v2", user?.id, currentUserRole?.slug],
    queryFn: async () => {
      if (!currentUserRole || currentUserRole.role === "admin") return null;
      const { data } = await supabase
        .from("role_permissions")
        .select("section, allowed")
        .eq("role_slug", currentUserRole.slug);
      const map: Record<string, boolean> = {};
      for (const row of data || []) {
        map[row.section] = row.allowed;
      }
      return map;
    },
    enabled: !!user && !!currentUserRole,
    staleTime: 5 * 60 * 1000,
  });

  const isLeafVisible = (it: LeafItem) =>
    it.section === "__profile__"
      ? true
      : currentUserRole?.role === "admin" ? true : permissions?.[it.section] === true;

  const visibleItems: Item[] = items
    .map((it) => {
      if ("group" in it) {
        const children = it.children.filter(isLeafVisible);
        return children.length ? { ...it, children } : null;
      }
      return isLeafVisible(it) ? it : null;
    })
    .filter(Boolean) as Item[];

  const { data: branding } = useAdminBranding();
  const customAdminLogo = branding?.iconUrl ?? null;
  const adminLogoFit = branding?.iconFit ?? "contain";
  const adminWideLogo = branding?.wideUrl ?? null;
  const adminIconSize = branding?.iconSize ?? null;
  const adminWideSize = branding?.wideSize ?? null;

  const isActive = (path: string) =>
    path === "/admin"
      ? location.pathname === "/admin"
      : location.pathname.startsWith(path);

  const iconSizePx = adminIconSize || 36;
  const wideSizePx = adminWideSize || 36;

  // Track open state of groups; auto-open when a child route is active.
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  useEffect(() => {
    setOpenGroups((prev) => {
      const next = { ...prev };
      for (const it of items) {
        if ("group" in it) {
          const hasActive = it.children.some((c) => isActive(c.url));
          if (hasActive) next[it.title] = true;
        }
      }
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  return (
    <Sidebar collapsible="icon" className="border-r-0" style={{ "--sidebar-accent": "0 0% 100% / 0.12", "--sidebar-accent-foreground": "0 0% 100%", "--sidebar-foreground": "0 0% 100% / 0.6", "--sidebar-width-icon": "3.5rem" } as React.CSSProperties}>
      <div className="h-full flex flex-col min-h-0 bg-gradient-to-b from-[hsl(var(--primary))] via-[hsl(218,85%,22%)] to-[hsl(220,80%,12%)]">
        <div className={cn("shrink-0 h-16 flex items-center border-b border-white/10", collapsed ? "justify-center px-0" : "gap-3 px-4")}>
          <div className="shrink-0 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center shadow-lg shadow-black/20 overflow-hidden" style={{ width: iconSizePx + 8, height: iconSizePx + 8 }}>
            {customAdminLogo ? (
              <img src={customAdminLogo} alt="Admin" className="rounded-xl" style={{ width: iconSizePx, height: iconSizePx, objectFit: (adminLogoFit || "cover") as React.CSSProperties["objectFit"] }} />
            ) : (
              <Wifi className="h-6 w-6 text-white" />
            )}
          </div>
          {!collapsed && adminWideLogo && (
            <img src={adminWideLogo} alt="Jotazo" className="w-auto" style={{ height: wideSizePx, objectFit: "contain" }} />
          )}
          {!collapsed && !adminWideLogo && (
            <div className="flex flex-col">
              <span className="text-sm font-bold text-white tracking-wide">Jotazo</span>
              <span className="text-[10px] text-white/50 uppercase tracking-widest">Telecom</span>
            </div>
          )}
        </div>

        <SidebarContent className={cn("overflow-y-auto admin-sidebar-scroll", collapsed ? "px-1 pt-3" : "px-2 pt-4")}>
          <SidebarGroup>
            {!collapsed && (
              <SidebarGroupLabel className="text-white/40 text-[10px] uppercase tracking-widest mb-2 px-3">
                MENU PRINCIPAL
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {visibleItems.map((item) => {
                  if ("group" in item) {
                    const anyChildActive = item.children.some((c) => isActive(c.url));
                    const isOpen = collapsed ? false : (openGroups[item.title] ?? anyChildActive);

                    // When collapsed, render the group icon as a link to the first child (with tooltip).
                    if (collapsed) {
                      const first = item.children[0];
                      return (
                        <SidebarMenuItem key={item.title}>
                          <SidebarMenuButton asChild isActive={anyChildActive} tooltip={item.title}>
                            <SidebarLink
                              to={first.url}
                              className={cn(
                                "rounded-lg transition-all duration-200 justify-center !p-2",
                                anyChildActive
                                  ? "bg-white/15 text-white shadow-lg shadow-white/5 backdrop-blur-sm"
                                  : "text-white/60 hover:text-white hover:bg-white/8"
                              )}
                            >
                              <item.icon className={cn("h-4 w-4", anyChildActive && "text-[hsl(var(--accent))]")} />
                            </SidebarLink>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    }

                    return (
                      <Collapsible
                        key={item.title}
                        open={isOpen}
                        onOpenChange={(v) => setOpenGroups((s) => ({ ...s, [item.title]: v }))}
                        asChild
                      >
                        <SidebarMenuItem>
                          <CollapsibleTrigger asChild>
                            <SidebarMenuButton
                              isActive={anyChildActive}
                              tooltip={item.title}
                              className={cn(
                                "rounded-lg transition-all duration-200 w-full",
                                anyChildActive
                                  ? "bg-white/15 text-white shadow-lg shadow-white/5 backdrop-blur-sm"
                                  : "text-white/60 hover:text-white hover:bg-white/8"
                              )}
                            >
                              <item.icon className={cn("mr-2 h-4 w-4", anyChildActive && "text-[hsl(var(--accent))]")} />
                              <span className="text-sm flex-1 text-left">{item.title}</span>
                              <ChevronRight className={cn("h-3.5 w-3.5 transition-transform", isOpen && "rotate-90")} />
                            </SidebarMenuButton>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <SidebarMenuSub className="border-white/10">
                              {item.children.map((child) => {
                                const cActive = isActive(child.url);
                                return (
                                  <SidebarMenuSubItem key={child.title}>
                                    <SidebarMenuSubButton asChild isActive={cActive}>
                                      <SidebarLink
                                        to={child.url}
                                        className={cn(
                                          "rounded-md transition-all duration-200",
                                          cActive
                                            ? "bg-white/15 text-white"
                                            : "text-white/60 hover:text-white hover:bg-white/8"
                                        )}
                                      >
                                        <child.icon className={cn("mr-2 h-3.5 w-3.5", cActive && "text-[hsl(var(--accent))]")} />
                                        <span className="text-sm">{child.title}</span>
                                      </SidebarLink>
                                    </SidebarMenuSubButton>
                                  </SidebarMenuSubItem>
                                );
                              })}
                            </SidebarMenuSub>
                          </CollapsibleContent>
                        </SidebarMenuItem>
                      </Collapsible>
                    );
                  }

                  const active = isActive(item.url);
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild isActive={active} tooltip={item.title}>
                        <SidebarLink
                          to={item.url}
                          className={cn(
                            "rounded-lg transition-all duration-200",
                            collapsed && "justify-center !p-2",
                            active
                              ? "bg-white/15 text-white shadow-lg shadow-white/5 backdrop-blur-sm"
                              : "text-white/60 hover:text-white hover:bg-white/8"
                          )}
                        >
                          <item.icon className={cn(collapsed ? "mr-0" : "mr-2", "h-4 w-4", active && "text-[hsl(var(--accent))]")} />
                          {!collapsed && <span className="text-sm">{item.title}</span>}
                        </SidebarLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </div>
    </Sidebar>
  );
}
