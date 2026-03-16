import { AppLayout } from "@/components/AppLayout";
import { MapPin, Phone, User, Navigation } from "lucide-react";
import { useState } from "react";

const clientes = [
  { id: 1, nome: "João Silva", endereco: "Rua das Flores, 123 - Centro", cidade: "São Paulo", tel: "(11) 98765-4321", lat: -23.55, lng: -46.63, pedidos: 3, status: "ativo" },
  { id: 2, nome: "Maria Oliveira", endereco: "Av. Brasil, 456 - Jardins", cidade: "São Paulo", tel: "(11) 91234-5678", lat: -23.56, lng: -46.65, pedidos: 1, status: "ativo" },
  { id: 3, nome: "Carlos Santos", endereco: "Rua Augusta, 789 - Consolação", cidade: "São Paulo", tel: "(11) 99876-5432", lat: -23.55, lng: -46.66, pedidos: 5, status: "ativo" },
  { id: 4, nome: "Ana Costa", endereco: "Rua Oscar Freire, 321 - Pinheiros", cidade: "São Paulo", tel: "(11) 97654-3210", lat: -23.56, lng: -46.68, pedidos: 2, status: "pendente" },
  { id: 5, nome: "Pedro Lima", endereco: "Av. Paulista, 1000 - Bela Vista", cidade: "São Paulo", tel: "(11) 96543-2109", lat: -23.56, lng: -46.65, pedidos: 4, status: "ativo" },
  { id: 6, nome: "Lucia Ferreira", endereco: "Rua Haddock Lobo, 595 - Cerqueira César", cidade: "São Paulo", tel: "(11) 95432-1098", lat: -23.55, lng: -46.67, pedidos: 1, status: "inativo" },
];

const statusColors: Record<string, string> = {
  ativo: "bg-[hsl(142,72%,42%)] text-white",
  pendente: "bg-[hsl(38,92%,50%)] text-white",
  inativo: "bg-muted text-muted-foreground",
};

const Mapa = () => {
  const [selected, setSelected] = useState<number | null>(null);

  return (
    <AppLayout>
      <div className="space-y-6 max-w-7xl">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Mapa</h1>
          <p className="text-sm text-muted-foreground">Localização dos clientes e pedidos</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map placeholder */}
          <div className="lg:col-span-2 glass-card-premium overflow-hidden relative" style={{ minHeight: 480 }}>
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/20 flex items-center justify-center">
              <div className="relative w-full h-full">
                {/* Grid simulating a map */}
                <svg className="w-full h-full opacity-20" viewBox="0 0 400 300">
                  {[...Array(10)].map((_, i) => (
                    <line key={`h${i}`} x1={0} y1={i * 30} x2={400} y2={i * 30} stroke="hsl(207, 90%, 54%)" strokeWidth={0.5} />
                  ))}
                  {[...Array(14)].map((_, i) => (
                    <line key={`v${i}`} x1={i * 30} y1={0} x2={i * 30} y2={300} stroke="hsl(207, 90%, 54%)" strokeWidth={0.5} />
                  ))}
                </svg>
                {/* Pins */}
                {clientes.map((c, i) => (
                  <button
                    key={c.id}
                    onClick={() => setSelected(c.id)}
                    className={`absolute transition-transform hover:scale-125 ${selected === c.id ? "scale-125 z-10" : ""}`}
                    style={{ left: `${15 + i * 13}%`, top: `${20 + (i % 3) * 25}%` }}
                  >
                    <MapPin
                      className={`h-7 w-7 drop-shadow-md ${selected === c.id ? "text-primary" : "text-destructive"}`}
                      fill={selected === c.id ? "hsl(207, 90%, 54%)" : "hsl(0, 72%, 51%)"}
                    />
                  </button>
                ))}
                <div className="absolute bottom-4 left-4 bg-card/90 backdrop-blur-sm rounded-lg px-3 py-2 text-xs text-muted-foreground border border-border">
                  <Navigation className="h-3 w-3 inline mr-1" /> {clientes.length} clientes mapeados
                </div>
              </div>
            </div>
          </div>

          {/* Client list */}
          <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
            {clientes.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelected(c.id)}
                className={`w-full text-left bg-card border rounded-xl p-4 transition-all ${
                  selected === c.id ? "border-primary shadow-md" : "border-border hover:border-primary/30"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-primary" />
                    <span className="text-sm font-semibold text-foreground">{c.nome}</span>
                  </div>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${statusColors[c.status]}`}>
                    {c.status}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                  <MapPin className="h-3 w-3" /> {c.endereco}
                </p>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Phone className="h-3 w-3" /> {c.tel}
                  </p>
                  <span className="text-xs text-muted-foreground">{c.pedidos} pedido(s)</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Mapa;
