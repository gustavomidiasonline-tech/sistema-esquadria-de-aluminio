import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Login from "./pages/Login";
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
import Agenda from "./pages/Agenda";
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
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/clientes" element={<ProtectedRoute><Clientes /></ProtectedRoute>} />
            <Route path="/orcamentos" element={<ProtectedRoute><Orcamentos /></ProtectedRoute>} />
            <Route path="/servicos" element={<ProtectedRoute><Servicos /></ProtectedRoute>} />
            <Route path="/pedidos" element={<ProtectedRoute><Pedidos /></ProtectedRoute>} />
            <Route path="/plano-de-corte" element={<ProtectedRoute><PlanoDeCorte /></ProtectedRoute>} />
            <Route path="/agenda" element={<ProtectedRoute><Agenda /></ProtectedRoute>} />
            <Route path="/produtos" element={<ProtectedRoute><Produtos /></ProtectedRoute>} />
            <Route path="/precos" element={<ProtectedRoute><Precos /></ProtectedRoute>} />
            <Route path="/relatorios" element={<ProtectedRoute><Relatorios /></ProtectedRoute>} />
            <Route path="/mapa" element={<ProtectedRoute><Mapa /></ProtectedRoute>} />
            <Route path="/administradores" element={<ProtectedRoute><Administradores /></ProtectedRoute>} />
            <Route path="/funcionarios" element={<ProtectedRoute><Funcionarios /></ProtectedRoute>} />
            {/* Financeiro */}
            <Route path="/financeiro" element={<ProtectedRoute><FinanceiroVisaoGeral /></ProtectedRoute>} />
            <Route path="/financeiro/contas-receber" element={<ProtectedRoute><ContasReceber /></ProtectedRoute>} />
            <Route path="/financeiro/contas-pagar" element={<ProtectedRoute><ContasPagar /></ProtectedRoute>} />
            <Route path="/financeiro/notas-fiscais" element={<ProtectedRoute><NotasFiscais /></ProtectedRoute>} />
            <Route path="/financeiro/emissao-nf" element={<ProtectedRoute><EmissaoNF /></ProtectedRoute>} />
            <Route path="/financeiro/contratos" element={<ProtectedRoute><Contratos /></ProtectedRoute>} />
            <Route path="/financeiro/documentos" element={<ProtectedRoute><Documentos /></ProtectedRoute>} />
            <Route path="/financeiro/fluxo-caixa" element={<ProtectedRoute><FluxoCaixa /></ProtectedRoute>} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
