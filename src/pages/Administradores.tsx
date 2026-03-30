import { AppLayout } from "@/components/AppLayout";
import { ShieldCheck, Plus, Search, Mail, Phone, Pencil, Trash2, Shield, UserCheck, Loader2 } from "lucide-react";
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

interface Administrador {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  cargo: string;
  status: "ativo" | "inativo";
  dataCadastro: string;
}

const cargoLabels: Record<string, string> = {
  super_admin: "Super Admin",
  admin: "Administrador",
  gerente: "Gerente",
  funcionario: "Funcionário",
};

const cargoVariant: Record<string, "default" | "secondary" | "outline"> = {
  super_admin: "default",
  admin: "secondary",
  gerente: "outline",
  funcionario: "outline",
};

type FormState = { nome: string; email: string; telefone: string; cargo: string };

const emptyForm: FormState = { nome: "", email: "", telefone: "", cargo: "admin" };

const Administradores = () => {
  const { profile } = useAuth();
  const companyId = profile?.company_id;

  const [admins, setAdmins] = useState<Administrador[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editando, setEditando] = useState<Administrador | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [confirmDelete, setConfirmDelete] = useState<Administrador | null>(null);
  const [saving, setSaving] = useState(false);

  // Limpar dados falsos do localStorage quando o componente monta
  useEffect(() => {
    localStorage.removeItem('alumy_admins');
  }, []);

  const fetchAdmins = async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, user_id, nome, email, telefone, cargo, created_at, company_id")
        .eq("company_id", companyId)
        .neq("cargo", "removido")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const mapped: Administrador[] = (data ?? []).map((p: any) => ({
        id: p.id,
        nome: p.nome || p.email?.split("@")[0] || "Sem nome",
        email: p.email || "",
        telefone: p.telefone || "",
        cargo: p.cargo || "admin",
        status: "ativo" as const,
        dataCadastro: p.created_at?.split("T")[0] ?? new Date().toISOString().split("T")[0],
      }));

      setAdmins(mapped);
    } catch (err) {
      console.error("Erro ao buscar administradores:", err);
      toast.error("Erro ao carregar administradores");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, [companyId]);

  const filtrados = admins.filter(
    (a) =>
      a.nome.toLowerCase().includes(busca.toLowerCase()) ||
      a.email.toLowerCase().includes(busca.toLowerCase())
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
    setForm({ nome: admin.nome, email: admin.email, telefone: admin.telefone, cargo: admin.cargo });
    setDialogOpen(true);
  }

  async function handleSalvar() {
    if (!companyId) return;
    setSaving(true);
    try {
      if (editando) {
        // Atualizar perfil existente
        const { error } = await supabase
          .from("profiles")
          .update({ nome: form.nome, telefone: form.telefone, cargo: form.cargo })
          .eq("id", editando.id);

        if (error) throw error;
        toast.success("Administrador atualizado!");
      } else {
        toast.info("Para adicionar um novo administrador, peça que ele crie uma conta no sistema. O perfil dele aparecerá automaticamente aqui.");
        setDialogOpen(false);
        return;
      }
      await fetchAdmins();
      setDialogOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  async function handleExcluir() {
    if (!confirmDelete) return;
    setSaving(true);
    try {
      // Apenas atualiza o cargo para "removido" (não deleta o auth user)
      const { error } = await supabase
        .from("profiles")
        .update({ cargo: "removido" })
        .eq("id", confirmDelete.id);
      if (error) throw error;
      toast.success("Administrador removido da lista.");
      await fetchAdmins();
      setConfirmDelete(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao remover");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppLayout>
      <div className="space-y-6 max-w-7xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Administradores</h1>
            <p className="text-sm text-muted-foreground">Usuários cadastrados no sistema com acesso à sua empresa</p>
          </div>
          <Button className="gap-2" onClick={abrirNovo}>
            <Plus className="h-4 w-4" /> Adicionar
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
          {loading ? (
            <div className="px-5 py-12 flex items-center justify-center gap-2 text-muted-foreground text-sm">
              <Loader2 className="h-4 w-4 animate-spin" /> Carregando...
            </div>
          ) : filtrados.length === 0 ? (
            <div className="px-5 py-12 text-center text-muted-foreground text-sm">
              {admins.length === 0
                ? "Nenhum usuário cadastrado ainda. Crie uma conta para aparecer aqui."
                : "Nenhum administrador encontrado."}
            </div>
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
                      {admin.telefone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{admin.telefone}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={cargoVariant[admin.cargo] ?? "outline"}>
                    {cargoLabels[admin.cargo] ?? admin.cargo}
                  </Badge>
                  <Badge variant="default">Ativo</Badge>
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

      {/* Dialog Editar */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editando ? "Editar Administrador" : "Adicionar Administrador"}</DialogTitle>
          </DialogHeader>
          {!editando ? (
            <div className="space-y-3 py-2">
              <p className="text-sm text-muted-foreground">
                Para adicionar um novo administrador, basta pedir que o usuário <strong>crie uma conta no sistema</strong> usando o email da empresa. Ele aparecerá automaticamente nesta lista.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <Label>Nome completo</Label>
                <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Nome" />
              </div>
              <div>
                <Label>Telefone</Label>
                <Input value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} placeholder="(00) 00000-0000" />
              </div>
              <div>
                <Label>Cargo / Função</Label>
                <Select value={form.cargo} onValueChange={(v) => setForm({ ...form, cargo: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="gerente">Gerente</SelectItem>
                    <SelectItem value="funcionario">Funcionário</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            {editando && (
              <Button onClick={handleSalvar} disabled={saving || !form.nome}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Salvar alterações
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Confirmar Remoção */}
      <Dialog open={!!confirmDelete} onOpenChange={() => setConfirmDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remover administrador</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Tem certeza que deseja remover <strong>{confirmDelete?.nome}</strong> da lista de administradores?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleExcluir} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Remover
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default Administradores;
