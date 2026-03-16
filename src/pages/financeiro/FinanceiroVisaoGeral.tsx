import { AppLayout } from "@/components/AppLayout";
import { TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownRight, DollarSign } from "lucide-react";
import { useSupabaseQuery } from "@/hooks/useSupabaseQuery";
import type { Tables } from "@/integrations/supabase/types";

type ContaReceberRow = Tables<"contas_receber">;
type ContaPagarRow = Tables<"contas_pagar">;
type ContaComTipo = (ContaReceberRow | ContaPagarRow) & { tipo: string };

const FinanceiroVisaoGeral = () => {
  const { data: contasReceber = [] } = useSupabaseQuery("contas_receber");
  const { data: contasPagar = [] } = useSupabaseQuery("contas_pagar");

  const totalReceber = contasReceber.reduce((s: number, c: ContaReceberRow) => s + Number(c.valor || 0), 0);
  const totalPagar = contasPagar.reduce((s: number, c: ContaPagarRow) => s + Number(c.valor || 0), 0);
  const totalRecebido = contasReceber.filter((c: ContaReceberRow) => c.status === "pago").reduce((s: number, c: ContaReceberRow) => s + Number(c.valor || 0), 0);
  const totalPago = contasPagar.filter((c: ContaPagarRow) => c.status === "pago").reduce((s: number, c: ContaPagarRow) => s + Number(c.valor || 0), 0);
  const lucro = totalRecebido - totalPago;
  const saldo = totalReceber - totalPagar;

  const fmt = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

  return (
    <AppLayout>
      <div className="space-y-6 max-w-7xl">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Financeiro</h1>
          <p className="text-sm text-muted-foreground">Visão geral das finanças da empresa</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[
            { label: "Total a Receber", value: fmt(totalReceber), icon: TrendingUp, color: "text-success", count: `${contasReceber.length} contas` },
            { label: "Total a Pagar", value: fmt(totalPagar), icon: TrendingDown, color: "text-destructive", count: `${contasPagar.length} contas` },
            { label: "Recebido", value: fmt(totalRecebido), icon: Wallet, color: "text-primary", count: `${contasReceber.filter((c: ContaReceberRow) => c.status === "pago").length} pagas` },
            { label: "Saldo", value: fmt(saldo), icon: DollarSign, color: saldo >= 0 ? "text-success" : "text-destructive", count: lucro >= 0 ? "Positivo" : "Negativo" },
          ].map((kpi) => (
            <div key={kpi.label} className="bg-card border border-border rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground">{kpi.label}</p>
                <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
              </div>
              <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
              <p className="text-xs text-muted-foreground">{kpi.count}</p>
            </div>
          ))}
        </div>

        {/* Recent from both */}
        <div className="bg-card border border-border rounded-xl shadow-sm">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="text-sm font-bold text-foreground">Últimas Contas</h2>
          </div>
          <div className="divide-y divide-border">
            {[...contasReceber.slice(0, 3).map((c: ContaReceberRow) => ({ ...c, tipo: "receber" as const })), ...contasPagar.slice(0, 3).map((c: ContaPagarRow) => ({ ...c, tipo: "pagar" as const }))]
              .sort((a: ContaComTipo, b: ContaComTipo) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
              .slice(0, 5)
              .map((tx: ContaComTipo) => (
                <div key={tx.id} className="flex items-center justify-between px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center ${tx.tipo === "receber" ? "bg-success/10" : "bg-destructive/10"}`}>
                      {tx.tipo === "receber" ? <ArrowUpRight className="h-4 w-4 text-success" /> : <ArrowDownRight className="h-4 w-4 text-destructive" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{tx.descricao}</p>
                      <p className="text-xs text-muted-foreground">{new Date(tx.data_vencimento).toLocaleDateString("pt-BR")}</p>
                    </div>
                  </div>
                  <p className={`text-sm font-bold ${tx.tipo === "receber" ? "text-success" : "text-destructive"}`}>
                    {tx.tipo === "receber" ? "+" : "-"}R$ {Number(tx.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </p>
                </div>
              ))}
            {contasReceber.length === 0 && contasPagar.length === 0 && (
              <div className="px-5 py-8 text-center text-muted-foreground text-sm">
                Nenhuma movimentação financeira ainda.
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default FinanceiroVisaoGeral;
