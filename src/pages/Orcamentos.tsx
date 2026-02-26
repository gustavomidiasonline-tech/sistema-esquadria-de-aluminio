import { AppLayout } from "@/components/AppLayout";
import { Plus, Search, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

const mockOrcamentos = [
  { id: "ORC-001", client: "Igor Soares", product: "Janela 2 Folhas", value: "R$ 2.733,53", date: "06/05/2022", status: "Aprovado" },
  { id: "ORC-002", client: "Maria Oliveira", product: "Porta de Correr", value: "R$ 4.100,30", date: "12/05/2022", status: "Pendente" },
  { id: "ORC-003", client: "Carlos Santos", product: "Box Banheiro", value: "R$ 1.890,00", date: "18/05/2022", status: "Aprovado" },
  { id: "ORC-004", client: "Ana Costa", product: "Janela Maxim-Ar", value: "R$ 659,57", date: "25/05/2022", status: "Recusado" },
];

const statusColor: Record<string, string> = {
  Aprovado: "bg-success/10 text-success",
  Pendente: "bg-warning/10 text-warning",
  Recusado: "bg-destructive/10 text-destructive",
};

const Orcamentos = () => (
  <AppLayout>
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Orçamentos</h1>
          <p className="text-sm text-muted-foreground">{mockOrcamentos.length} orçamentos</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" /> Novo orçamento
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input type="text" placeholder="Buscar orçamento..." className="pl-10 pr-4 py-2.5 text-sm bg-card border border-border rounded-lg w-full outline-none focus:ring-2 focus:ring-primary/30 text-foreground placeholder:text-muted-foreground" />
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="text-left px-5 py-3 font-semibold text-muted-foreground">Código</th>
              <th className="text-left px-5 py-3 font-semibold text-muted-foreground">Cliente</th>
              <th className="text-left px-5 py-3 font-semibold text-muted-foreground">Produto</th>
              <th className="text-left px-5 py-3 font-semibold text-muted-foreground">Valor</th>
              <th className="text-left px-5 py-3 font-semibold text-muted-foreground">Data</th>
              <th className="text-left px-5 py-3 font-semibold text-muted-foreground">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {mockOrcamentos.map((orc) => (
              <tr key={orc.id} className="hover:bg-muted/30 transition-colors cursor-pointer">
                <td className="px-5 py-4 font-bold text-primary">{orc.id}</td>
                <td className="px-5 py-4 text-foreground">{orc.client}</td>
                <td className="px-5 py-4 text-foreground">{orc.product}</td>
                <td className="px-5 py-4 font-semibold text-foreground">{orc.value}</td>
                <td className="px-5 py-4 text-muted-foreground">{orc.date}</td>
                <td className="px-5 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusColor[orc.status]}`}>
                    {orc.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </AppLayout>
);

export default Orcamentos;
