import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Beaker, AlertTriangle } from "lucide-react";
import { CieloTestCreditTab } from "./CieloTestCreditTab";
import { CieloTestDebitTab } from "./CieloTestDebitTab";
import { CieloTestBoletoTab } from "./CieloTestBoletoTab";
import { CieloTestPixTab } from "./CieloTestPixTab";

export function CieloTestPanel({ isProd }: { isProd: boolean }) {
  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <Beaker className="h-4 w-4 text-primary" /> Testes de Pagamento
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Dispara transações reais usando as credenciais e providers do ambiente ativo. Resultados ficam em "Últimas chamadas".
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {isProd && (
          <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>Ambiente de PRODUÇÃO. Valores limitados a R$ 5,00. Pix/cartão geram cobrança real.</span>
          </div>
        )}
        <Tabs defaultValue="credit">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="credit">Crédito</TabsTrigger>
            <TabsTrigger value="debit">Débito 3DS</TabsTrigger>
            <TabsTrigger value="boleto">Boleto</TabsTrigger>
            <TabsTrigger value="pix">Pix</TabsTrigger>
          </TabsList>
          <TabsContent value="credit" className="mt-4"><CieloTestCreditTab isProd={isProd} /></TabsContent>
          <TabsContent value="debit" className="mt-4"><CieloTestDebitTab isProd={isProd} /></TabsContent>
          <TabsContent value="boleto" className="mt-4"><CieloTestBoletoTab isProd={isProd} /></TabsContent>
          <TabsContent value="pix" className="mt-4"><CieloTestPixTab isProd={isProd} /></TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
