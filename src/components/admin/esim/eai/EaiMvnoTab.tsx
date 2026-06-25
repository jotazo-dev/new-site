import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, Phone, ShoppingCart, ArrowRightLeft, Users } from "lucide-react";
import { CatalogPanel } from "./CatalogPanel";
import { LinesPanel } from "./LinesPanel";
import { CartWizardPanel } from "./CartWizardPanel";
import { PortabilityPanel } from "./PortabilityPanel";
import { CustomerPanel } from "./CustomerPanel";

export function EaiMvnoTab() {
  const [sub, setSub] = useState("customer");
  return (
    <div className="space-y-4">
      <Tabs value={sub} onValueChange={setSub}>
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="customer"><Users className="mr-2 h-4 w-4" />Clientes</TabsTrigger>
          <TabsTrigger value="port"><ArrowRightLeft className="mr-2 h-4 w-4" />Portabilidade</TabsTrigger>
          <TabsTrigger value="cart"><ShoppingCart className="mr-2 h-4 w-4" />Ativação</TabsTrigger>
          <TabsTrigger value="catalogo"><Package className="mr-2 h-4 w-4" />Catálogo</TabsTrigger>
          <TabsTrigger value="linhas"><Phone className="mr-2 h-4 w-4" />Linhas</TabsTrigger>
        </TabsList>
        <TabsContent value="customer" className="mt-4"><CustomerPanel /></TabsContent>
        <TabsContent value="port" className="mt-4"><PortabilityPanel /></TabsContent>
        <TabsContent value="cart" className="mt-4"><CartWizardPanel /></TabsContent>
        <TabsContent value="catalogo" className="mt-4"><CatalogPanel /></TabsContent>
        <TabsContent value="linhas" className="mt-4"><LinesPanel /></TabsContent>
      </Tabs>
    </div>
  );
}
