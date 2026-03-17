import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function CatalogDebug() {
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function debugCheck() {
    setLoading(true);
    try {
      // 1. Verificar perfis_catalogo sem filtro
      const { data: allPerfis, error: perfisError } = await supabase
        .from('perfis_catalogo')
        .select('id, codigo, nome, company_id, tipo')
        .limit(5);

      // 2. Verificar window_models sem filtro
      const { data: allModelos, error: modelosError } = await supabase
        .from('window_models')
        .select('id, codigo, nome, company_id, tipo')
        .limit(5);

      // 3. Verificar com RLS (como faz o app)
      const { data: rls_perfis, error: rls_error } = await supabase
        .from('perfis_catalogo')
        .select('id, codigo, nome, company_id')
        .order('codigo')
        .limit(5);

      setResults({
        allPerfis: { data: allPerfis, error: perfisError },
        allModelos: { data: allModelos, error: modelosError },
        rls_perfis: { data: rls_perfis, error: rls_error },
      });
    } catch (err) {
      setResults({ error: err });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4 border border-yellow-500 bg-yellow-50 rounded-lg space-y-3">
      <h3 className="font-bold text-sm">🔍 Debug Catálogo</h3>
      <Button onClick={debugCheck} disabled={loading} size="sm">
        {loading ? 'Verificando...' : 'Verificar Dados'}
      </Button>

      {results && (
        <div className="space-y-2 text-xs bg-white p-2 rounded border border-gray-200 max-h-96 overflow-auto">
          <div>
            <strong>Perfis (sem filtro):</strong>
            {results.allPerfis?.error ? (
              <Badge variant="destructive">{results.allPerfis.error.message}</Badge>
            ) : (
              <div className="ml-2">
                {results.allPerfis?.data?.length === 0 ? (
                  <span className="text-red-600">❌ ZERO perfis no banco!</span>
                ) : (
                  <>
                    <span className="text-green-600">✓ {results.allPerfis?.data?.length} encontrados</span>
                    {results.allPerfis?.data?.map((p: any) => (
                      <div key={p.id} className="ml-2 text-gray-600">
                        {p.codigo} | {p.nome} | company_id: {p.company_id ? '✓' : 'NULL'}
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>

          <div>
            <strong>Modelos (sem filtro):</strong>
            {results.allModelos?.error ? (
              <Badge variant="destructive">{results.allModelos.error.message}</Badge>
            ) : (
              <div className="ml-2">
                {results.allModelos?.data?.length === 0 ? (
                  <span className="text-red-600">❌ ZERO modelos no banco!</span>
                ) : (
                  <>
                    <span className="text-green-600">✓ {results.allModelos?.data?.length} encontrados</span>
                    {results.allModelos?.data?.map((m: any) => (
                      <div key={m.id} className="ml-2 text-gray-600">
                        {m.codigo} | {m.nome} | company_id: {m.company_id ? '✓' : 'NULL'}
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>

          <div>
            <strong>Perfis com RLS (como app usa):</strong>
            {results.rls_perfis?.error ? (
              <Badge variant="destructive">{results.rls_perfis.error.message}</Badge>
            ) : (
              <div className="ml-2">
                {results.rls_perfis?.data?.length === 0 ? (
                  <span className="text-red-600">❌ RLS bloqueando dados!</span>
                ) : (
                  <>
                    <span className="text-green-600">✓ RLS retorna {results.rls_perfis?.data?.length}</span>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
