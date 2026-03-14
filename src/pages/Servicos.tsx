import { AppLayout } from "@/components/AppLayout";
import { MapPin, Phone, User, RotateCcw, DollarSign, FileText, Printer, Search, Plus, Filter } from "lucide-react";
import { ServiceWorkflow } from "@/components/servicos/ServiceWorkflow";
import { ServicosKPIs } from "@/components/servicos/ServicosKPIs";
import { Button } from "@/components/ui/button";
import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useSupabaseQuery, useSupabaseInsert, useSupabaseUpdate } from "@/hooks/useSupabaseQuery";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { differenceInDays, parseISO, format, isAfter, isBefore } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

const statusLabels: Record<string, string> = {
  agendado: "AGENDADO", em_andamento: "EM ANDAMENTO", concluido: "CONCLUÍDO", cancelado: "CANCELADO",
};

const Servicos = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: servicos = [], isLoading } = useSupabaseQuery("servicos", {
    select: "*, clientes(nome, endereco, telefone, cidade, estado)",
    orderBy: { column: "created_at", ascending: false },
  });
  const { data: clientes = [] } = useSupabaseQuery("clientes");
  const insertMutation = useSupabaseInsert("servicos");
  const updateMutation = useSupabaseUpdate("servicos");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [form, setForm] = useState({ cliente_id: "", tipo: "instalacao", descricao: "", valor: "", data_agendada: "", responsavel: "" });

  // Action dialogs
  const [reagendarDialog, setReagendarDialog] = useState<any>(null);
  const [reagendarDate, setReagendarDate] = useState("");
  const [pagamentoDialog, setPagamentoDialog] = useState<any>(null);
  const [pagForm, setPagForm] = useState({ valor: "", forma_pagamento: "pix", observacoes: "" });
  const [contratoDialog, setContratoDialog] = useState<any>(null);
  const [contratoForm, setContratoForm] = useState({ titulo: "", descricao: "", valor: "" });
  const printRef = useRef<HTMLDivElement>(null);

  const handleCriar = async () => {
    if (!form.cliente_id) { toast.error("Selecione um cliente"); return; }
    try {
      await insertMutation.mutateAsync({
        cliente_id: form.cliente_id, tipo: form.tipo, descricao: form.descricao,
        valor: Number(form.valor) || 0, data_agendada: form.data_agendada || null,
        responsavel: form.responsavel, created_by: user?.id,
      });
      toast.success("Serviço criado!");
      setForm({ cliente_id: "", tipo: "instalacao", descricao: "", valor: "", data_agendada: "", responsavel: "" });
      setDialogOpen(false);
    } catch {}
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const values: any = { status: newStatus };
      if (newStatus === "concluido") values.data_conclusao = new Date().toISOString().split("T")[0];
      await updateMutation.mutateAsync({ id, values });
      toast.success("Status atualizado!");
    } catch {}
  };

  // === REAGENDAR ===
  const handleReagendar = async () => {
    if (!reagendarDialog || !reagendarDate) { toast.error("Selecione uma data"); return; }
    try {
      await updateMutation.mutateAsync({ id: reagendarDialog.id, values: { data_agendada: reagendarDate } });
      toast.success("Serviço reagendado!");
      setReagendarDialog(null);
      setReagendarDate("");
    } catch {}
  };

  // === PAGAMENTO ===
  const handleRegistrarPagamento = async () => {
    if (!pagamentoDialog || !pagForm.valor) { toast.error("Informe o valor"); return; }
    try {
      const { error } = await supabase.from("pagamentos").insert({
        descricao: `Pagamento Serviço #${pagamentoDialog.numero}`,
        valor: Number(pagForm.valor),
        tipo: "entrada",
        forma_pagamento: pagForm.forma_pagamento,
        observacoes: pagForm.observacoes,
        cliente_id: pagamentoDialog.cliente_id,
        created_by: user?.id,
      });
      if (error) throw error;
      toast.success("Pagamento registrado!");
      setPagamentoDialog(null);
      setPagForm({ valor: "", forma_pagamento: "pix", observacoes: "" });
      queryClient.invalidateQueries({ queryKey: ["pagamentos"] });
    } catch (e: any) {
      toast.error("Erro: " + e.message);
    }
  };

  // === CONTRATO ===
  const handleCriarContrato = async () => {
    if (!contratoDialog || !contratoForm.titulo) { toast.error("Informe o título"); return; }
    try {
      const { error } = await supabase.from("contratos").insert({
        titulo: contratoForm.titulo,
        descricao: contratoForm.descricao || `Contrato ref. Serviço #${contratoDialog.numero}`,
        valor: Number(contratoForm.valor) || Number(contratoDialog.valor) || 0,
        cliente_id: contratoDialog.cliente_id,
        status: "rascunho",
        created_by: user?.id,
      });
      if (error) throw error;
      toast.success("Contrato criado!");
      setContratoDialog(null);
      setContratoForm({ titulo: "", descricao: "", valor: "" });
      queryClient.invalidateQueries({ queryKey: ["contratos"] });
    } catch (e: any) {
      toast.error("Erro: " + e.message);
    }
  };

  // === IMPRESSÃO ===
  const handleImprimir = (servico: any) => {
    const cliente = servico.clientes;
    const content = `
      <html><head><title>Serviço #${servico.numero}</title>
      <style>body{font-family:Arial,sans-serif;padding:40px;color:#333}
      h1{font-size:22px;border-bottom:2px solid #7c3aed;padding-bottom:8px}
      .info{margin:16px 0;line-height:1.8}.label{font-weight:bold;color:#555}
      .valor{font-size:24px;color:#7c3aed;font-weight:bold;margin:16px 0}
      table{width:100%;border-collapse:collapse;margin-top:20px}
      td{padding:8px 12px;border:1px solid #ddd}
      .header{background:#f5f3ff;font-weight:bold}</style></head>
      <body>
        <h1>ORDEM DE SERVIÇO #${servico.numero}</h1>
        <div class="info">
          <p><span class="label">Cliente:</span> ${cliente?.nome || "—"}</p>
          <p><span class="label">Endereço:</span> ${cliente?.endereco || "—"}${cliente?.cidade ? `, ${cliente.cidade}` : ""}</p>
          <p><span class="label">Telefone:</span> ${cliente?.telefone || "—"}</p>
          <p><span class="label">Responsável:</span> ${servico.responsavel || "—"}</p>
          <p><span class="label">Tipo:</span> ${servico.tipo || "—"}</p>
          <p><span class="label">Status:</span> ${statusLabels[servico.status] || servico.status}</p>
          <p><span class="label">Data Agendada:</span> ${servico.data_agendada ? format(parseISO(servico.data_agendada), "dd/MM/yyyy") : "—"}</p>
          <p><span class="label">Descrição:</span> ${servico.descricao || "—"}</p>
        </div>
        <p class="valor">Valor: R$ ${Number(servico.valor || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
        <p style="margin-top:40px;font-size:12px;color:#999">Gerado em ${format(new Date(), "dd/MM/yyyy HH:mm")}</p>
      </body></html>`;
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(content);
      win.document.close();
      win.print();
    }
  };

  const filtered = servicos.filter((s: any) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = !term || s.clientes?.nome?.toLowerCase().includes(term) || String(s.numero).includes(term);
    const matchesStatus = statusFilter === "todos" || s.status === statusFilter;
    const createdDate = parseISO(s.created_at);
    const matchesDateFrom = !dateFrom || isAfter(createdDate, parseISO(dateFrom));
    const matchesDateTo = !dateTo || isBefore(createdDate, parseISO(dateTo + "T23:59:59"));
    return matchesSearch && matchesStatus && matchesDateFrom && matchesDateTo;
  });

  const getDaysInfo = (date: string | null) => {
    if (!date) return { label: "", overdue: false };
    const diff = differenceInDays(parseISO(date), new Date());
    if (diff < 0) return { label: `Atrasado ${Math.abs(diff)} dias`, overdue: true };
    if (diff === 0) return { label: "Hoje", overdue: false };
    return { label: `Faltam ${diff} dias`, overdue: false };
  };

  const fmt = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
  const activeFilters = (statusFilter !== "todos" ? 1 : 0) + (dateFrom ? 1 : 0) + (dateTo ? 1 : 0);

  return (
    <AppLayout>
      <div className="space-y-4 max-w-7xl">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Serviços</h1>
          <Button className="gap-2" onClick={() => setDialogOpen(true)}><Plus className="h-4 w-4" /> Novo serviço</Button>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input type="text" placeholder="Buscar serviço..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2.5 text-sm bg-card border border-border rounded-lg w-full outline-none focus:ring-2 focus:ring-primary/30 text-foreground placeholder:text-muted-foreground" />
          </div>
          <Button variant="outline" size="sm" className="gap-2" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="h-4 w-4" /> Filtros {activeFilters > 0 && <span className="bg-primary text-primary-foreground text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">{activeFilters}</span>}
          </Button>
        </div>

        {showFilters && (
          <div className="flex items-end gap-3 flex-wrap bg-card border border-border rounded-xl p-4">
            <div><Label className="text-xs">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40 mt-1 h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="agendado">Agendado</SelectItem>
                  <SelectItem value="em_andamento">Em Andamento</SelectItem>
                  <SelectItem value="concluido">Concluído</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select></div>
            <div><Label className="text-xs">Data de</Label><Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="mt-1 h-9 w-40" /></div>
            <div><Label className="text-xs">Data até</Label><Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="mt-1 h-9 w-40" /></div>
            <Button variant="ghost" size="sm" onClick={() => { setStatusFilter("todos"); setDateFrom(""); setDateTo(""); }}>Limpar</Button>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">Nenhum serviço encontrado.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((servico: any) => {
              const days = getDaysInfo(servico.data_agendada);
              const cliente = servico.clientes;
              return (
                <div key={servico.id} className="bg-card border border-border rounded-xl shadow-sm flex flex-col">
                  <div className="p-4 pb-2 space-y-2">
                    <h3 className="text-base font-bold text-foreground">SERVIÇO #{servico.numero}</h3>
                    <div className="space-y-1 text-xs text-muted-foreground">
                      <div className="flex items-start gap-1.5"><User className="h-3.5 w-3.5 mt-0.5 shrink-0" /><span className="font-medium text-foreground">{cliente?.nome || "Sem cliente"}</span></div>
                      {cliente?.endereco && <div className="flex items-start gap-1.5"><MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" /><span>{cliente.endereco}{cliente.cidade ? `, ${cliente.cidade}` : ""}</span></div>}
                      {cliente?.telefone && <div className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 shrink-0" /><span>{cliente.telefone}</span></div>}
                    </div>
                    <div className="text-xs space-y-0.5">
                      {servico.responsavel && <p className="text-muted-foreground"><span className="font-medium text-foreground">Responsável:</span> {servico.responsavel}</p>}
                      <div className="flex items-center justify-between">
                        {servico.data_agendada && <p className="text-muted-foreground"><span className="font-medium text-foreground">Previsão:</span> {format(parseISO(servico.data_agendada), "dd/MM/yyyy")}</p>}
                        {days.label && <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${days.overdue ? "border-destructive/30 bg-destructive/10 text-destructive" : "border-success/30 bg-success/10 text-success"}`}>{days.label}</span>}
                      </div>
                    </div>
                    <div className="flex items-end justify-between">
                      <p className={`text-lg font-bold ${days.overdue ? "text-destructive" : "text-primary"}`}>{fmt(Number(servico.valor) || 0)}</p>
                      <p className="text-[10px] text-muted-foreground">{format(parseISO(servico.created_at), "dd/MM/yyyy HH:mm")}</p>
                    </div>
                  </div>
                  <div className="px-4 py-2 border-t border-border">
                    <p className="text-xs font-bold text-foreground">{statusLabels[servico.status] || servico.status}</p>
                    {servico.tipo && <p className="text-[10px] text-muted-foreground mt-0.5">Tipo: {servico.tipo}</p>}
                    {servico.descricao && <p className="text-[10px] text-muted-foreground">{servico.descricao}</p>}
                  </div>
                  <div className="px-4 py-3 border-t border-border">
                    <div className="flex items-center justify-between">
                      <button onClick={() => { setReagendarDialog(servico); setReagendarDate(servico.data_agendada || ""); }} className="flex flex-col items-center gap-1 text-muted-foreground hover:text-primary transition-colors group">
                        <div className="h-9 w-9 rounded-lg border border-border flex items-center justify-center group-hover:border-primary/30 group-hover:bg-primary/5 transition-colors"><RotateCcw className="h-4 w-4" /></div>
                        <span className="text-[10px]">Reagendar</span>
                      </button>
                      <button onClick={() => { setPagamentoDialog(servico); setPagForm({ valor: String(servico.valor || ""), forma_pagamento: "pix", observacoes: "" }); }} className="flex flex-col items-center gap-1 text-muted-foreground hover:text-primary transition-colors group">
                        <div className="h-9 w-9 rounded-lg border border-border flex items-center justify-center group-hover:border-primary/30 group-hover:bg-primary/5 transition-colors"><DollarSign className="h-4 w-4" /></div>
                        <span className="text-[10px]">Pagamentos</span>
                      </button>
                      <button onClick={() => { setContratoDialog(servico); setContratoForm({ titulo: `Contrato Serviço #${servico.numero}`, descricao: servico.descricao || "", valor: String(servico.valor || "") }); }} className="flex flex-col items-center gap-1 text-muted-foreground hover:text-primary transition-colors group">
                        <div className="h-9 w-9 rounded-lg border border-border flex items-center justify-center group-hover:border-primary/30 group-hover:bg-primary/5 transition-colors"><FileText className="h-4 w-4" /></div>
                        <span className="text-[10px]">Contrato</span>
                      </button>
                      <button onClick={() => handleImprimir(servico)} className="flex flex-col items-center gap-1 text-muted-foreground hover:text-primary transition-colors group">
                        <div className="h-9 w-9 rounded-lg border border-border flex items-center justify-center group-hover:border-primary/30 group-hover:bg-primary/5 transition-colors"><Printer className="h-4 w-4" /></div>
                        <span className="text-[10px]">Impressões</span>
                      </button>
                    </div>
                  </div>
                  <ServiceWorkflow servicoId={servico.id} servicoStatus={servico.status} />
                  <div className="flex gap-2 p-4 pt-0 mt-auto">
                    {servico.status !== "cancelado" && <button onClick={() => handleStatusChange(servico.id, "cancelado")} className="flex-1 py-2 text-xs font-medium rounded-lg border border-border text-foreground hover:bg-muted transition-colors">Cancelar</button>}
                    {servico.status !== "concluido" && servico.status !== "cancelado" && (
                      <button onClick={() => handleStatusChange(servico.id, servico.status === "agendado" ? "em_andamento" : "concluido")}
                        className="flex-1 py-2 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
                        {servico.status === "agendado" ? "Iniciar serviço" : "Concluir serviço"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Dialog Novo Serviço */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo Serviço</DialogTitle><DialogDescription>Crie um novo serviço vinculado a um cliente.</DialogDescription></DialogHeader>
          <div className="space-y-3 py-2">
            <div><Label>Cliente <span className="text-destructive">*</span></Label>
              <Select value={form.cliente_id} onValueChange={(v) => setForm({ ...form, cliente_id: v })}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{clientes.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
              </Select></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Tipo</Label>
                <Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v })}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="instalacao">Instalação</SelectItem><SelectItem value="manutencao">Manutenção</SelectItem>
                    <SelectItem value="reparo">Reparo</SelectItem><SelectItem value="medicao">Medição</SelectItem><SelectItem value="entrega">Entrega</SelectItem>
                  </SelectContent></Select></div>
              <div><Label>Valor (R$)</Label><Input type="number" value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })} className="mt-1" placeholder="0,00" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Data Agendada</Label><Input type="date" value={form.data_agendada} onChange={(e) => setForm({ ...form, data_agendada: e.target.value })} className="mt-1" /></div>
              <div><Label>Responsável</Label><Input value={form.responsavel} onChange={(e) => setForm({ ...form, responsavel: e.target.value })} className="mt-1" /></div>
            </div>
            <div><Label>Descrição</Label><Textarea value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} className="mt-1" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleCriar} disabled={insertMutation.isPending}>{insertMutation.isPending ? "Salvando..." : "Criar serviço"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Reagendar */}
      <Dialog open={!!reagendarDialog} onOpenChange={() => setReagendarDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reagendar Serviço #{reagendarDialog?.numero}</DialogTitle>
            <DialogDescription>Selecione a nova data para o serviço.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label>Nova data agendada</Label>
              <Input type="date" value={reagendarDate} onChange={(e) => setReagendarDate(e.target.value)} className="mt-1" />
            </div>
            {reagendarDialog?.data_agendada && (
              <p className="text-xs text-muted-foreground">Data atual: {format(parseISO(reagendarDialog.data_agendada), "dd/MM/yyyy")}</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReagendarDialog(null)}>Cancelar</Button>
            <Button onClick={handleReagendar} disabled={updateMutation.isPending}>Reagendar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Pagamento */}
      <Dialog open={!!pagamentoDialog} onOpenChange={() => setPagamentoDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar Pagamento - Serviço #{pagamentoDialog?.numero}</DialogTitle>
            <DialogDescription>Registre um pagamento vinculado a este serviço.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label>Valor (R$) <span className="text-destructive">*</span></Label>
              <Input type="number" value={pagForm.valor} onChange={(e) => setPagForm({ ...pagForm, valor: e.target.value })} className="mt-1" placeholder="0,00" />
            </div>
            <div>
              <Label>Forma de pagamento</Label>
              <Select value={pagForm.forma_pagamento} onValueChange={(v) => setPagForm({ ...pagForm, forma_pagamento: v })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pix">PIX</SelectItem>
                  <SelectItem value="dinheiro">Dinheiro</SelectItem>
                  <SelectItem value="cartao_credito">Cartão de Crédito</SelectItem>
                  <SelectItem value="cartao_debito">Cartão de Débito</SelectItem>
                  <SelectItem value="boleto">Boleto</SelectItem>
                  <SelectItem value="transferencia">Transferência</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Observações</Label>
              <Textarea value={pagForm.observacoes} onChange={(e) => setPagForm({ ...pagForm, observacoes: e.target.value })} className="mt-1" placeholder="Observações opcionais..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPagamentoDialog(null)}>Cancelar</Button>
            <Button onClick={handleRegistrarPagamento}>Registrar Pagamento</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Contrato */}
      <Dialog open={!!contratoDialog} onOpenChange={() => setContratoDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Gerar Contrato - Serviço #{contratoDialog?.numero}</DialogTitle>
            <DialogDescription>Crie um contrato vinculado ao cliente deste serviço.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label>Título <span className="text-destructive">*</span></Label>
              <Input value={contratoForm.titulo} onChange={(e) => setContratoForm({ ...contratoForm, titulo: e.target.value })} className="mt-1" />
            </div>
            <div>
              <Label>Valor (R$)</Label>
              <Input type="number" value={contratoForm.valor} onChange={(e) => setContratoForm({ ...contratoForm, valor: e.target.value })} className="mt-1" />
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea value={contratoForm.descricao} onChange={(e) => setContratoForm({ ...contratoForm, descricao: e.target.value })} className="mt-1" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setContratoDialog(null)}>Cancelar</Button>
            <Button onClick={handleCriarContrato}>Criar Contrato</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default Servicos;
