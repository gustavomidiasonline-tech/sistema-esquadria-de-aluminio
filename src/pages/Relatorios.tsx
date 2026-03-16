import { AppLayout } from "@/components/AppLayout";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { TrendingUp, TrendingDown, DollarSign, FileText, CheckSquare, Users, Wrench, MapPin } from "lucide-react";
import { useSupabaseQuery } from "@/hooks/useSupabaseQuery";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { parseISO, format, startOfMonth, eachMonthOfInterval, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { BOMService } from "@/services/bom.service";
import type { LucideIcon } from "lucide-react";

const StatCard = ({ icon: Icon, label, value, change, positive }: { icon: LucideIcon; label: string; value: string; change: string; positive: boolean }) => (
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

const BAR_COLORS = ["hsl(var(--primary))", "hsl(142, 72%, 42%)", "hsl(38, 92%, 50%)", "hsl(280, 60%, 55%)", "hsl(0, 72%, 51%)", "hsl(180, 50%, 45%)"];

const Relatorios = () => {
  const { data: pedidos = [] } = useSupabaseQuery("pedidos");
  const { data: orcamentos = [] } = useSupabaseQuery("orcamentos");
  const { data: clientes = [] } = useSupabaseQuery("clientes");
  const { data: servicos = [] } = useSupabaseQuery("servicos");

  const { data: orcItens = [] } = useQuery({
    queryKey: ["relatorios-orc-itens"],
    queryFn: async () => {
      const { data } = await supabase.from("orcamento_itens").select("id, descricao, largura, altura, quantidade, orcamento_id");
      return data ?? [];
    },
  });

  const { data: clientesOrc = [] } = useQuery({
    queryKey: ["relatorios-clientes-orc"],
    queryFn: async () => {
      const { data } = await supabase.from("orcamentos").select("id, cliente_id, valor_total, status, clientes(nome, cidade, estado)");
      return data ?? [];
    },
  });

  const totalFaturamento = pedidos.reduce((s: number, p) => s + (Number(p.valor_total) || 0), 0);
  const pedidosConcluidos = pedidos.filter((p) => p.status === "entregue").length;
  const orcAprovados = orcamentos.filter((o) => o.status === "aprovado").length;

  // ===== FINANCEIRO =====
  const financeiroData = useMemo(() => {
    const now = new Date();
    const months = eachMonthOfInterval({ start: subMonths(startOfMonth(now), 5), end: startOfMonth(now) });

    const mensal = months.map((month) => {
      const mesKey = format(month, "yyyy-MM");
      const mesLabel = format(month, "MMM", { locale: ptBR });
      const doMes = pedidos.filter((p) => format(parseISO(p.created_at), "yyyy-MM") === mesKey);
      const valor = doMes.reduce((s: number, p) => s + (Number(p.valor_total) || 0), 0);
      return { mes: mesLabel, valor };
    });

    const maxValor = Math.max(...mensal.map((m) => m.valor), 1);
    const ticketMedio = pedidos.length > 0 ? totalFaturamento / pedidos.length : 0;

    // Top clientes
    const clienteValor: Record<string, { nome: string; valor: number; count: number }> = {};
    clientesOrc.forEach((o) => {
      const cNome = (o.clientes as { nome: string } | null)?.nome || "Sem cliente";
      const cId = o.cliente_id || "unknown";
      if (!clienteValor[cId]) clienteValor[cId] = { nome: cNome, valor: 0, count: 0 };
      clienteValor[cId].valor += Number(o.valor_total) || 0;
      clienteValor[cId].count++;
    });
    const topClientes = Object.values(clienteValor).sort((a, b) => b.valor - a.valor).slice(0, 5);

    return { mensal, maxValor, ticketMedio, topClientes };
  }, [pedidos, clientesOrc, totalFaturamento]);

  // ===== PRODUCAO =====
  const producaoData = useMemo(() => {
    const statusCounts: Record<string, number> = {};
    orcamentos.forEach((o) => { statusCounts[o.status] = (statusCounts[o.status] || 0) + 1; });
    const totalOrc = orcamentos.length;
    const maxCount = Math.max(...Object.values(statusCounts), 1);

    const taxaConversao = totalOrc > 0 ? Math.round((orcAprovados / totalOrc) * 100) : 0;

    // Tempo medio
    const aprovados = orcamentos.filter((o) => o.status === "aprovado" && o.updated_at && o.created_at);
    let tempoMedio = 0;
    if (aprovados.length > 0) {
      const totalDias = aprovados.reduce((s, o) => {
        const diff = (new Date(o.updated_at).getTime() - new Date(o.created_at).getTime()) / (1000 * 60 * 60 * 24);
        return s + diff;
      }, 0);
      tempoMedio = Math.round(totalDias / aprovados.length);
    }

    return { statusCounts, maxCount, taxaConversao, tempoMedio };
  }, [orcamentos, orcAprovados]);

  // ===== MATERIAIS =====
  const materiaisData = useMemo(() => {
    const boms = orcItens.map((item) =>
      BOMService.calcularBOM({
        id: item.id,
        descricao: item.descricao,
        largura: item.largura,
        altura: item.altura,
        quantidade: item.quantidade,
      })
    );

    const agregados = Array.from(BOMService.agregarMateriais(boms).values());
    const sorted = agregados.sort((a, b) => b.quantidade - a.quantidade);
    const maxQtd = Math.max(...sorted.map((m) => m.quantidade), 1);

    return { sorted: sorted.slice(0, 10), maxQtd, totalItens: orcItens.length };
  }, [orcItens]);

  // ===== CLIENTES =====
  const clientesData = useMemo(() => {
    const clienteMap: Record<string, { nome: string; cidade: string; estado: string; valor: number; count: number }> = {};
    clientesOrc.forEach((o) => {
      const c = o.clientes as { nome: string; cidade: string | null; estado: string | null } | null;
      const cId = o.cliente_id || "unknown";
      if (!clienteMap[cId]) clienteMap[cId] = { nome: c?.nome || "Sem nome", cidade: c?.cidade || "", estado: c?.estado || "", valor: 0, count: 0 };
      clienteMap[cId].valor += Number(o.valor_total) || 0;
      clienteMap[cId].count++;
    });

    const ranking = Object.values(clienteMap).sort((a, b) => b.valor - a.valor);
    const maxValor = Math.max(...ranking.map((r) => r.valor), 1);

    // Cidades
    const cidadeMap: Record<string, number> = {};
    ranking.forEach((c) => {
      const key = c.cidade ? `${c.cidade}/${c.estado}` : "Nao informado";
      cidadeMap[key] = (cidadeMap[key] || 0) + 1;
    });
    const cidades = Object.entries(cidadeMap).sort((a, b) => b[1] - a[1]).slice(0, 8);
    const maxCidade = Math.max(...cidades.map((c) => c[1]), 1);

    return { ranking: ranking.slice(0, 10), maxValor, cidades, maxCidade };
  }, [clientesOrc]);

  const statusColors: Record<string, string> = {
    aprovado: "bg-emerald-500",
    enviado: "bg-blue-500",
    rascunho: "bg-gray-400",
    rejeitado: "bg-red-500",
    pendente: "bg-amber-500",
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-7xl">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Relatorios</h1>
          <p className="text-sm text-muted-foreground">Metricas de vendas, producao, materiais e clientes</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={DollarSign} label="Faturamento total" value={fmtCur(totalFaturamento)} change={`${pedidos.length} pedidos`} positive />
          <StatCard icon={FileText} label="Orcamentos gerados" value={String(orcamentos.length)} change={`${orcAprovados} aprovados`} positive />
          <StatCard icon={CheckSquare} label="Pedidos concluidos" value={String(pedidosConcluidos)} change={`de ${pedidos.length}`} positive={pedidosConcluidos > 0} />
          <StatCard icon={Wrench} label="Servicos" value={String(servicos.length)} change={`${servicos.filter((s) => s.status === "concluido").length} concluidos`} positive />
        </div>

        <Tabs defaultValue="financeiro">
          <TabsList>
            <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
            <TabsTrigger value="producao">Producao</TabsTrigger>
            <TabsTrigger value="materiais">Materiais</TabsTrigger>
            <TabsTrigger value="clientes">Clientes</TabsTrigger>
          </TabsList>

          {/* FINANCEIRO */}
          <TabsContent value="financeiro" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="text-sm font-semibold text-foreground mb-4">Faturamento Mensal</h3>
                {financeiroData.mensal.every((m) => m.valor === 0) ? (
                  <p className="text-center text-muted-foreground py-8">Sem dados de vendas.</p>
                ) : (
                  <div className="space-y-3">
                    {financeiroData.mensal.map((m) => {
                      const pct = Math.round((m.valor / financeiroData.maxValor) * 100);
                      return (
                        <div key={m.mes} className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-foreground w-10">{m.mes}</span>
                            <span className="text-xs font-bold text-muted-foreground">{fmtCur(m.valor)}</span>
                          </div>
                          <div className="h-3 bg-muted rounded-full overflow-hidden">
                            <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="bg-card border border-border rounded-xl p-6">
                  <h3 className="text-sm font-semibold text-foreground mb-3">Ticket Medio</h3>
                  <p className="text-3xl font-bold text-primary">{fmtCur(financeiroData.ticketMedio)}</p>
                  <p className="text-xs text-muted-foreground mt-1">por pedido</p>
                </div>

                <div className="bg-card border border-border rounded-xl p-6">
                  <h3 className="text-sm font-semibold text-foreground mb-3">Top 5 Clientes por Valor</h3>
                  <div className="space-y-2">
                    {financeiroData.topClientes.length === 0 ? (
                      <p className="text-xs text-muted-foreground">Sem dados.</p>
                    ) : (
                      financeiroData.topClientes.map((c, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-muted-foreground w-4">{i + 1}</span>
                            <span className="text-xs font-medium text-foreground truncate max-w-[140px]">{c.nome}</span>
                          </div>
                          <span className="text-xs font-bold text-primary">{fmtCur(c.valor)}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* PRODUCAO */}
          <TabsContent value="producao" className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="bg-card border border-border rounded-xl p-4">
                <p className="text-[10px] font-medium text-muted-foreground uppercase">Taxa Conversao</p>
                <p className="text-3xl font-bold text-primary">{producaoData.taxaConversao}%</p>
                <p className="text-xs text-muted-foreground">orcamentos aprovados</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-4">
                <p className="text-[10px] font-medium text-muted-foreground uppercase">Tempo Medio</p>
                <p className="text-3xl font-bold text-foreground">{producaoData.tempoMedio}d</p>
                <p className="text-xs text-muted-foreground">para aprovacao</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-4">
                <p className="text-[10px] font-medium text-muted-foreground uppercase">Total</p>
                <p className="text-3xl font-bold text-foreground">{orcamentos.length}</p>
                <p className="text-xs text-muted-foreground">orcamentos</p>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="text-sm font-semibold text-foreground mb-4">Orcamentos por Status</h3>
              {Object.keys(producaoData.statusCounts).length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Sem orcamentos.</p>
              ) : (
                <div className="space-y-3">
                  {Object.entries(producaoData.statusCounts).map(([status, count]) => {
                    const pct = Math.round((count / producaoData.maxCount) * 100);
                    return (
                      <div key={status} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className={cn("h-2.5 w-2.5 rounded-full", statusColors[status] || "bg-gray-400")} />
                            <span className="text-xs font-medium text-foreground capitalize">{status}</span>
                          </div>
                          <span className="text-xs font-bold text-muted-foreground">{count} ({orcamentos.length > 0 ? Math.round((count / orcamentos.length) * 100) : 0}%)</span>
                        </div>
                        <div className="h-3 bg-muted rounded-full overflow-hidden">
                          <div className={cn("h-full rounded-full transition-all duration-500", statusColors[status] || "bg-primary")} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </TabsContent>

          {/* MATERIAIS */}
          <TabsContent value="materiais" className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-card border border-border rounded-xl p-4">
                <p className="text-[10px] font-medium text-muted-foreground uppercase">Itens Orcados</p>
                <p className="text-3xl font-bold text-foreground">{materiaisData.totalItens}</p>
                <p className="text-xs text-muted-foreground">itens com BOM calculado</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-4">
                <p className="text-[10px] font-medium text-muted-foreground uppercase">Materiais Distintos</p>
                <p className="text-3xl font-bold text-primary">{materiaisData.sorted.length}</p>
                <p className="text-xs text-muted-foreground">tipos de material</p>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="text-sm font-semibold text-foreground mb-4">Materiais Mais Usados</h3>
              {materiaisData.sorted.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Sem dados de materiais.</p>
              ) : (
                <div className="space-y-3">
                  {materiaisData.sorted.map((m, i) => {
                    const pct = Math.round((m.quantidade / materiaisData.maxQtd) * 100);
                    return (
                      <div key={i} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-foreground">{m.nome}</span>
                          <span className="text-xs font-bold text-muted-foreground">{m.quantidade.toFixed(2)} {m.unidade}</span>
                        </div>
                        <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: BAR_COLORS[i % BAR_COLORS.length] }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </TabsContent>

          {/* CLIENTES */}
          <TabsContent value="clientes" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="text-sm font-semibold text-foreground mb-4">Ranking por Valor</h3>
                {clientesData.ranking.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Sem dados.</p>
                ) : (
                  <div className="space-y-3">
                    {clientesData.ranking.map((c, i) => {
                      const pct = Math.round((c.valor / clientesData.maxValor) * 100);
                      return (
                        <div key={i} className="space-y-1">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold text-primary bg-primary/10 h-5 w-5 rounded-full flex items-center justify-center">{i + 1}</span>
                              <span className="text-xs font-medium text-foreground truncate max-w-[120px]">{c.nome}</span>
                              <span className="text-[10px] text-muted-foreground">{c.count} orc.</span>
                            </div>
                            <span className="text-xs font-bold text-foreground">{fmtCur(c.valor)}</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: BAR_COLORS[i % BAR_COLORS.length] }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="bg-card border border-border rounded-xl p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <MapPin className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-semibold text-foreground">Clientes por Cidade</h3>
                  </div>
                  {clientesData.cidades.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Sem dados de localizacao.</p>
                  ) : (
                    <div className="space-y-2.5">
                      {clientesData.cidades.map(([cidade, count], i) => {
                        const pct = Math.round((count / clientesData.maxCidade) * 100);
                        return (
                          <div key={cidade} className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-medium text-foreground">{cidade}</span>
                              <span className="text-xs font-bold text-muted-foreground">{count}</span>
                            </div>
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: BAR_COLORS[i % BAR_COLORS.length] }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="bg-card border border-border rounded-xl p-6">
                  <h3 className="text-sm font-semibold text-foreground mb-3">Resumo</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase">Total Clientes</p>
                      <p className="text-2xl font-bold text-foreground">{clientes.length}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase">Com Orcamentos</p>
                      <p className="text-2xl font-bold text-primary">{clientesData.ranking.length}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default Relatorios;
