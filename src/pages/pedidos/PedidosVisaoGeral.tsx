import { AppLayout } from "@/components/AppLayout";
import { ListChecks, GitBranch, Package, TrendingUp, Truck, Clock } from "lucide-react";
import { useSupabaseQuery } from "@/hooks/useSupabaseQuery";
import { useNavigate } from "react-router-dom";
import { useMemo } from "react";
import type { Tables } from "@/integrations/supabase/types";

type Pedido = Tables<"pedidos">;

const PedidosVisaoGeral = () => {
  const navigate = useNavigate();
  const { data: pedidos = [], isLoading } = useSupabaseQuery("pedidos", {
    orderBy: { column: "created_at", ascending: false },
  });

  const sections = [
    {
      title: "Lista de Pedidos",
      url: "/pedidos/lista",
      icon: ListChecks,
      description: "Gestao completa de pedidos, status e kanban",
    },
    {
      title: "Workflow",
      url: "/pedidos/workflow",
      icon: GitBranch,
      description: "Acompanhamento detalhado do processo de producao",
    },
  ];

  const stats = useMemo(() => {
    const total = pedidos.length;
    const emProducao = pedidos.filter((p) => p.status === "em_producao").length;
    const novos = pedidos.filter((p) => p.status === "pendente").length;
    const prontos = pedidos.filter((p) => p.status === "pronto").length;
    return { total, emProducao, novos, prontos };
  }, [pedidos]);

  return (
    <AppLayout>
      <div className="space-y-6 max-w-7xl">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pedidos</h1>
          <p className="text-sm text-muted-foreground">Gestao e acompanhamento de pedidos de venda</p>
        </div>

        {/* Navigation Cards */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">Acessar Modulos</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {sections.map((section) => (
              <button
                key={section.url}
                onClick={() => navigate(section.url)}
                className="glass-card-premium p-6 rounded-xl hover:bg-primary/5 transition-all duration-300 text-left group border border-border/50 hover:border-primary/50 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
                  <section.icon className="h-24 w-24" />
                </div>
                <div className="flex items-center gap-4 mb-3">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                    <section.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors">
                      {section.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">{section.description}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Pedidos", value: stats.total, icon: Package, color: "text-primary", bg: "bg-primary/10" },
            { label: "Novos", value: stats.novos, icon: Clock, color: "text-amber-500", bg: "bg-amber-500/10" },
            { label: "Em Producao", value: stats.emProducao, icon: TrendingUp, color: "text-blue-500", bg: "bg-blue-500/10" },
            { label: "Prontos", value: stats.prontos, icon: Truck, color: "text-emerald-500", bg: "bg-emerald-500/10" },
          ].map((kpi) => (
            <div key={kpi.label} className="glass-card-premium p-5 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{kpi.label}</p>
                <div className={`p-2 rounded-lg ${kpi.bg}`}>
                  <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
                </div>
              </div>
              <p className="text-3xl font-black text-foreground">{kpi.value}</p>
            </div>
          ))}
        </div>

        {/* Recent Orders Table Highlight */}
        <div className="glass-card-premium rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <h2 className="font-bold text-foreground">Pedidos Recentes</h2>
            <button onClick={() => navigate("/pedidos/lista")} className="text-xs font-bold text-primary hover:underline">Ver todos</button>
          </div>
          <div className="divide-y divide-border">
            {isLoading ? (
              <div className="p-8 text-center"><div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto" /></div>
            ) : pedidos.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">Nenhum pedido encontrado.</div>
            ) : (
              pedidos.slice(0, 5).map((pedido: Pedido) => (
                <div key={pedido.id} className="px-6 py-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center font-bold text-xs">
                      #{pedido.numero}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">Vendedor: {pedido.vendedor || "Sistema"}</p>
                      <p className="text-xs text-muted-foreground">{new Date(pedido.created_at).toLocaleDateString("pt-BR")}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-foreground">
                      R$ {Number(pedido.valor_total).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </p>
                    <span className="text-[10px] font-bold uppercase py-0.5 px-2 rounded-full border border-border">{pedido.status}</span>
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

export default PedidosVisaoGeral;
