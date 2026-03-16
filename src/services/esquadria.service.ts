/**
 * EsquadriaService — Motor de cálculo de esquadrias de alumínio
 * Lógica de negócio pura: sem dependências de React ou UI
 */

export interface EsquadriaConfig {
  modelo: string;
  largura: number;  // mm
  altura: number;   // mm
  numFolhas?: number;
  tipoVidro?: string;
  cor?: string;
}

export interface Peca {
  posicao: string;
  perfilCodigo?: string;
  comprimento: number;  // mm
  quantidade: number;
  pesoTotal?: number;   // kg
  observacao?: string;
}

export interface ListaMateriais {
  pecas: Peca[];
  totalPerfisMetros: number;
  totalPesoKg: number;
  areaVidroM2: number;
}

export interface ValidationResult {
  valido: boolean;
  erros: string[];
}

export const EsquadriaService = {
  /**
   * Calcula a lista de peças para uma esquadria dado modelo e dimensões
   */
  calcularPerfis(config: EsquadriaConfig): Peca[] {
    const { modelo, largura, altura, numFolhas = 1 } = config;

    EsquadriaService.validarDimensoes(largura, altura);

    // Delegar para calculador específico por tipo
    switch (modelo.toLowerCase()) {
      case 'correr':
      case 'correr_2f':
        return calcularCorrer2Folhas(largura, altura);
      case 'correr_4f':
        return calcularCorrer4Folhas(largura, altura);
      case 'fixo':
        return calcularFixo(largura, altura);
      case 'maxim-ar':
      case 'maximar':
        return calcularMaximAr(largura, altura);
      case 'basculante':
        return calcularBasculante(largura, altura);
      default:
        return calcularGenerico(largura, altura, numFolhas);
    }
  },

  /**
   * Agrega lista de peças em lista de materiais com totais
   */
  calcularListaMateriais(pecas: Peca[]): ListaMateriais {
    const totalPerfisMetros = pecas.reduce((acc, peca) => {
      return acc + (peca.comprimento / 1000) * peca.quantidade;
    }, 0);

    const totalPesoKg = pecas.reduce((acc, peca) => {
      return acc + (peca.pesoTotal ?? 0);
    }, 0);

    return {
      pecas,
      totalPerfisMetros: Math.round(totalPerfisMetros * 100) / 100,
      totalPesoKg: Math.round(totalPesoKg * 100) / 100,
      areaVidroM2: 0, // calculado separadamente com dimensões de vidro
    };
  },

  /**
   * Valida se as dimensões estão dentro de limites aceitáveis
   */
  validarDimensoes(largura: number, altura: number): ValidationResult {
    const erros: string[] = [];

    if (largura <= 0) erros.push('Largura deve ser maior que zero');
    if (altura <= 0) erros.push('Altura deve ser maior que zero');
    if (largura < 300) erros.push('Largura mínima: 300mm');
    if (largura > 6000) erros.push('Largura máxima: 6000mm');
    if (altura < 300) erros.push('Altura mínima: 300mm');
    if (altura > 4000) erros.push('Altura máxima: 4000mm');

    if (erros.length > 0) {
      return { valido: false, erros };
    }

    return { valido: true, erros: [] };
  },

  /**
   * Calcula área de vidro necessária em m²
   */
  calcularAreaVidro(largura: number, altura: number, numFolhas: number = 1, folga: number = 10): number {
    const larguraVidro = largura / numFolhas - folga * 2;
    const alturaVidro = altura - folga * 2;
    return (larguraVidro * alturaVidro * numFolhas) / 1_000_000;
  },
};

// --- Calculadores internos por tipo ---

