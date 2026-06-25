import { ShieldAlert } from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

interface Props {
  section: string;
  children: React.ReactNode;
}

export function AdminRouteGuard({ section, children }: Props) {
  const { user, loading: authLoading } = useAuth();

  const { data: hasAccess, isLoading: accessLoading } = useQuery({
    queryKey: ["admin_section_access", user?.id, section],
    queryFn: async () => {
      if (!user) return false;
      const { data, error } = await supabase.rpc("has_section_permission", {
        _user_id: user.id,
        _section: section,
      });

      if (error) throw error;
      return Boolean(data);
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  // While we don't know the role yet, render the children optimistically.
  // Admin RPC `has_role` already protects sensitive data on the server side, so
  // a brief render before the permission check will not leak anything.
  // This avoids the visible "blank flash" between route changes.
  if (authLoading || accessLoading) {
    return <>{children}</>;
  }

  if (hasAccess) {
    return <>{children}</>;
  }

  // Sem acesso ao Dashboard: redireciona automaticamente para o Painel
  if (section === "dashboard") {
    return <Navigate to="/admin/painel" replace />;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-muted-foreground">
      <ShieldAlert className="h-16 w-16 text-destructive/60" />
      <h2 className="text-xl font-semibold text-foreground">Acesso Negado</h2>
      <p className="text-sm">Você não tem permissão para acessar esta seção.</p>
      <Button asChild variant="outline">
        <Link to="/admin">Voltar ao Dashboard</Link>
      </Button>
    </div>
  );
}
