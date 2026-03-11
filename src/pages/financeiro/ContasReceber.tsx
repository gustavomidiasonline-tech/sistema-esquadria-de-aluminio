import { AppLayout } from "@/components/AppLayout";
import { Wallet, Search, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const mockContas = [
  { id: 1, cliente: "Igor Soares de Souza", descricao: "Pedido #3 - Janelas", valor: 2440.94, vencimento: "15/03/2026", status: "pendente" },
  { id: 2, cliente: "Ana Costa", descricao: "Fachada comercial", valor: 4500, vencimento: "20/03/2026", status: "pendente" },
  { id: 3, cliente: "Carlos Santos", descricao: "Box de banheiro", valor: 1850, vencimento: "10/03/2026", status: "vencido" },
  { id: 4, cliente: "Maria Oliveira", descricao: "Porta de abrir", valor: 320, vencimento: "05/03/2026", status: "pago" },
  { id: 5, cliente: "José Lima", descricao: "Manutenção porta correr", valor: 180, vencimento: "01/03/2026", status: "pago" },
];

const statusMap: Record<string, { label: string; variant: "default" | "destructive" | "outline" }> = {
  pendente: { label: "Pendente", variant: "outline" },
  vencido: { label: "Vencido", variant: "destructive" },
  pago: { label: "Pago", variant: "default" },
};

const ContasReceber = () => (
  <AppLayout>
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Contas a Receber</h1>
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
                <div className="h-10 w-10 rounded-full bg-success/10 flex items-center justify-center">
                  <Wallet className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{c.cliente}</p>
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

export default ContasReceber;
