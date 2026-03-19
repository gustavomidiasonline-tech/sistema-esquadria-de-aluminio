/**
 * CatalogAuditService — Auditoria de importações de catálogo
 * Registra todas as importações para rastreabilidade e debugging
 */

import { supabase } from '@/integrations/supabase/client';

export interface CatalogImportAudit {
  company_id: string;
  file_name: string;
  fabricante: string;
  perfis_importados: number;
  modelos_importados: number;
  perfis_sincronizados: number;
  status: 'sucesso' | 'falha' | 'parcial';
  error_message?: string;
  duration_ms: number;
}

export const CatalogAuditService = {
  /**
   * Registra uma importação de catálogo após conclusão
   * Chamado após sucesso ou falha da importação
   */
  async logImport(
    companyId: string,
    userId: string | undefined,
    audit: CatalogImportAudit
  ): Promise<string | null> {
    try {
      const { data, error } = await supabase.rpc('log_catalog_import', {
        p_company_id: companyId,
        p_user_id: userId || null,
        p_file_name: audit.file_name,
        p_fabricante: audit.fabricante,
        p_perfis_importados: audit.perfis_importados,
        p_modelos_importados: audit.modelos_importados,
        p_perfis_sincronizados: audit.perfis_sincronizados,
        p_status: audit.status,
        p_error_message: audit.error_message || null,
        p_duration_ms: audit.duration_ms,
      });

      if (error) {
        console.warn('❌ Erro ao registrar import na auditoria:', error.message);
        return null;
      }

      console.log('✅ Import registrado na auditoria:', data);
      return data as string;
    } catch (err) {
      console.error('❌ Erro ao chamar log_catalog_import:', err);
      return null;
    }
  },

  /**
   * Busca histórico de imports de uma empresa
   */
  async getImportHistory(companyId: string, limit: number = 50) {
    try {
      const { data, error } = await supabase
        .from('catalog_imports')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw new Error(`Erro ao buscar histórico: ${error.message}`);
      }

      return data || [];
    } catch (err) {
      console.error('❌ Erro ao buscar histórico de imports:', err);
      return [];
    }
  },

  /**
   * Busca estatísticas de imports
   */
  async getImportStats(companyId: string) {
    try {
      const { data, error } = await supabase
        .from('catalog_imports')
        .select('status, COUNT(*) as count, SUM(perfis_importados) as total_perfis')
        .eq('company_id', companyId)
        .group_by('status');

      if (error) {
        throw new Error(`Erro ao buscar estatísticas: ${error.message}`);
      }

      return {
        total: data?.reduce((sum, row: any) => sum + (row.count || 0), 0) || 0,
        byStatus: data?.reduce(
          (acc: any, row: any) => {
            acc[row.status] = row.count || 0;
            return acc;
          },
          {} as Record<string, number>
        ) || {},
        totalPerfisImportados:
          data?.reduce((sum: number, row: any) => sum + (row.total_perfis || 0), 0) || 0,
      };
    } catch (err) {
      console.error('❌ Erro ao buscar estatísticas:', err);
      return null;
    }
  },
};
