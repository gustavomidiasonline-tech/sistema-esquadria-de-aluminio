import { AppLayout } from "@/components/AppLayout";
import { Users, Plus, Search, Pencil, Trash2, Phone, Mail, MapPin, Eye, Star, DollarSign, TrendingUp, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useClientes } from "@/hooks/useClientes";
import type { Cliente } from "@/hooks/useClientes";
import { useCreateCliente, useUpdateCliente, useDeleteCliente } from "@/hooks/useClienteMutations";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState, useMemo, useCallback } from "react";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";

const FORM_VAZIO = {
  nome: "", email: "", telefone: "", whatsapp: "", cpf_cnpj: "", endereco: "", cidade: "", estado: "", cep: "", observacoes: "",
};

type ClienteForm = typeof FORM_VAZIO;

const ESTADOS_BR = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"
];

const Clientes = () => {
  const { user } = useAuth();
  const { data: clientes = [], isLoading } = useClientes();
  const createMutation = useCreateCliente();
  const updateMutation = useUpdateCliente();
  const deleteMutation = useDeleteCliente();

  const [search, setSearch] = useState("");
  const [estadoFilter, setEstadoFilter] = useState("todos");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailCliente, setDetailCliente] = useState<Cliente | null>(null);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
  const [form, setForm] = useState<ClienteForm>(FORM_VAZIO);
  const [cepLoading, setCepLoading] = useState(false);

  // Orcamentos por cliente
  const { data: orcamentos = [] } = useQuery({
    queryKey: ["clientes-orcamentos"],
    queryFn: async () => {
      const { data } = await supabase.from("orcamentos").select("id, numero, cliente_id, valor_total, status, created_at").order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const clienteStats = useMemo(() => {
    const map: Record<string, { valor: number; count: number; lastDate: string }> = {};
    orcamentos.forEach((o) => {
      const cid = o.cliente_id;
      if (!cid) return;
      if (!map[cid]) map[cid] = { valor: 0, count: 0, lastDate: o.created_at };
      map[cid].valor += Number(o.valor_total) || 0;
      map[cid].count++;
      if (o.created_at > map[cid].lastDate) map[cid].lastDate = o.created_at;
    });
    return map;
  }, [orcamentos]);

  // KPIs
  const kpis = useMemo(() => {
    const now = new Date();
    const inicioMes = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const novosMes = clientes.filter((c) => c.created_at >= inicioMes).length;
    const totalValor = Object.values(clienteStats).reduce((s, c) => s + c.valor, 0);
    const withOrc = Object.keys(clienteStats).length;
    const ticketMedio = withOrc > 0 ? totalValor / withOrc : 0;
    return { total: clientes.length, novosMes, totalValor, ticketMedio };
  }, [clientes, clienteStats]);

  const filtered = useMemo(() => {
    return clientes.filter((c) => {
      const term = search.toLowerCase();
      const matchSearch = !term ||
        c.nome.toLowerCase().includes(term) ||
        (c.email && c.email.toLowerCase().includes(term)) ||
        (c.telefone && c.telefone.includes(term)) ||
        (c.cidade && c.cidade.toLowerCase().includes(term));
      const matchEstado = estadoFilter === "todos" || c.estado === estadoFilter;
      return matchSearch && matchEstado;
    });
  }, [clientes, search, estadoFilter]);

  const openNew = () => {
    setEditingCliente(null);
    setForm(FORM_VAZIO);
    setDialogOpen(true);
  };

  const openEdit = (c: Cliente) => {
    setEditingCliente(c);
    setForm({
      nome: c.nome, email: c.email || "", telefone: c.telefone || "",
      whatsapp: "", cpf_cnpj: c.cpf_cnpj || "", endereco: c.endereco || "", cidade: c.cidade || "",
      estado: c.estado || "", cep: c.cep || "", observacoes: c.observacoes || "",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.nome.trim()) {
      toast.error("Nome e obrigatorio");
      return;
    }
    try {
      const payload = {
        nome: form.nome, email: form.email || null, telefone: form.telefone || null,
        cpf_cnpj: form.cpf_cnpj || null, endereco: form.endereco || null, cidade: form.cidade || null,
        estado: form.estado || null, cep: form.cep || null, observacoes: form.observacoes || null,
      };
      if (editingCliente) {
        await updateMutation.mutateAsync({ id: editingCliente.id, values: payload });
        toast.success("Cliente atualizado!");
      } else {
        await createMutation.mutateAsync({ ...payload, created_by: user?.id ?? undefined });
        toast.success("Cliente adicionado!");
      }
      setDialogOpen(false);
    } catch { /* handled by mutation */ }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir este cliente?")) {
      try {
        await deleteMutation.mutateAsync(id);
        toast.success("Cliente excluido!");
      } catch { /* handled by mutation */ }
    }
  };

  const buscarCep = useCallback(async () => {
    const cepClean = form.cep.replace(/\D/g, '');
    if (cepClean.length !== 8) {
      toast.error('CEP deve ter 8 digitos');
      return;
    }
    setCepLoading(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cepClean}/json/`);
      const data = await res.json();
      if (data.erro) {
        toast.error('CEP nao encontrado');
        return;
      }
      setForm((prev) => ({
        ...prev,
        endereco: data.logradouro || prev.endereco,
        cidade: data.localidade || prev.cidade,
        estado: data.uf || prev.estado,
      }));
      toast.success('Endereco preenchido!');
    } catch {
      toast.error('Erro ao buscar CEP');
    } finally {
      setCepLoading(false);
    }
  }, [form.cep]);

  const fmt = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

  const getClienteOrcamentos = (clienteId: string) => {
    return orcamentos.filter((o) => o.cliente_id === clienteId).slice(0, 5);
  };

  const isVIP = (clienteId: string) => {
    const stats = clienteStats[clienteId];
    return stats && stats.valor > 50000;
  };

  const statusBadge: Record<string, string> = {
    aprovado: "bg-emerald-100 text-emerald-800",
    enviado: "bg-blue-100 text-blue-800",
    rascunho: "bg-gray-100 text-gray-800",
    rejeitado: "bg-red-100 text-red-800",
    pendente: "bg-amber-100 text-amber-800",
  };

  return (
    <AppLayout>
      <div className="space-y-4 max-w-7xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Clientes</h1>
            <p className="text-sm text-muted-foreground">{clientes.length} clientes cadastrados</p>
          </div>
          <Button className="gap-2" onClick={openNew}>
            <Plus className="h-4 w-4" /> Novo cliente
          </Button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total Clientes", value: String(kpis.total), icon: Users, color: "text-primary", bg: "bg-primary/10" },
            { label: "Novos este mes", value: String(kpis.novosMes), icon: UserPlus, color: "text-emerald-500", bg: "bg-emerald-500/10" },
            { label: "Valor Total", value: fmt(kpis.totalValor), icon: DollarSign, color: "text-primary", bg: "bg-primary/10" },
            { label: "Ticket Medio", value: fmt(kpis.ticketMedio), icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-500/10" },
          ].map((kpi) => {
            const Icon = kpi.icon;
            return (
              <div key={kpi.label} className="bg-card border border-border rounded-xl p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-medium text-muted-foreground">{kpi.label}</span>
                  <div className={cn("h-6 w-6 rounded-md flex items-center justify-center", kpi.bg)}>
                    <Icon className={cn("h-3 w-3", kpi.color)} />
                  </div>
                </div>
                <p className="font-bold text-foreground text-lg">{kpi.value}</p>
              </div>
            );
          })}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text" placeholder="Buscar por nome, email, telefone, cidade..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2.5 text-sm bg-card border border-border rounded-lg w-full outline-none focus:ring-2 focus:ring-primary/30 text-foreground placeholder:text-muted-foreground"
            />
          </div>
          <Select value={estadoFilter} onValueChange={setEstadoFilter}>
            <SelectTrigger className="w-32 h-10">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              {ESTADOS_BR.map((uf) => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}
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
            {clientes.length === 0 ? 'Nenhum cliente cadastrado. Clique em "Novo cliente" para comecar.' : "Nenhum cliente encontrado."}
          </div>
        ) : (
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left p-3 font-medium text-muted-foreground">Nome</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Telefone</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Email</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Cidade/UF</th>
                    <th className="text-right p-3 font-medium text-muted-foreground">Orcamentos</th>
                    <th className="text-right p-3 font-medium text-muted-foreground">Valor Total</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Acoes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((client) => {
                    const stats = clienteStats[client.id];
                    const vip = isVIP(client.id);
                    return (
                      <tr key={client.id} className="hover:bg-muted/30 transition-colors">
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                              <Users className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-foreground">{client.nome}</span>
                                {vip && (
                                  <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-[9px] px-1.5 py-0 h-4">
                                    <Star className="h-2.5 w-2.5 mr-0.5" /> VIP
                                  </Badge>
                                )}
                              </div>
                              {client.cpf_cnpj && <p className="text-[10px] text-muted-foreground">{client.cpf_cnpj}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="p-3 text-muted-foreground">{client.telefone || "-"}</td>
                        <td className="p-3 text-muted-foreground text-xs">{client.email || "-"}</td>
                        <td className="p-3 text-muted-foreground text-xs">
                          {client.cidade ? `${client.cidade}${client.estado ? `/${client.estado}` : ""}` : "-"}
                        </td>
                        <td className="p-3 text-right font-bold text-foreground">{stats?.count ?? 0}</td>
                        <td className="p-3 text-right font-bold text-primary">{stats ? fmt(stats.valor) : "-"}</td>
                        <td className="p-3">
                          <div className="flex items-center gap-1">
                            <button onClick={() => setDetailCliente(client)} className="p-1.5 rounded hover:bg-muted transition-colors">
                              <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                            </button>
                            <button onClick={() => openEdit(client)} className="p-1.5 rounded hover:bg-muted transition-colors">
                              <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                            </button>
                            <button onClick={() => handleDelete(client.id)} className="p-1.5 rounded hover:bg-muted transition-colors">
                              <Trash2 className="h-3.5 w-3.5 text-destructive" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!detailCliente} onOpenChange={(open) => { if (!open) setDetailCliente(null); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {detailCliente?.nome}
              {detailCliente && isVIP(detailCliente.id) && (
                <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-[10px]">
                  <Star className="h-3 w-3 mr-1" /> VIP
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription>Informacoes completas do cliente</DialogDescription>
          </DialogHeader>
          {detailCliente && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-3">
                {detailCliente.telefone && (
                  <div className="flex items-center gap-2 text-sm"><Phone className="h-4 w-4 text-muted-foreground" /><span>{detailCliente.telefone}</span></div>
                )}
                {detailCliente.email && (
                  <div className="flex items-center gap-2 text-sm"><Mail className="h-4 w-4 text-muted-foreground" /><span className="truncate">{detailCliente.email}</span></div>
                )}
              </div>
              {(detailCliente.endereco || detailCliente.cidade) && (
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>
                    {detailCliente.endereco}{detailCliente.cidade ? `, ${detailCliente.cidade}` : ""}{detailCliente.estado ? ` - ${detailCliente.estado}` : ""}{detailCliente.cep ? ` (${detailCliente.cep})` : ""}
                  </span>
                </div>
              )}
              {detailCliente.cpf_cnpj && (
                <div className="text-xs text-muted-foreground">CPF/CNPJ: <span className="font-medium text-foreground">{detailCliente.cpf_cnpj}</span></div>
              )}
              {detailCliente.observacoes && (
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-medium mb-1">Observacoes</p>
                  <p className="text-sm text-foreground bg-muted/50 rounded-lg p-3">{detailCliente.observacoes}</p>
                </div>
              )}

              {/* Historico orcamentos */}
              <div>
                <p className="text-[10px] text-muted-foreground uppercase font-medium mb-2">Historico de Orcamentos</p>
                <div className="space-y-2">
                  {getClienteOrcamentos(detailCliente.id).length === 0 ? (
                    <p className="text-xs text-muted-foreground">Nenhum orcamento registrado.</p>
                  ) : (
                    getClienteOrcamentos(detailCliente.id).map((orc) => (
                      <div key={orc.id} className="flex items-center justify-between bg-muted/30 rounded-lg p-2.5">
                        <div>
                          <span className="text-xs font-bold text-primary">#{orc.numero}</span>
                          <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded-full ml-2", statusBadge[orc.status] || "bg-gray-100 text-gray-800")}>
                            {orc.status}
                          </span>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-bold text-foreground">{fmt(Number(orc.valor_total) || 0)}</p>
                          <p className="text-[10px] text-muted-foreground">{format(parseISO(orc.created_at), "dd/MM/yyyy")}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => { setDetailCliente(null); openEdit(detailCliente); }}>
                  <Pencil className="h-4 w-4 mr-1" /> Editar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingCliente ? "Editar Cliente" : "Novo Cliente"}</DialogTitle>
            <DialogDescription>Preencha os dados do cliente.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2 max-h-[60vh] overflow-y-auto">
            <div>
              <Label>Nome <span className="text-destructive">*</span></Label>
              <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Email</Label>
                <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-1" type="email" />
              </div>
              <div>
                <Label>Telefone</Label>
                <Input value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} className="mt-1" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>WhatsApp</Label>
                <Input value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label>CPF/CNPJ</Label>
                <Input value={form.cpf_cnpj} onChange={(e) => setForm({ ...form, cpf_cnpj: e.target.value })} className="mt-1" />
              </div>
            </div>
            <div>
              <Label>CEP</Label>
              <div className="flex gap-2 mt-1">
                <Input value={form.cep} onChange={(e) => setForm({ ...form, cep: e.target.value })} placeholder="00000-000" />
                <Button variant="outline" size="sm" onClick={buscarCep} disabled={cepLoading}>
                  {cepLoading ? "..." : "Buscar"}
                </Button>
              </div>
            </div>
            <div>
              <Label>Endereco</Label>
              <Input value={form.endereco} onChange={(e) => setForm({ ...form, endereco: e.target.value })} className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Cidade</Label>
                <Input value={form.cidade} onChange={(e) => setForm({ ...form, cidade: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label>Estado</Label>
                <Select value={form.estado || "nenhum"} onValueChange={(v) => setForm({ ...form, estado: v === "nenhum" ? "" : v })}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="UF" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nenhum">--</SelectItem>
                    {ESTADOS_BR.map((uf) => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Observacoes</Label>
              <Textarea value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} className="mt-1" rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending}>
              {createMutation.isPending || updateMutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default Clientes;
