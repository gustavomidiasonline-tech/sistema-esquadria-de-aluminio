import { AppLayout } from "@/components/AppLayout";
import { ShieldCheck, Plus, Search, Mail, Phone, MoreVertical, Shield, UserCheck } from "lucide-react";
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

const Administradores = () => {
  const [admins, setAdmins] = useState<Administrador[]>(mockAdmins);
  const [busca, setBusca] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [novo, setNovo] = useState({ nome: "", email: "", telefone: "", cargo: "admin" });

  const filtrados = admins.filter(
    (a) => a.nome.toLowerCase().includes(busca.toLowerCase()) || a.email.toLowerCase().includes(busca.toLowerCase())
  );

  const handleCriar = () => {
    const novoAdmin: Administrador = {
      id: Date.now(),
      nome: novo.nome,
      email: novo.email,
      telefone: novo.telefone,
      cargo: novo.cargo as Administrador["cargo"],
      status: "ativo",
      dataCadastro: new Date().toISOString().split("T")[0],
    };
    setAdmins([novoAdmin, ...admins]);
    setNovo({ nome: "", email: "", telefone: "", cargo: "admin" });
    setDialogOpen(false);
  };

  const totais = {
    ativos: admins.filter((a) => a.status === "ativo").length,
    inativos: admins.filter((a) => a.status === "inativo").length,
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-7xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Administradores</h1>
            <p className="text-sm text-muted-foreground">Gerencie os administradores do sistema e suas permissões</p>
          </div>
          <Button className="gap-2" onClick={() => setDialogOpen(true)}>
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
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Administrador</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome completo</Label>
              <Input value={novo.nome} onChange={(e) => setNovo({ ...novo, nome: e.target.value })} placeholder="Nome do administrador" />
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
                <Label>Cargo</Label>
                <Select value={novo.cargo} onValueChange={(v) => setNovo({ ...novo, cargo: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="gerente">Gerente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleCriar} disabled={!novo.nome || !novo.email}>Criar administrador</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default Administradores;
