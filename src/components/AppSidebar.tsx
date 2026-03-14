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
  Lock,
  Crown,
  GitBranch,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation, useNavigate } from "react-router-dom";
import manageasyLogo from "@/assets/manageasy-logo.avif";
import { useState } from "react";
import { useSubscription, ROUTE_FEATURE_MAP, PLAN_LABELS, type FeatureKey } from "@/hooks/useSubscription";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const mainItems = [
  { title: "Início", url: "/", icon: Home },
  { title: "Clientes", url: "/clientes", icon: Users },
  { title: "Orçamentos", url: "/orcamentos", icon: FileText },
  { title: "Serviços", url: "/servicos", icon: CheckSquare },
  { title: "Pedidos", url: "/pedidos", icon: ListChecks },
  { title: "Workflow", url: "/workflow", icon: GitBranch },
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
  const navigate = useNavigate();
  const [financeiroOpen, setFinanceiroOpen] = useState(
    location.pathname.startsWith("/financeiro")
  );
  const { hasFeature, getMinPlan, currentPlan } = useSubscription();

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

  const isLocked = (url: string): boolean => {
    const feature = ROUTE_FEATURE_MAP[url];
    if (!feature) return false;
    return !hasFeature(feature);
  };

  const renderNavItem = (item: { title: string; url: string; icon: any }, isSubItem = false) => {
    const locked = isLocked(item.url);
    const feature = ROUTE_FEATURE_MAP[item.url];
    const minPlan = feature ? getMinPlan(feature) : "basico";

    if (locked) {
      return (
        <Tooltip key={item.url}>
          <TooltipTrigger asChild>
            <button
              onClick={() => navigate("/planos")}
              className={cn(
                "flex items-center gap-3 w-full rounded-lg text-sm font-medium transition-all duration-200 opacity-50",
                isSubItem ? "px-3 py-2 text-[13px]" : "px-3 py-2.5",
                "text-sidebar-foreground/50 hover:bg-sidebar-accent/30"
              )}
            >
              <item.icon className={cn("shrink-0", isSubItem ? "h-4 w-4" : "h-5 w-5")} />
              {!collapsed && (
                <>
                  <span className="flex-1 text-left">{item.title}</span>
                  <Lock className="h-3.5 w-3.5 text-sidebar-foreground/40" />
                </>
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p className="text-xs">Disponível no plano <span className="font-bold">{PLAN_LABELS[minPlan]}</span></p>
          </TooltipContent>
        </Tooltip>
      );
    }

    return (
      <NavLink
        key={item.url}
        to={item.url}
        end={item.url === "/"}
        className={isSubItem ? subLinkClass(item.url) : linkClass(item.url)}
        activeClassName=""
      >
        <item.icon className={cn("shrink-0", isSubItem ? "h-4 w-4" : "h-5 w-5")} />
        {!collapsed && <span>{item.title}</span>}
      </NavLink>
    );
  };

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
        {mainItems.map((item) => renderNavItem(item))}

        {/* Financeiro Section */}
        <div className="pt-4 pb-2">
          {!collapsed && (
            <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/40">
              Financeiro
            </p>
          )}
        </div>

        {collapsed ? (
          isLocked("/financeiro") ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <button onClick={() => navigate("/planos")} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium opacity-50 text-sidebar-foreground/50 hover:bg-sidebar-accent/30 w-full">
                  <Wallet className="h-5 w-5 shrink-0" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right"><p className="text-xs">Disponível no plano Essencial</p></TooltipContent>
            </Tooltip>
          ) : (
            <NavLink to="/financeiro" className={linkClass("/financeiro")} activeClassName="">
              <Wallet className="h-5 w-5 shrink-0" />
            </NavLink>
          )
        ) : (
          <>
            <button
              onClick={() => {
                if (isLocked("/financeiro")) { navigate("/planos"); return; }
                setFinanceiroOpen(!financeiroOpen);
              }}
              className={cn(
                "flex items-center justify-between w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                isLocked("/financeiro")
                  ? "opacity-50 text-sidebar-foreground/50 hover:bg-sidebar-accent/30"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              )}
            >
              <div className="flex items-center gap-3">
                <Wallet className="h-5 w-5 shrink-0" />
                <span>Financeiro</span>
              </div>
              {isLocked("/financeiro") ? (
                <Lock className="h-3.5 w-3.5 text-sidebar-foreground/40" />
              ) : (
                <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${financeiroOpen ? "rotate-180" : ""}`} />
              )}
            </button>
            {financeiroOpen && !isLocked("/financeiro") && (
              <div className="ml-3 pl-3 border-l border-sidebar-border/20 space-y-0.5">
                {financeiroItems.map((item) => renderNavItem(item, true))}
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

        {adminItems.map((item) => renderNavItem(item))}

        {/* Planos link */}
        <div className="pt-2">
          <NavLink
            to="/planos"
            className={linkClass("/planos")}
            activeClassName=""
          >
            <Crown className="h-5 w-5 shrink-0" />
            {!collapsed && <span>Planos</span>}
          </NavLink>
        </div>
      </nav>

      {/* Plan badge + collapse */}
      {!collapsed && (
        <div className="mx-3 mb-2 p-3 bg-primary/10 rounded-xl">
          <div className="flex items-center gap-2">
            <Crown className="h-4 w-4 text-primary" />
            <span className="text-xs font-bold text-primary">{PLAN_LABELS[currentPlan]}</span>
          </div>
          <button onClick={() => navigate("/planos")} className="text-[10px] text-primary/70 hover:text-primary mt-1">
            Fazer upgrade →
          </button>
        </div>
      )}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-center py-4 border-t border-sidebar-border/30 text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors"
      >
        {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
      </button>
    </aside>
  );
}
