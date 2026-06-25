import * as React from "react";
import { useNavigate } from "react-router-dom";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Users, Server, Zap, Smartphone, Database, UserCircle } from "lucide-react";
import { RbxClientesTab } from "@/components/admin/RbxClientesTab";
import { AlgarClientesTab } from "@/components/admin/AlgarClientesTab";
import { EaiClientesTab } from "@/components/admin/EaiClientesTab";
import { ContasSiteTab } from "@/components/admin/ContasSiteTab";

type SourceKey = "todos" | "site" | "rbx" | "algar" | "eai";

const TABS: { key: SourceKey; label: string; icon: any; description: string }[] = [
  { key: "todos", label: "Todos", icon: Users, description: "Visão consolidada dos clientes de todas as fontes (RBX, Algar, EAI)." },
  { key: "site", label: "Contas do Site", icon: UserCircle, description: "Contas criadas pelos clientes em /conta." },
  { key: "rbx", label: "RBX", icon: Server, description: "Clientes cadastrados no RBXSoft." },
  { key: "algar", label: "Algar", icon: Zap, description: "Clientes da operadora Algar (MVNO)." },
  { key: "eai", label: "EAI", icon: Smartphone, description: "Clientes da operadora EAI (MVNO)." },
];

export default function AdminClientes() {
  const navigate = useNavigate();
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Clientes"
        subtitle="Consulta unificada de clientes nas integrações RBX, Algar e EAI"
        onNew={() => navigate("/admin/pedido")}
        newLabel="Novo Pedido"
      />


      <Tabs defaultValue="rbx" className="w-full space-y-6">
        <TabsList className="bg-muted/50 flex-wrap h-auto gap-1 p-1">
          {TABS.map((t) => (
            <TabsTrigger key={t.key} value={t.key} className="gap-1.5 text-xs sm:text-sm">
              <t.icon className="h-3.5 w-3.5" /> {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="site" className="mt-0">
          <ContasSiteTab />
        </TabsContent>

        <TabsContent value="rbx" className="mt-0">
          <RbxClientesTab />
        </TabsContent>

        <TabsContent value="algar" className="mt-0">
          <AlgarClientesTab />
        </TabsContent>

        <TabsContent value="eai" className="mt-0">
          <EaiClientesTab />
        </TabsContent>

        {TABS.filter((t) => !["site", "rbx", "algar", "eai"].includes(t.key)).map((t) => (
          <TabsContent key={t.key} value={t.key} className="mt-0">
            <Card className="p-10 text-center text-muted-foreground">
              <t.icon className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm font-medium text-foreground mb-1">Clientes — {t.label}</p>
              <p className="text-xs max-w-md mx-auto">{t.description}</p>
              <p className="text-xs mt-4 opacity-70 flex items-center justify-center gap-1.5">
                <Database className="h-3.5 w-3.5" />
                Listagem será implementada na próxima etapa.
              </p>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
