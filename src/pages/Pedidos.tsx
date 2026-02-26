import { AppLayout } from "@/components/AppLayout";
import { ListChecks, MapPin, Phone, User, DollarSign, Calendar } from "lucide-react";

const mockPedidos = [
  {
    id: "PEDIDO 3",
    client: "Igor Soares de Souza",
    address: "Rua Teste, 1234, Caieiras, Serpa, 07716-053",
    phone: "(11) 9602-2000",
    seller: "Igor Soares de Souza",
    date: "06/06/2022",
    value: "R$ 2.440,94",
    status: "Conferência",
    daysLabel: "Atrasado 62 dias",
    overdue: true,
  },
  {
    id: "PEDIDO 4",
    client: "Igor Soares de Souza",
    address: "Rua Teste, 1234, Caieiras, Serpa, 07716-053",
    phone: "(11) 9602-2000",
    seller: "Igor Soares de Souza",
    date: "12/08/2022",
    value: "R$ 1.232,50",
    status: "Fechado",
    daysLabel: "Atrasado 62 dias",
    overdue: true,
  },
  {
    id: "PEDIDO 1",
    client: "Igor Soares de Souza",
    address: "Rua Teste, 1234, Caieiras",
    phone: "(11) 97473-9209",
    seller: "Igor Soares de Souza",
    date: "12/08/2022",
    value: "R$ 14.089,00",
    status: "Fechado",
    daysLabel: "Faltam 5 dias",
    overdue: false,
  },
];

const Pedidos = () => (
  <AppLayout>
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Pedidos</h1>
        <button className="px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
          + Novo pedido
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {mockPedidos.map((pedido) => (
          <div key={pedido.id} className="bg-card border border-border rounded-xl shadow-sm p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-foreground">{pedido.id}</h3>
              <span
                className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                  pedido.overdue
                    ? "bg-destructive/10 text-destructive"
                    : "bg-warning/10 text-warning"
                }`}
              >
                {pedido.daysLabel}
              </span>
            </div>

            <div className="space-y-1.5 text-sm">
              <div className="flex items-center gap-2 text-foreground">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
                {pedido.client}
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" />
                <span className="truncate">{pedido.address}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-3.5 w-3.5" />
                {pedido.phone}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border">
              <div>
                <p className="text-xs text-muted-foreground">Previsão: {pedido.date}</p>
                <p className="text-lg font-bold text-primary">{pedido.value}</p>
              </div>
              <span className="text-xs font-medium px-2 py-1 rounded bg-muted text-muted-foreground">
                {pedido.status}
              </span>
            </div>

            <div className="flex gap-2 pt-2">
              <button className="flex-1 py-2 text-xs font-medium rounded-lg border border-border text-foreground hover:bg-muted transition-colors">
                Cancelar
              </button>
              <button className="flex-1 py-2 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
                Concluir pedido
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  </AppLayout>
);

export default Pedidos;
