import { AppLayout } from "@/components/AppLayout";
import { useState, useEffect } from "react";
import { Search, Filter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { WorkflowCard } from "@/components/workflow/WorkflowCard";
import { WorkflowDetail } from "@/components/workflow/WorkflowDetail";
import { BackButton } from "@/components/ui/BackButton";

interface PedidoWithCliente {
  id: string;
  numero: number;
  status: string;
  valor_total: number | null;
  vendedor: string | null;
  data_entrega: string | null;
  created_at: string;
  cliente: { nome: string } | null;
}

interface WorkflowStage {
  id: string;
  name: string;
  icon: string;
  field_type: string;
  sort_order: number;
}

const Workflow = () => {
  const [pedidos, setPedidos] = useState<PedidoWithCliente[]>([]);
  const [stages, setStages] = useState<WorkflowStage[]>([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("todos");
  const [selectedPedido, setSelectedPedido] = useState<PedidoWithCliente | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [pedidosRes, stagesRes] = await Promise.all([
      supabase
        .from("pedidos")
        .select("id, numero, status, valor_total, vendedor, data_entrega, created_at, cliente:clientes(nome)")
        .order("numero", { ascending: false }),
      supabase
        .from("workflow_templates")
        .select("*")
        .order("sort_order"),
    ]);
    setPedidos((pedidosRes.data as PedidoWithCliente[]) || []);
    setStages((stagesRes.data as WorkflowStage[]) || []);
    setLoading(false);
  };

  const filtered = pedidos.filter((p) => {
    const matchSearch =
      String(p.numero).includes(search) ||
      (p.cliente as { nome: string } | null)?.nome?.toLowerCase().includes(search.toLowerCase()) ||
      p.vendedor?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "todos" || p.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const statusOptions = [
    { value: "todos", label: "Todos" },
    { value: "pendente", label: "Pendente" },
    { value: "em_producao", label: "Em Produção" },
    { value: "pronto", label: "Pronto" },
    { value: "entregue", label: "Entregue" },
  ];

  // Detail view
  if (selectedPedido) {
    return (
      <AppLayout>
        <WorkflowDetail
          pedido={selectedPedido}
          onBack={() => {
            setSelectedPedido(null);
            loadData();
          }}
        />
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <BackButton to="/pedidos" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">Workflow de Pedidos</h1>
            <p className="text-sm text-muted-foreground">
              Acompanhe o progresso de cada pedido pelas etapas de produção
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar pedido, cliente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-1.5 bg-muted/50 rounded-lg p-1">
            {statusOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setFilterStatus(opt.value)}
                className={`text-xs font-medium px-3 py-1.5 rounded-md transition-all ${
                  filterStatus === opt.value
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Cards grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-48 bg-muted/50 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground">Nenhum pedido encontrado</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((pedido) => (
              <WorkflowCard
                key={pedido.id}
                pedido={pedido}
                stages={stages}
                onClick={() => setSelectedPedido(pedido)}
              />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Workflow;
