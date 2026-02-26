import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Clientes from "./pages/Clientes";
import Orcamentos from "./pages/Orcamentos";
import Pedidos from "./pages/Pedidos";
import Produtos from "./pages/Produtos";
import NotFound from "./pages/NotFound";
import { PlaceholderPage } from "./components/PlaceholderPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/clientes" element={<Clientes />} />
          <Route path="/orcamentos" element={<Orcamentos />} />
          <Route path="/servicos" element={<PlaceholderPage title="Serviços" description="Gerencie os serviços da sua vidraçaria, incluindo instalação, manutenção e reparos." />} />
          <Route path="/pedidos" element={<Pedidos />} />
          <Route path="/plano-de-corte" element={<PlaceholderPage title="Plano de Corte" description="Otimize o corte dos vidros e perfis com planos automatizados." />} />
          <Route path="/agenda" element={<PlaceholderPage title="Agenda" description="Agende instalações, visitas técnicas e compromissos da equipe." />} />
          <Route path="/produtos" element={<Produtos />} />
          <Route path="/precos" element={<PlaceholderPage title="Preço dos Itens" description="Configure preços de vidros, perfis, ferragens e acessórios." />} />
          <Route path="/relatorios" element={<PlaceholderPage title="Relatórios" description="Visualize relatórios de vendas, orçamentos e desempenho da equipe." />} />
          <Route path="/mapa" element={<PlaceholderPage title="Mapa" description="Visualize a localização dos clientes e pedidos no mapa." />} />
          <Route path="/administradores" element={<PlaceholderPage title="Administradores" description="Gerencie os administradores do sistema e suas permissões." />} />
          <Route path="/funcionarios" element={<PlaceholderPage title="Funcionários" description="Cadastre e gerencie os funcionários da empresa." />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
