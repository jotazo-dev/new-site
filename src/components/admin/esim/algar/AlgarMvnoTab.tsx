import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, Phone, ShoppingCart, ArrowRightLeft, Users, Zap } from "lucide-react";
import { AlgarCustomerPanel } from "./AlgarCustomerPanel";
import { AlgarPortabilityPanel } from "./AlgarPortabilityPanel";
import { AlgarActivationWizard } from "./AlgarActivationWizard";
import { AlgarPlansPanel } from "./AlgarPlansPanel";
import { AlgarLinesPanel } from "./AlgarLinesPanel";
import { AlgarConfigPanel } from "./AlgarConfigPanel";

export function AlgarMvnoTab() {
  const [sub, setSub] = useState("customer");
  return (
    <div className="space-y-4">
      <Tabs value={sub} onValueChange={setSub}>
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="customer"><Users className="mr-2 h-4 w-4" />Linhas Móveis</TabsTrigger>
          <TabsTrigger value="port"><ArrowRightLeft className="mr-2 h-4 w-4" />Portabilidade</TabsTrigger>
          <TabsTrigger value="cart"><ShoppingCart className="mr-2 h-4 w-4" />Ativação</TabsTrigger>
          <TabsTrigger value="plans"><Package className="mr-2 h-4 w-4" />Planos</TabsTrigger>
          <TabsTrigger value="lines"><Phone className="mr-2 h-4 w-4" />Linhas</TabsTrigger>
          <TabsTrigger value="config"><Zap className="mr-2 h-4 w-4" />Configuração</TabsTrigger>
        </TabsList>
        <TabsContent value="customer" className="mt-4">
          <AlgarCustomerPanel />
        </TabsContent>
        <TabsContent value="port" className="mt-4">
          <AlgarPortabilityPanel />
        </TabsContent>
        <TabsContent value="cart" className="mt-4">
          <AlgarActivationWizard />
        </TabsContent>
        <TabsContent value="plans" className="mt-4">
          <AlgarPlansPanel />
        </TabsContent>
        <TabsContent value="lines" className="mt-4">
          <AlgarLinesPanel />
        </TabsContent>
        <TabsContent value="config" className="mt-4">
          <AlgarConfigPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}


