// Banco de dados completo de perfis de alumínio para esquadrias e serralheria
// Baseado nos perfis mais utilizados no mercado brasileiro (linhas Suprema, Linha 25, Série Gold, etc.)

export interface PerfilAluminio {
  codigo: string;
  descricao: string;
  linha: string;
  largura: number;  // mm
  altura: number;   // mm
  espessura: number; // mm
  peso: number; // kg/m
  tipo: "marco" | "montante" | "travessa" | "folha" | "contramarco" | "adaptador" | "batente" | "trilho" | "guia" | "reforco" | "arremate" | "puxador" | "veneziana" | "vidro" | "encaixe";
  aplicacao: string[];
}

export interface PerfilCorte {
  perfilCodigo: string;
  medida: number;      // mm
  quantidade: number;
  anguloEsquerdo: number; // graus
  anguloDireito: number;  // graus
  posicao: "Altura" | "Largura" | "Travessa" | "Montante" | "Diagonal";
}

export interface ProdutoEsquadria {
  id: number;
  nome: string;
  tipo: "janela" | "porta" | "portao" | "basculante" | "maxim-ar" | "pivotante" | "correr" | "veneziana" | "divisoria" | "fachada";
  largura: number;
  altura: number;
  folhas: number;
  linha: string;
  perfis: PerfilCorte[];
}

// ==================== BANCO DE PERFIS ====================

