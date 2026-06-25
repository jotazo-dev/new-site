import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowRightLeft, History, Loader2, Plus, RefreshCw, Search } from "lucide-react";
import { algarCall, formatMsisdn } from "./algarClient";
import { toast } from "sonner";

export function AlgarPortabilityPanel() {
  const [loading, setLoading] = useState(false);
  const [list, setList] = useState<any[]>([]);
  const [msisdn, setMsisdn] = useState("");
  const [document, setDocument] = useState("");
  const [operator, setOperator] = useState("");
  const [name, setName] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");

  async function loadPortabilities() {
    setLoading(true);
    try {
      setList([{
        id: "LNP-MOCK-1",
        msisdn: "34991234567",
        operator: "VIVO",
        name: "João da Silva",
        status: "PENDING",
        date: new Date().toISOString()
      }]);
    } catch (e) {
      toast.error("Erro ao carregar portabilidades");
    } finally {
      setLoading(false);
    }
  }

  async function handleRequest() {
    if (!msisdn || !document || !operator || !name) {
      return toast.error("Preencha todos os campos obrigatórios");
    }
    setLoading(true);
    const res = await algarCall("/v2/mobilelines/NEW/lnp", {
      method: "POST",
      body: {
        document: document.replace(/\D/g, ""),
        donor_terminal: msisdn.replace(/\D/g, ""),
        donor_operator: operator,
        name: name,
        scheduled_date: scheduledDate || undefined
      }
    });
    setLoading(false);
    if (res.ok) {
      toast.success("Portabilidade solicitada com sucesso!");
      setMsisdn("");
      setDocument("");
      setOperator("");
      setName("");
      setScheduledDate("");
    } else {
      toast.error(res.error || "Erro ao solicitar portabilidade");
    }
  }

  useEffect(() => { loadPortabilities(); }, []);

  return (
    <div className="space-y-4">
      <Card className="p-5 rounded-2xl space-y-4">
        <div className="flex items-center gap-2">
          <Plus className="h-4 w-4 text-primary" />
          <h3 className="font-semibold">Solicitar Portabilidade (Port-in)</h3>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Nome do Titular *</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="João da Silva" />
          </div>
          <div className="space-y-2">
            <Label>CPF/CNPJ do titular *</Label>
            <Input value={document} onChange={e => setDocument(e.target.value)} placeholder="000.000.000-00" />
          </div>
          <div className="space-y-2">
            <Label>Número a portar *</Label>
            <Input value={msisdn} onChange={e => setMsisdn(e.target.value)} placeholder="34991234567" />
          </div>
          <div className="space-y-2">
            <Label>Operadora doadora *</Label>
            <Input value={operator} onChange={e => setOperator(e.target.value)} placeholder="VIVO, CLARO, TIM..." />
          </div>
          <div className="space-y-2">
            <Label>Data para Portabilidade (Opcional)</Label>
            <Input type="date" value={scheduledDate} onChange={e => setScheduledDate(e.target.value)} />
          </div>
        </div>
        <Button onClick={handleRequest} disabled={loading} className="bg-green-600 hover:bg-green-700">
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRightLeft className="mr-2 h-4 w-4" />}
          Solicitar Portabilidade
        </Button>
      </Card>

      <Card className="p-5 rounded-2xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-primary" />
            <h3 className="font-semibold">Histórico Recente</h3>
          </div>
          <Button variant="ghost" size="sm" onClick={loadPortabilities}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
        <div className="rounded-xl border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Protocolo</TableHead>
                <TableHead>Número</TableHead>
                <TableHead>Operadora</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-mono text-xs">{item.id}</TableCell>
                  <TableCell>{formatMsisdn(item.msisdn)}</TableCell>
                  <TableCell>{item.operator}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                      {item.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
