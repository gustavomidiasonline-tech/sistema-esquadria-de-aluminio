import { AppLayout } from "@/components/AppLayout";
import { Receipt, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const mockNFs = [
  { id: 1, numero: "NF-e 001234", cliente: "Igor Soares de Souza", valor: 2440.94, data: "06/03/2026", status: "emitida" },
  { id: 2, numero: "NF-e 001235", cliente: "Ana Costa", valor: 4500, data: "08/03/2026", status: "emitida" },
  { id: 3, numero: "NF-e 001236", cliente: "Carlos Santos", valor: 1850, data: "10/03/2026", status: "cancelada" },
  { id: 4, numero: "NF-e 001237", cliente: "Maria Oliveira", valor: 320, data: "11/03/2026", status: "pendente" },
];

const statusMap: Record<string, { label: string; variant: "default" | "destructive" | "outline" }> = {
  emitida: { label: "Emitida", variant: "default" },
  cancelada: { label: "Cancelada", variant: "destructive" },
  pendente: { label: "Pendente", variant: "outline" },
};

const NotasFiscais = () => (
  <AppLayout>
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Notas Fiscais</h1>
        <p className="text-sm text-muted-foreground">Histórico de notas fiscais emitidas</p>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm divide-y divide-border">
        {mockNFs.map((nf) => {
          const s = statusMap[nf.status];
          return (
            <div key={nf.id} className="flex items-center justify-between px-5 py-4 hover:bg-muted/50 transition-colors cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Receipt className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{nf.numero}</p>
                  <p className="text-xs text-muted-foreground">{nf.cliente} · {nf.data}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-foreground">R$ {nf.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                <Badge variant={s.variant}>{s.label}</Badge>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  </AppLayout>
);

export default NotasFiscais;
