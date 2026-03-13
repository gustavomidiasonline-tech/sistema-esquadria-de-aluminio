import { AppLayout } from "@/components/AppLayout";
import { MapPin, Phone, User, RotateCcw, DollarSign, FileText, Printer, Search, Plus, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useSupabaseQuery, useSupabaseInsert, useSupabaseUpdate } from "@/hooks/useSupabaseQuery";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { differenceInDays, parseISO, format, isAfter, isBefore } from "date-fns";

const actionButtons = [
  { icon: RotateCcw, label: "Reagendar" },
  { icon: DollarSign, label: "Pagamentos" },
  { icon: FileText, label: "Contrato" },
  { icon: Printer, label: "Impressões" },
];

const statusLabels: Record<string, string> = {
  agendado: "AGENDADO", em_andamento: "EM ANDAMENTO", concluido: "CONCLUÍDO", cancelado: "CANCELADO",
};

const Servicos = () => {
  const { user } = useAuth();
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
                      {actionButtons.map((btn) => (
                        <button key={btn.label} className="flex flex-col items-center gap-1 text-muted-foreground hover:text-primary transition-colors group">
                          <div className="h-9 w-9 rounded-lg border border-border flex items-center justify-center group-hover:border-primary/30 group-hover:bg-primary/5 transition-colors"><btn.icon className="h-4 w-4" /></div>
                          <span className="text-[10px]">{btn.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
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
    </AppLayout>
  );
};

export default Servicos;