export const perfisAluminio: PerfilAluminio[] = [
  // ===== LINHA SUPREMA (Esquadrias de correr) =====
  { codigo: "SU-001", descricao: "Marco inferior 2 trilhos", linha: "Suprema", largura: 76, altura: 18, espessura: 1.3, peso: 0.520, tipo: "marco", aplicacao: ["Janela de correr 2 folhas", "Porta de correr 2 folhas"] },
  { codigo: "SU-002", descricao: "Marco superior 2 trilhos", linha: "Suprema", largura: 76, altura: 25, espessura: 1.3, peso: 0.580, tipo: "marco", aplicacao: ["Janela de correr 2 folhas", "Porta de correr 2 folhas"] },
  { codigo: "SU-003", descricao: "Marco lateral / montante", linha: "Suprema", largura: 71, altura: 26, espessura: 1.3, peso: 0.480, tipo: "montante", aplicacao: ["Janela de correr", "Porta de correr"] },
  { codigo: "SU-004", descricao: "Marco inferior 3 trilhos", linha: "Suprema", largura: 100, altura: 18, espessura: 1.3, peso: 0.680, tipo: "marco", aplicacao: ["Janela de correr 3 folhas", "Porta de correr 3 folhas"] },
  { codigo: "SU-005", descricao: "Marco superior 3 trilhos", linha: "Suprema", largura: 100, altura: 25, espessura: 1.3, peso: 0.720, tipo: "marco", aplicacao: ["Janela de correr 3 folhas", "Porta de correr 3 folhas"] },
  { codigo: "SU-006", descricao: "Marco inferior 4 trilhos", linha: "Suprema", largura: 132, altura: 18, espessura: 1.3, peso: 0.890, tipo: "marco", aplicacao: ["Janela de correr 4 folhas"] },
  { codigo: "SU-007", descricao: "Marco superior 4 trilhos", linha: "Suprema", largura: 132, altura: 25, espessura: 1.3, peso: 0.940, tipo: "marco", aplicacao: ["Janela de correr 4 folhas"] },
  { codigo: "SU-010", descricao: "Folha externa de correr", linha: "Suprema", largura: 26, altura: 33, espessura: 1.2, peso: 0.380, tipo: "folha", aplicacao: ["Janela de correr"] },
  { codigo: "SU-011", descricao: "Folha interna de correr", linha: "Suprema", largura: 26, altura: 33, espessura: 1.2, peso: 0.370, tipo: "folha", aplicacao: ["Janela de correr"] },
  { codigo: "SU-012", descricao: "Travessa inferior folha", linha: "Suprema", largura: 26, altura: 22, espessura: 1.2, peso: 0.310, tipo: "travessa", aplicacao: ["Janela de correr"] },
  { codigo: "SU-013", descricao: "Travessa superior folha", linha: "Suprema", largura: 26, altura: 18, espessura: 1.2, peso: 0.290, tipo: "travessa", aplicacao: ["Janela de correr"] },
  { codigo: "SU-014", descricao: "Contramarco", linha: "Suprema", largura: 30, altura: 40, espessura: 1.0, peso: 0.350, tipo: "contramarco", aplicacao: ["Janela de correr", "Porta de correr"] },
  { codigo: "SU-015", descricao: "Guia inferior porta", linha: "Suprema", largura: 50, altura: 10, espessura: 1.5, peso: 0.420, tipo: "guia", aplicacao: ["Porta de correr"] },

  // ===== LINHA SUPREMA (Portas e portões) =====
  { codigo: "SU-020", descricao: "Marco porta de giro", linha: "Suprema", largura: 44, altura: 40, espessura: 1.5, peso: 0.620, tipo: "marco", aplicacao: ["Porta de giro", "Porta pivotante"] },
  { codigo: "SU-021", descricao: "Folha porta de giro", linha: "Suprema", largura: 40, altura: 38, espessura: 1.3, peso: 0.560, tipo: "folha", aplicacao: ["Porta de giro"] },
  { codigo: "SU-022", descricao: "Batente porta", linha: "Suprema", largura: 50, altura: 25, espessura: 1.5, peso: 0.580, tipo: "batente", aplicacao: ["Porta de giro", "Porta pivotante"] },
  { codigo: "SU-023", descricao: "Marco porta pivotante", linha: "Suprema", largura: 60, altura: 44, espessura: 1.8, peso: 0.820, tipo: "marco", aplicacao: ["Porta pivotante"] },
  { codigo: "SU-024", descricao: "Folha porta pivotante", linha: "Suprema", largura: 50, altura: 42, espessura: 1.5, peso: 0.710, tipo: "folha", aplicacao: ["Porta pivotante"] },

  // ===== LINHA 25 (Básica) =====
  { codigo: "L25-001", descricao: "Marco inferior 2 trilhos", linha: "Linha 25", largura: 50, altura: 14, espessura: 1.0, peso: 0.340, tipo: "marco", aplicacao: ["Janela de correr econômica"] },
  { codigo: "L25-002", descricao: "Marco superior 2 trilhos", linha: "Linha 25", largura: 50, altura: 20, espessura: 1.0, peso: 0.380, tipo: "marco", aplicacao: ["Janela de correr econômica"] },
  { codigo: "L25-003", descricao: "Marco lateral", linha: "Linha 25", largura: 25, altura: 20, espessura: 1.0, peso: 0.280, tipo: "montante", aplicacao: ["Janela de correr econômica"] },
  { codigo: "L25-004", descricao: "Folha externa", linha: "Linha 25", largura: 20, altura: 25, espessura: 1.0, peso: 0.260, tipo: "folha", aplicacao: ["Janela de correr econômica"] },
  { codigo: "L25-005", descricao: "Folha interna", linha: "Linha 25", largura: 20, altura: 25, espessura: 1.0, peso: 0.250, tipo: "folha", aplicacao: ["Janela de correr econômica"] },
  { codigo: "L25-006", descricao: "Travessa inferior", linha: "Linha 25", largura: 20, altura: 16, espessura: 1.0, peso: 0.220, tipo: "travessa", aplicacao: ["Janela de correr econômica"] },
  { codigo: "L25-007", descricao: "Travessa superior", linha: "Linha 25", largura: 20, altura: 14, espessura: 1.0, peso: 0.200, tipo: "travessa", aplicacao: ["Janela de correr econômica"] },
  { codigo: "L25-008", descricao: "Contramarco", linha: "Linha 25", largura: 25, altura: 30, espessura: 0.8, peso: 0.220, tipo: "contramarco", aplicacao: ["Janela de correr econômica"] },

  // ===== SÉRIE GOLD (Premium) =====
  { codigo: "GD-001", descricao: "Marco inferior 2 trilhos", linha: "Série Gold", largura: 88, altura: 22, espessura: 1.5, peso: 0.680, tipo: "marco", aplicacao: ["Janela de correr premium"] },
  { codigo: "GD-002", descricao: "Marco superior 2 trilhos", linha: "Série Gold", largura: 88, altura: 30, espessura: 1.5, peso: 0.740, tipo: "marco", aplicacao: ["Janela de correr premium"] },
  { codigo: "GD-003", descricao: "Marco lateral", linha: "Série Gold", largura: 44, altura: 30, espessura: 1.5, peso: 0.540, tipo: "montante", aplicacao: ["Janela de correr premium"] },
  { codigo: "GD-004", descricao: "Folha externa", linha: "Série Gold", largura: 32, altura: 40, espessura: 1.3, peso: 0.460, tipo: "folha", aplicacao: ["Janela de correr premium"] },
  { codigo: "GD-005", descricao: "Folha interna", linha: "Série Gold", largura: 32, altura: 40, espessura: 1.3, peso: 0.450, tipo: "folha", aplicacao: ["Janela de correr premium"] },
  { codigo: "GD-006", descricao: "Travessa inferior", linha: "Série Gold", largura: 32, altura: 25, espessura: 1.3, peso: 0.380, tipo: "travessa", aplicacao: ["Janela de correr premium"] },
  { codigo: "GD-007", descricao: "Travessa superior", linha: "Série Gold", largura: 32, altura: 20, espessura: 1.3, peso: 0.340, tipo: "travessa", aplicacao: ["Janela de correr premium"] },
  { codigo: "GD-008", descricao: "Contramarco Gold", linha: "Série Gold", largura: 35, altura: 45, espessura: 1.2, peso: 0.410, tipo: "contramarco", aplicacao: ["Janela de correr premium"] },
  { codigo: "GD-010", descricao: "Marco inferior 3 trilhos", linha: "Série Gold", largura: 120, altura: 22, espessura: 1.5, peso: 0.920, tipo: "marco", aplicacao: ["Janela de correr 3 folhas premium"] },
  { codigo: "GD-011", descricao: "Marco superior 3 trilhos", linha: "Série Gold", largura: 120, altura: 30, espessura: 1.5, peso: 0.980, tipo: "marco", aplicacao: ["Janela de correr 3 folhas premium"] },

  // ===== BASCULANTE / MAXIM-AR =====
  { codigo: "BA-001", descricao: "Marco inferior basculante", linha: "Basculante", largura: 38, altura: 25, espessura: 1.2, peso: 0.410, tipo: "marco", aplicacao: ["Janela basculante", "Janela maxim-ar"] },
  { codigo: "BA-002", descricao: "Marco superior basculante", linha: "Basculante", largura: 38, altura: 25, espessura: 1.2, peso: 0.420, tipo: "marco", aplicacao: ["Janela basculante", "Janela maxim-ar"] },
  { codigo: "BA-003", descricao: "Marco lateral basculante", linha: "Basculante", largura: 38, altura: 25, espessura: 1.2, peso: 0.400, tipo: "montante", aplicacao: ["Janela basculante", "Janela maxim-ar"] },
  { codigo: "BA-004", descricao: "Folha basculante", linha: "Basculante", largura: 32, altura: 38, espessura: 1.2, peso: 0.380, tipo: "folha", aplicacao: ["Janela basculante"] },
  { codigo: "BA-005", descricao: "Folha maxim-ar", linha: "Basculante", largura: 36, altura: 40, espessura: 1.3, peso: 0.420, tipo: "folha", aplicacao: ["Janela maxim-ar"] },
  { codigo: "BA-006", descricao: "Travessa divisória", linha: "Basculante", largura: 38, altura: 20, espessura: 1.2, peso: 0.320, tipo: "travessa", aplicacao: ["Janela basculante com bandeira"] },
  { codigo: "BA-007", descricao: "Montante central", linha: "Basculante", largura: 38, altura: 25, espessura: 1.2, peso: 0.400, tipo: "montante", aplicacao: ["Janela basculante dupla"] },

  // ===== VENEZIANAS =====
  { codigo: "VZ-001", descricao: "Marco veneziana", linha: "Veneziana", largura: 100, altura: 30, espessura: 1.5, peso: 0.720, tipo: "marco", aplicacao: ["Veneziana de correr"] },
  { codigo: "VZ-002", descricao: "Folha veneziana", linha: "Veneziana", largura: 45, altura: 35, espessura: 1.2, peso: 0.480, tipo: "folha", aplicacao: ["Veneziana de correr"] },
  { codigo: "VZ-003", descricao: "Paleta veneziana fixa", linha: "Veneziana", largura: 80, altura: 10, espessura: 0.5, peso: 0.180, tipo: "veneziana", aplicacao: ["Veneziana fixa", "Veneziana de correr"] },
  { codigo: "VZ-004", descricao: "Paleta veneziana móvel", linha: "Veneziana", largura: 80, altura: 12, espessura: 0.5, peso: 0.200, tipo: "veneziana", aplicacao: ["Veneziana regulável"] },
  { codigo: "VZ-005", descricao: "Travessa veneziana", linha: "Veneziana", largura: 45, altura: 20, espessura: 1.2, peso: 0.340, tipo: "travessa", aplicacao: ["Veneziana de correr"] },

  // ===== PORTAS DE CORRER =====
  { codigo: "PC-001", descricao: "Trilho superior porta correr", linha: "Porta Correr", largura: 50, altura: 40, espessura: 2.0, peso: 0.880, tipo: "trilho", aplicacao: ["Porta de correr"] },
  { codigo: "PC-002", descricao: "Trilho inferior porta correr", linha: "Porta Correr", largura: 40, altura: 15, espessura: 2.0, peso: 0.620, tipo: "trilho", aplicacao: ["Porta de correr"] },
  { codigo: "PC-003", descricao: "Montante porta de correr", linha: "Porta Correr", largura: 44, altura: 35, espessura: 1.5, peso: 0.560, tipo: "montante", aplicacao: ["Porta de correr"] },
  { codigo: "PC-004", descricao: "Folha porta de correr", linha: "Porta Correr", largura: 38, altura: 44, espessura: 1.5, peso: 0.620, tipo: "folha", aplicacao: ["Porta de correr"] },
  { codigo: "PC-005", descricao: "Travessa inferior porta", linha: "Porta Correr", largura: 38, altura: 30, espessura: 1.5, peso: 0.480, tipo: "travessa", aplicacao: ["Porta de correr"] },
  { codigo: "PC-006", descricao: "Puxador concha porta", linha: "Porta Correr", largura: 15, altura: 120, espessura: 1.2, peso: 0.180, tipo: "puxador", aplicacao: ["Porta de correr"] },

  // ===== FACHADA / PELE DE VIDRO =====
  { codigo: "FC-001", descricao: "Montante fachada structural", linha: "Fachada", largura: 52, altura: 115, espessura: 2.5, peso: 1.420, tipo: "montante", aplicacao: ["Pele de vidro", "Fachada structural glazing"] },
  { codigo: "FC-002", descricao: "Travessa fachada structural", linha: "Fachada", largura: 52, altura: 60, espessura: 2.5, peso: 0.980, tipo: "travessa", aplicacao: ["Pele de vidro", "Fachada structural glazing"] },
  { codigo: "FC-003", descricao: "Perfil de pressão fachada", linha: "Fachada", largura: 30, altura: 20, espessura: 2.0, peso: 0.480, tipo: "encaixe", aplicacao: ["Pele de vidro"] },
  { codigo: "FC-004", descricao: "Tampa de acabamento", linha: "Fachada", largura: 52, altura: 10, espessura: 1.0, peso: 0.280, tipo: "arremate", aplicacao: ["Pele de vidro", "Fachada"] },
  { codigo: "FC-005", descricao: "Montante fachada semi-structural", linha: "Fachada", largura: 50, altura: 80, espessura: 2.0, peso: 1.100, tipo: "montante", aplicacao: ["Fachada semi-structural"] },
  { codigo: "FC-006", descricao: "Travessa fachada semi-structural", linha: "Fachada", largura: 50, altura: 50, espessura: 2.0, peso: 0.820, tipo: "travessa", aplicacao: ["Fachada semi-structural"] },

  // ===== DIVISÓRIAS =====
  { codigo: "DV-001", descricao: "Montante divisória 35mm", linha: "Divisória", largura: 35, altura: 35, espessura: 1.2, peso: 0.420, tipo: "montante", aplicacao: ["Divisória de escritório"] },
  { codigo: "DV-002", descricao: "Montante divisória 50mm", linha: "Divisória", largura: 50, altura: 50, espessura: 1.5, peso: 0.620, tipo: "montante", aplicacao: ["Divisória industrial"] },
  { codigo: "DV-003", descricao: "Travessa divisória", linha: "Divisória", largura: 35, altura: 25, espessura: 1.2, peso: 0.340, tipo: "travessa", aplicacao: ["Divisória de escritório"] },
  { codigo: "DV-004", descricao: "Perfil vidro divisória", linha: "Divisória", largura: 20, altura: 12, espessura: 1.0, peso: 0.180, tipo: "vidro", aplicacao: ["Divisória de escritório"] },

  // ===== PORTÕES =====
  { codigo: "PT-001", descricao: "Tubo 30x30 portão", linha: "Portão", largura: 30, altura: 30, espessura: 1.5, peso: 0.520, tipo: "marco", aplicacao: ["Portão de abrir", "Portão de correr"] },
  { codigo: "PT-002", descricao: "Tubo 40x20 portão", linha: "Portão", largura: 40, altura: 20, espessura: 1.2, peso: 0.440, tipo: "travessa", aplicacao: ["Portão de abrir", "Portão de correr"] },
  { codigo: "PT-003", descricao: "Tubo 50x30 portão", linha: "Portão", largura: 50, altura: 30, espessura: 1.5, peso: 0.620, tipo: "marco", aplicacao: ["Portão industrial"] },
  { codigo: "PT-004", descricao: "Trilho portão correr V", linha: "Portão", largura: 60, altura: 60, espessura: 3.0, peso: 1.850, tipo: "trilho", aplicacao: ["Portão de correr"] },
  { codigo: "PT-005", descricao: "Trilho portão correr U", linha: "Portão", largura: 40, altura: 20, espessura: 2.0, peso: 0.940, tipo: "trilho", aplicacao: ["Portão de correr"] },

  // ===== ARREMATES E ACESSÓRIOS =====
  { codigo: "AR-001", descricao: "Arremate em L 15x15", linha: "Arremate", largura: 15, altura: 15, espessura: 1.0, peso: 0.140, tipo: "arremate", aplicacao: ["Acabamento geral"] },
  { codigo: "AR-002", descricao: "Arremate em L 20x20", linha: "Arremate", largura: 20, altura: 20, espessura: 1.0, peso: 0.180, tipo: "arremate", aplicacao: ["Acabamento geral"] },
  { codigo: "AR-003", descricao: "Arremate em L 25x15", linha: "Arremate", largura: 25, altura: 15, espessura: 1.0, peso: 0.190, tipo: "arremate", aplicacao: ["Acabamento geral"] },
  { codigo: "AR-004", descricao: "Arremate em U 10x20", linha: "Arremate", largura: 10, altura: 20, espessura: 1.0, peso: 0.160, tipo: "arremate", aplicacao: ["Acabamento vidro"] },
  { codigo: "AR-005", descricao: "Perfil H junção", linha: "Arremate", largura: 20, altura: 25, espessura: 1.0, peso: 0.220, tipo: "encaixe", aplicacao: ["Junção de vidros", "Policarbonato"] },
  { codigo: "AR-006", descricao: "Perfil F arremate", linha: "Arremate", largura: 25, altura: 10, espessura: 0.8, peso: 0.150, tipo: "arremate", aplicacao: ["Acabamento policarbonato"] },

  // ===== REFORÇOS =====
  { codigo: "RF-001", descricao: "Reforço tubo 20x20", linha: "Reforço", largura: 20, altura: 20, espessura: 1.2, peso: 0.280, tipo: "reforco", aplicacao: ["Reforço janela", "Reforço porta"] },
  { codigo: "RF-002", descricao: "Reforço tubo 30x20", linha: "Reforço", largura: 30, altura: 20, espessura: 1.2, peso: 0.360, tipo: "reforco", aplicacao: ["Reforço janela", "Reforço porta"] },
  { codigo: "RF-003", descricao: "Reforço tubo 40x20", linha: "Reforço", largura: 40, altura: 20, espessura: 1.5, peso: 0.480, tipo: "reforco", aplicacao: ["Reforço porta pesada"] },
  { codigo: "RF-004", descricao: "Reforço chato 30x3", linha: "Reforço", largura: 30, altura: 3, espessura: 3.0, peso: 0.240, tipo: "reforco", aplicacao: ["Reforço geral"] },

  // ===== GUARDA-CORPO =====
  { codigo: "GC-001", descricao: "Montante guarda-corpo tubular", linha: "Guarda-corpo", largura: 40, altura: 40, espessura: 2.0, peso: 0.740, tipo: "montante", aplicacao: ["Guarda-corpo sacada", "Guarda-corpo escada"] },
  { codigo: "GC-002", descricao: "Corrimão tubular redondo 50mm", linha: "Guarda-corpo", largura: 50, altura: 50, espessura: 1.5, peso: 0.580, tipo: "travessa", aplicacao: ["Corrimão", "Guarda-corpo"] },
  { codigo: "GC-003", descricao: "Travessa horizontal guarda-corpo", linha: "Guarda-corpo", largura: 25, altura: 25, espessura: 1.2, peso: 0.340, tipo: "travessa", aplicacao: ["Guarda-corpo sacada"] },
  { codigo: "GC-004", descricao: "Perfil U vidro guarda-corpo", linha: "Guarda-corpo", largura: 25, altura: 22, espessura: 2.0, peso: 0.420, tipo: "vidro", aplicacao: ["Guarda-corpo vidro"] },

  // ===== BOX BANHEIRO =====
  { codigo: "BX-001", descricao: "Trilho superior box", linha: "Box", largura: 20, altura: 25, espessura: 1.2, peso: 0.280, tipo: "trilho", aplicacao: ["Box banheiro"] },
  { codigo: "BX-002", descricao: "Trilho inferior box", linha: "Box", largura: 18, altura: 12, espessura: 1.2, peso: 0.220, tipo: "trilho", aplicacao: ["Box banheiro"] },
  { codigo: "BX-003", descricao: "Perfil lateral box", linha: "Box", largura: 18, altura: 25, espessura: 1.2, peso: 0.260, tipo: "montante", aplicacao: ["Box banheiro"] },
  { codigo: "BX-004", descricao: "Puxador box L", linha: "Box", largura: 15, altura: 150, espessura: 1.2, peso: 0.180, tipo: "puxador", aplicacao: ["Box banheiro"] },

  // ===== LINHA MODULAR (Esquadrias de abrir) =====
  { codigo: "MD-001", descricao: "Marco de giro inferior", linha: "Modular", largura: 44, altura: 60, espessura: 1.5, peso: 0.680, tipo: "marco", aplicacao: ["Janela de abrir", "Porta de abrir"] },
  { codigo: "MD-002", descricao: "Marco de giro superior", linha: "Modular", largura: 44, altura: 60, espessura: 1.5, peso: 0.690, tipo: "marco", aplicacao: ["Janela de abrir", "Porta de abrir"] },
  { codigo: "MD-003", descricao: "Marco de giro lateral", linha: "Modular", largura: 44, altura: 60, espessura: 1.5, peso: 0.670, tipo: "montante", aplicacao: ["Janela de abrir", "Porta de abrir"] },
  { codigo: "MD-004", descricao: "Folha de giro", linha: "Modular", largura: 44, altura: 52, espessura: 1.3, peso: 0.580, tipo: "folha", aplicacao: ["Janela de abrir"] },
  { codigo: "MD-005", descricao: "Batente vedação", linha: "Modular", largura: 20, altura: 15, espessura: 1.0, peso: 0.180, tipo: "batente", aplicacao: ["Janela de abrir", "Porta de abrir"] },

  // ===== ADAPTADORES =====
  { codigo: "AD-001", descricao: "Adaptador 3 para 4 polegadas", linha: "Adaptador", largura: 100, altura: 75, espessura: 1.5, peso: 0.580, tipo: "adaptador", aplicacao: ["Adaptação de vão"] },
  { codigo: "AD-002", descricao: "Adaptador requadro 2\"", linha: "Adaptador", largura: 50, altura: 50, espessura: 1.2, peso: 0.420, tipo: "adaptador", aplicacao: ["Requadro janela"] },
  { codigo: "AD-003", descricao: "Adaptador requadro 3\"", linha: "Adaptador", largura: 75, altura: 50, espessura: 1.2, peso: 0.520, tipo: "adaptador", aplicacao: ["Requadro janela", "Requadro porta"] },

  // ===== PERFIS ESPECIAIS =====
  { codigo: "SP-001", descricao: "Quebra-sol / brise horizontal", linha: "Especial", largura: 100, altura: 30, espessura: 1.5, peso: 0.680, tipo: "travessa", aplicacao: ["Brise horizontal", "Quebra-sol fachada"] },
  { codigo: "SP-002", descricao: "Quebra-sol / brise vertical", linha: "Especial", largura: 30, altura: 150, espessura: 1.5, peso: 0.820, tipo: "montante", aplicacao: ["Brise vertical", "Quebra-sol fachada"] },
  { codigo: "SP-003", descricao: "Pergolado tubo 80x40", linha: "Especial", largura: 80, altura: 40, espessura: 2.0, peso: 1.120, tipo: "travessa", aplicacao: ["Pergolado alumínio"] },
  { codigo: "SP-004", descricao: "Cobertura policarbonato perfil", linha: "Especial", largura: 50, altura: 50, espessura: 1.5, peso: 0.620, tipo: "travessa", aplicacao: ["Cobertura policarbonato", "Toldo fixo"] },

  // ===== LINHA INTEGRADA (Correr com ruptura térmica) =====
  { codigo: "IT-001", descricao: "Marco inferior c/ ruptura térmica", linha: "Integrada", largura: 92, altura: 28, espessura: 1.8, peso: 0.840, tipo: "marco", aplicacao: ["Janela acústica", "Janela térmica"] },
  { codigo: "IT-002", descricao: "Marco superior c/ ruptura térmica", linha: "Integrada", largura: 92, altura: 35, espessura: 1.8, peso: 0.920, tipo: "marco", aplicacao: ["Janela acústica", "Janela térmica"] },
  { codigo: "IT-003", descricao: "Folha c/ ruptura térmica", linha: "Integrada", largura: 38, altura: 50, espessura: 1.5, peso: 0.640, tipo: "folha", aplicacao: ["Janela acústica", "Janela térmica"] },
  { codigo: "IT-004", descricao: "Montante c/ ruptura térmica", linha: "Integrada", largura: 46, altura: 35, espessura: 1.8, peso: 0.720, tipo: "montante", aplicacao: ["Janela acústica", "Janela térmica"] },
];

