import { AppLayout } from "@/components/AppLayout";
import { CheckSquare, Plus, Search, Clock, CheckCircle2, AlertCircle, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  id: number;
  titulo: string;
  cliente: string;
  tipo: "instalacao" | "manutencao" | "reparo" | "medicao" | "entrega";
  status: "pendente" | "em_andamento" | "concluido" | "cancelado";
  data: string;
  valor: number;
  descricao: string;
}

const tipoLabels: Record<string, string> = {
  instalacao: "Instalação",
  manutencao: "Manutenção",
  reparo: "Reparo",
  medicao: "Medição",
  entrega: "Entrega",
};

const statusConfig: Record<string, { label: string; icon: React.ElementType; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pendente: { label: "Pendente", icon: Clock, variant: "outline" },
  em_andamento: { label: "Em andamento", icon: AlertCircle, variant: "secondary" },
  concluido: { label: "Concluído", icon: CheckCircle2, variant: "default" },
  cancelado: { label: "Cancelado", icon: AlertCircle, variant: "destructive" },
};

const mockServicos: Servico[] = [
  { id: 1, titulo: "Instalação de janela de correr", cliente: "Igor Soares de Souza", tipo: "instalacao", status: "em_andamento", data: "2025-03-15", valor: 850, descricao: "Janela de correr 4 folhas, linha Suprema" },
  { id: 2, titulo: "Reparo em porta de abrir", cliente: "Maria Oliveira", tipo: "reparo", status: "pendente", data: "2025-03-18", valor: 320, descricao: "Troca de fechadura e ajuste de dobradiças" },
  { id: 3, titulo: "Medição para box de banheiro", cliente: "Carlos Santos", tipo: "medicao", status: "concluido", data: "2025-03-10", valor: 0, descricao: "Medição no local para orçamento de box" },
  { id: 4, titulo: "Instalação de fachada comercial", cliente: "Ana Costa", tipo: "instalacao", status: "pendente", data: "2025-03-20", valor: 4500, descricao: "Fachada em pele de vidro, 12m²" },
  { id: 5, titulo: "Manutenção de porta de correr", cliente: "José Lima", tipo: "manutencao", status: "concluido", data: "2025-03-08", valor: 180, descricao: "Lubrificação de trilhos e ajuste de roldanas" },
  { id: 6, titulo: "Entrega de esquadrias", cliente: "Fernanda Reis", tipo: "entrega", status: "em_andamento", data: "2025-03-16", valor: 0, descricao: "Entrega de 3 janelas e 2 portas" },
];

const Servicos = () => {
  const [servicos, setServicos] = useState<Servico[]>(mockServicos);
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [novoServico, setNovoServico] = useState({ titulo: "", cliente: "", tipo: "instalacao", descricao: "", valor: "" });

  const filtrados = servicos.filter((s) => {
    const matchBusca = s.titulo.toLowerCase().includes(busca.toLowerCase()) || s.cliente.toLowerCase().includes(busca.toLowerCase());
    const matchStatus = filtroStatus === "todos" || s.status === filtroStatus;
    return matchBusca && matchStatus;
  });

  const handleCriar = () => {
    const novo: Servico = {
      id: Date.now(),
      titulo: novoServico.titulo,
      cliente: novoServico.cliente,
      tipo: novoServico.tipo as Servico["tipo"],
      status: "pendente",
      data: new Date().toISOString().split("T")[0],
      valor: parseFloat(novoServico.valor) || 0,
      descricao: novoServico.descricao,
    };
    setServicos([novo, ...servicos]);
    setNovoServico({ titulo: "", cliente: "", tipo: "instalacao", descricao: "", valor: "" });
    setDialogOpen(false);
  };

  const totais = {
    pendente: servicos.filter((s) => s.status === "pendente").length,
    em_andamento: servicos.filter((s) => s.status === "em_andamento").length,
    concluido: servicos.filter((s) => s.status === "concluido").length,
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Serviços</h1>
            <p className="text-sm text-muted-foreground">{servicos.length} serviços cadastrados</p>
          </div>
          <Button className="gap-2" onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4" /> Novo serviço
          </Button>
        </div>

        {/* Cards resumo */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
              <Clock className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{totais.pendente}</p>
              <p className="text-xs text-muted-foreground">Pendentes</p>
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Wrench className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{totais.em_andamento}</p>
              <p className="text-xs text-muted-foreground">Em andamento</p>
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{totais.concluido}</p>
              <p className="text-xs text-muted-foreground">Concluídos</p>
            </div>
          </div>
        </div>

        {/* Busca e filtro */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar serviço ou cliente..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-10 pr-4 py-2.5 text-sm bg-card border border-border rounded-lg w-full outline-none focus:ring-2 focus:ring-primary/30 text-foreground placeholder:text-muted-foreground"
            />
          </div>
          <Select value={filtroStatus} onValueChange={setFiltroStatus}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="pendente">Pendente</SelectItem>
              <SelectItem value="em_andamento">Em andamento</SelectItem>
              <SelectItem value="concluido">Concluído</SelectItem>
              <SelectItem value="cancelado">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Lista */}
        <div className="bg-card border border-border rounded-xl shadow-sm divide-y divide-border">
          {filtrados.length === 0 ? (
            <div className="px-5 py-12 text-center text-muted-foreground text-sm">Nenhum serviço encontrado.</div>
          ) : (
            filtrados.map((servico) => {
              const sc = statusConfig[servico.status];
              const StatusIcon = sc.icon;
              return (
                <div key={servico.id} className="flex items-center justify-between px-5 py-4 hover:bg-muted/50 transition-colors cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <CheckSquare className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{servico.titulo}</p>
                      <p className="text-xs text-muted-foreground">
                        {servico.cliente} · {tipoLabels[servico.tipo]} · {new Date(servico.data).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {servico.valor > 0 && (
                      <span className="text-sm font-medium text-foreground">
                        R$ {servico.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </span>
                    )}
                    <Badge variant={sc.variant} className="gap-1">
                      <StatusIcon className="h-3 w-3" />
                      {sc.label}
                    </Badge>
                  </div>
                </div>
              );
            })
          )}
        </div>
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
