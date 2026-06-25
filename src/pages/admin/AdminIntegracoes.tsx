import * as React from "react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plug, Server, Signal, Zap, Wallet, CreditCard, Banknote, Shuffle } from "lucide-react";
import { IntegrationsTab } from "@/components/admin/IntegrationsTab";
import { RbxConfigTab } from "@/components/admin/RbxConfigTab";
import { EaiMvnoTab } from "@/components/admin/EaiMvnoTab";
import { AlgarMvnoTab } from "@/components/admin/AlgarMvnoTab";
import { AsaasConfigTab } from "@/components/admin/AsaasConfigTab";
import { CieloConfigTab } from "@/components/admin/CieloConfigTab";
import { MercadoPagoTab } from "@/components/admin/MercadoPagoTab";
import { PaymentRoutingTab } from "@/components/admin/PaymentRoutingTab";
import { useSearchParams } from "react-router-dom";

export default function AdminIntegracoes() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get("tab") || "geral";

  const onTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <AdminPageHeader 
        title="Integrações" 
        subtitle="Gerencie as integrações de API, RBX, MVNO e pagamentos" 
      />

      <Tabs value={tab} onValueChange={onTabChange} className="w-full">
        <TabsList className="bg-muted/50 flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="geral" className="gap-1.5 text-xs sm:text-sm">
            <Plug className="h-3.5 w-3.5" /> Geral
          </TabsTrigger>
          <TabsTrigger value="rbx" className="gap-1.5 text-xs sm:text-sm">
            <Server className="h-3.5 w-3.5" /> RBX
          </TabsTrigger>
          <TabsTrigger value="eai" className="gap-1.5 text-xs sm:text-sm">
            <Signal className="h-3.5 w-3.5" /> EAI MVNO
          </TabsTrigger>
          <TabsTrigger value="algar" className="gap-1.5 text-xs sm:text-sm">
            <Zap className="h-3.5 w-3.5" /> Algar MVNO
          </TabsTrigger>
          <TabsTrigger value="asaas" className="gap-1.5 text-xs sm:text-sm">
            <Wallet className="h-3.5 w-3.5" /> Asaas
          </TabsTrigger>
          <TabsTrigger value="cielo" className="gap-1.5 text-xs sm:text-sm">
            <CreditCard className="h-3.5 w-3.5" /> Cielo
          </TabsTrigger>
          <TabsTrigger value="mercadopago" className="gap-1.5 text-xs sm:text-sm">
            <Banknote className="h-3.5 w-3.5" /> Mercado Pago
          </TabsTrigger>
          <TabsTrigger value="roteamento" className="gap-1.5 text-xs sm:text-sm">
            <Shuffle className="h-3.5 w-3.5" /> Roteamento
          </TabsTrigger>
        </TabsList>

        <TabsContent value="geral" className="space-y-6 mt-6">
          <IntegrationsTab />
        </TabsContent>

        <TabsContent value="rbx" className="space-y-6 mt-6">
          <RbxConfigTab />
        </TabsContent>

        <TabsContent value="eai" className="space-y-6 mt-6">
          <EaiMvnoTab />
        </TabsContent>

        <TabsContent value="algar" className="space-y-6 mt-6">
          <AlgarMvnoTab />
        </TabsContent>

        <TabsContent value="asaas" className="space-y-6 mt-6">
          <AsaasConfigTab />
        </TabsContent>

        <TabsContent value="cielo" className="space-y-6 mt-6">
          <CieloConfigTab />
        </TabsContent>

        <TabsContent value="mercadopago" className="space-y-6 mt-6">
          <MercadoPagoTab />
        </TabsContent>

        <TabsContent value="roteamento" className="space-y-6 mt-6">
          <PaymentRoutingTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
