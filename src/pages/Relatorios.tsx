import { AppLayout } from "@/components/AppLayout";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from "recharts";
import { TrendingUp, TrendingDown, DollarSign, FileText, CheckSquare, Users } from "lucide-react";
import { useSupabaseQuery } from "@/hooks/useSupabaseQuery";
import { parseISO, format } from "date-fns";

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

  return (
    <AppLayout>
      <div className="space-y-6 max-w-7xl">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Relatórios</h1>
          <p className="text-sm text-muted-foreground">Métricas reais de vendas, orçamentos e desempenho</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={DollarSign} label="Faturamento total" value={fmtCur(totalFaturamento)} change={`${pedidos.length} pedidos`} positive />
          <StatCard icon={FileText} label="Orçamentos gerados" value={String(orcamentos.length)} change={`${orcAprovados} aprovados`} positive />
          <StatCard icon={CheckSquare} label="Pedidos concluídos" value={String(pedidosConcluidos)} change={`de ${pedidos.length}`} positive={pedidosConcluidos > 0} />
          <StatCard icon={Users} label="Clientes cadastrados" value={String(clientes.length)} change={`${servicos.length} serviços`} positive />
        </div>

        <Tabs defaultValue="vendas">
          <TabsList>
            <TabsTrigger value="vendas">Vendas</TabsTrigger>
            <TabsTrigger value="orcamentos">Orçamentos</TabsTrigger>
            <TabsTrigger value="pedidos">Pedidos</TabsTrigger>
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
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default Relatorios;
