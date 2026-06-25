import { Outlet, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Bell, Home } from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { RequireCustomerAuth } from "@/components/conta/RequireCustomerAuth";
import { useCustomerAuth } from "@/hooks/useCustomerAuth";
import { PainelSidebar } from "./PainelSidebar";

function PainelTopbar() {
  const { profile, user } = useCustomerAuth();
  const name = profile?.full_name || user?.email || "";
  const initials =
    (name || "JZ")
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join("") || "JZ";

  return (
    <header className="sticky top-0 z-30 h-16 border-b bg-background/80 backdrop-blur-md">
      <div className="h-full px-4 md:px-6 flex items-center gap-3">
        <SidebarTrigger className="shrink-0" />
        <div className="flex-1" />
        <Link to="/">
          <Button variant="ghost" size="sm" className="gap-2 hidden sm:inline-flex">
            <Home className="h-4 w-4" /> Ir ao site
          </Button>
        </Link>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
        </Button>
        <Link to="/conta/painel/perfil" className="flex items-center gap-3 pl-2 border-l">
          <div className="text-right hidden md:block">
            <p className="text-sm font-medium leading-tight truncate max-w-[180px]">{name}</p>
            <p className="text-[11px] text-muted-foreground">Cliente Jotazo</p>
          </div>
          <Avatar className="h-9 w-9 border">
            <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Link>
      </div>
    </header>
  );
}

export function PainelLayout() {
  return (
    <RequireCustomerAuth>
      <Helmet>
        <title>Painel — Jotazo</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-muted/30">
          <PainelSidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <PainelTopbar />
            <main className="flex-1 p-4 md:p-8">
              <div className="mx-auto w-full max-w-6xl">
                <Outlet />
              </div>
            </main>
          </div>
        </div>
      </SidebarProvider>
    </RequireCustomerAuth>
  );
}
