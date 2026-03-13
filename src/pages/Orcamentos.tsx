import { AppLayout } from "@/components/AppLayout";
import { Plus, Search, Filter } from "lucide-react";
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
import { format, parseISO, isAfter, isBefore } from "date-fns";

const statusColor: Record<string, string> = {
  aprovado: "bg-success/10 text-success", rascunho: "bg-muted text-muted-foreground",
  enviado: "bg-primary/10 text-primary", rejeitado: "bg-destructive/10 text-destructive", expirado: "bg-warning/10 text-warning",
};
const statusLabel: Record<string, string> = {
  rascunho: "Rascunho", enviado: "Enviado", aprovado: "Aprovado", rejeitado: "Rejeitado", expirado: "Expirado",
};

const Orcamentos = () => {
  const { user } = useAuth();
  const { data: orcamentos = [], isLoading } = useSupabaseQuery("orcamentos", {
    select: "*, clientes(nome)", orderBy: { column: "created_at", ascending: false },
  });
  const { data: clientes = [] } = useSupabaseQuery("clientes");
  const insertMutation = useSupabaseInsert("orcamentos");
  const updateMutation = useSupabaseUpdate("orcamentos");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [form, setForm] = useState({ cliente_id: "", descricao: "", valor_total: "", validade: "", observacoes: "" });

  const handleSave = async () => {
    if (!form.cliente_id) { toast.error("Selecione um cliente"); return; }
    try {
      await insertMutation.mutateAsync({
        cliente_id: form.cliente_id, descricao: form.descricao,
        valor_total: Number(form.valor_total) || 0, validade: form.validade || null,
        observacoes: form.observacoes, created_by: user?.id,
      });
      toast.success("Orçamento criado!");
      setDialogOpen(false);
      setForm({ cliente_id: "", descricao: "", valor_total: "", validade: "", observacoes: "" });
    } catch {}
  };

  const handleStatusChange = async (id: string, status: string) => {
    try { await updateMutation.mutateAsync({ id, values: { status } }); toast.success("Status atualizado!"); } catch {}
  };

  const filtered = orcamentos.filter((o: any) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = !term || o.clientes?.nome?.toLowerCase().includes(term) || String(o.numero).includes(term) || o.descricao?.toLowerCase().includes(term);
    const matchesStatus = statusFilter === "todos" || o.status === statusFilter;
    const createdDate = parseISO(o.created_at);
    const matchesDateFrom = !dateFrom || isAfter(createdDate, parseISO(dateFrom));
    const matchesDateTo = !dateTo || isBefore(createdDate, parseISO(dateTo + "T23:59:59"));
    return matchesSearch && matchesStatus && matchesDateFrom && matchesDateTo;
  });

  const fmt = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
  const activeFilters = (statusFilter !== "todos" ? 1 : 0) + (dateFrom ? 1 : 0) + (dateTo ? 1 : 0);

  return (
    <AppLayout>
      <div className="space-y-6 max-w-7xl">
        <div className="flex items-center justify-between">
          <div><h1 className="text-2xl font-bold text-foreground">Orçamentos</h1><p className="text-sm text-muted-foreground">{orcamentos.length} orçamentos</p></div>
          <Button className="gap-2" onClick={() => setDialogOpen(true)}><Plus className="h-4 w-4" /> Novo orçamento</Button>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input type="text" placeholder="Buscar orçamento..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
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
                  <SelectItem value="todos">Todos</SelectItem><SelectItem value="rascunho">Rascunho</SelectItem>
                  <SelectItem value="enviado">Enviado</SelectItem><SelectItem value="aprovado">Aprovado</SelectItem>
                  <SelectItem value="rejeitado">Rejeitado</SelectItem><SelectItem value="expirado">Expirado</SelectItem>
                </SelectContent></Select></div>
            <div><Label className="text-xs">Data de</Label><Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="mt-1 h-9 w-40" /></div>
            <div><Label className="text-xs">Data até</Label><Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="mt-1 h-9 w-40" /></div>
            <Button variant="ghost" size="sm" onClick={() => { setStatusFilter("todos"); setDateFrom(""); setDateTo(""); }}>Limpar</Button>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">Nenhum orçamento encontrado.</div>
        ) : (
          <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border bg-muted/50">
                <th className="text-left px-5 py-3 font-semibold text-muted-foreground">Código</th>
                <th className="text-left px-5 py-3 font-semibold text-muted-foreground">Cliente</th>
                <th className="text-left px-5 py-3 font-semibold text-muted-foreground">Descrição</th>
                <th className="text-left px-5 py-3 font-semibold text-muted-foreground">Valor</th>
                <th className="text-left px-5 py-3 font-semibold text-muted-foreground">Data</th>
                <th className="text-left px-5 py-3 font-semibold text-muted-foreground">Status</th>
                <th className="text-left px-5 py-3 font-semibold text-muted-foreground">Ações</th>
              </tr></thead>
              <tbody className="divide-y divide-border">
                {filtered.map((orc: any) => (
                  <tr key={orc.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-4 font-bold text-primary">ORC-{String(orc.numero).padStart(3, "0")}</td>
                    <td className="px-5 py-4 text-foreground">{orc.clientes?.nome || "—"}</td>
                    <td className="px-5 py-4 text-foreground truncate max-w-[200px]">{orc.descricao || "—"}</td>
                    <td className="px-5 py-4 font-semibold text-foreground">{fmt(Number(orc.valor_total) || 0)}</td>
                    <td className="px-5 py-4 text-muted-foreground">{format(parseISO(orc.created_at), "dd/MM/yyyy")}</td>
                    <td className="px-5 py-4"><span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusColor[orc.status] || "bg-muted text-muted-foreground"}`}>{statusLabel[orc.status] || orc.status}</span></td>
                    <td className="px-5 py-4">
                      <Select value={orc.status} onValueChange={(v) => handleStatusChange(orc.id, v)}>
                        <SelectTrigger className="h-8 w-28 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="rascunho">Rascunho</SelectItem><SelectItem value="enviado">Enviado</SelectItem>
                          <SelectItem value="aprovado">Aprovado</SelectItem><SelectItem value="rejeitado">Rejeitado</SelectItem>
                          <SelectItem value="expirado">Expirado</SelectItem>
                        </SelectContent></Select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo Orçamento</DialogTitle><DialogDescription>Crie um novo orçamento para um cliente.</DialogDescription></DialogHeader>
          <div className="space-y-3 py-2">
            <div><Label>Cliente <span className="text-destructive">*</span></Label>
              <Select value={form.cliente_id} onValueChange={(v) => setForm({ ...form, cliente_id: v })}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{clientes.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
              </Select></div>
            <div><Label>Descrição</Label><Input value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} className="mt-1" placeholder="Ex: Janela 2 folhas" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Valor Total</Label><Input type="number" value={form.valor_total} onChange={(e) => setForm({ ...form, valor_total: e.target.value })} className="mt-1" placeholder="0,00" /></div>
              <div><Label>Validade</Label><Input type="date" value={form.validade} onChange={(e) => setForm({ ...form, validade: e.target.value })} className="mt-1" /></div>
            </div>
            <div><Label>Observações</Label><Textarea value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} className="mt-1" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={insertMutation.isPending}>{insertMutation.isPending ? "Salvando..." : "Criar orçamento"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default Orcamentos;
