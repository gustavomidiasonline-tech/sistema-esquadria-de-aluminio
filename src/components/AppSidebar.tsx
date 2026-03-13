import {
  Home,
  Users,
  FileText,
  CheckSquare,
  Scissors,
  ListChecks,
  Calendar,
  Package,
  DollarSign,
  BarChart3,
  MapPin,
  ShieldCheck,
  UserCog,
  ChevronLeft,
  ChevronRight,
  Wallet,
  Receipt,
  FileCheck,
  FilePlus,
  CreditCard,
  TrendingUp,
  Building2,
  ChevronDown,
  Truck,
  Banknote,
  Wrench,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import manageasyLogo from "@/assets/manageasy-logo.avif";
import { useState } from "react";

const mainItems = [
  { title: "Início", url: "/", icon: Home },
  { title: "Clientes", url: "/clientes", icon: Users },
  { title: "Orçamentos", url: "/orcamentos", icon: FileText },
  { title: "Serviços", url: "/servicos", icon: CheckSquare },
  { title: "Pedidos", url: "/pedidos", icon: ListChecks },
  { title: "Plano de corte", url: "/plano-de-corte", icon: Scissors },
  { title: "Esquadrias", url: "/esquadrias", icon: Wrench },
  { title: "Agenda", url: "/agenda", icon: Calendar },
  { title: "Produtos", url: "/produtos", icon: Package },
  { title: "Preço dos itens", url: "/precos", icon: DollarSign },
  { title: "Fornecedores", url: "/fornecedores", icon: Truck },
  { title: "Relatórios", url: "/relatorios", icon: BarChart3 },
  { title: "Mapa", url: "/mapa", icon: MapPin },
];

const financeiroItems = [
  { title: "Visão Geral", url: "/financeiro", icon: TrendingUp },
  { title: "Contas a Receber", url: "/financeiro/contas-receber", icon: Wallet },
  { title: "Contas a Pagar", url: "/financeiro/contas-pagar", icon: CreditCard },
  { title: "Pagamentos", url: "/financeiro/pagamentos", icon: Banknote },
  { title: "Notas Fiscais", url: "/financeiro/notas-fiscais", icon: Receipt },
  { title: "Emissão de NF", url: "/financeiro/emissao-nf", icon: FilePlus },
  { title: "Contratos", url: "/financeiro/contratos", icon: FileCheck },
  { title: "Documentos", url: "/financeiro/documentos", icon: FileText },
  { title: "Fluxo de Caixa", url: "/financeiro/fluxo-caixa", icon: Building2 },
];

const adminItems = [
  { title: "Administradores", url: "/administradores", icon: ShieldCheck },
  { title: "Funcionários", url: "/funcionarios", icon: UserCog },
];

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const [financeiroOpen, setFinanceiroOpen] = useState(
    location.pathname.startsWith("/financeiro")
  );

  const isActive = (path: string) =>
    path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);

  const linkClass = (path: string) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
      isActive(path)
        ? "bg-sidebar-accent text-sidebar-accent-foreground"
        : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
    }`;

  const subLinkClass = (path: string) =>
    `flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-200 ${
      isActive(path)
        ? "bg-sidebar-accent text-sidebar-accent-foreground"
        : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
    }`;

  return (
    <aside
      className={`${
        collapsed ? "w-[72px]" : "w-[240px]"
      } glass-sidebar flex flex-col h-screen sticky top-0 transition-all duration-300 shrink-0`}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-sidebar-border/30">
        <img src={manageasyLogo} alt="Manageasy" className="h-8 w-8 rounded-lg object-contain" />
        {!collapsed && (
          <div>
            <h1 className="text-base font-bold text-sidebar-foreground">Alumy</h1>
            <p className="text-[10px] text-sidebar-foreground/60">by Manageasy</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {mainItems.map((item) => (
          <NavLink
            key={item.url}
            to={item.url}
            end={item.url === "/"}
            className={linkClass(item.url)}
            activeClassName=""
          >
            <item.icon className="h-5 w-5 shrink-0" />
            {!collapsed && <span>{item.title}</span>}
          </NavLink>
        ))}

        {/* Financeiro Section */}
        <div className="pt-4 pb-2">
          {!collapsed && (
            <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/40">
              Financeiro
            </p>
          )}
        </div>

        {collapsed ? (
          <NavLink
            to="/financeiro"
            className={linkClass("/financeiro")}
            activeClassName=""
          >
            <Wallet className="h-5 w-5 shrink-0" />
          </NavLink>
        ) : (
          <>
            <button
              onClick={() => setFinanceiroOpen(!financeiroOpen)}
              className="flex items-center justify-between w-full px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-all duration-200"
            >
              <div className="flex items-center gap-3">
                <Wallet className="h-5 w-5 shrink-0" />
                <span>Financeiro</span>
              </div>
              <ChevronDown
                className={`h-4 w-4 transition-transform duration-200 ${
                  financeiroOpen ? "rotate-180" : ""
                }`}
              />
            </button>
            {financeiroOpen && (
              <div className="ml-3 pl-3 border-l border-sidebar-border/20 space-y-0.5">
                {financeiroItems.map((item) => (
                  <NavLink
                    key={item.url}
                    to={item.url}
                    className={subLinkClass(item.url)}
                    activeClassName=""
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    <span>{item.title}</span>
                  </NavLink>
                ))}
              </div>
            )}
          </>
        )}

        {/* Gestão Section */}
        <div className="pt-4 pb-2">
          {!collapsed && (
            <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/40">
              Gestão
            </p>
          )}
        </div>

        {adminItems.map((item) => (
          <NavLink
            key={item.url}
            to={item.url}
            className={linkClass(item.url)}
            activeClassName=""
          >
            <item.icon className="h-5 w-5 shrink-0" />
            {!collapsed && <span>{item.title}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-center py-4 border-t border-sidebar-border/30 text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors"
      >
        {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
      </button>
    </aside>
  );
}
