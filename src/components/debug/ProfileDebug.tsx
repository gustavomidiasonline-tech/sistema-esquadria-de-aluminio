import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

export function ProfileDebug() {
  const { profile } = useAuth();
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function checkProfileInDB() {
    setLoading(true);
    try {
      if (!profile?.user_id) {
        console.error('❌ Nenhum user_id no profile');
        return;
      }

      // Consultar profiles diretamente
      const { data, error } = await supabase
        .from('profiles')
        .select('id, user_id, company_id, nome, email')
        .eq('user_id', profile.user_id)
        .single();

      console.log('📋 Profile no banco:', { data, error });
      setResult({ data, error });
    } catch (err) {
      console.error('❌ Erro:', err);
      setResult({ error: err });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4 border border-purple-500 bg-purple-50 rounded-lg space-y-2 mb-4">
      <h3 className="font-bold text-sm">📋 Debug Profile no Banco</h3>
      <div className="text-xs">
        <div>👤 user_id do contexto: <code className="bg-white p-1 rounded">{profile?.user_id?.slice(0, 8)}...</code></div>
        <div>🏢 company_id do contexto: <code className="bg-white p-1 rounded">{profile?.company_id?.slice(0, 8)}...</code></div>
      </div>
      <Button onClick={checkProfileInDB} disabled={loading} size="sm">
        {loading ? 'Consultando...' : 'Verificar Profile no Banco'}
      </Button>
      {result && (
        <div className="text-xs bg-white p-2 rounded border border-gray-200">
          {result.error ? (
            <div className="text-red-600">❌ Erro: {JSON.stringify(result.error)}</div>
          ) : (
            <div className="text-green-600">
              ✅ Profile encontrado:
              <pre className="overflow-auto">{JSON.stringify(result.data, null, 2)}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
