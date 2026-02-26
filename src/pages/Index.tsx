import { TrendingUp, TrendingDown, ArrowRight, Package, FileText, BarChart3 } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";

const kpiCards = [
  {
    title: "Vendas",
    value: "R$ 23.987,21",
    change: "+5%",
    positive: true,
    subtitle: "Ticket-médio R$ 3.987,21 · 142 vendas",
    highlight: true,
  },
  {
    title: "Obras entregues",
    value: "332",
    change: "-3%",
    positive: false,
    subtitle: "Ticket-médio R$ 3.987,21",
    highlight: false,
  },
  {
    title: "Orçamentos realizados",
    value: "R$ 5.987,21",
    change: "+3%",
    positive: true,
    subtitle: "Ticket-médio R$ 3.987,21 · 142 vendas",
    highlight: false,
  },
];

const summaryCards = [
  {
    title: "Markup",
    icon: BarChart3,
    value: "2,29",
    details: [
      { label: "Despesas fixas", value: "R$ 3.988,21" },
      { label: "Despesas variáveis", value: "R$ 3.988,21" },
      { label: "Faturamento médio", value: "R$ 3.988,21" },
    ],
  },
  {
    title: "Notas fiscais",
    icon: FileText,
    value: "R$ 3.098,21",
    details: [
      { label: "Produtos", value: "33" },
      { label: "Serviços", value: "33" },
      { label: "Total", value: "66" },
    ],
  },
  {
    title: "Estoque",
    icon: Package,
    value: "—",
    details: [
      { label: "Entradas", value: "—" },
      { label: "Saídas", value: "—" },
    ],
  },
];

const recentOrders = [
  { id: "PED-001", client: "Igor Soares de Souza", value: "R$ 2.440,94", status: "Em andamento", days: "Faltam 5 dias" },
  { id: "PED-002", client: "Maria Oliveira", value: "R$ 14.089,00", status: "Fechado", days: "Atrasado 2 dias" },
  { id: "PED-003", client: "Carlos Santos", value: "R$ 1.232,50", status: "Em andamento", days: "Faltam 8 dias" },
  { id: "PED-004", client: "Ana Costa", value: "R$ 3.087,31", status: "Conferência", days: "Faltam 1 dia" },
];

const Index = () => {
  return (
    <AppLayout>
      <div className="space-y-6 max-w-7xl">
        {/* Greeting */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Olá, Bom dia, Gabriel.
            </h1>
            <p className="text-sm text-muted-foreground">
              {new Date().toLocaleDateString("pt-BR", {
                weekday: "long",
                day: "2-digit",
                month: "long",
              })}
            </p>
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2 text-sm font-medium rounded-full border border-border bg-card text-foreground hover:bg-muted transition-colors">
              Parceiros
            </button>
            <button className="px-4 py-2 text-sm font-medium rounded-full border border-border bg-card text-foreground hover:bg-muted transition-colors">
              Assinaturas
            </button>
            <button className="px-4 py-2 text-sm font-medium rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
              Tutoriais
            </button>
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
                <span
                  className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
                    card.positive
                      ? card.highlight
                        ? "bg-success/30 text-success-foreground"
                        : "bg-success/10 text-success"
                      : card.highlight
                        ? "bg-destructive/30 text-destructive-foreground"
                        : "bg-destructive/10 text-destructive"
                  }`}
                >
                  {card.positive ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  {card.change}
                </span>
              </div>
              <p className={`text-2xl font-bold ${card.highlight ? "text-primary-foreground" : "text-foreground"}`}>
                {card.value}
              </p>
              <p className={`text-xs mt-2 ${card.highlight ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                {card.subtitle}
              </p>
              <button
                className={`mt-3 flex items-center gap-1 text-xs font-medium ${
                  card.highlight
                    ? "text-primary-foreground/80 hover:text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                } transition-colors`}
              >
                Ver mais <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {summaryCards.map((card) => (
            <div
              key={card.title}
              className="bg-card border border-border rounded-xl p-5 shadow-sm"
            >
              <div className="flex items-center gap-2 mb-3">
                <card.icon className="h-5 w-5 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">{card.title}</h3>
              </div>
              <p className="text-xl font-bold text-foreground mb-3">{card.value}</p>
              <div className="flex gap-4">
                {card.details.map((d) => (
                  <div key={d.label}>
                    <p className="text-[11px] text-muted-foreground">{d.label}</p>
                    <p className="text-sm font-semibold text-foreground">{d.value}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Recent Orders */}
        <div className="bg-card border border-border rounded-xl shadow-sm">
          <div className="flex items-center justify-between p-5 border-b border-border">
            <h3 className="text-base font-semibold text-foreground">Pedidos recentes</h3>
            <button className="text-sm text-primary font-medium hover:underline">
              Ver todos
            </button>
          </div>
          <div className="divide-y divide-border">
            {recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-bold text-primary">{order.id}</span>
                  <div>
                    <p className="text-sm font-medium text-foreground">{order.client}</p>
                    <p className="text-xs text-muted-foreground">{order.status}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-foreground">{order.value}</p>
                  <p
                    className={`text-xs font-medium ${
                      order.days.includes("Atrasado")
                        ? "text-destructive"
                        : "text-warning"
                    }`}
                  >
                    {order.days}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Index;
