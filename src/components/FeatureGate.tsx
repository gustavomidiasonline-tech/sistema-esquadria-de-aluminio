import { useSubscription, type FeatureKey, PLAN_LABELS } from "@/hooks/useSubscription";
import { Lock, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface FeatureGateProps {
  feature: FeatureKey;
  children: React.ReactNode;
}

export function FeatureGate({ feature, children }: FeatureGateProps) {
  const { hasFeature, getMinPlan } = useSubscription();
  const navigate = useNavigate();

  if (hasFeature(feature)) {
    return <>{children}</>;
  }

  const minPlan = getMinPlan(feature);

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-4">
      <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
        <Lock className="h-8 w-8 text-primary" />
      </div>
      <h2 className="text-xl font-bold text-foreground">Funcionalidade bloqueada</h2>
      <p className="text-muted-foreground text-sm max-w-md">
        Esta funcionalidade está disponível a partir do plano{" "}
        <span className="font-bold text-primary">{PLAN_LABELS[minPlan]}</span>.
        Faça upgrade para desbloquear.
      </p>
      <Button onClick={() => navigate("/planos")} className="gap-2">
        <Crown className="h-4 w-4" /> Ver planos
      </Button>
    </div>
  );
}
