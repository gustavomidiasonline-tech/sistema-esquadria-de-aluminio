import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BackButtonProps {
  to?: string;
}

export function BackButton({ to }: BackButtonProps) {
  const navigate = useNavigate();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => (to ? navigate(to) : navigate(-1))}
      className="h-9 w-9 rounded-full hover:bg-muted transition-all duration-200"
      title="Voltar"
    >
      <ArrowLeft className="h-5 w-5 text-foreground" />
    </Button>
  );
}
