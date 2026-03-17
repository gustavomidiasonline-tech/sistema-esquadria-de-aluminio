import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CleanupCatalogButtonProps {
  onSuccess?: () => void;
}

export function CleanupCatalogButton({ onSuccess }: CleanupCatalogButtonProps) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  async function handleCleanup() {
    if (!profile?.company_id) {
      toast({
        title: 'Erro',
        description: 'Empresa não identificada',
        variant: 'destructive',
      });
      return;
    }

    if (!confirm('⚠️ Isso vai deletar TODOS os perfis e modelos da sua empresa. Tem certeza?')) {
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('cleanup_catalog', {
        p_company_id: profile.company_id,
      });

      if (error) {
        throw new Error(error.message);
      }

      const result = data as { perfis_deletados: number; modelos_deletados: number; success: boolean };

      toast({
        title: '✅ Limpeza concluída',
        description: `${result.perfis_deletados} perfis e ${result.modelos_deletados} modelos deletados.`,
      });

      onSuccess?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao limpar catálogo';
      toast({
        title: 'Erro na limpeza',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant="destructive"
      size="sm"
      onClick={handleCleanup}
      disabled={loading}
      className="gap-2"
    >
      <Trash2 className="h-4 w-4" />
      {loading ? 'Limpando...' : 'Limpar Catálogo'}
    </Button>
  );
}
