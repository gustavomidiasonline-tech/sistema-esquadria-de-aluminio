import { useMemo } from "react";
import { useSupabaseQuery } from "@/hooks/useSupabaseQuery";
import { isPast, parseISO, differenceInDays, format, addDays, isWithinInterval } from "date-fns";
import type { Database } from "@/integrations/supabase/types";

type PedidoRow = Database["public"]["Tables"]["pedidos"]["Row"];
type ContaPagarRow = Database["public"]["Tables"]["contas_pagar"]["Row"];
type ContaReceberRow = Database["public"]["Tables"]["contas_receber"]["Row"];
type ServicoRow = Database["public"]["Tables"]["servicos"]["Row"];

export type NotificationType = "pedido_atrasado" | "pedido_proximo" | "conta_vencida" | "conta_vencendo" | "servico_atrasado";
export type NotificationSeverity = "critical" | "warning" | "info";

export interface AppNotification {
  id: string;
  type: NotificationType;
  severity: NotificationSeverity;
  title: string;
  detail: string;
  route?: string;
  createdAt: Date;
}

const fmt = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

export function useNotifications() {
  const { data: pedidos = [] } = useSupabaseQuery("pedidos", {
    orderBy: { column: "created_at", ascending: false },
  });
  const { data: servicos = [] } = useSupabaseQuery("servicos");
  const { data: contasReceber = [] } = useSupabaseQuery("contas_receber");
  const { data: contasPagar = [] } = useSupabaseQuery("contas_pagar");

  const notifications = useMemo<AppNotification[]>(() => {
    const now = new Date();
    const items: AppNotification[] = [];

    // Pedidos atrasados
    pedidos.forEach((p: PedidoRow) => {
      if (!p.data_entrega || p.status === "entregue" || p.status === "cancelado") return;
      const entrega = parseISO(p.data_entrega);
      const dias = differenceInDays(now, entrega);
      if (dias > 0) {
        items.push({
          id: `ped-atr-${p.id}`, type: "pedido_atrasado", severity: "critical",
          title: `Pedido #${p.numero} atrasado ${dias}d`,
          detail: `Entrega prevista: ${format(entrega, "dd/MM/yyyy")}`,
          route: "/pedidos", createdAt: entrega,
        });
      }
    });

    // Pedidos próximos da entrega (3 dias)
    pedidos.forEach((p: PedidoRow) => {
      if (!p.data_entrega || p.status === "entregue" || p.status === "cancelado") return;
      const entrega = parseISO(p.data_entrega);
      const dias = differenceInDays(entrega, now);
      if (dias >= 0 && dias <= 3) {
        items.push({
          id: `ped-prox-${p.id}`, type: "pedido_proximo", severity: dias === 0 ? "warning" : "info",
          title: dias === 0 ? `Pedido #${p.numero} vence hoje` : `Pedido #${p.numero} em ${dias}d`,
          detail: `Entrega: ${format(entrega, "dd/MM/yyyy")}`,
          route: "/pedidos", createdAt: entrega,
        });
      }
    });

    // Contas vencidas (pagar + receber)
    const allContas = [
      ...contasPagar.map((c: ContaPagarRow) => ({ ...c, _tipo: "pagar" as const })),
      ...contasReceber.map((c: ContaReceberRow) => ({ ...c, _tipo: "receber" as const })),
    ];
    allContas.forEach((c) => {
      if (c.status !== "pendente" || !c.data_vencimento) return;
      const venc = parseISO(c.data_vencimento);
      const dias = differenceInDays(now, venc);
      if (dias > 0) {
        items.push({
          id: `cnt-venc-${c.id}`, type: "conta_vencida", severity: "critical",
          title: `Conta a ${c._tipo} vencida há ${dias}d`,
          detail: `${c.descricao} · ${fmt(Number(c.valor))}`,
          route: c._tipo === "pagar" ? "/financeiro/contas-pagar" : "/financeiro/contas-receber",
          createdAt: venc,
        });
      } else if (dias >= -5 && dias <= 0) {
        const restam = Math.abs(dias);
        items.push({
          id: `cnt-prox-${c.id}`, type: "conta_vencendo", severity: restam <= 1 ? "warning" : "info",
          title: restam === 0 ? `Conta a ${c._tipo} vence hoje` : `Conta a ${c._tipo} em ${restam}d`,
          detail: `${c.descricao} · ${fmt(Number(c.valor))}`,
          route: c._tipo === "pagar" ? "/financeiro/contas-pagar" : "/financeiro/contas-receber",
          createdAt: venc,
        });
      }
    });

    // Serviços atrasados
    servicos.forEach((s: ServicoRow) => {
      if (!s.data_agendada || s.status === "concluido" || s.status === "cancelado") return;
      const agendado = parseISO(s.data_agendada);
      const dias = differenceInDays(now, agendado);
      if (dias > 0) {
        items.push({
          id: `srv-atr-${s.id}`, type: "servico_atrasado", severity: "critical",
          title: `Serviço #${s.numero} atrasado ${dias}d`,
          detail: `Agendado: ${format(agendado, "dd/MM/yyyy")}${s.descricao ? ` · ${s.descricao}` : ""}`,
          route: "/servicos", createdAt: agendado,
        });
      }
    });

    // Sort: critical first, then by date
    items.sort((a, b) => {
      const sev = { critical: 0, warning: 1, info: 2 };
      if (sev[a.severity] !== sev[b.severity]) return sev[a.severity] - sev[b.severity];
      return b.createdAt.getTime() - a.createdAt.getTime();
    });

    return items;
  }, [pedidos, servicos, contasReceber, contasPagar]);

  const criticalCount = notifications.filter(n => n.severity === "critical").length;
  const warningCount = notifications.filter(n => n.severity === "warning").length;
  const totalCount = notifications.length;

  return { notifications, criticalCount, warningCount, totalCount };
}
