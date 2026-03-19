/**
 * CatalogImportService — Importação de catálogos de fabricantes via IA
 * Pipeline: PDF/texto → extração LLM → validação → salva no banco
 *
 * Fabricantes suportados: Hydro, Alumasa, Aliança, e outros.
 * O serviço usa a API Claude para extrair perfis e modelos estruturados.
 */

import { supabase } from '@/integrations/supabase/client';
import { eventBus } from '@/services/eventBus';
import { importError, databaseError, apiError } from '@/lib/error-handler';
import type * as PDFJSType from 'pdfjs-dist';

// Lazy load PDF.js for catalog imports
let PDFJS: typeof PDFJSType | null = null;

const getPDFJS = async () => {
  if (!PDFJS) {
    PDFJS = await import('pdfjs-dist');
    try {
      const workerModule = await import('pdfjs-dist/build/pdf.worker.min.mjs');
      const blob = new Blob([workerModule.default || ''], { type: 'application/javascript' });
      PDFJS.GlobalWorkerOptions.workerSrc = URL.createObjectURL(blob);
    } catch {
      PDFJS.GlobalWorkerOptions.workerSrc =
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    }
  }
  return PDFJS;
};

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

    if (jobError) throw databaseError(`Erro ao criar job: ${jobError.message}`, { service: 'catalog-import', operation: 'iniciarImportacao' });
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
      throw apiError(`Claude API error ${response.status}: ${errorText}`, { service: 'catalog-import', operation: 'extrairComIA' });
    }

    const result = await response.json() as {
      content: Array<{ type: string; text: string }>;
    };

    const textContent = result.content.find((c) => c.type === 'text')?.text ?? '{}';

    // Extrair JSON da resposta (pode vir com texto antes/depois)
    const jsonMatch = textContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw importError('Claude não retornou JSON válido', { service: 'catalog-import', operation: 'extrairComIA' });

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

    if (error) throw databaseError(`Job não encontrado: ${error.message}`, { service: 'catalog-import', operation: 'confirmarImportacao' });
    if (!job.dados_para_import) throw importError('Job sem dados para importar', { service: 'catalog-import', operation: 'confirmarImportacao' });

    const dados = job.dados_para_import as unknown as CatalogExtractedData;

    // Importar perfis no catálogo (perfis_catalogo, não perfis_aluminio que é BOM)
    if (dados.perfis?.length) {
      const perfisInsert = dados.perfis.map((p) => ({
        company_id: companyId,
        codigo: p.codigo,
        nome: p.nome,
        peso_kg_m: p.peso_kg_m ?? null,
        espessura_mm: p.espessura_mm ?? null,
        tipo: p.categoria ?? 'perfil',
      }));

      await supabase
        .from('perfis_catalogo')
        .upsert(perfisInsert, { onConflict: 'company_id,codigo', ignoreDuplicates: false });
    }

    // Importar modelos de janelas
    if (dados.modelos?.length) {
      const modelosInsert = dados.modelos.map((m) => ({
        company_id: companyId,
        codigo: m.codigo,
        nome: m.nome,
        tipo: m.tipo ?? 'correr',
        descricao: m.descricao ?? null,
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

    if (error) throw databaseError(`Erro ao listar jobs: ${error.message}`, { service: 'catalog-import', operation: 'listarJobs' });
    return (data ?? []) as ImportJob[];
  },

  /**
   * Extrai texto de um arquivo PDF usando pdfjs-dist
   */
  async extrairTextoPDF(file: File): Promise<string> {
    try {
      const pdfjs = await getPDFJS();
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjs.getDocument(arrayBuffer).promise;

      let fullText = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const items = textContent.items as Array<{ str: string; transform: number[] }>;

        // Group items by Y position (same line) for tabular data
        const lines = new Map<number, Array<{ str: string; x: number }>>();
        for (const item of items) {
          if (!item.str.trim()) continue;
          const y = Math.round(item.transform[5]);
          if (!lines.has(y)) lines.set(y, []);
          lines.get(y)!.push({ str: item.str, x: item.transform[4] });
        }

        // Sort lines top-to-bottom (Y descending)
        const sortedLines = [...lines.entries()].sort((a, b) => b[0] - a[0]);
        for (const [, lineItems] of sortedLines) {
          lineItems.sort((a, b) => a.x - b.x);
          fullText += lineItems.map(item => item.str).join(' ') + '\n';
        }
        fullText += '\n';
      }

      return fullText;
    } catch (error) {
      throw importError(
        `Erro ao extrair texto do PDF: ${error instanceof Error ? error.message : 'Desconhecido'}`,
        { service: 'catalog-import', operation: 'extrairTextoPDF' }
      );
    }
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
