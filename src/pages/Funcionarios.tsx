import { AppLayout } from "@/components/AppLayout";
import { UserCog, Plus, Search, Mail, Phone, Briefcase, UserCheck, UserX } from "lucide-react";
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

interface Funcionario {
  id: number;
  nome: string;
  email: string;
  telefone: string;
  funcao: "instalador" | "cortador" | "montador" | "medidor" | "motorista" | "auxiliar";
  status: "ativo" | "ferias" | "afastado" | "desligado";
  dataAdmissao: string;
  salario: number;
}

const funcaoLabels: Record<string, string> = {
  instalador: "Instalador",
  cortador: "Cortador",
  montador: "Montador",
  medidor: "Medidor",
  motorista: "Motorista",
  auxiliar: "Auxiliar",
};

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  ativo: { label: "Ativo", variant: "default" },
  ferias: { label: "Férias", variant: "secondary" },
  afastado: { label: "Afastado", variant: "outline" },
  desligado: { label: "Desligado", variant: "destructive" },
};

const mockFuncionarios: Funcionario[] = [
  { id: 1, nome: "João Pedro Almeida", email: "joao@alumy.com", telefone: "(11) 99111-2233", funcao: "instalador", status: "ativo", dataAdmissao: "2023-02-10", salario: 3200 },
  { id: 2, nome: "Lucas Martins", email: "lucas@alumy.com", telefone: "(11) 98222-3344", funcao: "cortador", status: "ativo", dataAdmissao: "2023-05-15", salario: 2800 },
  { id: 3, nome: "Rafael Souza", email: "rafael@alumy.com", telefone: "(21) 97333-4455", funcao: "montador", status: "ferias", dataAdmissao: "2022-11-01", salario: 3000 },
  { id: 4, nome: "Pedro Henrique Lima", email: "pedro@alumy.com", telefone: "(11) 96444-5566", funcao: "medidor", status: "ativo", dataAdmissao: "2024-01-20", salario: 2500 },
  { id: 5, nome: "Marcos Vinícius", email: "marcos@alumy.com", telefone: "(11) 95555-6677", funcao: "motorista", status: "ativo", dataAdmissao: "2023-08-12", salario: 2600 },
  { id: 6, nome: "Thiago Oliveira", email: "thiago@alumy.com", telefone: "(21) 94666-7788", funcao: "auxiliar", status: "afastado", dataAdmissao: "2024-04-05", salario: 1800 },
  { id: 7, nome: "André Costa", email: "andre@alumy.com", telefone: "(11) 93777-8899", funcao: "instalador", status: "desligado", dataAdmissao: "2022-06-10", salario: 0 },
];

const Funcionarios = () => {
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>(mockFuncionarios);
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [novo, setNovo] = useState({ nome: "", email: "", telefone: "", funcao: "instalador", salario: "" });

  const filtrados = funcionarios.filter((f) => {
    const matchBusca = f.nome.toLowerCase().includes(busca.toLowerCase()) || f.email.toLowerCase().includes(busca.toLowerCase());
    const matchStatus = filtroStatus === "todos" || f.status === filtroStatus;
    return matchBusca && matchStatus;
  });

  const handleCriar = () => {
    const novoFunc: Funcionario = {
      id: Date.now(),
      nome: novo.nome,
      email: novo.email,
      telefone: novo.telefone,
      funcao: novo.funcao as Funcionario["funcao"],
      status: "ativo",
      dataAdmissao: new Date().toISOString().split("T")[0],
      salario: parseFloat(novo.salario) || 0,
    };
    setFuncionarios([novoFunc, ...funcionarios]);
    setNovo({ nome: "", email: "", telefone: "", funcao: "instalador", salario: "" });
    setDialogOpen(false);
  };

  const totais = {
    ativos: funcionarios.filter((f) => f.status === "ativo").length,
    ferias: funcionarios.filter((f) => f.status === "ferias").length,
    afastados: funcionarios.filter((f) => f.status === "afastado").length,
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-7xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Funcionários</h1>
            <p className="text-sm text-muted-foreground">Cadastre e gerencie os funcionários da empresa</p>
          </div>
          <Button className="gap-2" onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4" /> Novo funcionário
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
              <UserCheck className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{totais.ativos}</p>
              <p className="text-xs text-muted-foreground">Ativos</p>
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-accent flex items-center justify-center">
              <Briefcase className="h-5 w-5 text-accent-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{totais.ferias}</p>
              <p className="text-xs text-muted-foreground">Em férias</p>
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
              <UserX className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{totais.afastados}</p>
              <p className="text-xs text-muted-foreground">Afastados</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar funcionário..."
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
              <SelectItem value="ativo">Ativo</SelectItem>
              <SelectItem value="ferias">Férias</SelectItem>
              <SelectItem value="afastado">Afastado</SelectItem>
              <SelectItem value="desligado">Desligado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="bg-card border border-border rounded-xl shadow-sm divide-y divide-border">
          {filtrados.length === 0 ? (
            <div className="px-5 py-12 text-center text-muted-foreground text-sm">Nenhum funcionário encontrado.</div>
          ) : (
            filtrados.map((func) => {
              const sc = statusConfig[func.status];
              return (
                <div key={func.id} className="flex items-center justify-between px-5 py-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <UserCog className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{func.nome}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{func.email}</span>
                        <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{func.telefone}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">{funcaoLabels[func.funcao]}</Badge>
                    <Badge variant={sc.variant}>{sc.label}</Badge>
                    {func.salario > 0 && (
                      <span className="text-sm font-medium text-foreground">
                        R$ {func.salario.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Funcionário</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome completo</Label>
              <Input value={novo.nome} onChange={(e) => setNovo({ ...novo, nome: e.target.value })} placeholder="Nome do funcionário" />
            </div>
            <div>
              <Label>E-mail</Label>
              <Input type="email" value={novo.email} onChange={(e) => setNovo({ ...novo, email: e.target.value })} placeholder="email@empresa.com" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Telefone</Label>
                <Input value={novo.telefone} onChange={(e) => setNovo({ ...novo, telefone: e.target.value })} placeholder="(00) 00000-0000" />
              </div>
              <div>
                <Label>Função</Label>
                <Select value={novo.funcao} onValueChange={(v) => setNovo({ ...novo, funcao: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="instalador">Instalador</SelectItem>
                    <SelectItem value="cortador">Cortador</SelectItem>
                    <SelectItem value="montador">Montador</SelectItem>
                    <SelectItem value="medidor">Medidor</SelectItem>
                    <SelectItem value="motorista">Motorista</SelectItem>
                    <SelectItem value="auxiliar">Auxiliar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Salário (R$)</Label>
              <Input type="number" value={novo.salario} onChange={(e) => setNovo({ ...novo, salario: e.target.value })} placeholder="0,00" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleCriar} disabled={!novo.nome || !novo.email}>Criar funcionário</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default Funcionarios;
