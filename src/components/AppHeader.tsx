import { Bell, Search, User, LogOut, AlertTriangle, Clock, CreditCard, Wrench, Package, ChevronRight, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useNotifications, type AppNotification } from "@/hooks/useNotifications";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";

const severityStyles = {
  critical: "bg-destructive/10 border-destructive/20 text-destructive",
  warning: "bg-amber-500/10 border-amber-500/20 text-amber-600",
  info: "bg-primary/10 border-primary/20 text-primary",
};

const severityDot = {
  critical: "bg-destructive",
  warning: "bg-amber-500",
  info: "bg-primary",
};

const typeIcon = {
  pedido_atrasado: Package,
  pedido_proximo: Clock,
  conta_vencida: CreditCard,
  conta_vencendo: CreditCard,
  servico_atrasado: Wrench,
};

function NotificationItem({ notification, onClick }: { notification: AppNotification; onClick: () => void }) {
  const Icon = typeIcon[notification.type];
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-start gap-3 p-3 rounded-lg border text-left transition-colors hover:opacity-80",
        severityStyles[notification.severity]
      )}
    >
      <div className={cn("mt-0.5 h-7 w-7 rounded-md flex items-center justify-center shrink-0", severityDot[notification.severity] + "/20")}>
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold leading-tight">{notification.title}</p>
        <p className="text-[10px] opacity-75 mt-0.5 truncate">{notification.detail}</p>
      </div>
      <ChevronRight className="h-3.5 w-3.5 mt-1 shrink-0 opacity-50" />
    </button>
  );
}

interface AppHeaderProps {
  onToggleSidebar?: () => void;
  isMobile?: boolean;
}

export function AppHeader({ onToggleSidebar, isMobile }: AppHeaderProps) {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const { notifications, criticalCount, totalCount } = useNotifications();

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const badgeCount = totalCount > 99 ? "99+" : totalCount;

  return (
    <header className="h-14 sm:h-16 glass-header flex items-center justify-between px-3 sm:px-6 shrink-0">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {isMobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleSidebar}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Abrir menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}
        <div className="relative min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar..."
            className="glass-input-field pl-10 pr-4 py-2 text-xs sm:text-sm w-36 sm:w-64 max-w-[55vw]"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Notifications */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
              <Bell className="h-5 w-5" />
              {totalCount > 0 && (
                <span className={cn(
                  "absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 text-[10px] font-bold rounded-full flex items-center justify-center",
                  criticalCount > 0
                    ? "bg-destructive text-destructive-foreground"
                    : "bg-amber-500 text-white"
                )}>
                  {badgeCount}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-[90vw] max-w-sm sm:w-96 p-0">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <h3 className="text-sm font-bold text-foreground">Notificações</h3>
              </div>
              {totalCount > 0 && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                  {totalCount} {totalCount === 1 ? "alerta" : "alertas"}
                </span>
              )}
            </div>

            <ScrollArea className="max-h-[400px]">
              {notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Nenhum alerta no momento</p>
                  <p className="text-[10px] text-muted-foreground/60 mt-1">Tudo em dia! 🎉</p>
                </div>
              ) : (
                <div className="p-3 space-y-2">
                  {/* Critical section */}
                  {criticalCount > 0 && (
                    <>
                      <p className="text-[10px] font-bold text-destructive uppercase tracking-wide px-1">
                        Urgente ({criticalCount})
                      </p>
                      {notifications.filter(n => n.severity === "critical").map(n => (
                        <NotificationItem key={n.id} notification={n} onClick={() => n.route && navigate(n.route)} />
                      ))}
                    </>
                  )}

                  {/* Warning/Info section */}
                  {notifications.some(n => n.severity !== "critical") && (
                    <>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide px-1 mt-2">
                        Atenção
                      </p>
                      {notifications.filter(n => n.severity !== "critical").map(n => (
                        <NotificationItem key={n.id} notification={n} onClick={() => n.route && navigate(n.route)} />
                      ))}
                    </>
                  )}
                </div>
              )}
            </ScrollArea>

            {/* Summary footer */}
            {totalCount > 0 && (
              <div className="border-t border-border px-4 py-2.5 flex items-center gap-3 text-[10px] text-muted-foreground">
                {criticalCount > 0 && <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-destructive" />{criticalCount} urgentes</span>}
                {notifications.filter(n => n.severity === "warning").length > 0 && (
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-500" />{notifications.filter(n => n.severity === "warning").length} atenção</span>
                )}
                {notifications.filter(n => n.severity === "info").length > 0 && (
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-primary" />{notifications.filter(n => n.severity === "info").length} info</span>
                )}
              </div>
            )}
          </PopoverContent>
        </Popover>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-3 pl-3 border-l border-border cursor-pointer hover:opacity-80 transition-opacity">
              <div className="h-9 w-9 rounded-full bg-primary flex items-center justify-center">
                <User className="h-4 w-4 text-primary-foreground" />
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-semibold text-foreground">
                  {profile?.nome || "Usuário"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {profile?.cargo || "Funcionário"}
                </p>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleSignOut} className="text-destructive cursor-pointer">
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
