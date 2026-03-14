import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { FeatureGate } from "@/components/FeatureGate";
import Login from "./pages/Login";
import ResetPassword from "./pages/ResetPassword";
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
import Fornecedores from "./pages/Fornecedores";
import Agenda from "./pages/Agenda";
import EsquadriasModule from "./pages/EsquadriasModule";
import FinanceiroVisaoGeral from "./pages/financeiro/FinanceiroVisaoGeral";
import ContasReceber from "./pages/financeiro/ContasReceber";
import ContasPagar from "./pages/financeiro/ContasPagar";
import NotasFiscais from "./pages/financeiro/NotasFiscais";
import EmissaoNF from "./pages/financeiro/EmissaoNF";
import Contratos from "./pages/financeiro/Contratos";
import Documentos from "./pages/financeiro/Documentos";
import FluxoCaixa from "./pages/financeiro/FluxoCaixa";
import Pagamentos from "./pages/financeiro/Pagamentos";
import Planos from "./pages/Planos";
import Workflow from "./pages/Workflow";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/clientes" element={<ProtectedRoute><FeatureGate feature="clientes"><Clientes /></FeatureGate></ProtectedRoute>} />
            <Route path="/orcamentos" element={<ProtectedRoute><FeatureGate feature="orcamentos"><Orcamentos /></FeatureGate></ProtectedRoute>} />
            <Route path="/servicos" element={<ProtectedRoute><FeatureGate feature="servicos"><Servicos /></FeatureGate></ProtectedRoute>} />
            <Route path="/pedidos" element={<ProtectedRoute><FeatureGate feature="pedidos"><Pedidos /></FeatureGate></ProtectedRoute>} />
            <Route path="/plano-de-corte" element={<ProtectedRoute><FeatureGate feature="plano_corte"><PlanoDeCorte /></FeatureGate></ProtectedRoute>} />
            <Route path="/agenda" element={<ProtectedRoute><FeatureGate feature="agenda"><Agenda /></FeatureGate></ProtectedRoute>} />
            <Route path="/produtos" element={<ProtectedRoute><FeatureGate feature="produtos"><Produtos /></FeatureGate></ProtectedRoute>} />
            <Route path="/precos" element={<ProtectedRoute><FeatureGate feature="precos"><Precos /></FeatureGate></ProtectedRoute>} />
            <Route path="/fornecedores" element={<ProtectedRoute><FeatureGate feature="fornecedores"><Fornecedores /></FeatureGate></ProtectedRoute>} />
            <Route path="/relatorios" element={<ProtectedRoute><FeatureGate feature="relatorios"><Relatorios /></FeatureGate></ProtectedRoute>} />
            <Route path="/mapa" element={<ProtectedRoute><FeatureGate feature="mapa"><Mapa /></FeatureGate></ProtectedRoute>} />
            <Route path="/administradores" element={<ProtectedRoute><Administradores /></ProtectedRoute>} />
            <Route path="/funcionarios" element={<ProtectedRoute><Funcionarios /></ProtectedRoute>} />
            <Route path="/esquadrias" element={<ProtectedRoute><FeatureGate feature="esquadrias"><EsquadriasModule /></FeatureGate></ProtectedRoute>} />
            <Route path="/planos" element={<ProtectedRoute><Planos /></ProtectedRoute>} />
            <Route path="/workflow" element={<ProtectedRoute><FeatureGate feature="pedidos"><Workflow /></FeatureGate></ProtectedRoute>} />
            {/* Financeiro */}
            <Route path="/financeiro" element={<ProtectedRoute><FeatureGate feature="financeiro"><FinanceiroVisaoGeral /></FeatureGate></ProtectedRoute>} />
            <Route path="/financeiro/contas-receber" element={<ProtectedRoute><FeatureGate feature="financeiro"><ContasReceber /></FeatureGate></ProtectedRoute>} />
            <Route path="/financeiro/contas-pagar" element={<ProtectedRoute><FeatureGate feature="financeiro"><ContasPagar /></FeatureGate></ProtectedRoute>} />
            <Route path="/financeiro/pagamentos" element={<ProtectedRoute><FeatureGate feature="financeiro"><Pagamentos /></FeatureGate></ProtectedRoute>} />
            <Route path="/financeiro/notas-fiscais" element={<ProtectedRoute><FeatureGate feature="financeiro"><NotasFiscais /></FeatureGate></ProtectedRoute>} />
            <Route path="/financeiro/emissao-nf" element={<ProtectedRoute><FeatureGate feature="financeiro"><EmissaoNF /></FeatureGate></ProtectedRoute>} />
            <Route path="/financeiro/contratos" element={<ProtectedRoute><FeatureGate feature="contratos"><Contratos /></FeatureGate></ProtectedRoute>} />
            <Route path="/financeiro/documentos" element={<ProtectedRoute><FeatureGate feature="financeiro"><Documentos /></FeatureGate></ProtectedRoute>} />
            <Route path="/financeiro/fluxo-caixa" element={<ProtectedRoute><FeatureGate feature="financeiro"><FluxoCaixa /></FeatureGate></ProtectedRoute>} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
