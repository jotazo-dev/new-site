import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Receipt,
  Package,
  Wifi,
  Sparkles,
  HeadphonesIcon,
  User as UserIcon,
  LogOut,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useCustomerAuth } from "@/hooks/useCustomerAuth";
import logo from "@/assets/logo-agenda-login.png";

const mainItems = [
  { title: "Visão geral", url: "/conta/painel", icon: LayoutDashboard, exact: true },
  { title: "Faturas", url: "/conta/painel/faturas", icon: Receipt },
  { title: "Meus pedidos", url: "/conta/painel/pedidos", icon: Package },
  { title: "Conexão", url: "/conta/painel/conexao", icon: Wifi },
  { title: "Meu plano", url: "/conta/painel/plano", icon: Sparkles },
];

const supportItems = [
  { title: "Suporte", url: "/conta/painel/suporte", icon: HeadphonesIcon },
  { title: "Perfil", url: "/conta/painel/perfil", icon: UserIcon },
];

export function PainelSidebar() {
  const { state } = useSidebar();
  const { pathname } = useLocation();
  const { signOut } = useCustomerAuth();
  const collapsed = state === "collapsed";

  const isActive = (url: string, exact?: boolean) =>
    exact ? pathname === url : pathname === url || pathname.startsWith(url + "/");

  const linkCls = (active: boolean) =>
    `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
      active
        ? "bg-primary text-primary-foreground font-medium"
        : "hover:bg-muted text-foreground"
    }`;

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarHeader className="border-b px-4 py-4">
        <NavLink to="/" className="flex items-center gap-2">
          <img src={logo} alt="Jotazo" className="h-9 w-auto" />
          {!collapsed && (
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Painel
            </span>
          )}
        </NavLink>
      </SidebarHeader>

      <SidebarContent className="px-2 py-4">
        <SidebarGroup>
          <SidebarGroupLabel>Conta</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={isActive(item.url, item.exact)}>
                    <NavLink to={item.url} end={item.exact} className={linkCls(isActive(item.url, item.exact))}>
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span className="truncate">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Outros</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {supportItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink to={item.url} className={linkCls(isActive(item.url))}>
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span className="truncate">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={() => signOut()} className="text-destructive hover:bg-destructive/10">
              <LogOut className="h-4 w-4 shrink-0" />
              {!collapsed && <span>Sair</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
