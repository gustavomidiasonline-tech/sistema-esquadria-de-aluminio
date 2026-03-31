import { AppLayout } from "@/components/AppLayout";
import { ClipboardList, Package, Upload, Layers, Wrench, Box } from "lucide-react";
import { useNavigate } from "react-router-dom";

const MateriaisVisaoGeral = () => {
  const navigate = useNavigate();

  const sections = [
    {
      title: "Lista de Materiais (BOM)",
      url: "/materiais/lista",
      icon: ClipboardList,
      description: "Geracao de listas de materiais por orcamento",
    },
    {
      title: "Catalogo de Produtos",
      url: "/materiais/catalogo",
      icon: Package,
      description: "Gerenciar modelos de esquadrias e componentes",
    },
    {
      title: "Importar Dados",
      url: "/materiais/importar-dados",
      icon: Upload,
      description: "Importacao em massa de materiais e catalogos",
    },
  ];

  return (
    <AppLayout>
      <div className="space-y-6 max-w-7xl">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Materiais</h1>
          <p className="text-sm text-muted-foreground">Gestao de suprimentos, catalogos e especificacoes</p>
        </div>

        {/* Navigation Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sections.map((section) => (
            <button
              key={section.url}
              onClick={() => navigate(section.url)}
              className="glass-card-premium p-6 rounded-xl hover:bg-primary/5 transition-all duration-300 text-left group border border-border/50 hover:border-primary/50 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
                <section.icon className="h-20 w-20" />
              </div>
              <div className="flex flex-col gap-4">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                  <section.icon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors">
                    {section.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">{section.description}</p>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Extra Info / Stats Placeholder */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="glass-card-premium p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500">
              <Layers className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Perfis Disponíveis</p>
              <p className="text-2xl font-black text-foreground">Calculando...</p>
            </div>
          </div>
          <div className="glass-card-premium p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
              <Box className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Itens no Catalogo</p>
              <p className="text-2xl font-black text-foreground">Acessar Catalogo</p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default MateriaisVisaoGeral;
