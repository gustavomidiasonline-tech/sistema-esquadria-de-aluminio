import { AppLayout } from "@/components/AppLayout";
import { MapPin, Phone, User, RotateCcw, DollarSign, FileText, Printer, Clock, Search, Settings, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface Servico {
  id: string;
  client: string;
  address: string;
  phone: string;
  seller: string;
  date: string;
  value: string;
  valueDate: string;
  status: string;
  statusDetail?: string;
  statusNote?: string;
  daysLabel: string;
  overdue: boolean;
  statusDaysLabel?: string;
  statusOverdue?: boolean;
}

const mockServicos: Servico[] = [
  {
    id: "SERVIÇO 1",
    client: "IGOR SOARES DE SOUZA",
    address: "Rua Teste, 1234, Caieiras, Serpa, 07716-053",
    phone: "(11) 9602-2000",
    seller: "Igor Soares de Souza",
    date: "15/03/2025",
    value: "R$ 850,00",
    valueDate: "10/03/2025 14:30",
    status: "EM ANDAMENTO",
    statusDetail: "Data início: 12/03/2025 08:00",
    daysLabel: "Faltam 4 dias",
    overdue: false,
    statusDaysLabel: "Faltam 2 dias",
    statusOverdue: false,
  },
  {
    id: "SERVIÇO 2",
    client: "MARIA OLIVEIRA",
    address: "Av. Brasil, 567, São Paulo, SP, 01234-000",
    phone: "(11) 98765-4321",
    seller: "Igor Soares de Souza",
    date: "18/03/2025",
    value: "R$ 320,00",
    valueDate: "15/03/2025 09:15",
    status: "PENDENTE",
    daysLabel: "Faltam 7 dias",
    overdue: false,
  },
  {
    id: "SERVIÇO 3",
    client: "CARLOS SANTOS",
    address: "Rua das Flores, 89, Guarulhos, SP, 07123-456",
    phone: "(11) 91234-5678",
    seller: "Igor Soares de Souza",
    date: "10/03/2025",
    value: "R$ 0,00",
    valueDate: "08/03/2025 16:45",
    status: "CONCLUÍDO",
    daysLabel: "No prazo",
    overdue: false,
  },
  {
    id: "SERVIÇO 4",
    client: "ANA COSTA",
    address: "Rua Industrial, 2000, Osasco, SP, 06100-000",
    phone: "(11) 94567-8901",
    seller: "Empresa modelo",
    date: "20/03/2025",
    value: "R$ 4.500,00",
    valueDate: "14/03/2025 11:20",
    status: "PENDENTE",
    statusDetail: "Aguardando material",
    daysLabel: "Faltam 9 dias",
    overdue: false,
    statusDaysLabel: "Faltam 5 dias",
    statusOverdue: false,
  },
  {
    id: "SERVIÇO 5",
    client: "JOSÉ LIMA",
    address: "Rua Manutenção, 45, Barueri, SP, 06400-100",
    phone: "(11) 93456-7890",
    seller: "Igor Soares de Souza",
    date: "08/03/2025",
    value: "R$ 180,00",
    valueDate: "05/03/2025 10:00",
    status: "CONCLUÍDO",
    daysLabel: "No prazo",
    overdue: false,
  },
  {
    id: "SERVIÇO 6",
    client: "FERNANDA REIS",
    address: "Av. Paulista, 1500, São Paulo, SP, 01310-100",
    phone: "(11) 92345-6789",
    seller: "Empresa modelo",
    date: "16/03/2025",
    value: "R$ 0,00",
    valueDate: "13/03/2025 08:30",
    status: "EM ANDAMENTO",
    statusDetail: "Entrega em rota",
    daysLabel: "Atrasado 2 dias",
    overdue: true,
    statusDaysLabel: "Atrasado 1 dia",
    statusOverdue: true,
  },
];

const actionButtons = [
  { icon: RotateCcw, label: "Reagendar" },
  { icon: DollarSign, label: "Pagamentos" },
  { icon: FileText, label: "Contrato" },
  { icon: Printer, label: "Impressões" },
];

const Servicos = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [novoServico, setNovoServico] = useState({ titulo: "", cliente: "", tipo: "instalacao", descricao: "", valor: "" });

  const handleCriar = () => {
    setNovoServico({ titulo: "", cliente: "", tipo: "instalacao", descricao: "", valor: "" });
    setDialogOpen(false);
  };

  return (
    <AppLayout>
      <div className="space-y-4 max-w-7xl">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Serviços</h1>
          <Button className="gap-2" onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4" /> Novo serviço
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {mockServicos.map((servico) => (
            <div key={servico.id} className="bg-card border border-border rounded-xl shadow-sm flex flex-col">
              {/* Header */}
              <div className="p-4 pb-2 space-y-2">
                <h3 className="text-base font-bold text-foreground">{servico.id}</h3>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <div className="flex items-start gap-1.5">
                    <User className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                    <span className="font-medium text-foreground">{servico.client}</span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                    <span>{servico.address}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 shrink-0" />
                    <span>{servico.phone}</span>
                  </div>
                </div>

                {/* Seller + Date + Badge */}
                <div className="text-xs space-y-0.5">
                  <p className="text-muted-foreground">
                    <span className="font-medium text-foreground">Vendedor:</span> {servico.seller}
                  </p>
                  <div className="flex items-center justify-between">
                    <p className="text-muted-foreground">
                      <span className="font-medium text-foreground">Previsão:</span> {servico.date}
                    </p>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                        servico.overdue
                          ? "border-destructive/30 bg-destructive/10 text-destructive"
                          : "border-success/30 bg-success/10 text-success"
                      }`}
                    >
                      {servico.daysLabel}
                    </span>
                  </div>
                </div>

                {/* Value */}
                <div className="flex items-end justify-between">
                  <p className={`text-lg font-bold ${servico.overdue ? "text-destructive" : "text-primary"}`}>
                    {servico.value}
                  </p>
                  <p className="text-[10px] text-muted-foreground">{servico.valueDate}</p>
                </div>
              </div>

              {/* Status section */}
              {servico.status && (
                <div className="px-4 py-2 border-t border-border">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-foreground">{servico.status}</p>
                    {servico.statusDaysLabel && (
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                          servico.statusOverdue
                            ? "border-destructive/30 bg-destructive/10 text-destructive"
                            : "border-success/30 bg-success/10 text-success"
                        }`}
                      >
                        {servico.statusDaysLabel}
                      </span>
                    )}
                  </div>
                  {servico.statusDetail && (
                    <p className="text-[10px] text-muted-foreground mt-0.5">{servico.statusDetail}</p>
                  )}
                  {servico.statusNote && (
                    <p className="text-[10px] text-muted-foreground">{servico.statusNote}</p>
                  )}
                </div>
              )}

              {/* Action icons */}
              <div className="px-4 py-3 border-t border-border">
                <div className="flex items-center justify-between">
                  {actionButtons.map((btn) => (
                    <button
                      key={btn.label}
                      className="flex flex-col items-center gap-1 text-muted-foreground hover:text-primary transition-colors group"
                    >
                      <div className="h-9 w-9 rounded-lg border border-border flex items-center justify-center group-hover:border-primary/30 group-hover:bg-primary/5 transition-colors">
                        <btn.icon className="h-4 w-4" />
                      </div>
                      <span className="text-[10px]">{btn.label}</span>
                    </button>
                  ))}
                </div>

                <button className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors mt-3 text-xs">
                  <div className="h-8 w-8 rounded-lg border border-border flex items-center justify-center hover:border-primary/30">
                    <Clock className="h-4 w-4" />
                  </div>
                  <span>Alterar etapa</span>
                </button>
              </div>

              {/* Footer buttons */}
              <div className="flex gap-2 p-4 pt-0 mt-auto">
                <button className="flex-1 py-2 text-xs font-medium rounded-lg border border-border text-foreground hover:bg-muted transition-colors">
                  Cancelar
                </button>
                <button className="flex-1 py-2 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
                  Concluir serviço
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border py-3 px-6 flex items-center justify-center gap-12 z-10">
          <button className="flex flex-col items-center gap-1 text-muted-foreground hover:text-primary transition-colors">
            <Search className="h-5 w-5" />
            <span className="text-xs">Buscar</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-muted-foreground hover:text-primary transition-colors">
            <Settings className="h-5 w-5" />
            <span className="text-xs">Configurar etapas</span>
          </button>
        </div>

        {/* Spacer for bottom bar */}
        <div className="h-16" />
      </div>

      {/* Dialog novo serviço */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Serviço</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Título</Label>
              <Input value={novoServico.titulo} onChange={(e) => setNovoServico({ ...novoServico, titulo: e.target.value })} placeholder="Ex: Instalação de janela" />
            </div>
            <div>
              <Label>Cliente</Label>
              <Input value={novoServico.cliente} onChange={(e) => setNovoServico({ ...novoServico, cliente: e.target.value })} placeholder="Nome do cliente" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tipo</Label>
                <Select value={novoServico.tipo} onValueChange={(v) => setNovoServico({ ...novoServico, tipo: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="instalacao">Instalação</SelectItem>
                    <SelectItem value="manutencao">Manutenção</SelectItem>
                    <SelectItem value="reparo">Reparo</SelectItem>
                    <SelectItem value="medicao">Medição</SelectItem>
                    <SelectItem value="entrega">Entrega</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Valor (R$)</Label>
                <Input type="number" value={novoServico.valor} onChange={(e) => setNovoServico({ ...novoServico, valor: e.target.value })} placeholder="0,00" />
              </div>
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea value={novoServico.descricao} onChange={(e) => setNovoServico({ ...novoServico, descricao: e.target.value })} placeholder="Detalhes do serviço..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleCriar} disabled={!novoServico.titulo || !novoServico.cliente}>Criar serviço</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default Servicos;