function calcularCorrer2Folhas(largura: number, altura: number): Peca[] {
  const folga = 10;
  return [
    // Marco externo
    { posicao: 'marco_horizontal_superior', comprimento: largura, quantidade: 1 },
    { posicao: 'marco_horizontal_inferior', comprimento: largura, quantidade: 1 },
    { posicao: 'marco_vertical_esquerdo', comprimento: altura - 2 * folga, quantidade: 1 },
    { posicao: 'marco_vertical_direito', comprimento: altura - 2 * folga, quantidade: 1 },
    // Folhas (2 folhas)
    { posicao: 'folha_horizontal_superior', comprimento: largura / 2 + 30, quantidade: 2 },
    { posicao: 'folha_horizontal_inferior', comprimento: largura / 2 + 30, quantidade: 2 },
    { posicao: 'folha_vertical', comprimento: altura - 80, quantidade: 4 },
    // Trilhos
    { posicao: 'trilho_superior', comprimento: largura, quantidade: 1 },
    { posicao: 'trilho_inferior', comprimento: largura, quantidade: 1 },
  ];
}

function calcularCorrer4Folhas(largura: number, altura: number): Peca[] {
  const folga = 10;
  return [
    { posicao: 'marco_horizontal_superior', comprimento: largura, quantidade: 1 },
    { posicao: 'marco_horizontal_inferior', comprimento: largura, quantidade: 1 },
    { posicao: 'marco_vertical_esquerdo', comprimento: altura - 2 * folga, quantidade: 1 },
    { posicao: 'marco_vertical_direito', comprimento: altura - 2 * folga, quantidade: 1 },
    // 4 folhas
    { posicao: 'folha_horizontal_superior', comprimento: largura / 4 + 20, quantidade: 4 },
    { posicao: 'folha_horizontal_inferior', comprimento: largura / 4 + 20, quantidade: 4 },
    { posicao: 'folha_vertical', comprimento: altura - 80, quantidade: 8 },
    { posicao: 'trilho_superior', comprimento: largura, quantidade: 1 },
    { posicao: 'trilho_inferior', comprimento: largura, quantidade: 1 },
  ];
}

function calcularFixo(largura: number, altura: number): Peca[] {
  return [
    { posicao: 'marco_horizontal_superior', comprimento: largura, quantidade: 1 },
    { posicao: 'marco_horizontal_inferior', comprimento: largura, quantidade: 1 },
    { posicao: 'marco_vertical_esquerdo', comprimento: altura, quantidade: 1 },
    { posicao: 'marco_vertical_direito', comprimento: altura, quantidade: 1 },
  ];
}

function calcularMaximAr(largura: number, altura: number): Peca[] {
  const numFolhas = Math.floor(altura / 300);
  const alturaFolha = (altura - 40) / numFolhas;
  return [
    { posicao: 'marco_horizontal_superior', comprimento: largura, quantidade: 1 },
    { posicao: 'marco_horizontal_inferior', comprimento: largura, quantidade: 1 },
    { posicao: 'marco_vertical', comprimento: altura, quantidade: 2 },
    { posicao: 'folha_horizontal', comprimento: largura - 10, quantidade: numFolhas * 2 },
    { posicao: 'folha_vertical', comprimento: alturaFolha, quantidade: numFolhas * 2 },
    { posicao: 'travessa_intermediaria', comprimento: largura, quantidade: numFolhas - 1 },
  ];
}

function calcularBasculante(largura: number, altura: number): Peca[] {
  return [
    { posicao: 'marco_horizontal_superior', comprimento: largura, quantidade: 1 },
    { posicao: 'marco_horizontal_inferior', comprimento: largura, quantidade: 1 },
    { posicao: 'marco_vertical', comprimento: altura, quantidade: 2 },
    { posicao: 'folha_horizontal', comprimento: largura - 20, quantidade: 2 },
    { posicao: 'folha_vertical', comprimento: altura - 20, quantidade: 2 },
  ];
}

function calcularGenerico(largura: number, altura: number, numFolhas: number): Peca[] {
  const larguraFolha = largura / numFolhas;
  return [
    { posicao: 'marco_horizontal', comprimento: largura, quantidade: 2 },
    { posicao: 'marco_vertical', comprimento: altura, quantidade: 2 },
    { posicao: 'folha_horizontal', comprimento: larguraFolha - 10, quantidade: numFolhas * 2 },
    { posicao: 'folha_vertical', comprimento: altura - 40, quantidade: numFolhas * 2 },
  ];
}
