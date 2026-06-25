import { Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useCustomerAuth } from "@/hooks/useCustomerAuth";

export function RequireCustomerAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useCustomerAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    const redirect = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/conta/login?redirect=${redirect}`} replace />;
  }

  return <>{children}</>;
}
