import { Outlet } from "react-router-dom";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { RequireCustomerAuth } from "./RequireCustomerAuth";

export function ContaLayout() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <SiteHeader />
      <main className="flex-1 mx-auto w-full max-w-4xl px-4 py-10">
        <RequireCustomerAuth>
          <Outlet />
        </RequireCustomerAuth>
      </main>
      <SiteFooter />
    </div>
  );
}
