import { AppLayout } from "@/components/AppLayout";
import { MapPin, Phone, User, Calendar, RotateCcw, DollarSign, FileText, Printer, Clock, Search, Settings } from "lucide-react";

const mockPedidos = [
  {
    id: "PEDIDO 3",
    client: "IGOR SOARES DE SOUZA",
    address: "Rua Teste, 1234, Caieiras, Serpa, 07716-053",
    phone: "(11) 9602-2000",
    seller: "Igor Soares de Souza",
    date: "06/06/2022",
    value: "R$ 2.440,94",
    valueDate: "06/05/2022 17:15",
    status: "CONFERÊNCIA",
    statusDetail: "Data início: 07/08/2022 15:12",
    statusNote: "Anotação: teste",
    daysLabel: "Atrasado 62 dias",
    overdue: true,
    statusDaysLabel: "Faltam 1 dias",
    statusOverdue: false,
  },
  {
    id: "PEDIDO 4",
    client: "IGOR SOARES DE SOUZA",
    address: "Rua Teste, 1234, Caieiras, Serpa, 07716-053",
    phone: "(11) 9602-2000",
    seller: "Igor Soares de Souza",
    date: "06/06/2022",
    value: "R$ 1.232,50",
    valueDate: "06/05/2022 20:02",
    status: "FECHADO",
    daysLabel: "Atrasado 62 dias",
    overdue: true,
  },
  {
    id: "PEDIDO 1",
    client: "IGOR SOARES DE SOUZA",
    address: "Rua Teste, 1234, Caieiras, Serpa, 07716-053",
    phone: "(11) 97473-9209",
    seller: "Igor Soares de Souza",
    date: "12/08/2022",
    value: "R$ 14.089,00",
    valueDate: "27/01/2022 22:28",
    status: "FECHADO",
    daysLabel: "Faltam 5 dias",
    overdue: false,
  },
  {
    id: "PEDIDO 8",
    client: "IGOR SOARES DE SOUZA",
    address: "Rua Teste, 1234, Caieiras, Serpa, 07716-053",
    phone: "(11) 9602-2000",
    seller: "Igor Soares de Souza",
    date: "13/08/2022",
    value: "R$ 3.087,31",
    valueDate: "29/07/2022 13:46",
    status: "ORÇAMENTO 1",
    daysLabel: "Faltam 6 dias",
    overdue: false,
  },
  {
    id: "PEDIDO 2",
    client: "IGOR SOARES DE SOUZA",
    address: "Rua Teste, 1234, Caieiras, Serpa, 07716-053",
    phone: "(11) 9602-2000",
    seller: "Igor Soares de Souza",
    date: "15/08/2022",
    value: "R$ 17.495,60",
    valueDate: "13/03/2022 19:47",
    status: "",
    daysLabel: "Faltam 8 dias",
    overdue: false,
  },
  {
    id: "PEDIDO 6",
    client: "IGOR SOARES DE SOUZA",
    address: "Rua Teste, 1234, Caieiras, Serpa, 07716-053",
    phone: "(11) 9602-2000",
    seller: "Empresa modelo",
    date: "19/08/2022",
    value: "R$ 274,70",
    valueDate: "03/08/2022 14:11",
    status: "",
    daysLabel: "Faltam 12 dias",
    overdue: false,
  },
];

const actionButtons = [
  { icon: RotateCcw, label: "Reagendar" },
  { icon: DollarSign, label: "Pagamentos" },
  { icon: FileText, label: "Contrato" },
  { icon: Printer, label: "Impressões" },
];

const Pedidos = () => (
  <AppLayout>
    <div className="space-y-4 max-w-7xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Pedidos</h1>
        <button className="px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
          + Novo pedido
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {mockPedidos.map((pedido) => (
          <div key={pedido.id} className="bg-card border border-border rounded-xl shadow-sm flex flex-col">
            {/* Header */}
            <div className="p-4 pb-2 space-y-2">
              <h3 className="text-base font-bold text-foreground">{pedido.id}</h3>
              <div className="space-y-1 text-xs text-muted-foreground">
                <div className="flex items-start gap-1.5">
                  <User className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  <span className="font-medium text-foreground">{pedido.client}</span>
                </div>
                <div className="flex items-start gap-1.5">
                  <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  <span>{pedido.address}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 shrink-0" />
                  <span>{pedido.phone}</span>
                </div>
              </div>

              {/* Seller + Date + Badge */}
              <div className="text-xs space-y-0.5">
                <p className="text-muted-foreground">
                  <span className="font-medium text-foreground">Vendedor:</span> {pedido.seller}
                </p>
                <div className="flex items-center justify-between">
                  <p className="text-muted-foreground">
                    <span className="font-medium text-foreground">Previsão:</span> {pedido.date}
                  </p>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                      pedido.overdue
                        ? "border-destructive/30 bg-destructive/10 text-destructive"
                        : "border-success/30 bg-success/10 text-success"
                    }`}
                  >
                    {pedido.daysLabel}
                  </span>
                </div>
              </div>

              {/* Value */}
              <div className="flex items-end justify-between">
                <p className={`text-lg font-bold ${pedido.overdue ? "text-destructive" : "text-primary"}`}>
                  {pedido.value}
                </p>
                <p className="text-[10px] text-muted-foreground">{pedido.valueDate}</p>
              </div>
            </div>

            {/* Status section */}
            {pedido.status && (
              <div className="px-4 py-2 border-t border-border">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-foreground">{pedido.status}</p>
                  {pedido.statusDaysLabel && (
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                        pedido.statusOverdue
                          ? "border-destructive/30 bg-destructive/10 text-destructive"
                          : "border-success/30 bg-success/10 text-success"
                      }`}
                    >
                      {pedido.statusDaysLabel}
                    </span>
                  )}
                </div>
                {pedido.statusDetail && (
                  <p className="text-[10px] text-muted-foreground mt-0.5">{pedido.statusDetail}</p>
                )}
                {pedido.statusNote && (
                  <p className="text-[10px] text-muted-foreground">{pedido.statusNote}</p>
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
                Concluir pedido
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
  </AppLayout>
);

export default Pedidos;
