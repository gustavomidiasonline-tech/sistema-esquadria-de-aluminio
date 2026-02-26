import { AppLayout } from "@/components/AppLayout";
import { Users, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

const mockClients = [
  { id: 1, name: "Igor Soares de Souza", phone: "(11) 9602-2000", address: "Rua Teste, 1234, Caieiras, SP", orders: 5 },
  { id: 2, name: "Maria Oliveira", phone: "(11) 98765-4321", address: "Av. Brasil, 500, São Paulo, SP", orders: 3 },
  { id: 3, name: "Carlos Santos", phone: "(11) 91234-5678", address: "Rua das Flores, 88, Guarulhos, SP", orders: 8 },
  { id: 4, name: "Ana Costa", phone: "(21) 99876-5432", address: "Rua XV, 200, Rio de Janeiro, RJ", orders: 2 },
];

const Clientes = () => (
  <AppLayout>
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Clientes</h1>
          <p className="text-sm text-muted-foreground">{mockClients.length} clientes cadastrados</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" /> Novo cliente
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar cliente..."
          className="pl-10 pr-4 py-2.5 text-sm bg-card border border-border rounded-lg w-full outline-none focus:ring-2 focus:ring-primary/30 text-foreground placeholder:text-muted-foreground"
        />
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm divide-y divide-border">
        {mockClients.map((client) => (
          <div key={client.id} className="flex items-center justify-between px-5 py-4 hover:bg-muted/50 transition-colors cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{client.name}</p>
                <p className="text-xs text-muted-foreground">{client.phone} · {client.address}</p>
              </div>
            </div>
            <span className="text-xs font-medium text-muted-foreground">{client.orders} pedidos</span>
          </div>
        ))}
      </div>
    </div>
  </AppLayout>
);

export default Clientes;
