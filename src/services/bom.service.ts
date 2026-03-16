// BOM = Bill of Materials — calcula materiais necessarios para esquadrias

export interface ModeloComponente {
  id: string;
  modelo_id: string;
  nome: string;
  categoria: 'aluminio' | 'vidro' | 'ferragem' | 'acessorio' | 'borracha';
  unidade: 'metro' | 'unidade' | 'm2' | 'kg';
  formula: string;
  codigo_fornecedor?: string;
}

export interface MaterialCalculado {
  nome: string;
  categoria: string;
  quantidade: number;
  unidade: string;
  formula: string;
}

export interface BOMResult {
  orcamento_item_id: string;
  descricao: string;
  largura: number;
  altura: number;
  quantidade: number;
  materiais: MaterialCalculado[];
}

export class BOMService {
  static evaluateFormula(formula: string, largura: number, altura: number): number {
    const l = largura / 1000;
    const a = altura / 1000;
    try {
      const expr = formula
        .replace(/largura/g, String(l))
        .replace(/altura/g, String(a));
      return Function(`"use strict"; return (${expr})`)() as number;
    } catch {
      return 0;
    }
  }

  static getComponentesPadrao(categoria: string): ModeloComponente[] {
    const baseId = categoria;
    const componentes: Record<string, ModeloComponente[]> = {
      'correr': [
        { id: `${baseId}-1`, modelo_id: baseId, nome: 'Trilho superior', categoria: 'aluminio', unidade: 'metro', formula: 'largura' },
        { id: `${baseId}-2`, modelo_id: baseId, nome: 'Trilho inferior', categoria: 'aluminio', unidade: 'metro', formula: 'largura' },
        { id: `${baseId}-3`, modelo_id: baseId, nome: 'Montante lateral', categoria: 'aluminio', unidade: 'metro', formula: 'altura * 2' },
        { id: `${baseId}-4`, modelo_id: baseId, nome: 'Folha vertical', categoria: 'aluminio', unidade: 'metro', formula: 'altura * 2' },
        { id: `${baseId}-5`, modelo_id: baseId, nome: 'Folha horizontal', categoria: 'aluminio', unidade: 'metro', formula: 'largura' },
        { id: `${baseId}-6`, modelo_id: baseId, nome: 'Vidro', categoria: 'vidro', unidade: 'm2', formula: '(largura * altura) / 1000000' },
        { id: `${baseId}-7`, modelo_id: baseId, nome: 'Roldana', categoria: 'ferragem', unidade: 'unidade', formula: '4' },
        { id: `${baseId}-8`, modelo_id: baseId, nome: 'Fecho', categoria: 'ferragem', unidade: 'unidade', formula: '2' },
        { id: `${baseId}-9`, modelo_id: baseId, nome: 'Borracha vedacao', categoria: 'borracha', unidade: 'metro', formula: '(largura + altura) * 2' },
      ],
      'basculante': [
        { id: `${baseId}-1`, modelo_id: baseId, nome: 'Perfil moldura', categoria: 'aluminio', unidade: 'metro', formula: '(largura + altura) * 2 / 1000' },
        { id: `${baseId}-2`, modelo_id: baseId, nome: 'Perfil folha', categoria: 'aluminio', unidade: 'metro', formula: '(largura + altura) * 2 / 1000' },
        { id: `${baseId}-3`, modelo_id: baseId, nome: 'Vidro', categoria: 'vidro', unidade: 'm2', formula: '(largura * altura) / 1000000' },
        { id: `${baseId}-4`, modelo_id: baseId, nome: 'Fecho basculante', categoria: 'ferragem', unidade: 'unidade', formula: '2' },
        { id: `${baseId}-5`, modelo_id: baseId, nome: 'Borracha', categoria: 'borracha', unidade: 'metro', formula: '(largura + altura) * 2 / 1000' },
      ],
      'porta': [
        { id: `${baseId}-1`, modelo_id: baseId, nome: 'Perfil marco', categoria: 'aluminio', unidade: 'metro', formula: '(largura + altura * 2) / 1000' },
        { id: `${baseId}-2`, modelo_id: baseId, nome: 'Perfil folha', categoria: 'aluminio', unidade: 'metro', formula: '(largura + altura * 2) / 1000' },
        { id: `${baseId}-3`, modelo_id: baseId, nome: 'Vidro', categoria: 'vidro', unidade: 'm2', formula: '(largura * altura) / 1000000' },
        { id: `${baseId}-4`, modelo_id: baseId, nome: 'Dobradica', categoria: 'ferragem', unidade: 'unidade', formula: '3' },
        { id: `${baseId}-5`, modelo_id: baseId, nome: 'Fechadura', categoria: 'ferragem', unidade: 'unidade', formula: '1' },
        { id: `${baseId}-6`, modelo_id: baseId, nome: 'Borracha', categoria: 'borracha', unidade: 'metro', formula: '(largura + altura * 2) / 1000' },
      ],
      'maxim-ar': [
        { id: `${baseId}-1`, modelo_id: baseId, nome: 'Perfil moldura', categoria: 'aluminio', unidade: 'metro', formula: '(largura + altura) * 2 / 1000' },
        { id: `${baseId}-2`, modelo_id: baseId, nome: 'Vidro temperado', categoria: 'vidro', unidade: 'm2', formula: '(largura * altura) / 1000000' },
        { id: `${baseId}-3`, modelo_id: baseId, nome: 'Braco articulado', categoria: 'ferragem', unidade: 'unidade', formula: '2' },
        { id: `${baseId}-4`, modelo_id: baseId, nome: 'Borracha', categoria: 'borracha', unidade: 'metro', formula: '(largura + altura) * 2 / 1000' },
      ],
      'default': [
        { id: `${baseId}-1`, modelo_id: baseId, nome: 'Perfil aluminio', categoria: 'aluminio', unidade: 'metro', formula: '(largura + altura) * 2 / 1000' },
        { id: `${baseId}-2`, modelo_id: baseId, nome: 'Vidro', categoria: 'vidro', unidade: 'm2', formula: '(largura * altura) / 1000000' },
        { id: `${baseId}-3`, modelo_id: baseId, nome: 'Ferragem', categoria: 'ferragem', unidade: 'unidade', formula: '2' },
      ],
    };

    const desc = categoria.toLowerCase();
    if (desc.includes('correr') || desc.includes('desliz')) return componentes['correr'];
    if (desc.includes('bascul')) return componentes['basculante'];
    if (desc.includes('porta')) return componentes['porta'];
    if (desc.includes('maxim')) return componentes['maxim-ar'];
    return componentes['default'];
  }

