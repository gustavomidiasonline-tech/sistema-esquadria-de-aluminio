import { AppLayout } from "@/components/AppLayout";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from "recharts";
import { TrendingUp, TrendingDown, DollarSign, FileText, CheckSquare, Users } from "lucide-react";

const vendasMensal = [
  { mes: "Set", valor: 32500 }, { mes: "Out", valor: 41200 }, { mes: "Nov", valor: 38700 },
  { mes: "Dez", valor: 52300 }, { mes: "Jan", valor: 29800 }, { mes: "Fev", valor: 46100 },
];

const orcamentoStatus = [
  { name: "Aprovados", value: 42, color: "hsl(142, 72%, 42%)" },
  { name: "Pendentes", value: 18, color: "hsl(38, 92%, 50%)" },
  { name: "Recusados", value: 12, color: "hsl(0, 72%, 51%)" },
];

const pedidosMensal = [
  { mes: "Set", concluidos: 14, andamento: 8 }, { mes: "Out", concluidos: 18, andamento: 6 },
  { mes: "Nov", concluidos: 15, andamento: 10 }, { mes: "Dez", concluidos: 22, andamento: 5 },
  { mes: "Jan", concluidos: 12, andamento: 9 }, { mes: "Fev", concluidos: 19, andamento: 7 },
];

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

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

const Relatorios = () => (
  <AppLayout>
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Relatórios</h1>
        <p className="text-sm text-muted-foreground">Visualize métricas de vendas, orçamentos e desempenho</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={DollarSign} label="Faturamento mensal" value={fmt(46100)} change="+12.4%" positive />
        <StatCard icon={FileText} label="Orçamentos gerados" value="72" change="+8.2%" positive />
        <StatCard icon={CheckSquare} label="Pedidos concluídos" value="19" change="-5.1%" positive={false} />
        <StatCard icon={Users} label="Novos clientes" value="11" change="+22%" positive />
      </div>

      <Tabs defaultValue="vendas">
        <TabsList>
          <TabsTrigger value="vendas">Vendas</TabsTrigger>
          <TabsTrigger value="orcamentos">Orçamentos</TabsTrigger>
          <TabsTrigger value="pedidos">Pedidos</TabsTrigger>
        </TabsList>

        <TabsContent value="vendas">
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="text-sm font-semibold text-foreground mb-4">Faturamento Mensal</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={vendasMensal}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 20%, 90%)" />
                <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v: number) => fmt(v)} />
                <Bar dataKey="valor" fill="hsl(207, 90%, 54%)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </TabsContent>

        <TabsContent value="orcamentos">
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="text-sm font-semibold text-foreground mb-4">Status dos Orçamentos</h3>
            <div className="flex flex-col md:flex-row items-center gap-8">
              <ResponsiveContainer width={250} height={250}>
                <PieChart>
                  <Pie data={orcamentoStatus} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" paddingAngle={4}>
                    {orcamentoStatus.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
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
          </div>
        </TabsContent>

        <TabsContent value="pedidos">
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="text-sm font-semibold text-foreground mb-4">Pedidos por Mês</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={pedidosMensal}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 20%, 90%)" />
                <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="concluidos" stroke="hsl(142, 72%, 42%)" strokeWidth={2} name="Concluídos" />
                <Line type="monotone" dataKey="andamento" stroke="hsl(38, 92%, 50%)" strokeWidth={2} name="Em andamento" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  </AppLayout>
);

export default Relatorios;
