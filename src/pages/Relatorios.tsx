import { AppLayout } from "@/components/AppLayout";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend, AreaChart, Area } from "recharts";
import { TrendingUp, TrendingDown, DollarSign, FileText, CheckSquare, Users, Wrench } from "lucide-react";
import { useSupabaseQuery } from "@/hooks/useSupabaseQuery";
import { parseISO, format, startOfMonth, eachMonthOfInterval, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useMemo } from "react";

const StatCard = ({ icon: Icon, label, value, change, positive }: { icon: any; label: string; value: string; change: string; positive: boolean }) => (
  <div className="bg-card border border-border rounded-xl p-5">
    <div className="flex items-center justify-between mb-3">
      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <span className={`flex items-center gap-1 text-xs font-medium ${positive ? "text-[hsl(var(--success))]" : "text-destructive"}`}>
        {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
        {change}
      </span>
    </div>
    <p className="text-2xl font-bold text-foreground">{value}</p>
    <p className="text-xs text-muted-foreground mt-1">{label}</p>
  </div>
);

const fmtCur = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const Relatorios = () => {
  const { data: pedidos = [] } = useSupabaseQuery("pedidos");
  const { data: orcamentos = [] } = useSupabaseQuery("orcamentos");
  const { data: clientes = [] } = useSupabaseQuery("clientes");
  const { data: servicos = [] } = useSupabaseQuery("servicos");

  const totalFaturamento = pedidos.reduce((s: number, p: any) => s + (Number(p.valor_total) || 0), 0);
  const pedidosConcluidos = pedidos.filter((p: any) => p.status === "entregue").length;
  const orcAprovados = orcamentos.filter((o: any) => o.status === "aprovado").length;
  const orcPendentes = orcamentos.filter((o: any) => o.status === "enviado" || o.status === "rascunho").length;
  const orcRejeitados = orcamentos.filter((o: any) => o.status === "rejeitado").length;

  // Group pedidos by month
  const pedidosByMonth: Record<string, { total: number; concluidos: number; andamento: number }> = {};
  pedidos.forEach((p: any) => {
    const month = format(parseISO(p.created_at), "MMM");
    if (!pedidosByMonth[month]) pedidosByMonth[month] = { total: 0, concluidos: 0, andamento: 0 };
    pedidosByMonth[month].total += Number(p.valor_total) || 0;
    if (p.status === "entregue") pedidosByMonth[month].concluidos++;
    else pedidosByMonth[month].andamento++;
  });

  const vendasMensal = Object.entries(pedidosByMonth).map(([mes, data]) => ({ mes, valor: data.total }));
  const pedidosMensal = Object.entries(pedidosByMonth).map(([mes, data]) => ({ mes, concluidos: data.concluidos, andamento: data.andamento }));

  const orcamentoStatus = [
    { name: "Aprovados", value: orcAprovados, color: "hsl(142, 72%, 42%)" },
    { name: "Pendentes", value: orcPendentes, color: "hsl(38, 92%, 50%)" },
    { name: "Rejeitados", value: orcRejeitados, color: "hsl(0, 72%, 51%)" },
  ];

  // ===== SERVIÇOS ANALYTICS =====
  const servicosAnalytics = useMemo(() => {
    const now = new Date();
    const months = eachMonthOfInterval({ start: subMonths(startOfMonth(now), 11), end: startOfMonth(now) });

    // Monthly evolution
    const evolucaoMensal = months.map((month) => {
      const mesKey = format(month, "yyyy-MM");
      const mesLabel = format(month, "MMM", { locale: ptBR });
      const doMes = servicos.filter((s: any) => {
        const created = format(parseISO(s.created_at), "yyyy-MM");
        return created === mesKey;
      });
      return {
        mes: mesLabel,
        total: doMes.length,
        agendados: doMes.filter((s: any) => s.status === "agendado").length,
        em_andamento: doMes.filter((s: any) => s.status === "em_andamento").length,
        concluidos: doMes.filter((s: any) => s.status === "concluido").length,
        cancelados: doMes.filter((s: any) => s.status === "cancelado").length,
        valor: doMes.reduce((sum: number, s: any) => sum + (Number(s.valor) || 0), 0),
      };
    });

    // Status distribution
    const statusDist = [
      { name: "Agendados", value: servicos.filter((s: any) => s.status === "agendado").length, color: "hsl(var(--primary))" },
      { name: "Em andamento", value: servicos.filter((s: any) => s.status === "em_andamento").length, color: "hsl(38, 92%, 50%)" },
      { name: "Concluídos", value: servicos.filter((s: any) => s.status === "concluido").length, color: "hsl(142, 72%, 42%)" },
      { name: "Cancelados", value: servicos.filter((s: any) => s.status === "cancelado").length, color: "hsl(0, 72%, 51%)" },
    ];

    // By type
    const tipoCount: Record<string, number> = {};
    servicos.forEach((s: any) => {
      const tipo = s.tipo || "Não especificado";
      tipoCount[tipo] = (tipoCount[tipo] || 0) + 1;
    });
    const porTipo = Object.entries(tipoCount)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    // KPIs
    const totalValor = servicos.reduce((s: number, sv: any) => s + (Number(sv.valor) || 0), 0);
    const concluidos = servicos.filter((s: any) => s.status === "concluido").length;
    const taxaConclusao = servicos.length > 0 ? Math.round((concluidos / servicos.length) * 100) : 0;

    return { evolucaoMensal, statusDist, porTipo, totalValor, concluidos, taxaConclusao };
  }, [servicos]);

  const TIPO_COLORS = ["hsl(var(--primary))", "hsl(142, 72%, 42%)", "hsl(38, 92%, 50%)", "hsl(280, 60%, 55%)", "hsl(0, 72%, 51%)", "hsl(180, 50%, 45%)"];

  return (
    <AppLayout>
      <div className="space-y-6 max-w-7xl">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Relatórios</h1>
          <p className="text-sm text-muted-foreground">Métricas reais de vendas, orçamentos, serviços e desempenho</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={DollarSign} label="Faturamento total" value={fmtCur(totalFaturamento)} change={`${pedidos.length} pedidos`} positive />
          <StatCard icon={FileText} label="Orçamentos gerados" value={String(orcamentos.length)} change={`${orcAprovados} aprovados`} positive />
          <StatCard icon={CheckSquare} label="Pedidos concluídos" value={String(pedidosConcluidos)} change={`de ${pedidos.length}`} positive={pedidosConcluidos > 0} />
          <StatCard icon={Wrench} label="Serviços" value={String(servicos.length)} change={`${servicosAnalytics.taxaConclusao}% concluídos`} positive={servicosAnalytics.taxaConclusao > 50} />
        </div>

        <Tabs defaultValue="vendas">
          <TabsList>
            <TabsTrigger value="vendas">Vendas</TabsTrigger>
            <TabsTrigger value="orcamentos">Orçamentos</TabsTrigger>
            <TabsTrigger value="pedidos">Pedidos</TabsTrigger>
            <TabsTrigger value="servicos">Serviços</TabsTrigger>
          </TabsList>

          <TabsContent value="vendas">
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="text-sm font-semibold text-foreground mb-4">Faturamento por Mês</h3>
              {vendasMensal.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Sem dados de vendas ainda.</p>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={vendasMensal}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                    <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(v: number) => fmtCur(v)} />
                    <Bar dataKey="valor" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </TabsContent>

          <TabsContent value="orcamentos">
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="text-sm font-semibold text-foreground mb-4">Status dos Orçamentos</h3>
              {orcamentos.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Sem orçamentos ainda.</p>
              ) : (
                <div className="flex flex-col md:flex-row items-center gap-8">
                  <ResponsiveContainer width={250} height={250}>
                    <PieChart>
                      <Pie data={orcamentoStatus} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" paddingAngle={4}>
                        {orcamentoStatus.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-3">
                    {orcamentoStatus.map((s) => (
                      <div key={s.name} className="flex items-center gap-3">
                        <div className="h-3 w-3 rounded-full" style={{ background: s.color }} />
                        <span className="text-sm text-foreground font-medium">{s.name}</span>
                        <span className="text-sm text-muted-foreground">{s.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="pedidos">
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="text-sm font-semibold text-foreground mb-4">Pedidos por Mês</h3>
              {pedidosMensal.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Sem dados de pedidos ainda.</p>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={pedidosMensal}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="concluidos" stroke="hsl(142, 72%, 42%)" strokeWidth={2} name="Concluídos" />
                    <Line type="monotone" dataKey="andamento" stroke="hsl(38, 92%, 50%)" strokeWidth={2} name="Em andamento" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </TabsContent>

          {/* ===== SERVIÇOS TAB ===== */}
          <TabsContent value="servicos" className="space-y-4">
            {/* KPI cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-card border border-border rounded-xl p-4">
                <p className="text-[10px] font-medium text-muted-foreground uppercase">Total</p>
                <p className="text-2xl font-bold text-foreground">{servicos.length}</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-4">
                <p className="text-[10px] font-medium text-muted-foreground uppercase">Concluídos</p>
                <p className="text-2xl font-bold text-foreground">{servicosAnalytics.concluidos}</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-4">
                <p className="text-[10px] font-medium text-muted-foreground uppercase">Taxa Conclusão</p>
                <p className="text-2xl font-bold text-primary">{servicosAnalytics.taxaConclusao}%</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-4">
                <p className="text-[10px] font-medium text-muted-foreground uppercase">Valor Total</p>
                <p className="text-xl font-bold text-foreground">{fmtCur(servicosAnalytics.totalValor)}</p>
              </div>
            </div>

            {/* Evolução mensal - Stacked Area */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="text-sm font-semibold text-foreground mb-4">Evolução Mensal de Serviços</h3>
              {servicosAnalytics.evolucaoMensal.every(m => m.total === 0) ? (
                <p className="text-center text-muted-foreground py-8">Sem dados de serviços ainda.</p>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={servicosAnalytics.evolucaoMensal}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="concluidos" stackId="1" stroke="hsl(142, 72%, 42%)" fill="hsl(142, 72%, 42%)" fillOpacity={0.4} name="Concluídos" />
                    <Area type="monotone" dataKey="em_andamento" stackId="1" stroke="hsl(38, 92%, 50%)" fill="hsl(38, 92%, 50%)" fillOpacity={0.4} name="Em andamento" />
                    <Area type="monotone" dataKey="agendados" stackId="1" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} name="Agendados" />
                    <Area type="monotone" dataKey="cancelados" stackId="1" stroke="hsl(0, 72%, 51%)" fill="hsl(0, 72%, 51%)" fillOpacity={0.3} name="Cancelados" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Faturamento mensal de serviços */}
              <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="text-sm font-semibold text-foreground mb-4">Faturamento Mensal de Serviços</h3>
                {servicosAnalytics.evolucaoMensal.every(m => m.valor === 0) ? (
                  <p className="text-center text-muted-foreground py-8">Sem dados financeiros.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={servicosAnalytics.evolucaoMensal}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                      <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(v: number) => fmtCur(v)} />
                      <Bar dataKey="valor" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} name="Valor" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Status distribution + por tipo */}
              <div className="space-y-4">
                <div className="bg-card border border-border rounded-xl p-6">
                  <h3 className="text-sm font-semibold text-foreground mb-4">Distribuição por Status</h3>
                  {servicos.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">Sem dados.</p>
                  ) : (
                    <div className="flex items-center gap-6">
                      <ResponsiveContainer width={140} height={140}>
                        <PieChart>
                          <Pie data={servicosAnalytics.statusDist.filter(s => s.value > 0)} cx="50%" cy="50%" innerRadius={35} outerRadius={60} dataKey="value" paddingAngle={3}>
                            {servicosAnalytics.statusDist.filter(s => s.value > 0).map((entry, i) => <Cell key={i} fill={entry.color} />)}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="space-y-2">
                        {servicosAnalytics.statusDist.map((s) => (
                          <div key={s.name} className="flex items-center gap-2">
                            <div className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
                            <span className="text-xs text-foreground">{s.name}</span>
                            <span className="text-xs font-bold text-muted-foreground">{s.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {servicosAnalytics.porTipo.length > 0 && (
                  <div className="bg-card border border-border rounded-xl p-6">
                    <h3 className="text-sm font-semibold text-foreground mb-3">Por Tipo de Serviço</h3>
                    <div className="space-y-2">
                      {servicosAnalytics.porTipo.slice(0, 6).map((t, i) => {
                        const pct = servicos.length > 0 ? Math.round((t.value / servicos.length) * 100) : 0;
                        return (
                          <div key={t.name} className="flex items-center gap-3">
                            <span className="text-xs text-foreground w-28 truncate">{t.name}</span>
                            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                              <div className="h-full rounded-full" style={{ width: `${pct}%`, background: TIPO_COLORS[i % TIPO_COLORS.length] }} />
                            </div>
                            <span className="text-[10px] font-bold text-muted-foreground w-8 text-right">{t.value}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default Relatorios;
