import { AppLayout } from "@/components/AppLayout";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

const mockFluxo = [
  { mes: "Janeiro", entradas: 38500, saidas: 21200 },
  { mes: "Fevereiro", entradas: 42800, saidas: 23500 },
  { mes: "Março", entradas: 48750, saidas: 22340 },
];

const FluxoCaixa = () => (
  <AppLayout>
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Fluxo de Caixa</h1>
        <p className="text-sm text-muted-foreground">Acompanhamento de entradas e saídas</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {mockFluxo.map((m) => {
          const saldo = m.entradas - m.saidas;
          return (
            <div key={m.mes} className="bg-card border border-border rounded-xl p-5 space-y-4">
              <p className="text-sm font-bold text-foreground">{m.mes}</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <ArrowUpRight className="h-3.5 w-3.5 text-success" /> Entradas
                  </div>
                  <span className="text-sm font-semibold text-success">R$ {m.entradas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <ArrowDownRight className="h-3.5 w-3.5 text-destructive" /> Saídas
                  </div>
                  <span className="text-sm font-semibold text-destructive">R$ {m.saidas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="pt-2 border-t border-border flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">Saldo</span>
                  <span className="text-sm font-bold text-primary">R$ {saldo.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  </AppLayout>
);

export default FluxoCaixa;
