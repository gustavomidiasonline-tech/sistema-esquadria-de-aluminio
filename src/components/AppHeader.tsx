import { Bell, Search, User } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AppHeader() {
  return (
    <header className="h-16 glass-header flex items-center justify-between px-6 shrink-0">
      <div className="flex items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar..."
            className="pl-10 pr-4 py-2 text-sm bg-muted rounded-lg border-none outline-none focus:ring-2 focus:ring-primary/30 w-64 text-foreground placeholder:text-muted-foreground"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
          <Bell className="h-5 w-5" />
          <span className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
            3
          </span>
        </Button>

        <div className="flex items-center gap-3 pl-3 border-l border-border">
          <div className="h-9 w-9 rounded-full bg-primary flex items-center justify-center">
            <User className="h-4 w-4 text-primary-foreground" />
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-semibold text-foreground">Gabriel Silva</p>
            <p className="text-xs text-muted-foreground">Administrador</p>
          </div>
        </div>
      </div>
    </header>
  );
}
