import { Package, FileText, BarChart3, DollarSign, AlertTriangle, Clock, Users, ArrowRight } from "lucide-react";
import { GlassDashboardCard } from "@/components/GlassDashboardCard";
import { AppLayout } from "@/components/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO, differenceInDays, isPast } from "date-fns";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";


const fmt = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

const statusColors: Record<string, string> = {
  pendente: "bg-amber-500",
  em_producao: "bg-blue-500",
  pronto: "bg-emerald-500",
  entregue: "bg-green-600",
  cancelado: "bg-red-500",
  aprovado: "bg-emerald-500",
  enviado: "bg-blue-500",
  rascunho: "bg-gray-400",
  rejeitado: "bg-red-500",
};

const Index = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const { data: orcamentos = [] } = useQuery({
    queryKey: ["dashboard-orcamentos"],
    queryFn: async () => {
      const { data } = await supabase.from("orcamentos").select("id, numero, status, valor_total, created_at, clientes(nome)").order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const { data: pedidos = [] } = useQuery({
    queryKey: ["dashboard-pedidos"],
    queryFn: async () => {
      const { data } = await supabase.from("pedidos").select("id, numero, status, valor_total, data_entrega, created_at, clientes(nome)").order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const { data: clientes = [] } = useQuery({
    queryKey: ["dashboard-clientes"],
    queryFn: async () => {
      const { data } = await supabase.from("clientes").select("id").limit(1000);
      return data ?? [];
    },
  });

  const { data: contasReceber = [] } = useQuery({
    queryKey: ["dashboard-contas-receber"],
    queryFn: async () => {
      const { data } = await supabase.from("contas_receber").select("id, valor, status, data_vencimento");
      return data ?? [];
    },
  });

  const { data: contasPagar = [] } = useQuery({
    queryKey: ["dashboard-contas-pagar"],
    queryFn: async () => {
      const { data } = await supabase.from("contas_pagar").select("id, valor, status, data_vencimento, descricao");
      return data ?? [];
    },
  });

  // KPI calculations
  const now = new Date();
  const inicioMes = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const orcMes = orcamentos.filter((o) => o.created_at >= inicioMes);
  const orcAprovadosMes = orcMes.filter((o) => o.status === "aprovado");
  const faturamentoMes = orcAprovadosMes.reduce((s, o) => s + (Number(o.valor_total) || 0), 0);
  const orcPendentes = orcamentos.filter((o) => o.status === "enviado" || o.status === "rascunho").length;
  const emProducao = pedidos.filter((p) => p.status === "em_producao" || p.status === "pendente").length;

  // Alertas
  const pedidosAtrasados = pedidos.filter(
    (p) => p.data_entrega && isPast(parseISO(p.data_entrega)) && p.status !== "entregue" && p.status !== "cancelado"
  );
  const contasVencidas = [
    ...contasPagar.filter((c) => isPast(parseISO(c.data_vencimento)) && c.status === "pendente"),
    ...contasReceber.filter((c) => isPast(parseISO(c.data_vencimento)) && c.status === "pendente"),
  ];
  const totalAlertas = pedidosAtrasados.length + contasVencidas.length;

  // Pipeline stats
  const statusCounts: Record<string, number> = {};
  orcamentos.forEach((o) => {
    statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
  });
  const maxStatusCount = Math.max(...Object.values(statusCounts), 1);

  const getGreeting = () => {
    const hour = now.getHours();
    if (hour < 12) return "Bom dia";
    if (hour < 18) return "Boa tarde";
    return "Boa noite";
  };

  const recentOrcamentos = orcamentos.slice(0, 5);
  const recentPedidos = pedidos.slice(0, 5);

  return (
    <AppLayout>
      <div className="space-y-6 max-w-7xl w-full">
        {/* Header */}
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">
            {getGreeting()}, {profile?.nome || "Usuario"}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {now.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })} - {clientes.length} clientes cadastrados
          </p>
        </div>

        {/* Alertas */}
        {totalAlertas > 0 && (
          <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <h3 className="text-sm font-bold text-destructive">
                {totalAlertas} alerta{totalAlertas > 1 ? "s" : ""} de atencao
              </h3>
            </div>
            <div className="space-y-2">
              {pedidosAtrasados.slice(0, 3).map((p) => (
                <div key={p.id} className="flex items-start gap-3 bg-background/50 rounded-lg p-3">
                  <div className="h-2 w-2 rounded-full mt-1.5 shrink-0 bg-amber-500" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Pedido #{p.numero} atrasado {Math.abs(differenceInDays(parseISO(p.data_entrega!), now))} dias</p>
                    <p className="text-xs text-muted-foreground">Entrega prevista: {format(parseISO(p.data_entrega!), "dd/MM/yyyy")}</p>
                  </div>
                </div>
              ))}
              {contasVencidas.slice(0, 3).map((c) => (
                <div key={c.id} className="flex items-start gap-3 bg-background/50 rounded-lg p-3">
                  <div className="h-2 w-2 rounded-full mt-1.5 shrink-0 bg-destructive" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Conta vencida: {fmt(Number(c.valor))}</p>
                    <p className="text-xs text-muted-foreground">Vencimento: {format(parseISO(c.data_vencimento), "dd/MM/yyyy")}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* KPI Cards — Glass Morphism */}
        <div
          className="relative rounded-2xl overflow-hidden p-4 sm:p-6"
          style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 40%, #2d1b69 70%, #3d0f4a 100%)' }}
        >
          {/* animated blobs */}
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="absolute top-0 left-1/4 w-64 h-64 bg-purple-500 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-blue-500 rounded-full blur-3xl" />
          </div>
          <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <GlassDashboardCard
              title="Faturamento do Mês"
              value={fmt(faturamentoMes)}
              subtitle={`${orcAprovadosMes.length} orçamentos aprovados`}
              icon={<DollarSign className="h-5 w-5" />}
              trend={orcAprovadosMes.length > 0 ? { direction: 'up', value: orcAprovadosMes.length, label: 'aprovados' } : undefined}
              badge={{ label: 'Este mês', variant: 'success' }}
              neonAccent
            />
            <GlassDashboardCard
              title="Orçamentos Pendentes"
              value={String(orcPendentes)}
              subtitle={`de ${orcamentos.length} total`}
              icon={<FileText className="h-5 w-5" />}
              badge={orcPendentes > 0 ? { label: `${orcPendentes} aguardando`, variant: 'warning' } : undefined}
            />
            <GlassDashboardCard
              title="Em Produção"
              value={String(emProducao)}
              subtitle={`${pedidos.filter((p) => p.status === "entregue").length} entregues`}
              icon={<Package className="h-5 w-5" />}
              badge={{ label: 'Ativo', variant: 'info' }}
            />
            <GlassDashboardCard
              title="Alertas"
              value={String(totalAlertas)}
              subtitle={`${pedidosAtrasados.length} pedidos atrasados`}
              icon={<AlertTriangle className="h-5 w-5" />}
              badge={totalAlertas > 0 ? { label: `${totalAlertas} atenção`, variant: 'destructive' } : { label: 'Tudo certo', variant: 'success' }}
              glowEffect={totalAlertas > 0}
            />
          </div>
        </div>

        {/* Row 2: Ultimos orcamentos + Pipeline */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Ultimos orcamentos */}
          <div className="glass-card-premium">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h3 className="text-base font-semibold text-foreground">Ultimos Orcamentos</h3>
              <button onClick={() => navigate("/orcamentos")} className="text-xs text-primary hover:underline flex items-center gap-1">
                Ver todos <ArrowRight className="h-3 w-3" />
              </button>
            </div>
            <div className="divide-y divide-border">
              {recentOrcamentos.length === 0 ? (
                <div className="px-5 py-8 text-center text-muted-foreground text-sm">Nenhum orcamento ainda.</div>
              ) : (
                recentOrcamentos.map((orc) => (
                  <div key={orc.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-primary">#{orc.numero}</span>
                      <div>
                        <p className="text-sm font-medium text-foreground">{(orc.clientes as { nome: string } | null)?.nome || "Sem cliente"}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={cn("h-1.5 w-1.5 rounded-full", statusColors[orc.status] || "bg-gray-400")} />
                          <span className="text-[10px] text-muted-foreground capitalize">{orc.status}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="text-sm font-bold text-foreground">{fmt(Number(orc.valor_total || 0))}</p>
                      <p className="text-[10px] text-muted-foreground">{format(parseISO(orc.created_at), "dd/MM")}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Pipeline de status */}
          <div className="glass-card-premium">
            <div className="p-5 border-b border-border">
              <h3 className="text-base font-semibold text-foreground">Pipeline de Orcamentos</h3>
            </div>
            <div className="p-5 space-y-3">
              {Object.keys(statusCounts).length === 0 ? (
                <p className="text-center text-muted-foreground text-sm py-4">Sem dados.</p>
              ) : (
                Object.entries(statusCounts).map(([status, count]) => {
                  const pct = Math.round((count / maxStatusCount) * 100);
                  return (
                    <div key={status} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-foreground capitalize">{status}</span>
                        <span className="text-xs font-bold text-muted-foreground">{count}</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={cn("h-full rounded-full transition-all duration-500", statusColors[status] || "bg-primary")}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Row 3: Ultimos pedidos + Avisos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="glass-card-premium">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h3 className="text-base font-semibold text-foreground">Ultimos Pedidos</h3>
              <button onClick={() => navigate("/pedidos")} className="text-xs text-primary hover:underline flex items-center gap-1">
                Ver todos <ArrowRight className="h-3 w-3" />
              </button>
            </div>
            <div className="divide-y divide-border">
              {recentPedidos.length === 0 ? (
                <div className="px-5 py-8 text-center text-muted-foreground text-sm">Nenhum pedido ainda.</div>
              ) : (
                recentPedidos.map((p) => {
                  const atrasado = p.data_entrega && isPast(parseISO(p.data_entrega)) && p.status !== "entregue" && p.status !== "cancelado";
                  return (
                    <div key={p.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <span className={cn("text-sm font-bold", atrasado ? "text-destructive" : "text-primary")}>#{p.numero}</span>
                        <div>
                          <p className="text-sm font-medium text-foreground">{(p.clientes as { nome: string } | null)?.nome || "Pedido"}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={cn("h-1.5 w-1.5 rounded-full", statusColors[p.status ?? ""] || "bg-gray-400")} />
                            <span className="text-[10px] text-muted-foreground capitalize">{p.status?.replace("_", " ")}</span>
                            {atrasado && <span className="text-[10px] text-destructive font-semibold">ATRASADO</span>}
                          </div>
                        </div>
                      </div>
                      <div className="text-left sm:text-right">
                        <p className="text-sm font-bold text-foreground">{fmt(Number(p.valor_total || 0))}</p>
                        {p.data_entrega && <p className="text-[10px] text-muted-foreground">{format(parseISO(p.data_entrega), "dd/MM")}</p>}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* System Alerts */}
          <div className="glass-card-premium">
            <div className="p-5 border-b border-border">
              <h3 className="text-base font-semibold text-foreground">Resumo do Sistema</h3>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Users className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{clientes.length} clientes</p>
                  <p className="text-[10px] text-muted-foreground">Total cadastrados</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <BarChart3 className="h-4 w-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{orcMes.length} orcamentos este mes</p>
                  <p className="text-[10px] text-muted-foreground">{orcAprovadosMes.length} aprovados</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <Clock className="h-4 w-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{pedidos.filter((p) => p.status === "pendente").length} pedidos aguardando</p>
                  <p className="text-[10px] text-muted-foreground">Iniciar producao</p>
                </div>
              </div>
              {contasVencidas.length > 0 && (
                <div className="flex items-center gap-3 p-3 bg-destructive/5 rounded-lg border border-destructive/20">
                  <div className="h-8 w-8 rounded-lg bg-destructive/10 flex items-center justify-center">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-destructive">{contasVencidas.length} contas vencidas</p>
                    <p className="text-[10px] text-muted-foreground">Requer atencao</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Index;
