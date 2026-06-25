import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { TableSkeleton } from "@/components/admin/TableSkeleton";
import { toast } from "sonner";
import { Search, Download, FileText, Trash2, Eye, Mail, Phone, MapPin, MessageSquare, Briefcase, Plane } from "lucide-react";

const statusColors: Record<string, string> = {
  novo: "bg-blue-100 text-blue-700 border-blue-200",
  "em análise": "bg-yellow-100 text-yellow-700 border-yellow-200",
  aprovado: "bg-green-100 text-green-700 border-green-200",
  rejeitado: "bg-red-100 text-red-700 border-red-200",
};

export default function AdminCurriculos() {
  const [search, setSearch] = useState("");
  const [selectedResume, setSelectedResume] = useState<any | null>(null);
  const [notes, setNotes] = useState("");
  const qc = useQueryClient();

  const { data: resumes, isLoading } = useQuery({
    queryKey: ["admin_resumes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("resumes")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Realtime: alert on new resume
  useEffect(() => {
    const channel = supabase
      .channel("resumes-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "resumes" },
        (payload) => {
          const name = (payload.new as any)?.name || "Candidato";
          toast.info(`Novo currículo recebido: ${name}`);
          qc.invalidateQueries({ queryKey: ["admin_resumes"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("resumes").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin_resumes"] });
      toast.success("Status atualizado");
    },
  });

  const updateNotes = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes: string }) => {
      const { error } = await supabase.from("resumes").update({ notes }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin_resumes"] });
      toast.success("Observações salvas");
    },
  });

  const deleteResume = useMutation({
    mutationFn: async ({ id, filePath }: { id: string; filePath: string }) => {
      if (filePath) {
        await supabase.storage.from("resumes").remove([filePath]);
      }
      const { error } = await supabase.from("resumes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin_resumes"] });
      toast.success("Currículo excluído");
      setSelectedResume(null);
    },
  });

  const handleDownload = async (filePath: string, fileName: string) => {
    const { data, error } = await supabase.storage.from("resumes").createSignedUrl(filePath, 604800);
    if (error || !data?.signedUrl) {
      toast.error("Erro ao gerar link de download");
      return;
    }
    const a = document.createElement("a");
    a.href = data.signedUrl;
    a.download = fileName;
    a.target = "_blank";
    a.click();
  };

  const openDetails = (r: any) => {
    setSelectedResume(r);
    setNotes(r.notes || "");
  };

  const filtered = (resumes || []).filter((r) => {
    const q = search.toLowerCase();
    return !q || r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q) || r.position.toLowerCase().includes(q) || (r.city || "").toLowerCase().includes(q);
  });

  return (
    <div>
      <AdminPageHeader title="Currículos" subtitle="Gerencie os currículos recebidos pelo site." />

      <div className="mb-4 flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar por nome, e-mail, cargo ou cidade..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Badge variant="secondary">{filtered.length} candidato(s)</Badge>
      </div>

      {isLoading ? (
        <TableSkeleton rows={6} columns={9} />
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-16 text-muted-foreground">
          <FileText className="h-10 w-10" />
          <p>Nenhum currículo encontrado.</p>
        </div>
      ) : (
        <div className="rounded-xl border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Cidade</TableHead>
                <TableHead>Viaja?</TableHead>
                <TableHead>Área</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium cursor-pointer hover:underline" onClick={() => openDetails(r)}>
                    {r.name}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{r.email}</TableCell>
                  <TableCell className="text-sm">{r.phone}</TableCell>
                  <TableCell className="text-sm">{r.city || "—"}</TableCell>
                  <TableCell className="text-sm">
                    {r.available_to_travel ? (
                      <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-100">Sim</Badge>
                    ) : (
                      <Badge variant="secondary">Não</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">{r.position}</TableCell>
                  <TableCell>
                    <Select value={r.status} onValueChange={(v) => updateStatus.mutate({ id: r.id, status: v })}>
                      <SelectTrigger className={`h-7 w-[120px] text-xs font-medium border ${statusColors[r.status] || ""}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="novo">Novo</SelectItem>
                        <SelectItem value="em análise">Em Análise</SelectItem>
                        <SelectItem value="aprovado">Aprovado</SelectItem>
                        <SelectItem value="rejeitado">Rejeitado</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(r.created_at).toLocaleDateString("pt-BR")}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openDetails(r)} title="Ver detalhes">
                        <Eye className="h-4 w-4" />
                      </Button>
                      {r.file_path && (
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleDownload(r.file_path, r.file_name)} title="Baixar currículo">
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => {
                          if (confirm("Excluir este currículo?")) {
                            deleteResume.mutate({ id: r.id, filePath: r.file_path });
                          }
                        }}
                        title="Excluir"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Details Dialog */}
      <Dialog open={!!selectedResume} onOpenChange={(open) => !open && setSelectedResume(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalhes do Currículo</DialogTitle>
            <DialogDescription>Informações do candidato e observações internas.</DialogDescription>
          </DialogHeader>

          {selectedResume && (
            <div className="space-y-4">
              {/* Candidate info */}
              <div className="grid grid-cols-1 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-base">{selectedResume.name}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4" /> {selectedResume.email}
                </div>
                {selectedResume.phone && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4" /> {selectedResume.phone}
                  </div>
                )}
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Briefcase className="h-4 w-4" /> {selectedResume.position || "Não informado"}
                </div>
                {selectedResume.city && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" /> {selectedResume.city}
                  </div>
                )}
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Plane className="h-4 w-4" />
                  Disponibilidade para viajar:
                  {selectedResume.available_to_travel ? (
                    <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-100">Sim</Badge>
                  ) : (
                    <Badge variant="secondary">Não</Badge>
                  )}
                </div>
                {selectedResume.message && (
                  <div className="flex items-start gap-2 text-muted-foreground">
                    <MessageSquare className="h-4 w-4 mt-0.5 shrink-0" />
                    <span>{selectedResume.message}</span>
                  </div>
                )}
                <div className="text-xs text-muted-foreground">
                  Enviado em {new Date(selectedResume.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>

              {/* Status */}
              <div className="space-y-1">
                <label className="text-sm font-medium">Status</label>
                <Select
                  value={selectedResume.status}
                  onValueChange={(v) => {
                    updateStatus.mutate({ id: selectedResume.id, status: v });
                    setSelectedResume({ ...selectedResume, status: v });
                  }}
                >
                  <SelectTrigger className={`h-9 w-full text-sm font-medium border ${statusColors[selectedResume.status] || ""}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="novo">Novo</SelectItem>
                    <SelectItem value="em análise">Em Análise</SelectItem>
                    <SelectItem value="aprovado">Aprovado</SelectItem>
                    <SelectItem value="rejeitado">Rejeitado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="text-sm font-medium">Observações internas</label>
                <Textarea
                  placeholder="Adicione observações sobre este candidato..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                />
                <Button
                  size="sm"
                  className="mt-1"
                  disabled={notes === (selectedResume.notes || "")}
                  onClick={() => {
                    updateNotes.mutate({ id: selectedResume.id, notes });
                    setSelectedResume({ ...selectedResume, notes });
                  }}
                >
                  Salvar observações
                </Button>
              </div>

              {/* Download */}
              {selectedResume.file_path && (
                <Button variant="outline" className="w-full" onClick={() => handleDownload(selectedResume.file_path, selectedResume.file_name)}>
                  <Download className="h-4 w-4 mr-2" />
                  Baixar currículo ({selectedResume.file_name})
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
