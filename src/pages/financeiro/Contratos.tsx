import { AppLayout } from "@/components/AppLayout";
import { FileCheck, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const mockContratos = [
  { id: 1, titulo: "Contrato #001 - Fachada Comercial", cliente: "Ana Costa", valor: 45000, inicio: "01/02/2026", fim: "30/04/2026", status: "ativo" },
  { id: 2, titulo: "Contrato #002 - Janelas Residenciais", cliente: "Igor Soares de Souza", valor: 14089, inicio: "10/01/2026", fim: "10/03/2026", status: "concluido" },
  { id: 3, titulo: "Contrato #003 - Manutenção Anual", cliente: "Carlos Santos", valor: 6000, inicio: "01/01/2026", fim: "31/12/2026", status: "ativo" },
  { id: 4, titulo: "Contrato #004 - Box Banheiros Hotel", cliente: "Fernanda Reis", valor: 28500, inicio: "15/03/2026", fim: "15/06/2026", status: "pendente" },
];

const statusMap: Record<string, { label: string; variant: "default" | "destructive" | "outline" | "secondary" }> = {
  ativo: { label: "Ativo", variant: "default" },
  concluido: { label: "Concluído", variant: "secondary" },
  pendente: { label: "Pendente", variant: "outline" },
  cancelado: { label: "Cancelado", variant: "destructive" },
};

const Contratos = () => (
  <AppLayout>
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Contratos</h1>
          <p className="text-sm text-muted-foreground">{mockContratos.length} contratos cadastrados</p>
        </div>
        <Button className="gap-2"><Plus className="h-4 w-4" /> Novo contrato</Button>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm divide-y divide-border">
        {mockContratos.map((c) => {
          const s = statusMap[c.status];
          return (
            <div key={c.id} className="flex items-center justify-between px-5 py-4 hover:bg-muted/50 transition-colors cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <FileCheck className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{c.titulo}</p>
                  <p className="text-xs text-muted-foreground">{c.cliente} · {c.inicio} a {c.fim}</p>
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

export default Contratos;