// ==================== PRODUTOS COM PERFIS ====================

export const produtosEsquadria: ProdutoEsquadria[] = [
  {
    id: 1, nome: "Janela 2 Folhas de Vidro", tipo: "correr", largura: 2000, altura: 1000, folhas: 2, linha: "Suprema",
    perfis: [
      { perfilCodigo: "SU-003", medida: 1000, quantidade: 2, anguloEsquerdo: 90, anguloDireito: 90, posicao: "Altura" },
      { perfilCodigo: "SU-001", medida: 2000, quantidade: 1, anguloEsquerdo: 90, anguloDireito: 90, posicao: "Largura" },
      { perfilCodigo: "SU-002", medida: 2000, quantidade: 1, anguloEsquerdo: 90, anguloDireito: 90, posicao: "Largura" },
      { perfilCodigo: "SU-010", medida: 950, quantidade: 2, anguloEsquerdo: 90, anguloDireito: 90, posicao: "Altura" },
      { perfilCodigo: "SU-011", medida: 950, quantidade: 2, anguloEsquerdo: 90, anguloDireito: 90, posicao: "Altura" },
      { perfilCodigo: "SU-012", medida: 950, quantidade: 2, anguloEsquerdo: 90, anguloDireito: 90, posicao: "Largura" },
      { perfilCodigo: "SU-013", medida: 950, quantidade: 2, anguloEsquerdo: 90, anguloDireito: 90, posicao: "Largura" },
    ],
  },
  {
    id: 2, nome: "Janela 4 Folhas de Vidro", tipo: "correr", largura: 2400, altura: 1200, folhas: 4, linha: "Suprema",
    perfis: [
      { perfilCodigo: "SU-003", medida: 1200, quantidade: 2, anguloEsquerdo: 90, anguloDireito: 90, posicao: "Altura" },
      { perfilCodigo: "SU-006", medida: 2400, quantidade: 1, anguloEsquerdo: 90, anguloDireito: 90, posicao: "Largura" },
      { perfilCodigo: "SU-007", medida: 2400, quantidade: 1, anguloEsquerdo: 90, anguloDireito: 90, posicao: "Largura" },
      { perfilCodigo: "SU-010", medida: 1150, quantidade: 2, anguloEsquerdo: 90, anguloDireito: 90, posicao: "Altura" },
      { perfilCodigo: "SU-011", medida: 1150, quantidade: 2, anguloEsquerdo: 90, anguloDireito: 90, posicao: "Altura" },
      { perfilCodigo: "SU-012", medida: 570, quantidade: 4, anguloEsquerdo: 90, anguloDireito: 90, posicao: "Largura" },
      { perfilCodigo: "SU-013", medida: 570, quantidade: 4, anguloEsquerdo: 90, anguloDireito: 90, posicao: "Largura" },
    ],
  },
  {
    id: 3, nome: "Porta Pivotante", tipo: "pivotante", largura: 1200, altura: 2200, folhas: 1, linha: "Suprema",
    perfis: [
      { perfilCodigo: "SU-023", medida: 2200, quantidade: 2, anguloEsquerdo: 90, anguloDireito: 90, posicao: "Altura" },
      { perfilCodigo: "SU-023", medida: 1200, quantidade: 1, anguloEsquerdo: 90, anguloDireito: 90, posicao: "Largura" },
      { perfilCodigo: "SU-024", medida: 2150, quantidade: 2, anguloEsquerdo: 90, anguloDireito: 90, posicao: "Altura" },
      { perfilCodigo: "SU-024", medida: 1100, quantidade: 1, anguloEsquerdo: 90, anguloDireito: 90, posicao: "Largura" },
      { perfilCodigo: "SU-024", medida: 1100, quantidade: 1, anguloEsquerdo: 90, anguloDireito: 90, posicao: "Travessa" },
      { perfilCodigo: "RF-003", medida: 2100, quantidade: 2, anguloEsquerdo: 90, anguloDireito: 90, posicao: "Altura" },
    ],
  },
  {
    id: 4, nome: "Fachada Pele de Vidro", tipo: "fachada", largura: 3000, altura: 2500, folhas: 0, linha: "Fachada",
    perfis: [
      { perfilCodigo: "FC-001", medida: 2500, quantidade: 4, anguloEsquerdo: 90, anguloDireito: 90, posicao: "Altura" },
      { perfilCodigo: "FC-002", medida: 980, quantidade: 6, anguloEsquerdo: 90, anguloDireito: 90, posicao: "Largura" },
      { perfilCodigo: "FC-003", medida: 980, quantidade: 6, anguloEsquerdo: 90, anguloDireito: 90, posicao: "Largura" },
      { perfilCodigo: "FC-004", medida: 980, quantidade: 6, anguloEsquerdo: 90, anguloDireito: 90, posicao: "Largura" },
    ],
  },
  {
    id: 5, nome: "Box Banheiro 2 Folhas", tipo: "correr", largura: 1200, altura: 1900, folhas: 2, linha: "Box",
    perfis: [
      { perfilCodigo: "BX-001", medida: 1200, quantidade: 1, anguloEsquerdo: 90, anguloDireito: 90, posicao: "Largura" },
      { perfilCodigo: "BX-002", medida: 1200, quantidade: 1, anguloEsquerdo: 90, anguloDireito: 90, posicao: "Largura" },
      { perfilCodigo: "BX-003", medida: 1900, quantidade: 2, anguloEsquerdo: 90, anguloDireito: 90, posicao: "Altura" },
      { perfilCodigo: "BX-004", medida: 150, quantidade: 2, anguloEsquerdo: 90, anguloDireito: 90, posicao: "Altura" },
    ],
  },
  {
    id: 6, nome: "Janela Basculante", tipo: "basculante", largura: 800, altura: 600, folhas: 1, linha: "Basculante",
    perfis: [
      { perfilCodigo: "BA-001", medida: 800, quantidade: 1, anguloEsquerdo: 90, anguloDireito: 90, posicao: "Largura" },
      { perfilCodigo: "BA-002", medida: 800, quantidade: 1, anguloEsquerdo: 90, anguloDireito: 90, posicao: "Largura" },
      { perfilCodigo: "BA-003", medida: 600, quantidade: 2, anguloEsquerdo: 90, anguloDireito: 90, posicao: "Altura" },
      { perfilCodigo: "BA-004", medida: 750, quantidade: 2, anguloEsquerdo: 90, anguloDireito: 90, posicao: "Largura" },
      { perfilCodigo: "BA-004", medida: 550, quantidade: 2, anguloEsquerdo: 90, anguloDireito: 90, posicao: "Altura" },
    ],
  },
  {
    id: 7, nome: "Janela Maxim-Ar", tipo: "maxim-ar", largura: 1000, altura: 800, folhas: 1, linha: "Basculante",
    perfis: [
      { perfilCodigo: "BA-001", medida: 1000, quantidade: 1, anguloEsquerdo: 90, anguloDireito: 90, posicao: "Largura" },
      { perfilCodigo: "BA-002", medida: 1000, quantidade: 1, anguloEsquerdo: 90, anguloDireito: 90, posicao: "Largura" },
      { perfilCodigo: "BA-003", medida: 800, quantidade: 2, anguloEsquerdo: 90, anguloDireito: 90, posicao: "Altura" },
      { perfilCodigo: "BA-005", medida: 950, quantidade: 2, anguloEsquerdo: 90, anguloDireito: 90, posicao: "Largura" },
      { perfilCodigo: "BA-005", medida: 750, quantidade: 2, anguloEsquerdo: 90, anguloDireito: 90, posicao: "Altura" },
    ],
  },
  {
    id: 8, nome: "Porta de Correr 2 Folhas", tipo: "correr", largura: 1600, altura: 2100, folhas: 2, linha: "Porta Correr",
    perfis: [
      { perfilCodigo: "PC-001", medida: 1600, quantidade: 1, anguloEsquerdo: 90, anguloDireito: 90, posicao: "Largura" },
      { perfilCodigo: "PC-002", medida: 1600, quantidade: 1, anguloEsquerdo: 90, anguloDireito: 90, posicao: "Largura" },
      { perfilCodigo: "PC-003", medida: 2100, quantidade: 2, anguloEsquerdo: 90, anguloDireito: 90, posicao: "Altura" },
      { perfilCodigo: "PC-004", medida: 2050, quantidade: 4, anguloEsquerdo: 90, anguloDireito: 90, posicao: "Altura" },
      { perfilCodigo: "PC-005", medida: 750, quantidade: 2, anguloEsquerdo: 90, anguloDireito: 90, posicao: "Largura" },
      { perfilCodigo: "PC-006", medida: 150, quantidade: 2, anguloEsquerdo: 90, anguloDireito: 90, posicao: "Altura" },
    ],
  },
  {
    id: 9, nome: "Guarda-Corpo Sacada", tipo: "fachada", largura: 2000, altura: 1100, folhas: 0, linha: "Guarda-corpo",
    perfis: [
      { perfilCodigo: "GC-001", medida: 1100, quantidade: 3, anguloEsquerdo: 90, anguloDireito: 90, posicao: "Altura" },
      { perfilCodigo: "GC-002", medida: 2000, quantidade: 1, anguloEsquerdo: 90, anguloDireito: 90, posicao: "Largura" },
      { perfilCodigo: "GC-003", medida: 980, quantidade: 2, anguloEsquerdo: 90, anguloDireito: 90, posicao: "Largura" },
      { perfilCodigo: "GC-004", medida: 980, quantidade: 2, anguloEsquerdo: 90, anguloDireito: 90, posicao: "Largura" },
    ],
  },
  {
    id: 10, nome: "Veneziana de Correr 4 Folhas", tipo: "veneziana", largura: 2400, altura: 1200, folhas: 4, linha: "Veneziana",
    perfis: [
      { perfilCodigo: "VZ-001", medida: 2400, quantidade: 2, anguloEsquerdo: 90, anguloDireito: 90, posicao: "Largura" },
      { perfilCodigo: "SU-003", medida: 1200, quantidade: 2, anguloEsquerdo: 90, anguloDireito: 90, posicao: "Altura" },
      { perfilCodigo: "VZ-002", medida: 1150, quantidade: 8, anguloEsquerdo: 90, anguloDireito: 90, posicao: "Altura" },
      { perfilCodigo: "VZ-005", medida: 570, quantidade: 8, anguloEsquerdo: 90, anguloDireito: 90, posicao: "Largura" },
      { perfilCodigo: "VZ-003", medida: 540, quantidade: 40, anguloEsquerdo: 90, anguloDireito: 90, posicao: "Largura" },
    ],
  },
];

// Helper function
export function getPerfilByCodigo(codigo: string): PerfilAluminio | undefined {
  return perfisAluminio.find(p => p.codigo === codigo);
}

export function getProdutoById(id: number): ProdutoEsquadria | undefined {
  return produtosEsquadria.find(p => p.id === id);
}
