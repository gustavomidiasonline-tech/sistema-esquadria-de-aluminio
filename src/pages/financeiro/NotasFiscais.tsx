import { useState, useMemo } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Plus, Receipt, Search, FileText, Download, Copy, ArrowUpRight, ArrowDownLeft,
  DollarSign, CheckCircle2, Clock, XCircle, Loader2,
} from "lucide-react";
import { FileUpload } from "@/components/shared/FileUpload";
import type { Tables } from "@/integrations/supabase/types";
import type { Database } from "@/integrations/supabase/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type NotaFiscalWithCliente = Tables<"notas_fiscais"> & { clientes: { nome: string } | null };
type NfStatus = Database["public"]["Enums"]["nf_status"];
type NfTipo = Database["public"]["Enums"]["nf_tipo"];

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STATUS_CONFIG: Record<string, { label: string; icon: typeof CheckCircle2; className: string }> = {
  emitida: { label: "Emitida", icon: CheckCircle2, className: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  cancelada: { label: "Cancelada", icon: XCircle, className: "bg-red-100 text-red-700 border-red-200" },
  pendente: { label: "Pendente", icon: Clock, className: "bg-yellow-100 text-yellow-700 border-yellow-200" },
};

const TIPO_CONFIG: Record<string, { label: string; className: string }> = {
  nfe: { label: "NF-e", className: "bg-blue-100 text-blue-700 border-blue-200" },
  nfse: { label: "NFS-e", className: "bg-purple-100 text-purple-700 border-purple-200" },
  nfce: { label: "NFC-e", className: "bg-cyan-100 text-cyan-700 border-cyan-200" },
};

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function NotasFiscais() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterTipo, setFilterTipo] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailNF, setDetailNF] = useState<NotaFiscalWithCliente | null>(null);
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

  // ---- Data fetching ----

  const { data: notas = [], isLoading } = useQuery({
    queryKey: ["notas_fiscais"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notas_fiscais")
        .select("*, clientes(nome)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as NotaFiscalWithCliente[];
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

  // ---- Mutations ----

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("notas_fiscais").insert({
        tipo: form.tipo as NfTipo,
        numero: form.numero || null,
        valor: Number(form.valor),
        descricao: form.descricao || null,
        cliente_id: form.cliente_id || null,
        status: form.status as NfStatus,
        data_emissao: form.status === "emitida" ? new Date().toISOString().split("T")[0] : null,
        created_by: user?.id,
        pdf_url: pdfUrl || null,
        xml_url: xmlUrl || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notas_fiscais"] });
      toast.success("Nota fiscal criada com sucesso!");
      closeCreateDialog();
    },
    onError: () => toast.error("Erro ao criar nota fiscal"),
  });

  const emitirMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("notas_fiscais")
        .update({
          status: "emitida" as NfStatus,
          data_emissao: new Date().toISOString().split("T")[0],
        })
        .eq("id", id);
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
      const { error } = await supabase
        .from("notas_fiscais")
        .update({ status: "cancelada" as NfStatus })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notas_fiscais"] });
      toast.success("Nota fiscal cancelada!");
      setDetailNF(null);
    },
  });

  // ---- Helpers ----

  function closeCreateDialog() {
    setDialogOpen(false);
    setForm({ tipo: "nfe", numero: "", valor: "", descricao: "", cliente_id: "", status: "pendente" });
    setPdfUrl("");
    setXmlUrl("");
  }

  const fmt = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).then(() => toast.success("Copiado!"));
  }

  // ---- Filtering ----

  const filtered = useMemo(() => {
    return notas.filter((n) => {
      const matchSearch =
        !search ||
        (n.numero ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (n.clientes?.nome ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (n.descricao ?? "").toLowerCase().includes(search.toLowerCase());
      const matchTipo = filterTipo === "all" || n.tipo === filterTipo;
      const matchStatus = filterStatus === "all" || n.status === filterStatus;
      return matchSearch && matchTipo && matchStatus;
    });
  }, [notas, search, filterTipo, filterStatus]);

  // ---- KPIs ----

  const kpis = useMemo(() => {
    const emitidas = notas.filter((n) => n.status === "emitida");
    const pendentes = notas.filter((n) => n.status === "pendente");
    const totalEmitidas = emitidas.reduce((s, n) => s + Number(n.valor), 0);
    const totalPendentes = pendentes.reduce((s, n) => s + Number(n.valor), 0);
    return {
      total: notas.length,
      emitidas: emitidas.length,
      totalEmitidas,
      totalPendentes,
      pendentes: pendentes.length,
    };
  }, [notas]);

  // ---- Status/Tipo badges ----

  const getStatusBadge = (status: string) => {
    const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.pendente;
    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${config.className}`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </span>
    );
  };

  const getTipoBadge = (tipo: string) => {
    const config = TIPO_CONFIG[tipo] ?? TIPO_CONFIG.nfe;
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${config.className}`}>
        {config.label}
      </span>
    );
  };

  // ---- Render ----

  return (
    <AppLayout>
      <div className="p-4 md:p-6 space-y-6 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Notas Fiscais</h1>
            <p className="text-sm text-muted-foreground">Gestao de notas fiscais eletronicas</p>
          </div>
          <Button onClick={() => setDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Nova NF
          </Button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <Receipt className="h-4 w-4 text-primary" />
              <span className="text-xs font-medium text-muted-foreground">Total NFs</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{kpis.total}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <span className="text-xs font-medium text-muted-foreground">Emitidas</span>
            </div>
            <p className="text-2xl font-bold text-emerald-600">{kpis.emitidas}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{fmt(kpis.totalEmitidas)}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-yellow-500" />
              <span className="text-xs font-medium text-muted-foreground">Pendentes</span>
            </div>
            <p className="text-2xl font-bold text-yellow-600">{kpis.pendentes}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{fmt(kpis.totalPendentes)}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="h-4 w-4 text-blue-500" />
              <span className="text-xs font-medium text-muted-foreground">Valor Total</span>
            </div>
            <p className="text-2xl font-bold text-blue-600">
              {fmt(notas.reduce((s, n) => s + Number(n.valor), 0))}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar nota fiscal..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterTipo} onValueChange={setFilterTipo}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos tipos</SelectItem>
              <SelectItem value="nfe">NF-e</SelectItem>
              <SelectItem value="nfse">NFS-e</SelectItem>
              <SelectItem value="nfce">NFC-e</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos status</SelectItem>
              <SelectItem value="emitida">Emitida</SelectItem>
              <SelectItem value="pendente">Pendente</SelectItem>
              <SelectItem value="cancelada">Cancelada</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
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
          <div className="rounded-xl border border-border overflow-hidden bg-card">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/40 border-b border-border">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Numero</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Tipo</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Cliente</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Emissao</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide">Valor</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Arquivos</th>
                    <th className="px-4 py-3 w-10" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {filtered.map((nf) => {
                    const hasFiles = nf.pdf_url || nf.xml_url;
                    return (
                      <tr
                        key={nf.id}
                        className="hover:bg-muted/30 transition-colors cursor-pointer"
                        onClick={() => setDetailNF(nf)}
                      >
                        <td className="px-4 py-3">
                          <p className="font-medium text-foreground">{nf.numero || "Sem numero"}</p>
                        </td>
                        <td className="px-4 py-3">{getTipoBadge(nf.tipo)}</td>
                        <td className="px-4 py-3">{getStatusBadge(nf.status)}</td>
                        <td className="px-4 py-3 text-muted-foreground">{nf.clientes?.nome || "--"}</td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">
                          {nf.data_emissao
                            ? new Date(nf.data_emissao).toLocaleDateString("pt-BR")
                            : "--"}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-foreground">
                          {fmt(Number(nf.valor))}
                        </td>
                        <td className="px-4 py-3">
                          {hasFiles ? (
                            <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                              {nf.pdf_url && (
                                <a
                                  href={nf.pdf_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="h-6 px-2 rounded border border-border flex items-center gap-1 hover:bg-muted transition-colors text-[10px] font-medium text-foreground"
                                >
                                  <Download className="h-3 w-3" /> PDF
                                </a>
                              )}
                              {nf.xml_url && (
                                <a
                                  href={nf.xml_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="h-6 px-2 rounded border border-border flex items-center gap-1 hover:bg-muted transition-colors text-[10px] font-medium text-foreground"
                                >
                                  <Download className="h-3 w-3" /> XML
                                </a>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground/50">--</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <FileText className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {/* Summary footer */}
            <div className="border-t border-border bg-muted/30 px-4 py-2.5 flex items-center justify-between text-xs text-muted-foreground">
              <span>{filtered.length} nota{filtered.length !== 1 ? "s" : ""} fiscal{filtered.length !== 1 ? "is" : ""}</span>
              <span className="font-semibold text-foreground">
                Total: {fmt(filtered.reduce((s, n) => s + Number(n.valor), 0))}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Detail dialog */}
      <Dialog open={!!detailNF} onOpenChange={(o) => !o && setDetailNF(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-primary" />
              {detailNF?.numero || "Nota Fiscal"}
            </DialogTitle>
          </DialogHeader>
          {detailNF && (
            <div className="space-y-4">
              {/* Badges */}
              <div className="flex items-center gap-2">
                {getTipoBadge(detailNF.tipo)}
                {getStatusBadge(detailNF.status)}
              </div>

              {/* Info grid */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Cliente</p>
                  <p className="font-medium text-foreground">{detailNF.clientes?.nome || "--"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Valor</p>
                  <p className="font-bold text-foreground text-lg">{fmt(Number(detailNF.valor))}</p>
                </div>
                {detailNF.data_emissao && (
                  <div>
                    <p className="text-xs text-muted-foreground">Data de Emissao</p>
                    <p className="font-medium text-foreground">
                      {new Date(detailNF.data_emissao).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                )}
                {detailNF.descricao && (
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground">Descricao</p>
                    <p className="text-foreground">{detailNF.descricao}</p>
                  </div>
                )}
              </div>

              {/* File links */}
              {(detailNF.pdf_url || detailNF.xml_url) && (
                <div className="flex gap-2 pt-1">
                  {detailNF.pdf_url && (
                    <a
                      href={detailNF.pdf_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors text-xs font-medium"
                    >
                      <Download className="h-3.5 w-3.5" /> Baixar PDF
                    </a>
                  )}
                  {detailNF.xml_url && (
                    <a
                      href={detailNF.xml_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors text-xs font-medium"
                    >
                      <Download className="h-3.5 w-3.5" /> Baixar XML
                    </a>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-2 border-t border-border">
                {detailNF.status === "pendente" && (
                  <Button
                    size="sm"
                    onClick={() => emitirMutation.mutate(detailNF.id)}
                    disabled={emitirMutation.isPending}
                    className="gap-1"
                  >
                    {emitirMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <FileText className="h-4 w-4" />
                    )}
                    Emitir
                  </Button>
                )}
                {detailNF.status !== "cancelada" && (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => cancelarMutation.mutate(detailNF.id)}
                    disabled={cancelarMutation.isPending}
                    className="gap-1"
                  >
                    {cancelarMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <XCircle className="h-4 w-4" />
                    )}
                    Cancelar NF
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create dialog */}
      <Dialog open={dialogOpen} onOpenChange={(o) => !o && closeCreateDialog()}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-primary" />
              Nova Nota Fiscal
            </DialogTitle>
            <DialogDescription>Preencha os dados e anexe os arquivos da nota fiscal.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Tipo</Label>
                <Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nfe">NF-e (Produto)</SelectItem>
                    <SelectItem value="nfse">NFS-e (Servico)</SelectItem>
                    <SelectItem value="nfce">NFC-e (Consumidor)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Numero</Label>
                <Input
                  value={form.numero}
                  onChange={(e) => setForm({ ...form, numero: e.target.value })}
                  placeholder="NF-e 001234"
                  className="mt-1"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>
                  Valor (R$) <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="number"
                  value={form.valor}
                  onChange={(e) => setForm({ ...form, valor: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Cliente</Label>
                <Select value={form.cliente_id} onValueChange={(v) => setForm({ ...form, cliente_id: v })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {clientes.map((c: { id: string; nome: string }) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="emitida">Emitida</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Descricao</Label>
              <Textarea
                value={form.descricao}
                onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                rows={2}
                className="mt-1"
              />
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
            <Button variant="outline" onClick={() => closeCreateDialog()}>
              Cancelar
            </Button>
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending || !form.valor}
              className="gap-2"
            >
              {saveMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Criar Nota Fiscal"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
