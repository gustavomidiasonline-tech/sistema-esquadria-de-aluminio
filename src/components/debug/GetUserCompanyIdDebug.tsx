import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';

export function GetUserCompanyIdDebug() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function testGetUserCompanyId() {
    setLoading(true);
    try {
      // Chamar a função SQL diretamente
      const { data, error } = await supabase.rpc('get_user_company_id');
      console.log('🔍 get_user_company_id() result:', { data, error });
      setResult({ data, error });
    } catch (err) {
      console.error('❌ Erro ao chamar get_user_company_id:', err);
      setResult({ error: err });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4 border border-blue-500 bg-blue-50 rounded-lg space-y-2 mb-4">
      <h3 className="font-bold text-sm">🔍 Debug get_user_company_id()</h3>
      <Button onClick={testGetUserCompanyId} disabled={loading} size="sm">
        {loading ? 'Testando...' : 'Teste Função SQL'}
      </Button>
      {result && (
        <div className="text-xs bg-white p-2 rounded border border-gray-200">
          <div>
            <strong>Retorno:</strong>
            <pre className="text-blue-600 overflow-auto">{JSON.stringify(result, null, 2)}</pre>
          </div>
        </div>
      )}
    </div>
  );
}
