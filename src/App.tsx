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
import PlanoDeCorte from "./pages/PlanoDeCorte";
import Precos from "./pages/Precos";
import Relatorios from "./pages/Relatorios";
import Mapa from "./pages/Mapa";
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
          <Route path="/plano-de-corte" element={<PlanoDeCorte />} />
          <Route path="/agenda" element={<PlaceholderPage title="Agenda" description="Agende instalações, visitas técnicas e compromissos da equipe." />} />
          <Route path="/produtos" element={<Produtos />} />
          <Route path="/precos" element={<Precos />} />
          <Route path="/relatorios" element={<Relatorios />} />
          <Route path="/mapa" element={<Mapa />} />
          <Route path="/administradores" element={<PlaceholderPage title="Administradores" description="Gerencie os administradores do sistema e suas permissões." />} />
          <Route path="/funcionarios" element={<PlaceholderPage title="Funcionários" description="Cadastre e gerencie os funcionários da empresa." />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
