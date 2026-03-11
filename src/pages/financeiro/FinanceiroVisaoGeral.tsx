import { AppLayout } from "@/components/AppLayout";
import { TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownRight, DollarSign } from "lucide-react";

const FinanceiroVisaoGeral = () => (
  <AppLayout>
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Financeiro</h1>
        <p className="text-sm text-muted-foreground">Visão geral das finanças da empresa</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: "Receita Mensal", value: "R$ 48.750,00", change: "+12,5%", up: true, icon: TrendingUp, color: "text-success" },
          { label: "Despesas Mensais", value: "R$ 22.340,00", change: "+3,2%", up: true, icon: TrendingDown, color: "text-destructive" },
          { label: "Lucro Líquido", value: "R$ 26.410,00", change: "+18,7%", up: true, icon: Wallet, color: "text-primary" },
          { label: "Saldo em Caixa", value: "R$ 134.890,00", change: "+5,1%", up: true, icon: DollarSign, color: "text-primary" },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-card border border-border rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">{kpi.label}</p>
              <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
            </div>
            <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
            <div className="flex items-center gap-1 text-xs">
              {kpi.up ? <ArrowUpRight className="h-3 w-3 text-success" /> : <ArrowDownRight className="h-3 w-3 text-destructive" />}
              <span className={kpi.up ? "text-success" : "text-destructive"}>{kpi.change}</span>
              <span className="text-muted-foreground">vs mês anterior</span>
            </div>
          </div>
        ))}
      </div>

      {/* Recent transactions */}
      <div className="bg-card border border-border rounded-xl shadow-sm">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-sm font-bold text-foreground">Últimas Movimentações</h2>
        </div>
        <div className="divide-y divide-border">
          {[
            { desc: "Recebimento - Pedido #3 Igor Soares", value: "R$ 2.440,94", type: "entrada", date: "11/03/2026" },
            { desc: "Pagamento - Fornecedor Vidros ABC", value: "R$ 8.500,00", type: "saida", date: "10/03/2026" },
            { desc: "Recebimento - Pedido #1 Igor Soares", value: "R$ 14.089,00", type: "entrada", date: "09/03/2026" },
            { desc: "Pagamento - Aluguel Galpão", value: "R$ 3.200,00", type: "saida", date: "08/03/2026" },
            { desc: "Recebimento - Serviço #4 Ana Costa", value: "R$ 4.500,00", type: "entrada", date: "07/03/2026" },
          ].map((tx, i) => (
            <div key={i} className="flex items-center justify-between px-5 py-3">
              <div className="flex items-center gap-3">
                <div className={`h-8 w-8 rounded-full flex items-center justify-center ${tx.type === "entrada" ? "bg-success/10" : "bg-destructive/10"}`}>
                  {tx.type === "entrada" ? <ArrowUpRight className="h-4 w-4 text-success" /> : <ArrowDownRight className="h-4 w-4 text-destructive" />}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{tx.desc}</p>
                  <p className="text-xs text-muted-foreground">{tx.date}</p>
                </div>
              </div>
              <p className={`text-sm font-bold ${tx.type === "entrada" ? "text-success" : "text-destructive"}`}>
                {tx.type === "entrada" ? "+" : "-"}{tx.value}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  </AppLayout>
);

export default FinanceiroVisaoGeral;
