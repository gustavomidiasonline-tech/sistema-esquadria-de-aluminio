import {
  Package, FileText, BarChart3, DollarSign, AlertTriangle, Clock, Users, ArrowRight,
  TrendingUp, TrendingDown, CheckCircle2
} from "lucide-react";
import { GlassDashboardCard } from "@/components/GlassDashboardCard";
import { AppLayout } from "@/components/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO, differenceInDays, isPast, startOfMonth, eachDayOfInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer
} from "recharts";
import {
  ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig
} from "@/components/ui/chart";


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

// Avatar component with client initials
const ClientAvatar = ({ nome }: { nome?: string }) => {
  const initials = (nome || "?")
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join("");
  const colors = ["bg-blue-100 text-blue-600", "bg-purple-100 text-purple-600", "bg-pink-100 text-pink-600", "bg-amber-100 text-amber-600", "bg-emerald-100 text-emerald-600", "bg-cyan-100 text-cyan-600"];
  const colorIndex = (nome || "").charCodeAt(0) % colors.length;
  return (
    <div className={cn("h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0", colors[colorIndex])}>
      {initials}
    </div>
  );
};

// Status badge component for tables
const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    pendente: { bg: "bg-amber-100", text: "text-amber-700", label: "Pendente" },
    em_producao: { bg: "bg-blue-100", text: "text-blue-700", label: "Em Produção" },
    pronto: { bg: "bg-emerald-100", text: "text-emerald-700", label: "Pronto" },
    entregue: { bg: "bg-green-100", text: "text-green-700", label: "Entregue" },
    cancelado: { bg: "bg-red-100", text: "text-red-700", label: "Cancelado" },
    aprovado: { bg: "bg-emerald-100", text: "text-emerald-700", label: "Aprovado" },
    enviado: { bg: "bg-blue-100", text: "text-blue-700", label: "Enviado" },
    rascunho: { bg: "bg-slate-100", text: "text-slate-600", label: "Rascunho" },
    rejeitado: { bg: "bg-red-100", text: "text-red-700", label: "Rejeitado" },
  };
  const s = map[status] ?? { bg: "bg-muted", text: "text-muted-foreground", label: status };
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold", s.bg, s.text)}>
      {s.label}
    </span>
  );
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

  // BI ENHANCEMENTS: Chart data and trends
  // Area chart: daily orcamentos this month
  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(now),
    end: now,
  });
  const orcByDay: Record<string, number> = {};
  orcMes.forEach((o) => {
    const day = format(parseISO(o.created_at), "dd/MM");
    orcByDay[day] = (orcByDay[day] || 0) + 1;
  });
  const areaChartData = daysInMonth.map((d) => ({
    dia: format(d, "dd/MM"),
    orcamentos: orcByDay[format(d, "dd/MM")] || 0,
  }));

  // Pie chart: status distribution
  const STATUS_LABELS: Record<string, string> = {
    rascunho: "Rascunho",
    enviado: "Enviado",
    aprovado: "Aprovado",
    rejeitado: "Rejeitado",
    cancelado: "Cancelado",
  };

  const STATUS_PIE_COLORS: Record<string, string> = {
    rascunho: "#94a3b8",
    enviado: "#3b82f6",
    aprovado: "#10b981",
    rejeitado: "#ef4444",
    cancelado: "#f97316",
  };

  const pieChartData = Object.entries(statusCounts).map(([status, count]) => ({
    name: STATUS_LABELS[status] ?? status,
    value: count,
    fill: STATUS_PIE_COLORS[status] ?? "#6366f1",
  }));

  // Trend: faturamento vs previous month
  const inicioMesAnterior = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
  const fimMesAnterior = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString();
  const orcMesAnterior = orcamentos.filter(
    (o) => o.created_at >= inicioMesAnterior && o.created_at <= fimMesAnterior
  );
  const faturamentoMesAnterior = orcMesAnterior
    .filter((o) => o.status === "aprovado")
    .reduce((s, o) => s + (Number(o.valor_total) || 0), 0);
  const faturamentoTrend =
    faturamentoMesAnterior > 0
      ? Math.round(((faturamentoMes - faturamentoMesAnterior) / faturamentoMesAnterior) * 100)
      : faturamentoMes > 0
        ? 100
        : 0;
  const faturamentoDirection: "up" | "down" = faturamentoTrend >= 0 ? "up" : "down";

  // Chart config
  const areaChartConfig: ChartConfig = {
    orcamentos: { label: "Orçamentos", color: "hsl(var(--primary))" },
  };

  // Pipeline values by status (for enhanced display)
  const statusValues: Record<string, number> = {};
  orcamentos.forEach((o) => {
    statusValues[o.status] = (statusValues[o.status] || 0) + (Number(o.valor_total) || 0);
  });

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
      <div className="space-y-6 w-full max-w-[1600px] mx-auto pb-6">
        {/* Zone 1: Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
              {getGreeting()}, {profile?.nome || "Usuario"}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              {now.toLocaleDateString("pt-BR", {
                weekday: "long",
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
              {" · "}
              <span className="font-medium text-foreground">{clientes.length}</span> clientes cadastrados
            </p>
          </div>
          {/* Live indicator */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-medium text-primary self-start sm:self-auto">
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            Ao vivo
          </div>
        </div>

        {/* Zone 2: Hero KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Faturamento */}
          <div className="relative overflow-hidden rounded-2xl p-5 border shadow-sm flex flex-col gap-3 bg-gradient-to-br from-blue-50 to-blue-100/60 border-blue-200/40">
            <div className="absolute inset-0 opacity-100 pointer-events-none" />
            <div className="relative z-10 flex items-center justify-between">
              <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-blue-500/20">
                <DollarSign className="h-5 w-5 text-blue-600" />
              </div>
              <div
                className={cn(
                  "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold",
                  faturamentoDirection === "up" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                )}
              >
                {faturamentoDirection === "up" ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {Math.abs(faturamentoTrend)}%
              </div>
            </div>
            <div className="relative z-10">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Faturamento do Mês</p>
              <p className="text-3xl font-extrabold text-foreground leading-tight mt-1">{fmt(faturamentoMes)}</p>
              <p className="text-xs text-muted-foreground mt-1">{orcAprovadosMes.length} orçamentos aprovados</p>
            </div>
            <div className="absolute bottom-0 inset-x-0 h-1 bg-blue-500" />
          </div>

          {/* Card 2: Orçamentos Pendentes */}
          <div className="relative overflow-hidden rounded-2xl p-5 border shadow-sm flex flex-col gap-3 bg-gradient-to-br from-amber-50 to-amber-100/60 border-amber-200/40">
            <div className="absolute inset-0 opacity-100 pointer-events-none" />
            <div className="relative z-10 flex items-center justify-between">
              <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-amber-500/20">
                <FileText className="h-5 w-5 text-amber-600" />
              </div>
              <div
                className={cn(
                  "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold",
                  orcPendentes > 0 ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
                )}
              >
                {orcPendentes > 0 ? (
                  <>
                    <TrendingUp className="h-3 w-3" />
                    {orcPendentes}
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-3 w-3" />
                    OK
                  </>
                )}
              </div>
            </div>
            <div className="relative z-10">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Orçamentos Pendentes</p>
              <p className="text-3xl font-extrabold text-foreground leading-tight mt-1">{orcPendentes}</p>
              <p className="text-xs text-muted-foreground mt-1">de {orcamentos.length} total</p>
            </div>
            <div className="absolute bottom-0 inset-x-0 h-1 bg-amber-500" />
          </div>

          {/* Card 3: Em Produção */}
          <div className="relative overflow-hidden rounded-2xl p-5 border shadow-sm flex flex-col gap-3 bg-gradient-to-br from-emerald-50 to-emerald-100/60 border-emerald-200/40">
            <div className="absolute inset-0 opacity-100 pointer-events-none" />
            <div className="relative z-10 flex items-center justify-between">
              <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-emerald-500/20">
                <Package className="h-5 w-5 text-emerald-600" />
              </div>
              <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
                <TrendingUp className="h-3 w-3" />
                Ativo
              </div>
            </div>
            <div className="relative z-10">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Em Produção</p>
              <p className="text-3xl font-extrabold text-foreground leading-tight mt-1">{emProducao}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {pedidos.filter((p) => p.status === "entregue").length} entregues
              </p>
            </div>
            <div className="absolute bottom-0 inset-x-0 h-1 bg-emerald-500" />
          </div>

          {/* Card 4: Alertas */}
          <div
            className={cn(
              "relative overflow-hidden rounded-2xl p-5 border shadow-sm flex flex-col gap-3",
              totalAlertas > 0
                ? "bg-gradient-to-br from-red-50 to-red-100/60 border-red-200/40"
                : "bg-gradient-to-br from-green-50 to-green-100/60 border-green-200/40"
            )}
          >
            <div className="absolute inset-0 opacity-100 pointer-events-none" />
            <div className="relative z-10 flex items-center justify-between">
              <div
                className={cn(
                  "h-10 w-10 rounded-xl flex items-center justify-center",
                  totalAlertas > 0 ? "bg-red-500/20" : "bg-green-500/20"
                )}
              >
                {totalAlertas > 0 ? (
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                ) : (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                )}
              </div>
              <div
                className={cn(
                  "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold",
                  totalAlertas > 0 ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                )}
              >
                {totalAlertas > 0 ? (
                  <>
                    <TrendingUp className="h-3 w-3" />
                    {totalAlertas}
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-3 w-3" />
                    Tudo ok
                  </>
                )}
              </div>
            </div>
            <div className="relative z-10">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Alertas</p>
              <p className={cn("text-3xl font-extrabold leading-tight mt-1", totalAlertas > 0 ? "text-foreground" : "text-green-700")}>
                {totalAlertas}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{pedidosAtrasados.length} pedidos atrasados</p>
            </div>
            <div className={cn("absolute bottom-0 inset-x-0 h-1", totalAlertas > 0 ? "bg-red-500" : "bg-green-500")} />
          </div>
        </div>

        {/* Zone 3: Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* Area Chart */}
          <div className="glass-card-premium lg:col-span-3">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-foreground">Orçamentos este mês</h3>
                <p className="text-xs text-muted-foreground">
                  {orcMes.length} total em {format(now, "MMMM", { locale: ptBR })}
                </p>
              </div>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </div>
            {areaChartData.length > 0 ? (
              <ChartContainer config={areaChartConfig} className="h-[200px] w-full">
                <AreaChart data={areaChartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorOrc" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="dia"
                    tick={{ fontSize: 9 }}
                    tickLine={false}
                    axisLine={false}
                    interval={Math.floor(daysInMonth.length / 6)}
                  />
                  <YAxis tick={{ fontSize: 9 }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area
                    type="monotone"
                    dataKey="orcamentos"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fill="url(#colorOrc)"
                    dot={false}
                    activeDot={{ r: 4, strokeWidth: 2 }}
                  />
                </AreaChart>
              </ChartContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-sm text-muted-foreground">Sem dados</div>
            )}
          </div>

          {/* Pie Chart */}
          <div className="glass-card-premium lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-foreground">Por status</h3>
                <p className="text-xs text-muted-foreground">{orcamentos.length} orçamentos</p>
              </div>
            </div>
            {pieChartData.length === 0 ? (
              <div className="h-[200px] flex items-center justify-center text-sm text-muted-foreground">Sem dados</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} strokeWidth={0} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [value, "Orçamentos"]}
                    contentStyle={{
                      background: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Zone 4: Pipeline + Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Pipeline */}
          <div className="glass-card-premium">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-semibold text-foreground">Pipeline de Orçamentos</h3>
              <span className="text-xs text-muted-foreground">{orcamentos.length} total · {fmt(Object.values(statusValues).reduce((a, b) => a + b, 0))}</span>
            </div>
            <div className="space-y-4">
              {[
                {
                  key: "rascunho",
                  label: "Rascunho",
                  color: "bg-slate-400",
                  textColor: "text-slate-600",
                  bgLight: "bg-slate-100",
                },
                { key: "enviado", label: "Enviado", color: "bg-blue-500", textColor: "text-blue-600", bgLight: "bg-blue-50" },
                {
                  key: "aprovado",
                  label: "Aprovado",
                  color: "bg-emerald-500",
                  textColor: "text-emerald-600",
                  bgLight: "bg-emerald-50",
                },
                { key: "rejeitado", label: "Rejeitado", color: "bg-red-500", textColor: "text-red-600", bgLight: "bg-red-50" },
                {
                  key: "cancelado",
                  label: "Cancelado",
                  color: "bg-orange-400",
                  textColor: "text-orange-600",
                  bgLight: "bg-orange-50",
                },
              ].map(({ key, label, color, textColor, bgLight }) => {
                const count = statusCounts[key] ?? 0;
                const value = statusValues[key] ?? 0;
                const pct = orcamentos.length > 0 ? Math.round((count / orcamentos.length) * 100) : 0;
                return (
                  <div key={key} className={cn("p-3 rounded-lg transition-colors hover:bg-muted/50", bgLight)}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={cn("text-xs font-bold", textColor)}>{label}</span>
                        <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-white/60", textColor)}>
                          {count}
                        </span>
                      </div>
                      <span className="text-xs font-semibold text-muted-foreground">{pct}%</span>
                    </div>
                    <div className="h-4 bg-white/40 rounded-full overflow-hidden mb-1">
                      <div
                        className={cn("h-full rounded-full transition-all duration-700 shadow-sm", color)}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground">{fmt(value)}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Alert Panel */}
          <div className="glass-card-premium">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-semibold text-foreground">Alertas do Sistema</h3>
              {totalAlertas > 0 && (
                <span className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-destructive/10 border border-destructive/20 text-xs font-bold text-destructive">
                  <AlertTriangle className="h-3 w-3" />
                  {totalAlertas}
                </span>
              )}
            </div>
            {totalAlertas === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 gap-2">
                <CheckCircle2 className="h-10 w-10 text-emerald-500 opacity-60" />
                <p className="text-sm font-medium text-emerald-600">Tudo em dia!</p>
                <p className="text-xs text-muted-foreground">Nenhum alerta no momento</p>
              </div>
            ) : (
              <div className="space-y-2">
                {pedidosAtrasados.slice(0, 3).map((p) => (
                  <div key={p.id} className="flex items-start gap-3 p-3 rounded-xl bg-amber-50 border border-amber-200 hover:bg-amber-100/50 transition-colors group cursor-pointer" onClick={() => navigate("/pedidos")}>
                    <div className="h-8 w-8 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0 group-hover:bg-amber-500/30 transition-colors">
                      <Package className="h-4 w-4 text-amber-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-amber-900 truncate">
                        Pedido #{p.numero} — {(p.clientes as { nome: string } | null)?.nome ?? ""}
                      </p>
                      <p className="text-[10px] text-amber-700 mt-0.5">
                        {Math.abs(differenceInDays(parseISO(p.data_entrega!), now))} dias de atraso · entrega{" "}
                        {format(parseISO(p.data_entrega!), "dd/MM")}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-amber-500 text-white">ATRASADO</span>
                      <ArrowRight className="h-3 w-3 text-amber-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                ))}
                {contasVencidas.slice(0, 3).map((c) => (
                  <div key={c.id} className="flex items-start gap-3 p-3 rounded-xl bg-red-50 border border-red-200 hover:bg-red-100/50 transition-colors group cursor-pointer" onClick={() => navigate("/financeiro/contas-pagar")}>
                    <div className="h-8 w-8 rounded-lg bg-red-500/20 flex items-center justify-center shrink-0 group-hover:bg-red-500/30 transition-colors">
                      <DollarSign className="h-4 w-4 text-red-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-red-900">Conta vencida — {fmt(Number(c.valor))}</p>
                      <p className="text-[10px] text-red-700 mt-0.5">Venceu em {format(parseISO(c.data_vencimento), "dd/MM/yyyy")}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-red-500 text-white">VENCIDA</span>
                      <ArrowRight className="h-3 w-3 text-red-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                ))}
                {totalAlertas > 6 && (
                  <p className="text-center text-xs text-muted-foreground pt-1">+{totalAlertas - 6} alertas adicionais</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Zone 5: Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Recent Orcamentos */}
          <div className="glass-card-premium">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <div>
                <h3 className="text-base font-semibold text-foreground">Últimos Orçamentos</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{recentOrcamentos.length} de {orcamentos.length} total</p>
              </div>
              <button
                onClick={() => navigate("/orcamentos")}
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                Ver todos <ArrowRight className="h-3 w-3" />
              </button>
            </div>
            {recentOrcamentos.length === 0 ? (
              <div className="px-5 py-8 text-center text-muted-foreground text-sm">Nenhum orçamento ainda.</div>
            ) : (
              <div className="divide-y divide-border">
                {recentOrcamentos.map((orc) => (
                  <div
                    key={orc.id}
                    className={cn(
                      "group flex items-center justify-between gap-3 px-5 py-4 hover:bg-primary/5 transition-colors hover:shadow-sm",
                      orc.status === "aprovado" && "bg-emerald-50/30"
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <ClientAvatar nome={(orc.clientes as { nome: string } | null)?.nome} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-primary">#{orc.numero}</span>
                          <StatusBadge status={orc.status} />
                        </div>
                        <p className="text-xs text-muted-foreground truncate mt-1">
                          {(orc.clientes as { nome: string } | null)?.nome ?? "—"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-foreground">{fmt(Number(orc.valor_total || 0))}</p>
                      <p className="text-[10px] text-muted-foreground">{format(parseISO(orc.created_at), "dd MMM", { locale: ptBR })}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Pedidos */}
          <div className="glass-card-premium">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <div>
                <h3 className="text-base font-semibold text-foreground">Últimos Pedidos</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{recentPedidos.length} de {pedidos.length} total</p>
              </div>
              <button onClick={() => navigate("/pedidos")} className="text-xs text-primary hover:underline flex items-center gap-1">
                Ver todos <ArrowRight className="h-3 w-3" />
              </button>
            </div>
            {recentPedidos.length === 0 ? (
              <div className="px-5 py-8 text-center text-muted-foreground text-sm">Nenhum pedido ainda.</div>
            ) : (
              <div className="divide-y divide-border">
                {recentPedidos.map((p) => {
                  const atrasado = p.data_entrega && isPast(parseISO(p.data_entrega)) && p.status !== "entregue" && p.status !== "cancelado";
                  return (
                    <div
                      key={p.id}
                      className={cn(
                        "group flex items-center justify-between gap-3 px-5 py-4 hover:bg-primary/5 transition-colors hover:shadow-sm",
                        atrasado && "bg-red-50/30"
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <ClientAvatar nome={(p.clientes as { nome: string } | null)?.nome} />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={cn("text-xs font-bold", atrasado ? "text-destructive" : "text-primary")}>
                              #{p.numero}
                            </span>
                            <StatusBadge status={p.status ?? ""} />
                            {atrasado && (
                              <span className="px-1.5 py-0.5 text-[8px] font-bold rounded bg-destructive/20 text-destructive">ATRASADO</span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate mt-1">
                            {(p.clientes as { nome: string } | null)?.nome ?? "—"}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-foreground">{fmt(Number(p.valor_total || 0))}</p>
                        {p.data_entrega && <p className="text-[10px] text-muted-foreground">{format(parseISO(p.data_entrega), "dd MMM", { locale: ptBR })}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Index;
