import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Receipt, Search, FileText, Download } from "lucide-react";
import { FileUpload } from "@/components/shared/FileUpload";

const statusMap: Record<string, { label: string; variant: "default" | "destructive" | "outline" | "secondary" }> = {
  emitida: { label: "Emitida", variant: "default" },
  cancelada: { label: "Cancelada", variant: "destructive" },
  pendente: { label: "Pendente", variant: "outline" },
};

const tipoMap: Record<string, string> = {
  nfe: "NF-e",
  nfse: "NFS-e",
  nfce: "NFC-e",
};

export default function NotasFiscais() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailNF, setDetailNF] = useState<any>(null);
  const [pdfUrl, setPdfUrl] = useState("");
  const [xmlUrl, setXmlUrl] = useState("");
  const [form, setForm] = useState({
    tipo: "nfe" as string,
    numero: "",
    valor: "",
    descricao: "",
    cliente_id: "",
    status: "pendente" as string,
  });

  const { data: notas = [], isLoading } = useQuery({
    queryKey: ["notas_fiscais"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notas_fiscais")
        .select("*, clientes(nome)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: clientes = [] } = useQuery({
    queryKey: ["clientes_select"],
    queryFn: async () => {
      const { data, error } = await supabase.from("clientes").select("id, nome").order("nome");
      if (error) throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("notas_fiscais").insert({
        tipo: form.tipo as any,
        numero: form.numero || null,
        valor: Number(form.valor),
        descricao: form.descricao || null,
        cliente_id: form.cliente_id || null,
        status: form.status as any,
        data_emissao: form.status === "emitida" ? new Date().toISOString().split("T")[0] : null,
        created_by: user?.id,
        pdf_url: pdfUrl || null,
        xml_url: xmlUrl || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notas_fiscais"] });
      toast.success("Nota fiscal criada!");
      setDialogOpen(false);
      setForm({ tipo: "nfe", numero: "", valor: "", descricao: "", cliente_id: "", status: "pendente" });
      setPdfUrl("");
      setXmlUrl("");
    },
    onError: () => toast.error("Erro ao criar nota fiscal"),
  });

  const emitirMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("notas_fiscais").update({
        status: "emitida" as any,
        data_emissao: new Date().toISOString().split("T")[0],
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notas_fiscais"] });
      toast.success("Nota fiscal emitida!");
      setDetailNF(null);
    },
  });

  const cancelarMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("notas_fiscais").update({ status: "cancelada" as any }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notas_fiscais"] });
      toast.success("Nota fiscal cancelada!");
      setDetailNF(null);
    },
  });

  const filtered = notas.filter((n: any) =>
    (n.numero || "").toLowerCase().includes(search.toLowerCase()) ||
    (n.clientes?.nome || "").toLowerCase().includes(search.toLowerCase()) ||
    (n.descricao || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="p-4 md:p-6 space-y-6 max-w-7xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Notas Fiscais</h1>
            <p className="text-sm text-muted-foreground">{notas.length} notas fiscais</p>
          </div>
          <Button onClick={() => setDialogOpen(true)} className="gap-2"><Plus className="h-4 w-4" /> Nova NF</Button>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar nota fiscal..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "Emitidas", count: notas.filter((n: any) => n.status === "emitida").length, total: notas.filter((n: any) => n.status === "emitida").reduce((s: number, n: any) => s + Number(n.valor), 0) },
            { label: "Pendentes", count: notas.filter((n: any) => n.status === "pendente").length, total: notas.filter((n: any) => n.status === "pendente").reduce((s: number, n: any) => s + Number(n.valor), 0) },
            { label: "Canceladas", count: notas.filter((n: any) => n.status === "cancelada").length, total: notas.filter((n: any) => n.status === "cancelada").reduce((s: number, n: any) => s + Number(n.valor), 0) },
          ].map((s) => (
            <div key={s.label} className="bg-card border border-border rounded-xl p-4">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="text-xl font-bold text-foreground">{s.count}</p>
              <p className="text-sm text-muted-foreground">R$ {s.total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
            </div>
          ))}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Receipt className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>Nenhuma nota fiscal encontrada.</p>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-xl shadow-sm divide-y divide-border">
            {filtered.map((nf: any) => {
              const s = statusMap[nf.status] || statusMap.pendente;
              const hasFiles = nf.pdf_url || nf.xml_url;
              return (
                <div key={nf.id} className="flex items-center justify-between px-5 py-4 hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => setDetailNF(nf)}>
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Receipt className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-foreground">{nf.numero || "Sem número"}</p>
                        <Badge variant="outline" className="text-[10px]">{tipoMap[nf.tipo] || nf.tipo}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {nf.clientes?.nome || "Sem cliente"}
                        {nf.data_emissao && ` · ${new Date(nf.data_emissao).toLocaleDateString("pt-BR")}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-foreground">R$ {Number(nf.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                    <Badge variant={s.variant}>{s.label}</Badge>
                    {hasFiles && (
                      <div className="flex gap-1">
                        {nf.pdf_url && (
                          <a href={nf.pdf_url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
                            className="h-7 px-2 rounded border border-border flex items-center gap-1 hover:bg-muted transition-colors text-[10px] font-medium text-foreground">
                            <Download className="h-3 w-3" /> PDF
                          </a>
                        )}
                        {nf.xml_url && (
                          <a href={nf.xml_url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
                            className="h-7 px-2 rounded border border-border flex items-center gap-1 hover:bg-muted transition-colors text-[10px] font-medium text-foreground">
                            <Download className="h-3 w-3" /> XML
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Detail dialog */}
      <Dialog open={!!detailNF} onOpenChange={(o) => !o && setDetailNF(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-primary" />
              {detailNF?.numero || "Nota Fiscal"}
            </DialogTitle>
          </DialogHeader>
          {detailNF && (
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <Badge variant="outline">{tipoMap[detailNF.tipo]}</Badge>
                <Badge variant={statusMap[detailNF.status]?.variant}>{statusMap[detailNF.status]?.label}</Badge>
              </div>
              <p><strong>Cliente:</strong> {detailNF.clientes?.nome || "—"}</p>
              <p><strong>Valor:</strong> R$ {Number(detailNF.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
              {detailNF.data_emissao && <p><strong>Emissão:</strong> {new Date(detailNF.data_emissao).toLocaleDateString("pt-BR")}</p>}
              {detailNF.descricao && <p><strong>Descrição:</strong> {detailNF.descricao}</p>}
              
              {/* File links */}
              {(detailNF.pdf_url || detailNF.xml_url) && (
                <div className="flex gap-2 pt-1">
                  {detailNF.pdf_url && (
                    <a href={detailNF.pdf_url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors text-xs font-medium">
                      <Download className="h-3.5 w-3.5" /> Baixar PDF
                    </a>
                  )}
                  {detailNF.xml_url && (
                    <a href={detailNF.xml_url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors text-xs font-medium">
                      <Download className="h-3.5 w-3.5" /> Baixar XML
                    </a>
                  )}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                {detailNF.status === "pendente" && (
                  <Button size="sm" onClick={() => emitirMutation.mutate(detailNF.id)}>
                    <FileText className="h-4 w-4 mr-1" /> Emitir
                  </Button>
                )}
                {detailNF.status !== "cancelada" && (
                  <Button size="sm" variant="destructive" onClick={() => cancelarMutation.mutate(detailNF.id)}>
                    Cancelar NF
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create dialog */}
      <Dialog open={dialogOpen} onOpenChange={(o) => !o && setDialogOpen(false)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Nova Nota Fiscal</DialogTitle>
            <DialogDescription>Preencha os dados e anexe os arquivos da nota fiscal.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Tipo</Label>
                <Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nfe">NF-e (Produto)</SelectItem>
                    <SelectItem value="nfse">NFS-e (Serviço)</SelectItem>
                    <SelectItem value="nfce">NFC-e (Consumidor)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Número</Label>
                <Input value={form.numero} onChange={(e) => setForm({ ...form, numero: e.target.value })} placeholder="NF-e 001234" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Valor (R$) *</Label>
                <Input type="number" value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })} />
              </div>
              <div>
                <Label>Cliente</Label>
                <Select value={form.cliente_id} onValueChange={(v) => setForm({ ...form, cliente_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {clientes.map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="emitida">Emitida</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} rows={2} />
            </div>
            <div>
              <Label>PDF da Nota Fiscal</Label>
              <FileUpload
                bucket="notas-fiscais"
                folder={user?.id ? `${user.id}/pdf` : "pdf"}
                onUploadComplete={(url) => setPdfUrl(url)}
                accept=".pdf"
                className="mt-1"
              />
            </div>
            <div>
              <Label>XML da Nota Fiscal</Label>
              <FileUpload
                bucket="notas-fiscais"
                folder={user?.id ? `${user.id}/xml` : "xml"}
                onUploadComplete={(url) => setXmlUrl(url)}
                accept=".xml"
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !form.valor}>
              {saveMutation.isPending ? "Salvando..." : "Criar Nota Fiscal"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
