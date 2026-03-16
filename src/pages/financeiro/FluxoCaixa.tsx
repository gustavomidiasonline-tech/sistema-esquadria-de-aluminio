import { AppLayout } from "@/components/AppLayout";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { useSupabaseQuery } from "@/hooks/useSupabaseQuery";
import { parseISO, format } from "date-fns";
import type { Tables } from "@/integrations/supabase/types";

const FluxoCaixa = () => {
  const { data: pagamentos = [], isLoading } = useSupabaseQuery("pagamentos", {
    orderBy: { column: "data_pagamento", ascending: false },
  });

  // Group by month
  const byMonth: Record<string, { entradas: number; saidas: number }> = {};
  pagamentos.forEach((p: Tables<"pagamentos">) => {
    const month = format(parseISO(p.data_pagamento), "MMMM yyyy");
    if (!byMonth[month]) byMonth[month] = { entradas: 0, saidas: 0 };
    if (p.tipo === "entrada") byMonth[month].entradas += Number(p.valor) || 0;
    else byMonth[month].saidas += Number(p.valor) || 0;
  });

  const fluxo = Object.entries(byMonth).map(([mes, data]) => ({ mes, ...data }));
  const fmt = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

  return (
    <AppLayout>
      <div className="space-y-6 max-w-7xl">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Fluxo de Caixa</h1>
          <p className="text-sm text-muted-foreground">Acompanhamento de entradas e saídas reais</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>
        ) : fluxo.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">Nenhum pagamento registrado ainda.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {fluxo.map((m) => {
              const saldo = m.entradas - m.saidas;
              return (
                <div key={m.mes} className="glass-card-premium p-5 space-y-4">
                  <p className="text-sm font-bold text-foreground capitalize">{m.mes}</p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground"><ArrowUpRight className="h-3.5 w-3.5 text-success" /> Entradas</div>
                      <span className="text-sm font-semibold text-success">{fmt(m.entradas)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground"><ArrowDownRight className="h-3.5 w-3.5 text-destructive" /> Saídas</div>
                      <span className="text-sm font-semibold text-destructive">{fmt(m.saidas)}</span>
                    </div>
                    <div className="pt-2 border-t border-border flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">Saldo</span>
                      <span className={`text-sm font-bold ${saldo >= 0 ? "text-success" : "text-destructive"}`}>{fmt(saldo)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default FluxoCaixa;
