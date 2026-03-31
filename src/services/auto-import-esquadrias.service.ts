/**
 * Serviço de importação automática de modelos de esquadrias
 * Sincroniza perfis do catálogo com modelos de esquadrias
 * 100% automatizado - sem processos manuais
 */

import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type Product = Database['public']['Tables']['mt_products']['Row'];
type CutRule = Database['public']['Tables']['cut_rules']['Row'];
type PerfilCatalogo = Database['public']['Tables']['perfis_catalogo']['Row'];

export interface AutoImportConfig {
  modeloNome: string;
  modeloDescricao?: string;
  componentes: {
    perfilCodigo: string; // Ex: "AL-001"
    formula: string;      // Ex: "L - 40" ou "H / 2 + 10"
    quantidade?: number;  // Default: 1
    posicao?: string;     // Ex: "vertical", "horizontal"
  }[];
}

export class AutoImportEsquadriasService {
  /**
   * Cria um modelo completo com todas as regras de corte automaticamente
   * @param config Configuração do modelo
   * @returns ID do modelo criado
   */
  static async criarModeloCompleto(config: AutoImportConfig): Promise<string> {
    try {
      // 1. Get user company
      const user = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('user_id', user.data.user?.id || '')
        .single();

      if (!profile?.company_id) {
        throw new Error('Company not found. Check your profile.');
      }

      // 2. Create product/modelo
      const { data: newProduct, error: productError } = await supabase
        .from('mt_products')
        .insert({
          company_id: profile.company_id,
          name: config.modeloNome,
          description: config.modeloDescricao || null,
          image_url: null,
        })
        .select()
        .single();

      if (productError) {
        throw new Error(`Erro ao criar modelo: ${productError.message}`);
      }

      // 3. For each componente, create a cut_rule
      const rulesPromises = config.componentes.map(async (comp) => {
        // Find profile by codigo
        const { data: profiles } = await supabase
          .from('perfis_catalogo')
          .select('id')
          .eq('codigo', comp.perfilCodigo)
          .single();

        if (!profiles?.id) {
          console.warn(`⚠️  Perfil ${comp.perfilCodigo} não encontrado. Pulando...`);
          return null;
        }

        // Insert cut rule
        const { error: ruleError } = await supabase
          .from('cut_rules')
          .insert({
            product_id: newProduct.id,
            profile_id: profiles.id,
            perfil_id: profiles.id, // For consistency
            formula: comp.formula,
            quantity: comp.quantidade || 1,
            angle: '90°',
            axis: comp.posicao || 'L', // L = Largura (Width), H = Altura (Height)
          });

        if (ruleError) {
          console.error(`Erro ao criar regra para ${comp.perfilCodigo}:`, ruleError);
          return null;
        }

        return true;
      });

      await Promise.all(rulesPromises);

      return newProduct.id;
    } catch (error) {
      console.error('Erro em criarModeloCompleto:', error);
      throw error;
    }
  }

  /**
   * Importa múltiplos modelos de uma vez (para planilhas)
   * @param modelos Array de configurações
   * @returns Resultado da importação
   */
  static async importarMultiplos(modelos: AutoImportConfig[]) {
    const resultados = {
      sucesso: 0,
      erros: [] as { modelo: string; erro: string }[],
      ids: [] as string[],
    };

    for (const modelo of modelos) {
      try {
        const id = await this.criarModeloCompleto(modelo);
        resultados.sucesso++;
        resultados.ids.push(id);
      } catch (error) {
        resultados.erros.push({
          modelo: modelo.modeloNome,
          erro: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return resultados;
  }

  /**
   * Sincroniza modelos_esquadria (ConfiguradorTab) com mt_products (ConfiguracaoModelos)
   * Ambas as páginas funcionam juntas
   */
  static async sincronizarEstruturasEsquadrias() {
    try {
      // 1. Get all modelos_esquadria
      const { data: modelosEsquadria } = await supabase
        .from('modelos_esquadria')
        .select('*');

      if (!modelosEsquadria || modelosEsquadria.length === 0) {
        return { sincronizados: 0, message: 'Nenhum modelo de esquadria encontrado' };
      }

      // 2. For each modelo_esquadria, check if it exists in mt_products
      let sincronizados = 0;

      for (const modelo of modelosEsquadria) {
        const { data: existingProduct } = await supabase
          .from('mt_products')
          .select('id')
          .eq('name', modelo.nome)
          .single();

        if (existingProduct) {
          // Already exists, skip
          continue;
        }

        // 3. Create corresponding mt_product
        const user = await supabase.auth.getUser();
        const { data: profile } = await supabase
          .from('profiles')
          .select('company_id')
          .eq('user_id', user.data.user?.id || '')
          .single();

        if (!profile?.company_id) continue;

        const { data: newProduct } = await supabase
          .from('mt_products')
          .insert({
            company_id: profile.company_id,
            name: modelo.nome,
            description: `${modelo.categoria} - ${modelo.tipo}`,
            image_url: null,
          })
          .select()
          .single();

        if (!newProduct) continue;

        // 4. Get componentes from componentes_modelo and create cut_rules
        const { data: componentes } = await supabase
          .from('componentes_modelo')
          .select('*, perfis_catalogo(id)')
          .eq('esquadria_id', modelo.id);

        if (componentes) {
          for (const comp of componentes) {
            if (!comp.perfis_catalogo?.id) continue;

            await supabase.from('cut_rules').insert({
              product_id: newProduct.id,
              profile_id: comp.perfis_catalogo.id,
              perfil_id: comp.perfis_catalogo.id,
              formula: comp.formula_calculo || 'L',
              quantity: comp.quantidade || 1,
              angle: '90°',
              axis: comp.posicao || 'L',
            });
          }
        }

        sincronizados++;
      }

      return { sincronizados, message: `${sincronizados} modelos sincronizados com sucesso` };
    } catch (error) {
      console.error('Erro ao sincronizar estruturas:', error);
      throw error;
    }
  }
}
