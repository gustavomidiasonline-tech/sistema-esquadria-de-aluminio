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
import Servicos from "./pages/Servicos";
import Administradores from "./pages/Administradores";
import Funcionarios from "./pages/Funcionarios";
import { PlaceholderPage } from "./components/PlaceholderPage";
import FinanceiroVisaoGeral from "./pages/financeiro/FinanceiroVisaoGeral";
import ContasReceber from "./pages/financeiro/ContasReceber";
import ContasPagar from "./pages/financeiro/ContasPagar";
import NotasFiscais from "./pages/financeiro/NotasFiscais";
import EmissaoNF from "./pages/financeiro/EmissaoNF";
import Contratos from "./pages/financeiro/Contratos";
import Documentos from "./pages/financeiro/Documentos";
import FluxoCaixa from "./pages/financeiro/FluxoCaixa";

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
          <Route path="/servicos" element={<Servicos />} />
          <Route path="/pedidos" element={<Pedidos />} />
          <Route path="/plano-de-corte" element={<PlanoDeCorte />} />
          <Route path="/agenda" element={<PlaceholderPage title="Agenda" description="Agende instalações, visitas técnicas e compromissos da equipe." />} />
          <Route path="/produtos" element={<Produtos />} />
          <Route path="/precos" element={<Precos />} />
          <Route path="/relatorios" element={<Relatorios />} />
          <Route path="/mapa" element={<Mapa />} />
          <Route path="/administradores" element={<Administradores />} />
          <Route path="/funcionarios" element={<Funcionarios />} />
          {/* Financeiro */}
          <Route path="/financeiro" element={<FinanceiroVisaoGeral />} />
          <Route path="/financeiro/contas-receber" element={<ContasReceber />} />
          <Route path="/financeiro/contas-pagar" element={<ContasPagar />} />
          <Route path="/financeiro/notas-fiscais" element={<NotasFiscais />} />
          <Route path="/financeiro/emissao-nf" element={<EmissaoNF />} />
          <Route path="/financeiro/contratos" element={<Contratos />} />
          <Route path="/financeiro/documentos" element={<Documentos />} />
          <Route path="/financeiro/fluxo-caixa" element={<FluxoCaixa />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
