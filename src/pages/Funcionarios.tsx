import { AppLayout } from "@/components/AppLayout";
import { UserCog, Plus, Search, Mail, Phone, Briefcase, UserCheck, UserX, Pencil, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
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
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface Funcionario {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  funcao: string;
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
  outro: "Outro",
};

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  ativo: { label: "Ativo", variant: "default" },
  ferias: { label: "Férias", variant: "secondary" },
  afastado: { label: "Afastado", variant: "outline" },
  desligado: { label: "Desligado", variant: "destructive" },
};

type FormState = { nome: string; email: string; telefone: string; funcao: string; status: string; salario: string };

const emptyForm: FormState = { nome: "", email: "", telefone: "", funcao: "instalador", status: "ativo", salario: "" };

const STORAGE_KEY = "alumy_funcionarios_v2";

const Funcionarios = () => {
  const { profile } = useAuth();
  const companyId = profile?.company_id;

  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editando, setEditando] = useState<Funcionario | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [confirmDelete, setConfirmDelete] = useState<Funcionario | null>(null);
  const [saving, setSaving] = useState(false);

  // Limpar dados falsos do localStorage antigo quando monta
  useEffect(() => {
    localStorage.removeItem("alumy_funcionarios");
  }, []);

  const loadFromStorage = (): Funcionario[] => {
    if (!companyId) return [];
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}_${companyId}`);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  };

  const saveToStorage = (data: Funcionario[]) => {
    if (!companyId) return;
    localStorage.setItem(`${STORAGE_KEY}_${companyId}`, JSON.stringify(data));
  };

  const fetchFuncionarios = async () => {
    if (!companyId) { setLoading(false); return; }
    setLoading(true);
    try {
      // Funcionários são armazenados localmente por empresa (tabela dedicada não existe no schema atual)
      const local = loadFromStorage();
      setFuncionarios(local);
    } catch (err) {
      console.error("Erro ao carregar funcionários:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFuncionarios();
  }, [companyId]);

  const filtrados = funcionarios.filter((f) => {
    const matchBusca =
      f.nome.toLowerCase().includes(busca.toLowerCase()) ||
      f.email.toLowerCase().includes(busca.toLowerCase());
    const matchStatus = filtroStatus === "todos" || f.status === filtroStatus;
    return matchBusca && matchStatus;
  });

  const totais = {
    ativos: funcionarios.filter((f) => f.status === "ativo").length,
    ferias: funcionarios.filter((f) => f.status === "ferias").length,
    afastados: funcionarios.filter((f) => f.status === "afastado").length,
  };

  function abrirNovo() {
    setEditando(null);
    setForm(emptyForm);
    setDialogOpen(true);
  }

  function abrirEditar(func: Funcionario) {
    setEditando(func);
    setForm({
      nome: func.nome,
      email: func.email,
      telefone: func.telefone,
      funcao: func.funcao,
      status: func.status,
      salario: func.salario > 0 ? String(func.salario) : "",
    });
    setDialogOpen(true);
  }

  function handleSalvar() {
    setSaving(true);
    const salarioNum = parseFloat(form.salario) || 0;
    let updated: Funcionario[];

    if (editando) {
      updated = funcionarios.map((f) =>
        f.id === editando.id
          ? { ...f, nome: form.nome, email: form.email, telefone: form.telefone, funcao: form.funcao, status: form.status as Funcionario["status"], salario: salarioNum }
          : f
      );
      toast.success("Funcionário atualizado!");
    } else {
      const novoFunc: Funcionario = {
        id: crypto.randomUUID(),
        nome: form.nome,
        email: form.email,
        telefone: form.telefone,
        funcao: form.funcao,
        status: form.status as Funcionario["status"],
        dataAdmissao: new Date().toISOString().split("T")[0],
        salario: salarioNum,
      };
      updated = [novoFunc, ...funcionarios];
      toast.success("Funcionário cadastrado!");
    }

    setFuncionarios(updated);
    saveToStorage(updated);
    setDialogOpen(false);
    setEditando(null);
    setForm(emptyForm);
    setSaving(false);
  }

  function handleExcluir() {
    if (confirmDelete) {
      const updated = funcionarios.filter((f) => f.id !== confirmDelete.id);
      setFuncionarios(updated);
      saveToStorage(updated);
      toast.success("Funcionário removido.");
      setConfirmDelete(null);
    }
  }

  return (
    <AppLayout>
      <div className="space-y-6 max-w-7xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Funcionários</h1>
            <p className="text-sm text-muted-foreground">Cadastre e gerencie os funcionários da empresa</p>
          </div>
          <Button className="gap-2" onClick={abrirNovo}>
            <Plus className="h-4 w-4" /> Novo funcionário
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="glass-card-premium p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-green-500/15 flex items-center justify-center">
              <UserCheck className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{totais.ativos}</p>
              <p className="text-xs text-muted-foreground">Ativos</p>
            </div>
          </div>
          <div className="glass-card-premium p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-accent flex items-center justify-center">
              <Briefcase className="h-5 w-5 text-accent-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{totais.ferias}</p>
              <p className="text-xs text-muted-foreground">Em férias</p>
            </div>
          </div>
          <div className="glass-card-premium p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-orange-500/15 flex items-center justify-center">
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
              className="pl-10 pr-4 py-2.5 text-sm glass-card-premium rounded-lg w-full outline-none focus:ring-2 focus:ring-primary/30 text-foreground placeholder:text-muted-foreground"
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

        <div className="glass-card-premium divide-y divide-border">
          {loading ? (
            <div className="px-5 py-12 flex items-center justify-center gap-2 text-muted-foreground text-sm">
              <Loader2 className="h-4 w-4 animate-spin" /> Carregando...
            </div>
          ) : filtrados.length === 0 ? (
            <div className="px-5 py-12 text-center text-muted-foreground text-sm">
              {funcionarios.length === 0
                ? "Nenhum funcionário cadastrado. Clique em \"Novo funcionário\" para começar."
                : "Nenhum funcionário encontrado."}
            </div>
          ) : (
            filtrados.map((func) => {
              const sc = statusConfig[func.status] ?? { label: func.status, variant: "outline" as const };
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
                        {func.telefone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{func.telefone}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">{funcaoLabels[func.funcao] ?? func.funcao}</Badge>
                    <Badge variant={sc.variant}>{sc.label}</Badge>
                    {func.salario > 0 && (
                      <span className="text-sm font-medium text-foreground">
                        R$ {func.salario.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </span>
                    )}
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => abrirEditar(func)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setConfirmDelete(func)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Dialog Criar / Editar */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editando ? "Editar Funcionário" : "Novo Funcionário"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome completo</Label>
              <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Nome do funcionário" />
            </div>
            <div>
              <Label>E-mail</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@empresa.com" />
            </div>
            <div>
              <Label>Telefone</Label>
              <Input value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} placeholder="(00) 00000-0000" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Função</Label>
                <Select value={form.funcao} onValueChange={(v) => setForm({ ...form, funcao: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="instalador">Instalador</SelectItem>
                    <SelectItem value="cortador">Cortador</SelectItem>
                    <SelectItem value="montador">Montador</SelectItem>
                    <SelectItem value="medidor">Medidor</SelectItem>
                    <SelectItem value="motorista">Motorista</SelectItem>
                    <SelectItem value="auxiliar">Auxiliar</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="ferias">Férias</SelectItem>
                    <SelectItem value="afastado">Afastado</SelectItem>
                    <SelectItem value="desligado">Desligado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Salário (R$)</Label>
              <Input
                type="number"
                min="0"
                step="100"
                value={form.salario}
                onChange={(e) => setForm({ ...form, salario: e.target.value })}
                placeholder="0,00"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSalvar} disabled={saving || !form.nome || !form.email}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {editando ? "Salvar alterações" : "Criar funcionário"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Confirmar Exclusão */}
      <Dialog open={!!confirmDelete} onOpenChange={() => setConfirmDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir funcionário</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Tem certeza que deseja excluir <strong>{confirmDelete?.nome}</strong>? Esta ação não pode ser desfeita.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleExcluir}>Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default Funcionarios;
