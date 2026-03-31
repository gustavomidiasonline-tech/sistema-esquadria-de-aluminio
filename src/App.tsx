import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { FeatureGate } from "@/components/FeatureGate";
import { PipelineInitializer } from "@/components/PipelineInitializer";
import { GlobalLoader } from "@/components/ui/global-loader";
import Estoque from "./pages/Estoque";
import Login from "./pages/Login";
import ResetPassword from "./pages/ResetPassword";
import Index from "./pages/Index";
import Clientes from "./pages/Clientes";
import Orcamentos from "./pages/Orcamentos";
import PlanoDeCorte from "./pages/PlanoDeCorte";
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
import PedidosVisaoGeral from "./pages/pedidos/PedidosVisaoGeral";
import PedidosLista from "./pages/pedidos/PedidosLista";
import Workflow from "./pages/pedidos/Workflow";
import ConfiguracaoModelos from "./pages/ConfiguracaoModelos";
import MateriaisVisaoGeral from "./pages/materiais/MateriaisVisaoGeral";
import BOM from "./pages/materiais/BOM";
import ImportarDados from "./pages/materiais/ImportarDados";
import Catalogo from "./pages/materiais/Catalogo";
import RedesSociais from "./pages/RedesSociais";
import Debug from "./pages/Debug";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <GlobalLoader />
      <BrowserRouter>
        <AuthProvider>
          <PipelineInitializer />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/clientes" element={<ProtectedRoute><FeatureGate feature="clientes"><Clientes /></FeatureGate></ProtectedRoute>} />
            <Route path="/orcamentos" element={<ProtectedRoute><FeatureGate feature="orcamentos"><Orcamentos /></FeatureGate></ProtectedRoute>} />
            <Route path="/servicos" element={<ProtectedRoute><FeatureGate feature="servicos"><Servicos /></FeatureGate></ProtectedRoute>} />
            <Route path="/pedidos" element={<ProtectedRoute><FeatureGate feature="pedidos"><PedidosVisaoGeral /></FeatureGate></ProtectedRoute>} />
            <Route path="/pedidos/lista" element={<ProtectedRoute><FeatureGate feature="pedidos"><PedidosLista /></FeatureGate></ProtectedRoute>} />
            <Route path="/pedidos/workflow" element={<ProtectedRoute><FeatureGate feature="pedidos"><Workflow /></FeatureGate></ProtectedRoute>} />
            <Route path="/plano-de-corte" element={<ProtectedRoute><FeatureGate feature="plano_corte"><PlanoDeCorte /></FeatureGate></ProtectedRoute>} />
            <Route path="/agenda" element={<ProtectedRoute><FeatureGate feature="agenda"><Agenda /></FeatureGate></ProtectedRoute>} />
            <Route path="/fornecedores" element={<ProtectedRoute><FeatureGate feature="fornecedores"><Fornecedores /></FeatureGate></ProtectedRoute>} />
            <Route path="/relatorios" element={<ProtectedRoute><FeatureGate feature="relatorios"><Relatorios /></FeatureGate></ProtectedRoute>} />
            <Route path="/mapa" element={<ProtectedRoute><FeatureGate feature="mapa"><Mapa /></FeatureGate></ProtectedRoute>} />
            <Route path="/administradores" element={<ProtectedRoute><Administradores /></ProtectedRoute>} />
            <Route path="/funcionarios" element={<ProtectedRoute><Funcionarios /></ProtectedRoute>} />
            <Route path="/esquadrias" element={<ProtectedRoute><FeatureGate feature="esquadrias"><EsquadriasModule /></FeatureGate></ProtectedRoute>} />
            <Route path="/planos" element={<ProtectedRoute><Planos /></ProtectedRoute>} />
            <Route path="/configuracao-modelos" element={<ProtectedRoute><ConfiguracaoModelos /></ProtectedRoute>} />
            <Route path="/estoque" element={<ProtectedRoute><Estoque /></ProtectedRoute>} />
            <Route path="/materiais" element={<ProtectedRoute><MateriaisVisaoGeral /></ProtectedRoute>} />
            <Route path="/materiais/lista" element={<ProtectedRoute><BOM /></ProtectedRoute>} />
            <Route path="/materiais/importar-dados" element={<ProtectedRoute><ImportarDados /></ProtectedRoute>} />
            <Route path="/materiais/catalogo" element={<ProtectedRoute><Catalogo /></ProtectedRoute>} />
            <Route path="/redes-sociais" element={<ProtectedRoute><RedesSociais /></ProtectedRoute>} />
            <Route path="/debug" element={<ProtectedRoute><Debug /></ProtectedRoute>} />
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
