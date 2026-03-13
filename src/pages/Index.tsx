import { TrendingUp, Package, FileText, BarChart3, Wrench, DollarSign } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useSupabaseQuery } from "@/hooks/useSupabaseQuery";
import { format, parseISO } from "date-fns";

const Index = () => {
  const { profile } = useAuth();
  const { data: pedidos = [] } = useSupabaseQuery("pedidos", { orderBy: { column: "created_at", ascending: false } });
  const { data: orcamentos = [] } = useSupabaseQuery("orcamentos");
  const { data: clientes = [] } = useSupabaseQuery("clientes");
  const { data: servicos = [] } = useSupabaseQuery("servicos");
  const { data: contasReceber = [] } = useSupabaseQuery("contas_receber");
  const { data: contasPagar = [] } = useSupabaseQuery("contas_pagar");

  const totalPedidos = pedidos.reduce((sum: number, p: any) => sum + (Number(p.valor_total) || 0), 0);
  const totalOrcamentos = orcamentos.reduce((sum: number, o: any) => sum + (Number(o.valor_total) || 0), 0);
  const totalReceber = contasReceber.reduce((s: number, c: any) => s + Number(c.valor || 0), 0);
  const totalPagar = contasPagar.reduce((s: number, c: any) => s + Number(c.valor || 0), 0);
  const saldo = totalReceber - totalPagar;

  const fmt = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

  const kpiCards = [
    { title: "Vendas", value: fmt(totalPedidos), change: `${pedidos.length} pedidos`, subtitle: `${clientes.length} clientes`, highlight: true, icon: DollarSign },
    { title: "Pedidos", value: String(pedidos.length), change: `${pedidos.filter((p: any) => p.status === "entregue").length} entregues`, subtitle: `${pedidos.filter((p: any) => p.status === "pendente").length} pendentes`, highlight: false, icon: Package },
    { title: "Orçamentos", value: fmt(totalOrcamentos), change: `${orcamentos.length} total`, subtitle: `${orcamentos.filter((o: any) => o.status === "aprovado").length} aprovados`, highlight: false, icon: FileText },
    { title: "Serviços", value: String(servicos.length), change: `${servicos.filter((s: any) => s.status === "em_andamento").length} em andamento`, subtitle: `${servicos.filter((s: any) => s.status === "concluido").length} concluídos`, highlight: false, icon: Wrench },
    { title: "A Receber", value: fmt(totalReceber), change: `${contasReceber.length} contas`, subtitle: `${contasReceber.filter((c: any) => c.status === "pago").length} pagas`, highlight: false, icon: TrendingUp },
    { title: "Saldo", value: fmt(saldo), change: saldo >= 0 ? "Positivo" : "Negativo", subtitle: `${fmt(totalPagar)} a pagar`, highlight: false, icon: BarChart3 },
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
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Olá, {getGreeting()}, {profile?.nome || "Usuário"}.
          </h1>
          <p className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {kpiCards.map((card) => (
            <div key={card.title} className={`rounded-xl p-5 ${card.highlight ? "stat-card-blue" : "bg-card border border-border shadow-sm"}`}>
              <div className="flex items-center justify-between mb-1">
                <p className={`text-sm font-medium ${card.highlight ? "text-primary-foreground/80" : "text-muted-foreground"}`}>{card.title}</p>
                <card.icon className={`h-4 w-4 ${card.highlight ? "text-primary-foreground/60" : "text-primary"}`} />
              </div>
              <p className={`text-2xl font-bold ${card.highlight ? "text-primary-foreground" : "text-foreground"}`}>{card.value}</p>
              <div className="flex items-center justify-between mt-2">
                <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${card.highlight ? "bg-success/30 text-success-foreground" : "bg-success/10 text-success"}`}>
                  <TrendingUp className="h-3 w-3" /> {card.change}
                </span>
                <p className={`text-xs ${card.highlight ? "text-primary-foreground/60" : "text-muted-foreground"}`}>{card.subtitle}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-card border border-border rounded-xl shadow-sm">
          <div className="flex items-center justify-between p-5 border-b border-border">
            <h3 className="text-base font-semibold text-foreground">Pedidos recentes</h3>
          </div>
          <div className="divide-y divide-border">
            {recentPedidos.length === 0 ? (
              <div className="px-5 py-8 text-center text-muted-foreground text-sm">Nenhum pedido ainda.</div>
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
                    <p className="text-sm font-bold text-foreground">{fmt(Number(order.valor_total || 0))}</p>
                    <p className="text-xs text-muted-foreground">{format(parseISO(order.created_at), "dd/MM/yyyy")}</p>
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
