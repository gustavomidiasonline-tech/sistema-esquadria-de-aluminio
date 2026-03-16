import { AppLayout } from "@/components/AppLayout";
import { Check, Crown, Star, Zap } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSubscription, type PlanType, PLAN_LABELS } from "@/hooks/useSubscription";
import { cn } from "@/lib/utils";

const plans: {
  id: PlanType;
  price: string;
  priceNum: number;
  icon: LucideIcon;
  recommended?: boolean;
  features: string[];
  cumulative?: string;
}[] = [
  {
    id: "basico",
    price: "94,99",
    priceNum: 94.99,
    icon: Zap,
    features: [
      "Cadastro de orçamentos",
      "Visualização em 3D",
      "Controle de serviços em andamento",
      "Pagamentos e recibos",
      "Cadastro de clientes",
      "Emissão de contrato",
      "Lista de materiais",
      "+3440 tipologias disponíveis (bônus)",
    ],
  },
  {
    id: "essencial",
    price: "149,99",
    priceNum: 149.99,
    icon: Star,
    recommended: true,
    cumulative: "Tudo do plano Básico e mais:",
    features: [
      "Projeto de vidro",
      "Financeiro (Fluxo de Caixa)",
      "Agenda",
      "Relatórios gerais",
      "Cadastro de meta de vendas",
      "Ranking dos vendedores",
      "Acesso ilimitado para funcionários",
      "Link para avaliação das obras",
    ],
  },
  {
    id: "avancado",
    price: "249,99",
    priceNum: 249.99,
    icon: Crown,
    cumulative: "Tudo do plano Básico, Essencial e mais:",
    features: [
      "Plano de corte das esquadrias",
      "Otimização dos perfis de alumínio",
      "Compartilhamento da obra ao vivo",
      "Etiqueta de cortes",
      "Etiqueta de produtos",
      "Checklist de produção",
      "Ordem de serviço",
    ],
  },
];

const Planos = () => {
  const { currentPlan } = useSubscription();

  return (
    <AppLayout>
      <div className="space-y-8 max-w-6xl mx-auto">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground">Escolha seu plano</h1>
          <p className="text-muted-foreground mt-2">Selecione o plano ideal para sua empresa de esquadrias</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const isCurrentPlan = currentPlan === plan.id;
            const Icon = plan.icon;
            return (
              <div
                key={plan.id}
                className={cn(
                  "relative bg-card border rounded-2xl p-6 flex flex-col transition-all duration-300",
                  plan.recommended
                    ? "border-primary shadow-lg shadow-primary/10 scale-[1.02]"
                    : "border-border hover:border-primary/40",
                  isCurrentPlan && "ring-2 ring-primary"
                )}
              >
                {plan.recommended && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider px-4 py-1 rounded-full">
                      Mais indicado
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-3 mb-4">
                  <div className={cn(
                    "h-10 w-10 rounded-xl flex items-center justify-center",
                    plan.recommended ? "bg-primary/10" : "bg-muted"
                  )}>
                    <Icon className={cn("h-5 w-5", plan.recommended ? "text-primary" : "text-muted-foreground")} />
                  </div>
                  <h2 className="text-xl font-bold text-foreground uppercase">{PLAN_LABELS[plan.id]}</h2>
                </div>

                {plan.cumulative && (
                  <p className="text-xs font-semibold text-foreground mb-3">{plan.cumulative}</p>
                )}

                <ul className="space-y-2.5 flex-1">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5 text-sm">
                      <Check className={cn("h-4 w-4 mt-0.5 shrink-0", plan.recommended ? "text-primary" : "text-emerald-500")} />
                      <span className="text-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-6 pt-6 border-t border-border">
                  <div className="flex items-baseline gap-1 mb-4">
                    <span className="text-sm text-muted-foreground">R$</span>
                    <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                    <span className="text-sm text-muted-foreground">/mês</span>
                  </div>

                  <Button
                    className={cn(
                      "w-full font-bold",
                      isCurrentPlan && "opacity-60 cursor-default"
                    )}
                    variant={plan.recommended ? "default" : "outline"}
                    disabled={isCurrentPlan}
                  >
                    {isCurrentPlan ? "Plano atual" : "Escolher este plano"}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-center text-xs text-muted-foreground">
          <p>* Os planos são cumulativos. O plano Avançado inclui todas as funcionalidades dos planos anteriores.</p>
          <p className="mt-1">Entre em contato para ativar ou alterar seu plano.</p>
        </div>
      </div>
    </AppLayout>
  );
};

export default Planos;
