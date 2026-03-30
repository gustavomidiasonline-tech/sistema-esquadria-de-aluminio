import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

export type PlanType = "basico" | "essencial" | "avancado";

export type FeatureKey =
  // Básico
  | "orcamentos"
  | "visualizacao_3d"
  | "servicos"
  | "pagamentos_recibos"
  | "clientes"
  | "contratos"
  | "lista_materiais"
  | "tipologias"
  | "produtos"
  | "precos"
  | "pedidos"
  // Essencial
  | "projeto_vidro"
  | "financeiro"
  | "agenda"
  | "relatorios"
  | "metas_vendas"
  | "ranking_vendedores"
  | "acesso_funcionarios"
  | "avaliacao_obras"
  | "fornecedores"
  // Avançado
  | "plano_corte"
  | "otimizacao_perfis"
  | "acompanhamento_obra"
  | "etiqueta_cortes"
  | "etiqueta_produtos"
  | "checklist_producao"
  | "ordem_servico"
  | "mapa"
  | "esquadrias";

const PLAN_FEATURES: Record<PlanType, FeatureKey[]> = {
  basico: [
    "orcamentos",
    "visualizacao_3d",
    "servicos",
    "pagamentos_recibos",
    "clientes",
    "contratos",
    "lista_materiais",
    "tipologias",
    "produtos",
    "precos",
    "pedidos",
  ],
  essencial: [
    // Inclui tudo do básico +
    "orcamentos", "visualizacao_3d", "servicos", "pagamentos_recibos",
    "clientes", "contratos", "lista_materiais", "tipologias", "produtos", "precos", "pedidos",
    // Essencial extras
    "projeto_vidro",
    "financeiro",
    "agenda",
    "relatorios",
    "metas_vendas",
    "ranking_vendedores",
    "acesso_funcionarios",
    "avaliacao_obras",
    "fornecedores",
  ],
  avancado: [
    // Inclui tudo do essencial +
    "orcamentos", "visualizacao_3d", "servicos", "pagamentos_recibos",
    "clientes", "contratos", "lista_materiais", "tipologias", "produtos", "precos", "pedidos",
    "projeto_vidro", "financeiro", "agenda", "relatorios", "metas_vendas",
    "ranking_vendedores", "acesso_funcionarios", "avaliacao_obras", "fornecedores",
    // Avançado extras
    "plano_corte",
    "otimizacao_perfis",
    "acompanhamento_obra",
    "etiqueta_cortes",
    "etiqueta_produtos",
    "checklist_producao",
    "ordem_servico",
    "mapa",
    "esquadrias",
  ],
};

// Map routes to features
export const ROUTE_FEATURE_MAP: Record<string, FeatureKey> = {
  "/clientes": "clientes",
  "/orcamentos": "orcamentos",
  "/servicos": "servicos",
  "/pedidos": "pedidos",
  "/produtos": "produtos",
  "/precos": "precos",
  "/plano-de-corte": "plano_corte",
  "/esquadrias": "esquadrias",
  "/agenda": "agenda",
  "/relatorios": "relatorios",
  "/mapa": "mapa",
  "/fornecedores": "fornecedores",
  "/financeiro": "financeiro",
  "/financeiro/contas-receber": "financeiro",
  "/financeiro/contas-pagar": "financeiro",
  "/financeiro/pagamentos": "financeiro",
  "/financeiro/notas-fiscais": "financeiro",
  "/financeiro/emissao-nf": "financeiro",
  "/financeiro/contratos": "contratos",
  "/financeiro/documentos": "financeiro",
  "/financeiro/fluxo-caixa": "financeiro",
};

export const PLAN_LABELS: Record<PlanType, string> = {
  basico: "Básico",
  essencial: "Essencial",
  avancado: "Avançado",
};

export const FEATURE_MIN_PLAN = {} as Record<FeatureKey, PlanType>;
// Build minimum plan for each feature
(["basico", "essencial", "avancado"] as PlanType[]).forEach((plan) => {
  PLAN_FEATURES[plan].forEach((feature) => {
    if (!FEATURE_MIN_PLAN[feature]) {
      FEATURE_MIN_PLAN[feature] = plan;
    }
  });
});

export function useSubscription() {
  const { user, profile } = useAuth();

  const { data: subscription, isLoading } = useQuery({
    queryKey: ["user_subscription", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("user_subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .single();
      if (error) return null;
      return data;
    },
    enabled: !!user,
  });

  // Super Admin: se o usuário tem cargo super_admin, libera plano avançado
  const hasSuperAdmin = useMemo(() => {
    return profile?.cargo === 'super_admin';
  }, [profile?.cargo]);

  const currentPlan: PlanType = hasSuperAdmin
    ? "avancado"
    : (subscription as { plan?: PlanType } | null)?.plan || "basico";

  const hasFeature = useMemo(() => {
    return (feature: FeatureKey): boolean => {
      return PLAN_FEATURES[currentPlan]?.includes(feature) ?? false;
    };
  }, [currentPlan]);

  const getMinPlan = (feature: FeatureKey): PlanType => {
    return FEATURE_MIN_PLAN[feature] || "basico";
  };

  return {
    currentPlan,
    isLoading,
    hasFeature,
    getMinPlan,
    subscription,
    planLabel: PLAN_LABELS[currentPlan],
  };
}
