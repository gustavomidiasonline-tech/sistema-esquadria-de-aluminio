import { TrendingUp, TrendingDown, ArrowRight, Package, FileText, BarChart3 } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useSupabaseQuery } from "@/hooks/useSupabaseQuery";

const Index = () => {
  const { profile } = useAuth();
  const { data: pedidos = [] } = useSupabaseQuery("pedidos", { orderBy: { column: "created_at", ascending: false } });
  const { data: orcamentos = [] } = useSupabaseQuery("orcamentos");
  const { data: clientes = [] } = useSupabaseQuery("clientes");

  const totalPedidos = pedidos.reduce((sum: number, p: any) => sum + (Number(p.valor_total) || 0), 0);
  const totalOrcamentos = orcamentos.reduce((sum: number, o: any) => sum + (Number(o.valor_total) || 0), 0);

  const kpiCards = [
    {
      title: "Vendas",
      value: `R$ ${totalPedidos.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
      change: `${pedidos.length} pedidos`,
      positive: true,
      subtitle: `${clientes.length} clientes cadastrados`,
      highlight: true,
    },
    {
      title: "Pedidos",
      value: String(pedidos.length),
      change: pedidos.filter((p: any) => p.status === "entregue").length + " entregues",
      positive: true,
      subtitle: pedidos.filter((p: any) => p.status === "pendente").length + " pendentes",
      highlight: false,
    },
    {
      title: "Orçamentos",
      value: `R$ ${totalOrcamentos.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
      change: `${orcamentos.length} orçamentos`,
      positive: true,
      subtitle: orcamentos.filter((o: any) => o.status === "aprovado").length + " aprovados",
      highlight: false,
    },
  ];

  const recentPedidos = pedidos.slice(0, 5);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bom dia";
    if (hour < 18) return "Boa tarde";
    return "Boa noite";
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-7xl">
        {/* Greeting */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Olá, {getGreeting()}, {profile?.nome || "Usuário"}.
            </h1>
            <p className="text-sm text-muted-foreground">
              {new Date().toLocaleDateString("pt-BR", {
                weekday: "long",
                day: "2-digit",
                month: "long",
              })}
            </p>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {kpiCards.map((card) => (
            <div
              key={card.title}
              className={`rounded-xl p-5 ${
                card.highlight
                  ? "stat-card-blue"
                  : "bg-card border border-border shadow-sm"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <p className={`text-sm font-medium ${card.highlight ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                  {card.title}
                </p>
                <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
                  card.highlight ? "bg-success/30 text-success-foreground" : "bg-success/10 text-success"
                }`}>
                  <TrendingUp className="h-3 w-3" />
                  {card.change}
                </span>
              </div>
              <p className={`text-2xl font-bold ${card.highlight ? "text-primary-foreground" : "text-foreground"}`}>
                {card.value}
              </p>
              <p className={`text-xs mt-2 ${card.highlight ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                {card.subtitle}
              </p>
            </div>
          ))}
        </div>

        {/* Recent Orders */}
        <div className="bg-card border border-border rounded-xl shadow-sm">
          <div className="flex items-center justify-between p-5 border-b border-border">
            <h3 className="text-base font-semibold text-foreground">Pedidos recentes</h3>
          </div>
          <div className="divide-y divide-border">
            {recentPedidos.length === 0 ? (
              <div className="px-5 py-8 text-center text-muted-foreground text-sm">
                Nenhum pedido ainda. Comece cadastrando clientes e criando pedidos.
              </div>
            ) : (
              recentPedidos.map((order: any) => (
                <div key={order.id} className="flex items-center justify-between px-5 py-4">
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-bold text-primary">#{order.numero}</span>
                    <div>
                      <p className="text-sm font-medium text-foreground">{order.observacoes || "Pedido"}</p>
                      <p className="text-xs text-muted-foreground capitalize">{order.status?.replace("_", " ")}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-foreground">
                      R$ {Number(order.valor_total || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Index;
