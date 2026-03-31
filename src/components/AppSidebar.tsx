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
  Settings,
  Warehouse,
  ClipboardList,
  Upload,
  Radio,
  type LucideIcon,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useSubscription, ROUTE_FEATURE_MAP, PLAN_LABELS } from "@/hooks/useSubscription";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const mainItemsPrimary = [
  { title: "Início", url: "/", icon: Home },
  { title: "Clientes", url: "/clientes", icon: Users },
  { title: "Orçamentos", url: "/orcamentos", icon: FileText },
  { title: "Serviços", url: "/servicos", icon: CheckSquare },
  { title: "Redes Sociais", url: "/redes-sociais", icon: Radio },
];

// Sub-items removed as they are now navigated from the module's overview page

const mainItemsSecondary = [
  { title: "Plano de corte", url: "/plano-de-corte", icon: Scissors },
  { title: "Esquadrias", url: "/esquadrias", icon: Wrench },
  { title: "Config. Modelos", url: "/configuracao-modelos", icon: Settings },
  { title: "Agenda", url: "/agenda", icon: Calendar },
  { title: "Estoque", url: "/estoque", icon: Warehouse },
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

interface AppSidebarProps {
  isMobile?: boolean;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function AppSidebar({ isMobile, mobileOpen, onMobileClose }: AppSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  // No longer needed collapsible states for these modules
  const { hasFeature, getMinPlan, currentPlan } = useSubscription();

  const isActive = (path: string) =>
    path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);

  const linkClass = (path: string) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
      isActive(path)
        ? "bg-primary/10 text-primary font-semibold border-l-2 border-primary pl-[10px]"
        : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
    }`;

  const subLinkClass = (path: string) =>
    `flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-200 ${
      isActive(path)
        ? "bg-primary/10 text-primary font-semibold border-l-2 border-primary pl-[10px]"
        : "text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground"
    }`;

  const isLocked = (url: string): boolean => {
    const feature = ROUTE_FEATURE_MAP[url];
    if (!feature) return false;
    return !hasFeature(feature);
  };

  const handleNavigate = () => {
    if (isMobile && onMobileClose) {
      onMobileClose();
    }
  };

  const handleNavigateTo = (path: string) => {
    navigate(path);
    handleNavigate();
  };

  const renderNavItem = (item: { title: string; url: string; icon: LucideIcon }, isSubItem = false) => {
    const locked = isLocked(item.url);
    const feature = ROUTE_FEATURE_MAP[item.url];
    const minPlan = feature ? getMinPlan(feature) : "basico";

    if (locked) {
      return (
        <Tooltip key={item.url}>
          <TooltipTrigger asChild>
            <button
              onClick={() => handleNavigateTo("/planos")}
              className={cn(
                "flex items-center gap-3 w-full rounded-lg text-sm font-medium transition-all duration-200 opacity-40",
                isSubItem ? "px-3 py-2 text-[13px]" : "px-3 py-2.5",
                "text-sidebar-foreground/40 hover:bg-sidebar-accent/30"
              )}
            >
              <item.icon className={cn("shrink-0", isSubItem ? "h-4 w-4" : "h-[18px] w-[18px]")} />
              {!isSidebarCollapsed && (
                <>
                  <span className="flex-1 text-left">{item.title}</span>
                  <Lock className="h-3.5 w-3.5 text-sidebar-muted/60" />
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
        onClick={handleNavigate}
      >
        <item.icon className={cn("shrink-0", isSubItem ? "h-4 w-4" : "h-[18px] w-[18px]")} />
        {!isSidebarCollapsed && <span>{item.title}</span>}
      </NavLink>
    );
  };

  const isSidebarCollapsed = isMobile ? false : collapsed;
  const isMobileOpen = Boolean(mobileOpen);

  const sidebarClassName = isMobile
    ? `glass-sidebar fixed inset-y-0 left-0 z-40 flex h-[100dvh] flex-col transition-transform duration-300 ${
        isMobileOpen ? "translate-x-0" : "-translate-x-full"
      } w-[min(80vw,280px)] pb-safe overflow-y-auto -webkit-overflow-scrolling-touch`
    : `${isSidebarCollapsed ? "w-16" : "w-60"} glass-sidebar flex flex-col h-screen sticky top-0 transition-all duration-300 shrink-0`;

  return (
    <aside className={sidebarClassName} role="navigation" aria-label="Menu principal">
      {/* Logo */}
    <div className="flex items-center gap-3 px-4 py-5 border-b border-sidebar-border">
        <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
          <ShieldCheck className="h-5 w-5 text-primary" />
        </div>
        {!isSidebarCollapsed && (
          <div>
            <h1 className="text-base font-bold text-sidebar-foreground">Esquadria Al.</h1>
            <p className="text-[10px] text-sidebar-muted font-medium uppercase tracking-wider opacity-60">Sistema de Gestão</p>
          </div>
        )}
      </div>

      {/* Menu label */}
      {!isSidebarCollapsed && (
        <div className="px-5 pt-5 pb-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-sidebar-muted/60">
            Menu
          </p>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-1 space-y-0.5">
        {mainItemsPrimary.map((item) => renderNavItem(item))}

        {/* Pedidos Section */}
        {isLocked("/pedidos") ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => handleNavigateTo("/planos")}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium opacity-40 text-sidebar-foreground/40 hover:bg-sidebar-accent/30 w-full"
              >
                <ListChecks className="h-[18px] w-[18px] shrink-0" />
                {!isSidebarCollapsed && (
                  <>
                    <span className="flex-1 text-left">Pedidos</span>
                    <Lock className="h-3.5 w-3.5 text-sidebar-muted/60" />
                  </>
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p className="text-xs">Disponível no plano Essencial</p>
            </TooltipContent>
          </Tooltip>
        ) : (
          <NavLink to="/pedidos" className={linkClass("/pedidos")} activeClassName="" onClick={handleNavigate}>
            <ListChecks className="h-[18px] w-[18px] shrink-0" />
            {!isSidebarCollapsed && <span>Pedidos</span>}
          </NavLink>
        )}

        {mainItemsSecondary.map((item) => renderNavItem(item))}

        {/* Materiais - Single link */}
        <NavLink to="/materiais" className={linkClass("/materiais")} activeClassName="" onClick={handleNavigate}>
          <ClipboardList className="h-[18px] w-[18px] shrink-0" />
          {!isSidebarCollapsed && <span>Materiais</span>}
        </NavLink>

        {/* Financeiro - Single link, no sub-items */}
        <div className="pt-5 pb-2">
          {!isSidebarCollapsed && (
            <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-sidebar-muted/60">
              Financeiro
            </p>
          )}
        </div>

        {isLocked("/financeiro") ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <button onClick={() => handleNavigateTo("/planos")} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium opacity-40 text-sidebar-foreground/40 hover:bg-sidebar-accent/30 w-full">
                <Wallet className="h-[18px] w-[18px] shrink-0" />
                {!isSidebarCollapsed && (
                  <>
                    <span className="flex-1 text-left">Financeiro</span>
                    <Lock className="h-3.5 w-3.5 text-sidebar-muted/60" />
                  </>
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="right"><p className="text-xs">Disponível no plano Essencial</p></TooltipContent>
          </Tooltip>
        ) : (
          <NavLink to="/financeiro" className={linkClass("/financeiro")} activeClassName="" onClick={handleNavigate}>
            <Wallet className="h-[18px] w-[18px] shrink-0" />
            {!isSidebarCollapsed && <span>Financeiro</span>}
          </NavLink>
        )}

        {/* Gestão Section */}
        <div className="pt-5 pb-2">
          {!isSidebarCollapsed && (
            <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-sidebar-muted/60">
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
            onClick={handleNavigate}
          >
            <Crown className="h-[18px] w-[18px] shrink-0" />
            {!isSidebarCollapsed && <span>Planos</span>}
          </NavLink>
        </div>
      </nav>

      {/* Plan badge + collapse */}
      {!isSidebarCollapsed && (
        <div className="mx-3 mb-2 p-3 bg-accent rounded-xl border border-border">
          <div className="flex items-center gap-2">
            <Crown className="h-4 w-4 text-primary" />
            <span className="text-xs font-bold text-primary">{PLAN_LABELS[currentPlan]}</span>
          </div>
          <button onClick={() => handleNavigateTo("/planos")} className="text-[10px] text-primary/70 hover:text-primary mt-1">
            Fazer upgrade {"\u2192"}
          </button>
        </div>
      )}

      {!isMobile && (
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center py-4 border-t border-sidebar-border text-sidebar-muted hover:text-sidebar-foreground transition-colors"
          aria-label={collapsed ? "Expandir menu lateral" : "Recolher menu lateral"}
        >
          {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </button>
      )}
    </aside>
  );
}
