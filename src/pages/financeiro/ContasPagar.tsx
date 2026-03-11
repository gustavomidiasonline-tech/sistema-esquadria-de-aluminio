import { AppLayout } from "@/components/AppLayout";
import { CreditCard, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const mockContas = [
  { id: 1, fornecedor: "Vidros ABC Ltda", descricao: "Vidros temperados lote #45", valor: 8500, vencimento: "18/03/2026", status: "pendente" },
  { id: 2, fornecedor: "Alumínio Sul", descricao: "Perfis linha Suprema", valor: 4200, vencimento: "22/03/2026", status: "pendente" },
  { id: 3, fornecedor: "Imobiliária Centro", descricao: "Aluguel galpão - Março", valor: 3200, vencimento: "10/03/2026", status: "pago" },
  { id: 4, fornecedor: "Energia Elétrica", descricao: "Conta de luz - Fev", valor: 890, vencimento: "05/03/2026", status: "pago" },
  { id: 5, fornecedor: "Ferragens Express", descricao: "Fechaduras e roldanas", valor: 1350, vencimento: "12/03/2026", status: "vencido" },
];

const statusMap: Record<string, { label: string; variant: "default" | "destructive" | "outline" }> = {
  pendente: { label: "Pendente", variant: "outline" },
  vencido: { label: "Vencido", variant: "destructive" },
  pago: { label: "Pago", variant: "default" },
};

const ContasPagar = () => (
  <AppLayout>
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Contas a Pagar</h1>
          <p className="text-sm text-muted-foreground">{mockContas.length} contas cadastradas</p>
        </div>
        <Button className="gap-2"><Plus className="h-4 w-4" /> Nova conta</Button>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm divide-y divide-border">
        {mockContas.map((c) => {
          const s = statusMap[c.status];
          return (
            <div key={c.id} className="flex items-center justify-between px-5 py-4 hover:bg-muted/50 transition-colors cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
                  <CreditCard className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{c.fornecedor}</p>
                  <p className="text-xs text-muted-foreground">{c.descricao} · Venc: {c.vencimento}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-foreground">R$ {c.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                <Badge variant={s.variant}>{s.label}</Badge>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  </AppLayout>
);

export default ContasPagar;
