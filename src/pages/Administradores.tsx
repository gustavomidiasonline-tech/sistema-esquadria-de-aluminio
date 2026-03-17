import { AppLayout } from "@/components/AppLayout";
import { ShieldCheck, Plus, Search, Mail, Phone, Pencil, Trash2, Shield, UserCheck } from "lucide-react";
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

interface Administrador {
  id: number;
  nome: string;
  email: string;
  telefone: string;
  cargo: "super_admin" | "admin" | "gerente";
  status: "ativo" | "inativo";
  dataCadastro: string;
}

const cargoLabels: Record<string, string> = {
  super_admin: "Super Admin",
  admin: "Administrador",
  gerente: "Gerente",
};

const cargoVariant: Record<string, "default" | "secondary" | "outline"> = {
  super_admin: "default",
  admin: "secondary",
  gerente: "outline",
};

const mockAdmins: Administrador[] = [
  { id: 1, nome: "Carlos Alberto Silva", email: "carlos@alumy.com", telefone: "(11) 99999-1234", cargo: "super_admin", status: "ativo", dataCadastro: "2024-01-10" },
  { id: 2, nome: "Ana Paula Ferreira", email: "ana@alumy.com", telefone: "(11) 98888-5678", cargo: "admin", status: "ativo", dataCadastro: "2024-03-15" },
  { id: 3, nome: "Roberto Santos", email: "roberto@alumy.com", telefone: "(21) 97777-9012", cargo: "gerente", status: "ativo", dataCadastro: "2024-06-20" },
  { id: 4, nome: "Mariana Costa", email: "mariana@alumy.com", telefone: "(11) 96666-3456", cargo: "admin", status: "inativo", dataCadastro: "2024-02-05" },
];

type FormState = { nome: string; email: string; telefone: string; cargo: string; status: string };

const emptyForm: FormState = { nome: "", email: "", telefone: "", cargo: "admin", status: "ativo" };

function usePersistedAdmins() {
  const key = 'alumy_admins';
  const [admins, setAdminsState] = useState<Administrador[]>(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? (JSON.parse(stored) as Administrador[]) : mockAdmins;
    } catch {
      return mockAdmins;
    }
  });

  function setAdmins(next: Administrador[]) {
    setAdminsState(next);
    localStorage.setItem(key, JSON.stringify(next));
  }

  return [admins, setAdmins] as const;
}

const Administradores = () => {
  const [admins, setAdmins] = usePersistedAdmins();
  const [busca, setBusca] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editando, setEditando] = useState<Administrador | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [confirmDelete, setConfirmDelete] = useState<Administrador | null>(null);

  const filtrados = admins.filter(
    (a) => a.nome.toLowerCase().includes(busca.toLowerCase()) || a.email.toLowerCase().includes(busca.toLowerCase())
  );

  const totais = {
    ativos: admins.filter((a) => a.status === "ativo").length,
    inativos: admins.filter((a) => a.status === "inativo").length,
  };

  function abrirNovo() {
    setEditando(null);
    setForm(emptyForm);
    setDialogOpen(true);
  }

  function abrirEditar(admin: Administrador) {
    setEditando(admin);
    setForm({ nome: admin.nome, email: admin.email, telefone: admin.telefone, cargo: admin.cargo, status: admin.status });
    setDialogOpen(true);
  }

  function handleSalvar() {
    if (editando) {
      setAdmins(admins.map((a) =>
        a.id === editando.id
          ? { ...a, nome: form.nome, email: form.email, telefone: form.telefone, cargo: form.cargo as Administrador["cargo"], status: form.status as Administrador["status"] }
          : a
      ));
    } else {
      const novoAdmin: Administrador = {
        id: Date.now(),
        nome: form.nome,
        email: form.email,
        telefone: form.telefone,
        cargo: form.cargo as Administrador["cargo"],
        status: form.status as Administrador["status"],
        dataCadastro: new Date().toISOString().split("T")[0],
      };
      setAdmins([novoAdmin, ...admins]);
    }
    setDialogOpen(false);
    setEditando(null);
    setForm(emptyForm);
  }

  function handleExcluir() {
    if (confirmDelete) {
      setAdmins(admins.filter((a) => a.id !== confirmDelete.id));
      setConfirmDelete(null);
    }
  }

  return (
    <AppLayout>
      <div className="space-y-6 max-w-7xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Administradores</h1>
            <p className="text-sm text-muted-foreground">Gerencie os administradores do sistema e suas permissões</p>
          </div>
          <Button className="gap-2" onClick={abrirNovo}>
            <Plus className="h-4 w-4" /> Novo administrador
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="glass-card-premium p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{admins.length}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
          </div>
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
            <div className="h-10 w-10 rounded-full bg-orange-500/15 flex items-center justify-center">
              <ShieldCheck className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{totais.inativos}</p>
              <p className="text-xs text-muted-foreground">Inativos</p>
            </div>
          </div>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar administrador..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-10 pr-4 py-2.5 text-sm glass-card-premium rounded-lg w-full outline-none focus:ring-2 focus:ring-primary/30 text-foreground placeholder:text-muted-foreground"
          />
        </div>

        <div className="glass-card-premium divide-y divide-border">
          {filtrados.length === 0 ? (
            <div className="px-5 py-12 text-center text-muted-foreground text-sm">Nenhum administrador encontrado.</div>
          ) : (
            filtrados.map((admin) => (
              <div key={admin.id} className="flex items-center justify-between px-5 py-4 hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{admin.nome}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{admin.email}</span>
                      <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{admin.telefone}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={cargoVariant[admin.cargo]}>{cargoLabels[admin.cargo]}</Badge>
                  <Badge variant={admin.status === "ativo" ? "default" : "outline"}>
                    {admin.status === "ativo" ? "Ativo" : "Inativo"}
                  </Badge>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => abrirEditar(admin)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setConfirmDelete(admin)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Dialog Criar / Editar */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editando ? "Editar Administrador" : "Novo Administrador"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome completo</Label>
              <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Nome do administrador" />
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
                <Label>Cargo / Função</Label>
                <Select value={form.cargo} onValueChange={(v) => setForm({ ...form, cargo: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="gerente">Gerente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="inativo">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSalvar} disabled={!form.nome || !form.email}>
              {editando ? "Salvar alterações" : "Criar administrador"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Confirmar Exclusão */}
      <Dialog open={!!confirmDelete} onOpenChange={() => setConfirmDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir administrador</DialogTitle>
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

export default Administradores;
