import { useState, useMemo } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useSupabaseQuery, useSupabaseInsert } from "@/hooks/useSupabaseQuery";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { format, parseISO, differenceInDays, isAfter, isBefore } from "date-fns";
import { FileUpload } from "@/components/shared/FileUpload";
import {
  Plus, FileCheck, Download, Search, Calendar, AlertTriangle,
  CheckCircle2, XCircle, Clock, Loader2, DollarSign, FileText,
} from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ContratoWithCliente = Tables<"contratos"> & { clientes: { nome: string } | null };

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STATUS_CONFIG: Record<string, { label: string; icon: typeof CheckCircle2; className: string }> = {
  ativo: { label: "Ativo", icon: CheckCircle2, className: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  encerrado: { label: "Encerrado", icon: FileCheck, className: "bg-slate-100 text-slate-600 border-slate-200" },
  rascunho: { label: "Rascunho", icon: Clock, className: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  cancelado: { label: "Cancelado", icon: XCircle, className: "bg-red-100 text-red-700 border-red-200" },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function calcVigencia(dataInicio: string | null, dataFim: string | null): { percent: number; daysLeft: number; color: string } {
  if (!dataInicio || !dataFim) return { percent: 0, daysLeft: 0, color: "bg-gray-300" };
  const start = parseISO(dataInicio);
  const end = parseISO(dataFim);
  const now = new Date();

  const totalDays = differenceInDays(end, start);
  if (totalDays <= 0) return { percent: 100, daysLeft: 0, color: "bg-red-500" };

  const elapsed = differenceInDays(now, start);
  const percent = Math.min(100, Math.max(0, (elapsed / totalDays) * 100));
  const daysLeft = Math.max(0, differenceInDays(end, now));

  let color = "bg-emerald-500";
  if (percent >= 90) color = "bg-red-500";
  else if (percent >= 70) color = "bg-yellow-500";

  return { percent, daysLeft, color };
}

function getVencimentoBadge(dataFim: string | null): React.ReactNode {
  if (!dataFim) return null;
  const end = parseISO(dataFim);
  const now = new Date();
  const daysLeft = differenceInDays(end, now);

  if (daysLeft < 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border bg-red-100 text-red-700 border-red-200">
        <AlertTriangle className="h-3 w-3" />
        Vencido
      </span>
    );
  }
  if (daysLeft <= 30) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border bg-yellow-100 text-yellow-700 border-yellow-200">
        <AlertTriangle className="h-3 w-3" />
        {daysLeft}d restantes
      </span>
    );
  }
  return null;
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

const Contratos = () => {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("geral");
  const [form, setForm] = useState({
    titulo: "",
    cliente_id: "",
    valor: "",
    data_inicio: "",
    data_fim: "",
    descricao: "",
    status: "rascunho" as string,
  });
  const [arquivoUrl, setArquivoUrl] = useState("");
  const [detailContrato, setDetailContrato] = useState<ContratoWithCliente | null>(null);

  // ---- Data fetching ----

  const { data: contratos = [], isLoading } = useSupabaseQuery("contratos", {
    select: "*, clientes(nome)",
    orderBy: { column: "created_at", ascending: false },
  });
  const { data: clientes = [] } = useSupabaseQuery("clientes");
  const insertMutation = useSupabaseInsert("contratos");

  // ---- Handlers ----

  const handleSave = async () => {
    if (!form.titulo.trim()) {
      toast.error("Preencha o titulo do contrato");
      return;
    }
    try {
      await insertMutation.mutateAsync({
        titulo: form.titulo,
        cliente_id: form.cliente_id || null,
        valor: Number(form.valor) || null,
        data_inicio: form.data_inicio || null,
        data_fim: form.data_fim || null,
        descricao: form.descricao || null,
        status: form.status as Tables<"contratos">["status"],
        arquivo_url: arquivoUrl || null,
        created_by: user?.id,
      });
      toast.success("Contrato criado com sucesso!");
      closeDialog();
    } catch {
      // error handled by useSupabaseInsert
    }
  };

  function closeDialog() {
    setDialogOpen(false);
    setForm({ titulo: "", cliente_id: "", valor: "", data_inicio: "", data_fim: "", descricao: "", status: "rascunho" });
    setArquivoUrl("");
    setActiveTab("geral");
  }

  const fmt = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

  // ---- Filtering ----

  const filtered = useMemo(() => {
    return (contratos as ContratoWithCliente[]).filter((c) => {
      const matchSearch =
        !search ||
        c.titulo.toLowerCase().includes(search.toLowerCase()) ||
        (c.clientes?.nome ?? "").toLowerCase().includes(search.toLowerCase());
      const matchStatus = filterStatus === "all" || c.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [contratos, search, filterStatus]);

  // ---- KPIs ----

  const kpis = useMemo(() => {
    const typed = contratos as ContratoWithCliente[];
    const ativos = typed.filter((c) => c.status === "ativo");
    const vencendo = typed.filter((c) => {
      if (c.status !== "ativo" || !c.data_fim) return false;
      const daysLeft = differenceInDays(parseISO(c.data_fim), new Date());
      return daysLeft >= 0 && daysLeft <= 30;
    });
    const valorAtivo = ativos.reduce((s, c) => s + (Number(c.valor) || 0), 0);
    return {
      total: typed.length,
      ativos: ativos.length,
      vencendo: vencendo.length,
      valorAtivo,
    };
  }, [contratos]);

  // ---- Status badge ----

  const getStatusBadge = (status: string) => {
    const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.rascunho;
    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${config.className}`}>
        <Icon className="h-3 w-3" />
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
            <h1 className="text-2xl font-bold text-foreground">Contratos</h1>
            <p className="text-sm text-muted-foreground">Gestao de contratos e vigencias</p>
          </div>
          <Button className="gap-2" onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4" /> Novo contrato
          </Button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <FileCheck className="h-4 w-4 text-primary" />
              <span className="text-xs font-medium text-muted-foreground">Total</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{kpis.total}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <span className="text-xs font-medium text-muted-foreground">Ativos</span>
            </div>
            <p className="text-2xl font-bold text-emerald-600">{kpis.ativos}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className={`h-4 w-4 ${kpis.vencendo > 0 ? "text-red-500" : "text-yellow-500"}`} />
              <span className="text-xs font-medium text-muted-foreground">Vencendo 30d</span>
            </div>
            <p className={`text-2xl font-bold ${kpis.vencendo > 0 ? "text-red-600" : "text-yellow-600"}`}>
              {kpis.vencendo}
            </p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="h-4 w-4 text-blue-500" />
              <span className="text-xs font-medium text-muted-foreground">Valor Ativo</span>
            </div>
            <p className="text-2xl font-bold text-blue-600">{fmt(kpis.valorAtivo)}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar contrato..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos status</SelectItem>
              <SelectItem value="ativo">Ativo</SelectItem>
              <SelectItem value="encerrado">Encerrado</SelectItem>
              <SelectItem value="rascunho">Rascunho</SelectItem>
              <SelectItem value="cancelado">Cancelado</SelectItem>
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
            <FileCheck className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>Nenhum contrato encontrado.</p>
          </div>
        ) : (
          <div className="rounded-xl border border-border overflow-hidden bg-card">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/40 border-b border-border">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Titulo</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Cliente</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Vigencia</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide">Valor</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Alerta</th>
                    <th className="px-4 py-3 w-20" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {filtered.map((c: ContratoWithCliente) => {
                    const vigencia = calcVigencia(c.data_inicio, c.data_fim);
                    const vencBadge = c.status === "ativo" ? getVencimentoBadge(c.data_fim) : null;
                    return (
                      <tr
                        key={c.id}
                        className="hover:bg-muted/30 transition-colors cursor-pointer"
                        onClick={() => setDetailContrato(c)}
                      >
                        <td className="px-4 py-3">
                          <p className="font-medium text-foreground">{c.titulo}</p>
                        </td>
                        <td className="px-4 py-3">{getStatusBadge(c.status)}</td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">
                          {c.clientes?.nome || "--"}
                        </td>
                        <td className="px-4 py-3 min-w-[200px]">
                          {c.data_inicio && c.data_fim ? (
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                                <span>{format(parseISO(c.data_inicio), "dd/MM/yy")}</span>
                                <span>{format(parseISO(c.data_fim), "dd/MM/yy")}</span>
                              </div>
                              <div className="h-2 rounded-full overflow-hidden bg-muted">
                                <div
                                  className={`h-full rounded-full transition-all ${vigencia.color}`}
                                  style={{ width: `${vigencia.percent}%` }}
                                />
                              </div>
                              <p className="text-[10px] text-muted-foreground text-right">
                                {vigencia.daysLeft > 0 ? `${vigencia.daysLeft} dias restantes` : "Vencido"}
                              </p>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground/50">Sem datas</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-foreground">
                          {c.valor ? fmt(Number(c.valor)) : "--"}
                        </td>
                        <td className="px-4 py-3">{vencBadge}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            {c.arquivo_url ? (
                              <a
                                href={c.arquivo_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="h-7 px-2 rounded border border-border flex items-center gap-1 hover:bg-muted transition-colors text-[10px] font-medium text-foreground"
                              >
                                <Download className="h-3 w-3" /> PDF
                              </a>
                            ) : (
                              <Badge variant="secondary" className="text-[10px]">Sem arquivo</Badge>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {/* Footer */}
            <div className="border-t border-border bg-muted/30 px-4 py-2.5 flex items-center justify-between text-xs text-muted-foreground">
              <span>{filtered.length} contrato{filtered.length !== 1 ? "s" : ""}</span>
              <span className="font-semibold text-foreground">
                Valor total: {fmt(filtered.reduce((s, c: ContratoWithCliente) => s + (Number(c.valor) || 0), 0))}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Detail dialog */}
      <Dialog open={!!detailContrato} onOpenChange={(o) => !o && setDetailContrato(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileCheck className="h-5 w-5 text-primary" />
              {detailContrato?.titulo}
            </DialogTitle>
          </DialogHeader>
          {detailContrato && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                {getStatusBadge(detailContrato.status)}
                {detailContrato.status === "ativo" && getVencimentoBadge(detailContrato.data_fim)}
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Cliente</p>
                  <p className="font-medium text-foreground">{detailContrato.clientes?.nome || "--"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Valor</p>
                  <p className="font-bold text-foreground text-lg">
                    {detailContrato.valor ? fmt(Number(detailContrato.valor)) : "--"}
                  </p>
                </div>
                {detailContrato.data_inicio && (
                  <div>
                    <p className="text-xs text-muted-foreground">Inicio</p>
                    <p className="font-medium text-foreground">{format(parseISO(detailContrato.data_inicio), "dd/MM/yyyy")}</p>
                  </div>
                )}
                {detailContrato.data_fim && (
                  <div>
                    <p className="text-xs text-muted-foreground">Fim</p>
                    <p className="font-medium text-foreground">{format(parseISO(detailContrato.data_fim), "dd/MM/yyyy")}</p>
                  </div>
                )}
              </div>

              {/* Vigencia bar */}
              {detailContrato.data_inicio && detailContrato.data_fim && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Vigencia</p>
                  {(() => {
                    const v = calcVigencia(detailContrato.data_inicio, detailContrato.data_fim);
                    return (
                      <>
                        <div className="h-2.5 rounded-full overflow-hidden bg-muted">
                          <div className={`h-full rounded-full transition-all ${v.color}`} style={{ width: `${v.percent}%` }} />
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                          {v.percent.toFixed(0)}% utilizado - {v.daysLeft > 0 ? `${v.daysLeft} dias restantes` : "Vencido"}
                        </p>
                      </>
                    );
                  })()}
                </div>
              )}

              {detailContrato.descricao && (
                <div>
                  <p className="text-xs text-muted-foreground">Descricao</p>
                  <p className="text-sm text-foreground mt-1">{detailContrato.descricao}</p>
                </div>
              )}

              {detailContrato.arquivo_url && (
                <a
                  href={detailContrato.arquivo_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors text-xs font-medium"
                >
                  <Download className="h-3.5 w-3.5" /> Baixar documento
                </a>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create dialog */}
      <Dialog open={dialogOpen} onOpenChange={(o) => !o && closeDialog()}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileCheck className="h-5 w-5 text-primary" />
              Novo Contrato
            </DialogTitle>
            <DialogDescription>Crie um novo contrato e anexe o documento.</DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="geral">Geral</TabsTrigger>
              <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
              <TabsTrigger value="documento">Documento</TabsTrigger>
            </TabsList>

            <TabsContent value="geral" className="space-y-3 mt-4">
              <div>
                <Label>Titulo <span className="text-destructive">*</span></Label>
                <Input
                  value={form.titulo}
                  onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                  placeholder="Ex: Contrato de fornecimento de perfis"
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
                    {(clientes as Tables<"clientes">[]).map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rascunho">Rascunho</SelectItem>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="encerrado">Encerrado</SelectItem>
                    <SelectItem value="cancelado">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            <TabsContent value="financeiro" className="space-y-3 mt-4">
              <div>
                <Label>Valor (R$)</Label>
                <Input
                  type="number"
                  value={form.valor}
                  onChange={(e) => setForm({ ...form, valor: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Data Inicio</Label>
                  <Input
                    type="date"
                    value={form.data_inicio}
                    onChange={(e) => setForm({ ...form, data_inicio: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Data Fim</Label>
                  <Input
                    type="date"
                    value={form.data_fim}
                    onChange={(e) => setForm({ ...form, data_fim: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="documento" className="space-y-3 mt-4">
              <div>
                <Label>Descricao / Clausulas</Label>
                <Textarea
                  value={form.descricao}
                  onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                  rows={4}
                  placeholder="Descricao do contrato, clausulas principais..."
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Arquivo do contrato</Label>
                <FileUpload
                  bucket="contratos"
                  folder={user?.id}
                  onUploadComplete={(url) => setArquivoUrl(url)}
                  accept=".pdf,.doc,.docx"
                  className="mt-1"
                />
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancelar</Button>
            <Button onClick={handleSave} disabled={insertMutation.isPending} className="gap-2">
              {insertMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Criar contrato"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default Contratos;