  static calcularBOM(item: {
    id: string;
    descricao: string;
    largura?: number | null;
    altura?: number | null;
    quantidade: number;
  }): BOMResult {
    const largura = item.largura ?? 1000;
    const altura = item.altura ?? 1200;
    const componentes = this.getComponentesPadrao(item.descricao);

    const materiais: MaterialCalculado[] = componentes.map(c => ({
      nome: c.nome,
      categoria: c.categoria,
      quantidade: parseFloat((this.evaluateFormula(c.formula, largura, altura) * item.quantidade).toFixed(3)),
      unidade: c.unidade,
      formula: c.formula,
    }));

    return {
      orcamento_item_id: item.id,
      descricao: item.descricao,
      largura,
      altura,
      quantidade: item.quantidade,
      materiais,
    };
  }

  static agregarMateriais(boms: BOMResult[]): Map<string, { nome: string; categoria: string; quantidade: number; unidade: string }> {
    const mapa = new Map<string, { nome: string; categoria: string; quantidade: number; unidade: string }>();

    for (const bom of boms) {
      for (const mat of bom.materiais) {
        const key = `${mat.nome}|${mat.unidade}`;
        const existing = mapa.get(key);
        if (existing) {
          existing.quantidade = parseFloat((existing.quantidade + mat.quantidade).toFixed(3));
        } else {
          mapa.set(key, { nome: mat.nome, categoria: mat.categoria, quantidade: mat.quantidade, unidade: mat.unidade });
        }
      }
    }
    return mapa;
  }
}
