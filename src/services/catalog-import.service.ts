/**
 * CatalogImportService — Importação de catálogos de fabricantes via IA
 * Pipeline: PDF/texto → extração LLM → validação → salva no banco
 *
 * Fabricantes suportados: Hydro, Alumasa, Aliança, e outros.
 * O serviço usa a API Claude para extrair perfis e modelos estruturados.
 */

import { supabase } from '@/integrations/supabase/client';
import { eventBus } from '@/services/eventBus';

export interface PerfilExtraido {
  codigo: string;
  nome: string;
  peso_kg_m: number;
  largura_mm: number;
  espessura_mm: number;
  liga?: string;              // ex: 6063-T5
  acabamento?: string;        // natural, anodizado, pintado
  categoria?: string;         // marco, folha, complemento
}

export interface ModeloExtraido {
  codigo: string;
  nome: string;
  tipo: string;               // correr, fixo, maxim-ar, etc.
  serie?: string;
  descricao?: string;
  perfis_utilizados?: string[];  // codigos de perfis
}

export interface CatalogExtractedData {
  fabricante: string;
  perfis: PerfilExtraido[];
  modelos: ModeloExtraido[];
  confianca: number;          // 0-1
  avisos: string[];
}

export interface ImportJob {
  id: string;
  company_id: string;
  nome_arquivo: string;
  status: 'pendente' | 'processando' | 'concluido' | 'erro';
  total_perfis: number;
  total_modelos: number;
  erro?: string;
  created_at: string;
}

const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const CLAUDE_MODEL = 'claude-haiku-4-5-20251001';  // Haiku — rápido e barato para extração

const EXTRACTION_PROMPT = `Você é um especialista em análise de catálogos técnicos de perfis de alumínio para esquadrias.

Analise o texto abaixo e extraia TODAS as informações sobre perfis e modelos de janelas/portas.

Retorne SOMENTE um JSON válido com esta estrutura:
{
  "fabricante": "nome do fabricante",
  "perfis": [
    {
      "codigo": "código único do perfil",
      "nome": "nome descritivo",
      "peso_kg_m": 0.0,
      "largura_mm": 0.0,
      "espessura_mm": 0.0,
      "liga": "6063-T5",
      "acabamento": "natural|anodizado|pintado",
      "categoria": "marco|folha|complemento|estrutural"
    }
  ],
  "modelos": [
    {
      "codigo": "código do modelo",
      "nome": "nome comercial",
      "tipo": "correr|fixo|maxim-ar|basculante|pivotante|deslizante",
      "serie": "nome da série",
      "descricao": "descrição técnica",
      "perfis_utilizados": ["CODIGO1", "CODIGO2"]
    }
  ],
  "confianca": 0.85,
  "avisos": ["aviso 1", "aviso 2"]
}

Se não encontrar algum campo, use null. Não invente dados — apenas extraia o que está explícito no texto.

TEXTO DO CATÁLOGO:
`;

