import { AppLayout } from "@/components/AppLayout";
import { Users, Plus, Search, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { useSupabaseQuery, useSupabaseInsert, useSupabaseUpdate, useSupabaseDelete } from "@/hooks/useSupabaseQuery";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { toast } from "sonner";

interface Cliente {
  id: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  cpf_cnpj: string | null;
  endereco: string | null;
  cidade: string | null;
  estado: string | null;
  cep: string | null;
  observacoes: string | null;
}

const Clientes = () => {
  const { user } = useAuth();
  const { data: clientes = [], isLoading } = useSupabaseQuery<Cliente>("clientes", {
    orderBy: { column: "nome", ascending: true },
  });
  const insertMutation = useSupabaseInsert("clientes");
  const updateMutation = useSupabaseUpdate("clientes");
  const deleteMutation = useSupabaseDelete("clientes");

  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
  const [form, setForm] = useState({
    nome: "", email: "", telefone: "", cpf_cnpj: "", endereco: "", cidade: "", estado: "", cep: "", observacoes: "",
  });

  const filtered = clientes.filter((c) =>
    c.nome.toLowerCase().includes(search.toLowerCase()) ||
    (c.email && c.email.toLowerCase().includes(search.toLowerCase()))
  );

  const openNew = () => {
    setEditingCliente(null);
    setForm({ nome: "", email: "", telefone: "", cpf_cnpj: "", endereco: "", cidade: "", estado: "", cep: "", observacoes: "" });
    setDialogOpen(true);
  };

  const openEdit = (c: Cliente) => {
    setEditingCliente(c);
    setForm({
      nome: c.nome, email: c.email || "", telefone: c.telefone || "",
      cpf_cnpj: c.cpf_cnpj || "", endereco: c.endereco || "", cidade: c.cidade || "",
      estado: c.estado || "", cep: c.cep || "", observacoes: c.observacoes || "",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.nome.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }
    try {
      if (editingCliente) {
        await updateMutation.mutateAsync({ id: editingCliente.id, values: form });
        toast.success("Cliente atualizado!");
      } else {
        await insertMutation.mutateAsync({ ...form, created_by: user?.id });
        toast.success("Cliente adicionado!");
      }
      setDialogOpen(false);
    } catch {}
  };

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir este cliente?")) {
      try {
        await deleteMutation.mutateAsync(id);
        toast.success("Cliente excluído!");
      } catch {}
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-7xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Clientes</h1>
            <p className="text-sm text-muted-foreground">{clientes.length} clientes cadastrados</p>
          </div>
          <Button className="gap-2" onClick={openNew}>
            <Plus className="h-4 w-4" /> Novo cliente
          </Button>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text" placeholder="Buscar cliente..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2.5 text-sm bg-card border border-border rounded-lg w-full outline-none focus:ring-2 focus:ring-primary/30 text-foreground placeholder:text-muted-foreground"
          />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            {clientes.length === 0 ? "Nenhum cliente cadastrado. Clique em \"Novo cliente\" para começar." : "Nenhum cliente encontrado."}
          </div>
        ) : (
          <div className="glass-surface rounded-xl divide-y divide-border/30">
            {filtered.map((client) => (
              <div key={client.id} className="flex items-center justify-between px-5 py-4 hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{client.nome}</p>
                    <p className="text-xs text-muted-foreground">
                      {client.telefone || ""}{client.telefone && client.endereco ? " · " : ""}{client.endereco ? `${client.endereco}${client.cidade ? `, ${client.cidade}` : ""}` : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(client)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(client.id)} className="text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingCliente ? "Editar Cliente" : "Novo Cliente"}</DialogTitle>
            <DialogDescription>Preencha os dados do cliente.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label>Nome <span className="text-destructive">*</span></Label>
              <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Email</Label>
                <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label>Telefone</Label>
                <Input value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} className="mt-1" />
              </div>
            </div>
            <div>
              <Label>CPF/CNPJ</Label>
              <Input value={form.cpf_cnpj} onChange={(e) => setForm({ ...form, cpf_cnpj: e.target.value })} className="mt-1" />
            </div>
            <div>
              <Label>Endereço</Label>
              <Input value={form.endereco} onChange={(e) => setForm({ ...form, endereco: e.target.value })} className="mt-1" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Cidade</Label>
                <Input value={form.cidade} onChange={(e) => setForm({ ...form, cidade: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label>Estado</Label>
                <Input value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label>CEP</Label>
                <Input value={form.cep} onChange={(e) => setForm({ ...form, cep: e.target.value })} className="mt-1" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={insertMutation.isPending || updateMutation.isPending}>
              {insertMutation.isPending || updateMutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default Clientes;