export const CatalogImportService = {
  /**
   * Cria um job de importação e inicia o processamento
   */
  async iniciarImportacao(
    companyId: string,
    nomeArquivo: string,
    conteudo: string,
    apiKey: string
  ): Promise<ImportJob> {
    // 1. Criar job no banco
    const { data: job, error: jobError } = await supabase
      .from('ai_import_jobs')
      .insert({
        company_id: companyId,
        nome_arquivo: nomeArquivo,
        status: 'processando',
        total_perfis: 0,
        total_modelos: 0,
      })
      .select()
      .single();

    if (jobError) throw new Error(`Erro ao criar job: ${jobError.message}`);
    const jobId = (job as { id: string }).id;

    // 2. Processar em background (sem await — fire and forget)
    CatalogImportService.processarJob(jobId, companyId, conteudo, apiKey).catch(async (err) => {
      await supabase
        .from('ai_import_jobs')
        .update({ status: 'erro', erro: err.message })
        .eq('id', jobId);
    });

    return job as ImportJob;
  },

  /**
   * Processa o job: chama Claude API, valida e salva no banco
   */
  async processarJob(
    jobId: string,
    companyId: string,
    conteudo: string,
    apiKey: string
  ): Promise<void> {
    // 1. Chamar Claude API para extração
    const extracted = await CatalogImportService.extrairComIA(conteudo, apiKey);

    // 2. Salvar raw output
    await supabase
      .from('ai_import_jobs')
      .update({ ai_raw_output: extracted as unknown as Record<string, unknown> })
      .eq('id', jobId);

    // 3. Validar dados extraídos
    const validados = validarDadosExtraidos(extracted);

    // 4. Salvar dados validados para review
    await supabase
      .from('ai_import_jobs')
      .update({
        dados_para_import: validados as unknown as Record<string, unknown>,
        total_perfis: validados.perfis.length,
        total_modelos: validados.modelos.length,
        status: 'concluido',
      })
      .eq('id', jobId);

    await eventBus.emit('catalog.import.completed', {
      jobId,
      perfis: validados.perfis.length,
      modelos: validados.modelos.length,
    });
  },

  /**
   * Chama a API Claude para extrair dados estruturados do catálogo
   */
  async extrairComIA(conteudo: string, apiKey: string): Promise<CatalogExtractedData> {
    // Limitar conteúdo a ~8000 chars para não exceder context
    const textoTruncado = conteudo.slice(0, 8000);

    const response = await fetch(CLAUDE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: EXTRACTION_PROMPT + textoTruncado,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Claude API error ${response.status}: ${errorText}`);
    }

    const result = await response.json() as {
      content: Array<{ type: string; text: string }>;
    };

    const textContent = result.content.find((c) => c.type === 'text')?.text ?? '{}';

    // Extrair JSON da resposta (pode vir com texto antes/depois)
    const jsonMatch = textContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Claude não retornou JSON válido');

    return JSON.parse(jsonMatch[0]) as CatalogExtractedData;
  },

  /**
   * Confirma a importação de um job (salva no catálogo definitivo)
   */
  async confirmarImportacao(jobId: string, companyId: string): Promise<void> {
    const { data: job, error } = await supabase
      .from('ai_import_jobs')
      .select('dados_para_import, nome_arquivo')
      .eq('id', jobId)
      .eq('company_id', companyId)
      .single();

    if (error) throw new Error(`Job não encontrado: ${error.message}`);
    if (!job.dados_para_import) throw new Error('Job sem dados para importar');

    const dados = job.dados_para_import as unknown as CatalogExtractedData;

    // Importar perfis
    if (dados.perfis?.length) {
      const perfisInsert = dados.perfis.map((p) => ({
        company_id: companyId,
        codigo: p.codigo,
        nome: p.nome,
        peso_kg_m: p.peso_kg_m ?? null,
        largura_mm: p.largura_mm ?? null,
        espessura_parede_mm: p.espessura_mm ?? null,
        liga: p.liga ?? null,
        acabamento: p.acabamento ?? null,
        categoria: p.categoria ?? null,
        fonte_importacao: (job.nome_arquivo as string) ?? 'catalog-import',
      }));

      await supabase
        .from('perfis_aluminio')
        .upsert(perfisInsert, { onConflict: 'company_id,codigo', ignoreDuplicates: false });
    }

    // Importar modelos de janelas
    if (dados.modelos?.length) {
      const modelosInsert = dados.modelos.map((m) => ({
        company_id: companyId,
        codigo: m.codigo,
        nome: m.nome,
        tipo: m.tipo ?? 'correr',
        serie: m.serie ?? null,
        descricao: m.descricao ?? null,
        fonte_importacao: (job.nome_arquivo as string) ?? 'catalog-import',
      }));

      await supabase
        .from('window_models')
        .upsert(modelosInsert, { onConflict: 'company_id,codigo', ignoreDuplicates: false });
    }

    // Marcar job como concluído e aplicado
    await supabase
      .from('ai_import_jobs')
      .update({ status: 'concluido' })
      .eq('id', jobId);
  },

  /**
   * Lista jobs de importação da empresa
   */
  async listarJobs(companyId: string): Promise<ImportJob[]> {
    const { data, error } = await supabase
      .from('ai_import_jobs')
      .select('id, company_id, nome_arquivo, status, total_perfis, total_modelos, erro, created_at')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Erro ao listar jobs: ${error.message}`);
    return (data ?? []) as ImportJob[];
  },

  /**
   * Extrai texto de um arquivo PDF usando FileReader (browser-only)
   * Para PDF real, recomenda-se usar pdf.js ou enviar para Edge Function
   */
  async extrairTextoPDF(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result;
        if (typeof text === 'string') {
          resolve(text);
        } else {
          // Para PDF binário, retorna mensagem orientativa
          resolve(`[Arquivo PDF: ${file.name}]\nPara extrair texto de PDF, use a integração com Supabase Edge Function ou envie o arquivo como texto.`);
        }
      };
      reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
      reader.readAsText(file);
    });
  },
};

// --- Helpers internos ---

function validarDadosExtraidos(data: Partial<CatalogExtractedData>): CatalogExtractedData {
  const perfis = (data.perfis ?? []).filter(
    (p): p is PerfilExtraido =>
      typeof p.codigo === 'string' &&
      p.codigo.length > 0 &&
      typeof p.nome === 'string' &&
      p.nome.length > 0
  );

  const modelos = (data.modelos ?? []).filter(
    (m): m is ModeloExtraido =>
      typeof m.codigo === 'string' &&
      m.codigo.length > 0 &&
      typeof m.nome === 'string' &&
      m.nome.length > 0
  );

  return {
    fabricante: data.fabricante ?? 'Desconhecido',
    perfis,
    modelos,
    confianca: Math.min(1, Math.max(0, data.confianca ?? 0.5)),
    avisos: data.avisos ?? [],
  };
}
