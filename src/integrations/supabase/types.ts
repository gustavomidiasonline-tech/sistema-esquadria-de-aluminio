export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      accessories: {
        Row: {
          ativo: boolean
          codigo: string
          company_id: string | null
          created_at: string
          descricao: string | null
          fornecedor: string | null
          id: string
          nome: string
          peso_unitario_kg: number | null
          preco_unitario: number
          tipo: string | null
          unidade: string
        }
        Insert: {
          ativo?: boolean
          codigo: string
          company_id?: string | null
          created_at?: string
          descricao?: string | null
          fornecedor?: string | null
          id?: string
          nome: string
          peso_unitario_kg?: number | null
          preco_unitario?: number
          tipo?: string | null
          unidade?: string
        }
        Update: {
          ativo?: boolean
          codigo?: string
          company_id?: string | null
          created_at?: string
          descricao?: string | null
          fornecedor?: string | null
          id?: string
          nome?: string
          peso_unitario_kg?: number | null
          preco_unitario?: number
          tipo?: string | null
          unidade?: string
        }
        Relationships: [
          {
            foreignKeyName: "accessories_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      agenda_eventos: {
        Row: {
          cliente_id: string | null
          company_id: string | null
          cor: string | null
          created_at: string
          created_by: string | null
          data_fim: string | null
          data_inicio: string
          descricao: string | null
          dia_inteiro: boolean
          endereco: string | null
          id: string
          observacoes: string | null
          pedido_id: string | null
          responsavel: string | null
          servico_id: string | null
          status: string
          tipo: string
          titulo: string
          updated_at: string
        }
        Insert: {
          cliente_id?: string | null
          company_id?: string | null
          cor?: string | null
          created_at?: string
          created_by?: string | null
          data_fim?: string | null
          data_inicio: string
          descricao?: string | null
          dia_inteiro?: boolean
          endereco?: string | null
          id?: string
          observacoes?: string | null
          pedido_id?: string | null
          responsavel?: string | null
          servico_id?: string | null
          status?: string
          tipo?: string
          titulo: string
          updated_at?: string
        }
        Update: {
          cliente_id?: string | null
          company_id?: string | null
          cor?: string | null
          created_at?: string
          created_by?: string | null
          data_fim?: string | null
          data_inicio?: string
          descricao?: string | null
          dia_inteiro?: boolean
          endereco?: string | null
          id?: string
          observacoes?: string | null
          pedido_id?: string | null
          responsavel?: string | null
          servico_id?: string | null
          status?: string
          tipo?: string
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agenda_eventos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agenda_eventos_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agenda_eventos_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agenda_eventos_servico_id_fkey"
            columns: ["servico_id"]
            isOneToOne: false
            referencedRelation: "servicos"
            referencedColumns: ["id"]
          },
        ]
      }
      catalog_profiles: {
        Row: {
          code: string
          company_id: string
          created_at: string | null
          description: string | null
          drawing_url: string | null
          id: string
        }
        Insert: {
          code: string
          company_id: string
          created_at?: string | null
          description?: string | null
          drawing_url?: string | null
          id?: string
        }
        Update: {
          code?: string
          company_id?: string
          created_at?: string | null
          description?: string | null
          drawing_url?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "catalog_profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      clientes: {
        Row: {
          cep: string | null
          cidade: string | null
          company_id: string | null
          cpf_cnpj: string | null
          created_at: string
          created_by: string | null
          email: string | null
          endereco: string | null
          estado: string | null
          id: string
          nome: string
          observacoes: string | null
          telefone: string | null
          updated_at: string
        }
        Insert: {
          cep?: string | null
          cidade?: string | null
          company_id?: string | null
          cpf_cnpj?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          nome: string
          observacoes?: string | null
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          cep?: string | null
          cidade?: string | null
          company_id?: string | null
          cpf_cnpj?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
          telefone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clientes_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          cep: string | null
          cidade: string | null
          cnpj: string | null
          created_at: string
          email: string | null
          endereco: string | null
          estado: string | null
          id: string
          max_usuarios: number | null
          nome: string
          plano: string
          status: string
          telefone: string | null
          updated_at: string
        }
        Insert: {
          cep?: string | null
          cidade?: string | null
          cnpj?: string | null
          created_at?: string
          email?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          max_usuarios?: number | null
          nome: string
          plano?: string
          status?: string
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          cep?: string | null
          cidade?: string | null
          cnpj?: string | null
          created_at?: string
          email?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          max_usuarios?: number | null
          nome?: string
          plano?: string
          status?: string
          telefone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      componentes_modelo: {
        Row: {
          company_id: string | null
          created_at: string
          esquadria_id: string
          formula_calculo: string
          id: string
          perfil_id: string | null
          posicao: string | null
          quantidade: number
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          esquadria_id: string
          formula_calculo: string
          id?: string
          perfil_id?: string | null
          posicao?: string | null
          quantidade?: number
        }
        Update: {
          company_id?: string | null
          created_at?: string
          esquadria_id?: string
          formula_calculo?: string
          id?: string
          perfil_id?: string | null
          posicao?: string | null
          quantidade?: number
        }
        Relationships: [
          {
            foreignKeyName: "componentes_modelo_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "componentes_modelo_esquadria_id_fkey"
            columns: ["esquadria_id"]
            isOneToOne: false
            referencedRelation: "modelos_esquadria"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "componentes_modelo_perfil_id_fkey"
            columns: ["perfil_id"]
            isOneToOne: false
            referencedRelation: "perfis_catalogo"
            referencedColumns: ["id"]
          },
        ]
      }
      config_precos: {
        Row: {
          chave: string
          company_id: string | null
          descricao: string | null
          id: string
          unidade: string | null
          updated_at: string
          updated_by: string | null
          valor: number
        }
        Insert: {
          chave: string
          company_id?: string | null
          descricao?: string | null
          id?: string
          unidade?: string | null
          updated_at?: string
          updated_by?: string | null
          valor?: number
        }
        Update: {
          chave?: string
          company_id?: string | null
          descricao?: string | null
          id?: string
          unidade?: string | null
          updated_at?: string
          updated_by?: string | null
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "config_precos_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      contas_pagar: {
        Row: {
          categoria: string | null
          company_id: string | null
          created_at: string
          created_by: string | null
          data_pagamento: string | null
          data_vencimento: string
          descricao: string
          forma_pagamento: string | null
          fornecedor: string
          fornecedor_id: string | null
          id: string
          observacoes: string | null
          status: Database["public"]["Enums"]["conta_status"]
          updated_at: string
          valor: number
        }
        Insert: {
          categoria?: string | null
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          data_pagamento?: string | null
          data_vencimento: string
          descricao: string
          forma_pagamento?: string | null
          fornecedor: string
          fornecedor_id?: string | null
          id?: string
          observacoes?: string | null
          status?: Database["public"]["Enums"]["conta_status"]
          updated_at?: string
          valor: number
        }
        Update: {
          categoria?: string | null
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          data_pagamento?: string | null
          data_vencimento?: string
          descricao?: string
          forma_pagamento?: string | null
          fornecedor?: string
          fornecedor_id?: string | null
          id?: string
          observacoes?: string | null
          status?: Database["public"]["Enums"]["conta_status"]
          updated_at?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "contas_pagar_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contas_pagar_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id"]
          },
        ]
      }
      contas_receber: {
        Row: {
          cliente_id: string | null
          company_id: string | null
          created_at: string
          created_by: string | null
          data_pagamento: string | null
          data_vencimento: string
          descricao: string
          forma_pagamento: string | null
          id: string
          observacoes: string | null
          pedido_id: string | null
          status: Database["public"]["Enums"]["conta_status"]
          updated_at: string
          valor: number
        }
        Insert: {
          cliente_id?: string | null
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          data_pagamento?: string | null
          data_vencimento: string
          descricao: string
          forma_pagamento?: string | null
          id?: string
          observacoes?: string | null
          pedido_id?: string | null
          status?: Database["public"]["Enums"]["conta_status"]
          updated_at?: string
          valor: number
        }
        Update: {
          cliente_id?: string | null
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          data_pagamento?: string | null
          data_vencimento?: string
          descricao?: string
          forma_pagamento?: string | null
          id?: string
          observacoes?: string | null
          pedido_id?: string | null
          status?: Database["public"]["Enums"]["conta_status"]
          updated_at?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "contas_receber_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contas_receber_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contas_receber_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
        ]
      }
      contratos: {
        Row: {
          arquivo_url: string | null
          cliente_id: string | null
          company_id: string | null
          created_at: string
          created_by: string | null
          data_fim: string | null
          data_inicio: string | null
          descricao: string | null
          id: string
          status: Database["public"]["Enums"]["contrato_status"]
          titulo: string
          updated_at: string
          valor: number | null
        }
        Insert: {
          arquivo_url?: string | null
          cliente_id?: string | null
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          descricao?: string | null
          id?: string
          status?: Database["public"]["Enums"]["contrato_status"]
          titulo: string
          updated_at?: string
          valor?: number | null
        }
        Update: {
          arquivo_url?: string | null
          cliente_id?: string | null
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          descricao?: string | null
          id?: string
          status?: Database["public"]["Enums"]["contrato_status"]
          titulo?: string
          updated_at?: string
          valor?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "contratos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contratos_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      cut_rules: {
        Row: {
          angle: string | null
          axis: string
          created_at: string | null
          formula: string
          id: string
          product_id: string
          profile_id: string
          quantity: number | null
        }
        Insert: {
          angle?: string | null
          axis: string
          created_at?: string | null
          formula: string
          id?: string
          product_id: string
          profile_id: string
          quantity?: number | null
        }
        Update: {
          angle?: string | null
          axis?: string
          created_at?: string | null
          formula?: string
          id?: string
          product_id?: string
          profile_id?: string
          quantity?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cut_rules_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "mt_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cut_rules_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "catalog_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      documentos: {
        Row: {
          arquivo_url: string | null
          cliente_id: string | null
          company_id: string | null
          created_at: string
          created_by: string | null
          descricao: string | null
          id: string
          tamanho_bytes: number | null
          tipo: string | null
          titulo: string
        }
        Insert: {
          arquivo_url?: string | null
          cliente_id?: string | null
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          descricao?: string | null
          id?: string
          tamanho_bytes?: number | null
          tipo?: string | null
          titulo: string
        }
        Update: {
          arquivo_url?: string | null
          cliente_id?: string | null
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          descricao?: string | null
          id?: string
          tamanho_bytes?: number | null
          tipo?: string | null
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "documentos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentos_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      fabricantes: {
        Row: {
          cnpj: string | null
          company_id: string | null
          contato: string | null
          created_at: string
          id: string
          nome: string
        }
        Insert: {
          cnpj?: string | null
          company_id?: string | null
          contato?: string | null
          created_at?: string
          id?: string
          nome: string
        }
        Update: {
          cnpj?: string | null
          company_id?: string | null
          contato?: string | null
          created_at?: string
          id?: string
          nome?: string
        }
        Relationships: [
          {
            foreignKeyName: "fabricantes_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      ferragens: {
        Row: {
          aplicacao: string | null
          company_id: string | null
          created_at: string
          fabricante: string | null
          id: string
          nome: string
          tipo: string | null
        }
        Insert: {
          aplicacao?: string | null
          company_id?: string | null
          created_at?: string
          fabricante?: string | null
          id?: string
          nome: string
          tipo?: string | null
        }
        Update: {
          aplicacao?: string | null
          company_id?: string | null
          created_at?: string
          fabricante?: string | null
          id?: string
          nome?: string
          tipo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ferragens_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      fornecedores: {
        Row: {
          ativo: boolean
          categoria: string | null
          cep: string | null
          cidade: string | null
          company_id: string | null
          contato: string | null
          cpf_cnpj: string | null
          created_at: string
          created_by: string | null
          email: string | null
          endereco: string | null
          estado: string | null
          id: string
          nome: string
          observacoes: string | null
          razao_social: string | null
          telefone: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          categoria?: string | null
          cep?: string | null
          cidade?: string | null
          company_id?: string | null
          contato?: string | null
          cpf_cnpj?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          nome: string
          observacoes?: string | null
          razao_social?: string | null
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          categoria?: string | null
          cep?: string | null
          cidade?: string | null
          company_id?: string | null
          contato?: string | null
          cpf_cnpj?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
          razao_social?: string | null
          telefone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fornecedores_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      glass_types: {
        Row: {
          ativo: boolean
          codigo: string
          company_id: string | null
          cor: string | null
          created_at: string
          espessura_mm: number
          fornecedor: string | null
          id: string
          nome: string
          peso_m2_kg: number | null
          preco_m2: number
          tipo: string | null
        }
        Insert: {
          ativo?: boolean
          codigo: string
          company_id?: string | null
          cor?: string | null
          created_at?: string
          espessura_mm?: number
          fornecedor?: string | null
          id?: string
          nome: string
          peso_m2_kg?: number | null
          preco_m2?: number
          tipo?: string | null
        }
        Update: {
          ativo?: boolean
          codigo?: string
          company_id?: string | null
          cor?: string | null
          created_at?: string
          espessura_mm?: number
          fornecedor?: string | null
          id?: string
          nome?: string
          peso_m2_kg?: number | null
          preco_m2?: number
          tipo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "glass_types_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      hardware: {
        Row: {
          ativo: boolean
          codigo: string
          company_id: string | null
          created_at: string
          descricao: string | null
          fornecedor: string | null
          id: string
          nome: string
          peso_unitario_kg: number | null
          preco_unitario: number
          tipo: string | null
          unidade: string
        }
        Insert: {
          ativo?: boolean
          codigo: string
          company_id?: string | null
          created_at?: string
          descricao?: string | null
          fornecedor?: string | null
          id?: string
          nome: string
          peso_unitario_kg?: number | null
          preco_unitario?: number
          tipo?: string | null
          unidade?: string
        }
        Update: {
          ativo?: boolean
          codigo?: string
          company_id?: string | null
          created_at?: string
          descricao?: string | null
          fornecedor?: string | null
          id?: string
          nome?: string
          peso_unitario_kg?: number | null
          preco_unitario?: number
          tipo?: string | null
          unidade?: string
        }
        Relationships: [
          {
            foreignKeyName: "hardware_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      linhas: {
        Row: {
          aplicacao: string | null
          categoria: string | null
          company_id: string | null
          created_at: string
          espessura_mm: number | null
          fabricante_id: string | null
          id: string
          nome: string
        }
        Insert: {
          aplicacao?: string | null
          categoria?: string | null
          company_id?: string | null
          created_at?: string
          espessura_mm?: number | null
          fabricante_id?: string | null
          id?: string
          nome: string
        }
        Update: {
          aplicacao?: string | null
          categoria?: string | null
          company_id?: string | null
          created_at?: string
          espessura_mm?: number | null
          fabricante_id?: string | null
          id?: string
          nome?: string
        }
        Relationships: [
          {
            foreignKeyName: "linhas_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "linhas_fabricante_id_fkey"
            columns: ["fabricante_id"]
            isOneToOne: false
            referencedRelation: "fabricantes"
            referencedColumns: ["id"]
          },
        ]
      }
      lista_corte: {
        Row: {
          company_id: string | null
          comprimento_mm: number
          created_at: string
          id: string
          perfil_codigo: string | null
          perfil_id: string | null
          perfil_nome: string | null
          posicao: string | null
          projeto_id: string
          quantidade: number
        }
        Insert: {
          company_id?: string | null
          comprimento_mm: number
          created_at?: string
          id?: string
          perfil_codigo?: string | null
          perfil_id?: string | null
          perfil_nome?: string | null
          posicao?: string | null
          projeto_id: string
          quantidade?: number
        }
        Update: {
          company_id?: string | null
          comprimento_mm?: number
          created_at?: string
          id?: string
          perfil_codigo?: string | null
          perfil_id?: string | null
          perfil_nome?: string | null
          posicao?: string | null
          projeto_id?: string
          quantidade?: number
        }
        Relationships: [
          {
            foreignKeyName: "lista_corte_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lista_corte_perfil_id_fkey"
            columns: ["perfil_id"]
            isOneToOne: false
            referencedRelation: "perfis_catalogo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lista_corte_projeto_id_fkey"
            columns: ["projeto_id"]
            isOneToOne: false
            referencedRelation: "projetos_esquadria"
            referencedColumns: ["id"]
          },
        ]
      }
      materials_list: {
        Row: {
          accessory_id: string | null
          company_id: string
          created_at: string
          custo_total: number | null
          custo_unitario: number
          descricao: string
          disponivel_estoque: boolean | null
          glass_type_id: string | null
          hardware_id: string | null
          id: string
          orcamento_id: string | null
          perfil_aluminio_id: string | null
          production_order_id: string | null
          quantidade: number
          unidade: string
        }
        Insert: {
          accessory_id?: string | null
          company_id: string
          created_at?: string
          custo_unitario?: number
          descricao: string
          disponivel_estoque?: boolean | null
          glass_type_id?: string | null
          hardware_id?: string | null
          id?: string
          orcamento_id?: string | null
          perfil_aluminio_id?: string | null
          production_order_id?: string | null
          quantidade: number
          unidade?: string
        }
        Update: {
          accessory_id?: string | null
          company_id?: string
          created_at?: string
          custo_unitario?: number
          descricao?: string
          disponivel_estoque?: boolean | null
          glass_type_id?: string | null
          hardware_id?: string | null
          id?: string
          orcamento_id?: string | null
          perfil_aluminio_id?: string | null
          production_order_id?: string | null
          quantidade?: number
          unidade?: string
        }
        Relationships: [
          {
            foreignKeyName: "materials_list_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "materials_list_production_order_id_fkey"
            columns: ["production_order_id"]
            isOneToOne: false
            referencedRelation: "production_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "materials_list_orcamento_id_fkey"
            columns: ["orcamento_id"]
            isOneToOne: false
            referencedRelation: "orcamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "materials_list_perfil_aluminio_id_fkey"
            columns: ["perfil_aluminio_id"]
            isOneToOne: false
            referencedRelation: "perfis_aluminio"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "materials_list_glass_type_id_fkey"
            columns: ["glass_type_id"]
            isOneToOne: false
            referencedRelation: "glass_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "materials_list_hardware_id_fkey"
            columns: ["hardware_id"]
            isOneToOne: false
            referencedRelation: "hardware"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "materials_list_accessory_id_fkey"
            columns: ["accessory_id"]
            isOneToOne: false
            referencedRelation: "accessories"
            referencedColumns: ["id"]
          },
        ]
      }
      modelos_esquadria: {
        Row: {
          altura_max_mm: number | null
          altura_min_mm: number | null
          categoria: string
          company_id: string | null
          created_at: string
          folhas: number | null
          id: string
          largura_max_mm: number | null
          largura_min_mm: number | null
          linha_id: string | null
          nome: string
          tipo: string
        }
        Insert: {
          altura_max_mm?: number | null
          altura_min_mm?: number | null
          categoria?: string
          company_id?: string | null
          created_at?: string
          folhas?: number | null
          id?: string
          largura_max_mm?: number | null
          largura_min_mm?: number | null
          linha_id?: string | null
          nome: string
          tipo: string
        }
        Update: {
          altura_max_mm?: number | null
          altura_min_mm?: number | null
          categoria?: string
          company_id?: string | null
          created_at?: string
          folhas?: number | null
          id?: string
          largura_max_mm?: number | null
          largura_min_mm?: number | null
          linha_id?: string | null
          nome?: string
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "modelos_esquadria_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "modelos_esquadria_linha_id_fkey"
            columns: ["linha_id"]
            isOneToOne: false
            referencedRelation: "linhas"
            referencedColumns: ["id"]
          },
        ]
      }
      mt_products: {
        Row: {
          company_id: string
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          name: string
        }
        Insert: {
          company_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
        }
        Update: {
          company_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "mt_products_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      notas_fiscais: {
        Row: {
          cliente_id: string | null
          company_id: string | null
          created_at: string
          created_by: string | null
          data_emissao: string | null
          descricao: string | null
          id: string
          numero: string | null
          pdf_url: string | null
          pedido_id: string | null
          status: Database["public"]["Enums"]["nf_status"]
          tipo: Database["public"]["Enums"]["nf_tipo"]
          updated_at: string
          valor: number
          xml_url: string | null
        }
        Insert: {
          cliente_id?: string | null
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          data_emissao?: string | null
          descricao?: string | null
          id?: string
          numero?: string | null
          pdf_url?: string | null
          pedido_id?: string | null
          status?: Database["public"]["Enums"]["nf_status"]
          tipo?: Database["public"]["Enums"]["nf_tipo"]
          updated_at?: string
          valor: number
          xml_url?: string | null
        }
        Update: {
          cliente_id?: string | null
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          data_emissao?: string | null
          descricao?: string | null
          id?: string
          numero?: string | null
          pdf_url?: string | null
          pedido_id?: string | null
          status?: Database["public"]["Enums"]["nf_status"]
          tipo?: Database["public"]["Enums"]["nf_tipo"]
          updated_at?: string
          valor?: number
          xml_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notas_fiscais_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notas_fiscais_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notas_fiscais_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
        ]
      }
      orcamento_itens: {
        Row: {
          altura: number | null
          area_vidro_m2: number | null
          company_id: string | null
          created_at: string
          custo_acessorios: number | null
          custo_aluminio: number | null
          custo_ferragem: number | null
          custo_mao_obra: number | null
          custo_total: number | null
          custo_vidro: number | null
          descricao: string
          id: string
          largura: number | null
          lucro: number | null
          markup_percentual: number | null
          orcamento_id: string
          peso_total_kg: number | null
          produto_id: string | null
          quantidade: number
          tipo_vidro: string | null
          valor_total: number
          valor_unitario: number
        }
        Insert: {
          altura?: number | null
          area_vidro_m2?: number | null
          company_id?: string | null
          created_at?: string
          custo_acessorios?: number | null
          custo_aluminio?: number | null
          custo_ferragem?: number | null
          custo_mao_obra?: number | null
          custo_total?: number | null
          custo_vidro?: number | null
          descricao: string
          id?: string
          largura?: number | null
          lucro?: number | null
          markup_percentual?: number | null
          orcamento_id: string
          peso_total_kg?: number | null
          produto_id?: string | null
          quantidade?: number
          tipo_vidro?: string | null
          valor_total?: number
          valor_unitario?: number
        }
        Update: {
          altura?: number | null
          area_vidro_m2?: number | null
          company_id?: string | null
          created_at?: string
          custo_acessorios?: number | null
          custo_aluminio?: number | null
          custo_ferragem?: number | null
          custo_mao_obra?: number | null
          custo_total?: number | null
          custo_vidro?: number | null
          descricao?: string
          id?: string
          largura?: number | null
          lucro?: number | null
          markup_percentual?: number | null
          orcamento_id?: string
          peso_total_kg?: number | null
          produto_id?: string | null
          quantidade?: number
          tipo_vidro?: string | null
          valor_total?: number
          valor_unitario?: number
        }
        Relationships: [
          {
            foreignKeyName: "orcamento_itens_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orcamento_itens_orcamento_id_fkey"
            columns: ["orcamento_id"]
            isOneToOne: false
            referencedRelation: "orcamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orcamento_itens_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      orcamentos: {
        Row: {
          cliente_id: string | null
          company_id: string | null
          created_at: string
          created_by: string | null
          descricao: string | null
          id: string
          numero: number
          observacoes: string | null
          status: Database["public"]["Enums"]["orcamento_status"]
          updated_at: string
          validade: string | null
          valor_total: number | null
        }
        Insert: {
          cliente_id?: string | null
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          descricao?: string | null
          id?: string
          numero?: number
          observacoes?: string | null
          status?: Database["public"]["Enums"]["orcamento_status"]
          updated_at?: string
          validade?: string | null
          valor_total?: number | null
        }
        Update: {
          cliente_id?: string | null
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          descricao?: string | null
          id?: string
          numero?: number
          observacoes?: string | null
          status?: Database["public"]["Enums"]["orcamento_status"]
          updated_at?: string
          validade?: string | null
          valor_total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "orcamentos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orcamentos_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      order_progress: {
        Row: {
          company_id: string | null
          completed_at: string | null
          completed_by: string | null
          created_at: string | null
          data: Json | null
          id: string
          pedido_id: string
          stage_id: string
          status: string
          updated_at: string | null
        }
        Insert: {
          company_id?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          data?: Json | null
          id?: string
          pedido_id: string
          stage_id: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          company_id?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          data?: Json | null
          id?: string
          pedido_id?: string
          stage_id?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_progress_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_progress_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_progress_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "workflow_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      pagamentos: {
        Row: {
          cliente_id: string | null
          company_id: string | null
          comprovante_url: string | null
          conta_pagar_id: string | null
          conta_receber_id: string | null
          created_at: string
          created_by: string | null
          data_pagamento: string
          descricao: string
          forma_pagamento: string | null
          fornecedor_id: string | null
          id: string
          observacoes: string | null
          tipo: string
          updated_at: string
          valor: number
        }
        Insert: {
          cliente_id?: string | null
          company_id?: string | null
          comprovante_url?: string | null
          conta_pagar_id?: string | null
          conta_receber_id?: string | null
          created_at?: string
          created_by?: string | null
          data_pagamento?: string
          descricao: string
          forma_pagamento?: string | null
          fornecedor_id?: string | null
          id?: string
          observacoes?: string | null
          tipo?: string
          updated_at?: string
          valor: number
        }
        Update: {
          cliente_id?: string | null
          company_id?: string | null
          comprovante_url?: string | null
          conta_pagar_id?: string | null
          conta_receber_id?: string | null
          created_at?: string
          created_by?: string | null
          data_pagamento?: string
          descricao?: string
          forma_pagamento?: string | null
          fornecedor_id?: string | null
          id?: string
          observacoes?: string | null
          tipo?: string
          updated_at?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "pagamentos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagamentos_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagamentos_conta_pagar_id_fkey"
            columns: ["conta_pagar_id"]
            isOneToOne: false
            referencedRelation: "contas_pagar"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagamentos_conta_receber_id_fkey"
            columns: ["conta_receber_id"]
            isOneToOne: false
            referencedRelation: "contas_receber"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagamentos_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id"]
          },
        ]
      }
      pedido_itens: {
        Row: {
          altura: number | null
          company_id: string | null
          created_at: string
          descricao: string
          id: string
          largura: number | null
          pedido_id: string
          produto_id: string | null
          quantidade: number
          valor_total: number
          valor_unitario: number
        }
        Insert: {
          altura?: number | null
          company_id?: string | null
          created_at?: string
          descricao: string
          id?: string
          largura?: number | null
          pedido_id: string
          produto_id?: string | null
          quantidade?: number
          valor_total?: number
          valor_unitario?: number
        }
        Update: {
          altura?: number | null
          company_id?: string | null
          created_at?: string
          descricao?: string
          id?: string
          largura?: number | null
          pedido_id?: string
          produto_id?: string | null
          quantidade?: number
          valor_total?: number
          valor_unitario?: number
        }
        Relationships: [
          {
            foreignKeyName: "pedido_itens_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedido_itens_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedido_itens_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      pedidos: {
        Row: {
          cliente_id: string | null
          company_id: string | null
          created_at: string
          created_by: string | null
          data_entrega: string | null
          endereco_entrega: string | null
          id: string
          numero: number
          observacoes: string | null
          orcamento_id: string | null
          status: Database["public"]["Enums"]["pedido_status"]
          updated_at: string
          valor_total: number | null
          vendedor: string | null
        }
        Insert: {
          cliente_id?: string | null
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          data_entrega?: string | null
          endereco_entrega?: string | null
          id?: string
          numero?: number
          observacoes?: string | null
          orcamento_id?: string | null
          status?: Database["public"]["Enums"]["pedido_status"]
          updated_at?: string
          valor_total?: number | null
          vendedor?: string | null
        }
        Update: {
          cliente_id?: string | null
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          data_entrega?: string | null
          endereco_entrega?: string | null
          id?: string
          numero?: number
          observacoes?: string | null
          orcamento_id?: string | null
          status?: Database["public"]["Enums"]["pedido_status"]
          updated_at?: string
          valor_total?: number | null
          vendedor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pedidos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedidos_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedidos_orcamento_id_fkey"
            columns: ["orcamento_id"]
            isOneToOne: false
            referencedRelation: "orcamentos"
            referencedColumns: ["id"]
          },
        ]
      }
      perfis_aluminio: {
        Row: {
          angulo_direito: number | null
          angulo_esquerdo: number | null
          codigo: string
          company_id: string | null
          created_at: string
          descricao: string | null
          id: string
          medida: number
          peso_metro: number | null
          posicao: string
          produto_id: string
          quantidade: number
        }
        Insert: {
          angulo_direito?: number | null
          angulo_esquerdo?: number | null
          codigo: string
          company_id?: string | null
          created_at?: string
          descricao?: string | null
          id?: string
          medida: number
          peso_metro?: number | null
          posicao: string
          produto_id: string
          quantidade?: number
        }
        Update: {
          angulo_direito?: number | null
          angulo_esquerdo?: number | null
          codigo?: string
          company_id?: string | null
          created_at?: string
          descricao?: string | null
          id?: string
          medida?: number
          peso_metro?: number | null
          posicao?: string
          produto_id?: string
          quantidade?: number
        }
        Relationships: [
          {
            foreignKeyName: "perfis_aluminio_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "perfis_aluminio_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      perfis_catalogo: {
        Row: {
          codigo: string
          company_id: string | null
          comprimento_padrao_mm: number | null
          created_at: string
          espessura_mm: number | null
          id: string
          linha_id: string | null
          nome: string
          peso_kg_m: number | null
          tipo: string
        }
        Insert: {
          codigo: string
          company_id?: string | null
          comprimento_padrao_mm?: number | null
          created_at?: string
          espessura_mm?: number | null
          id?: string
          linha_id?: string | null
          nome: string
          peso_kg_m?: number | null
          tipo: string
        }
        Update: {
          codigo?: string
          company_id?: string | null
          comprimento_padrao_mm?: number | null
          created_at?: string
          espessura_mm?: number | null
          id?: string
          linha_id?: string | null
          nome?: string
          peso_kg_m?: number | null
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "perfis_catalogo_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "perfis_catalogo_linha_id_fkey"
            columns: ["linha_id"]
            isOneToOne: false
            referencedRelation: "linhas"
            referencedColumns: ["id"]
          },
        ]
      }
      planos_de_corte: {
        Row: {
          altura: number
          company_id: string | null
          created_at: string
          created_by: string | null
          descricao: string | null
          id: string
          largura: number
          produto_id: string | null
          updated_at: string
        }
        Insert: {
          altura: number
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          descricao?: string | null
          id?: string
          largura: number
          produto_id?: string | null
          updated_at?: string
        }
        Update: {
          altura?: number
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          descricao?: string | null
          id?: string
          largura?: number
          produto_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "planos_de_corte_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "planos_de_corte_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      produtos: {
        Row: {
          altura_padrao: number | null
          ativo: boolean | null
          company_id: string | null
          created_at: string
          descricao: string | null
          folhas: number | null
          id: string
          largura_padrao: number | null
          nome: string
          preco: number | null
          tipo: string
          updated_at: string
        }
        Insert: {
          altura_padrao?: number | null
          ativo?: boolean | null
          company_id?: string | null
          created_at?: string
          descricao?: string | null
          folhas?: number | null
          id?: string
          largura_padrao?: number | null
          nome: string
          preco?: number | null
          tipo: string
          updated_at?: string
        }
        Update: {
          altura_padrao?: number | null
          ativo?: boolean | null
          company_id?: string | null
          created_at?: string
          descricao?: string | null
          folhas?: number | null
          id?: string
          largura_padrao?: number | null
          nome?: string
          preco?: number | null
          tipo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "produtos_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      production_order_items: {
        Row: {
          comprimento_mm: number
          created_at: string
          id: string
          pedido_item_id: string | null
          perfil_aluminio_id: string | null
          posicao: string | null
          production_order_id: string
          quantidade: number
          status: string
          window_part_id: string | null
        }
        Insert: {
          comprimento_mm: number
          created_at?: string
          id?: string
          pedido_item_id?: string | null
          perfil_aluminio_id?: string | null
          posicao?: string | null
          production_order_id: string
          quantidade?: number
          status?: string
          window_part_id?: string | null
        }
        Update: {
          comprimento_mm?: number
          created_at?: string
          id?: string
          pedido_item_id?: string | null
          perfil_aluminio_id?: string | null
          posicao?: string | null
          production_order_id?: string
          quantidade?: number
          status?: string
          window_part_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "production_order_items_production_order_id_fkey"
            columns: ["production_order_id"]
            isOneToOne: false
            referencedRelation: "production_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_order_items_pedido_item_id_fkey"
            columns: ["pedido_item_id"]
            isOneToOne: false
            referencedRelation: "pedido_itens"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_order_items_window_part_id_fkey"
            columns: ["window_part_id"]
            isOneToOne: false
            referencedRelation: "window_parts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_order_items_perfil_aluminio_id_fkey"
            columns: ["perfil_aluminio_id"]
            isOneToOne: false
            referencedRelation: "perfis_aluminio"
            referencedColumns: ["id"]
          },
        ]
      }
      production_orders: {
        Row: {
          company_id: string
          created_at: string
          data_conclusao_real: string | null
          data_entrega_prevista: string | null
          data_inicio_prevista: string | null
          data_inicio_real: string | null
          id: string
          numero: string
          observacoes: string | null
          pedido_id: string
          plano_corte_gerado: boolean
          prioridade: string
          responsavel_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          data_conclusao_real?: string | null
          data_entrega_prevista?: string | null
          data_inicio_prevista?: string | null
          data_inicio_real?: string | null
          id?: string
          numero: string
          observacoes?: string | null
          pedido_id: string
          plano_corte_gerado?: boolean
          prioridade?: string
          responsavel_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          data_conclusao_real?: string | null
          data_entrega_prevista?: string | null
          data_inicio_prevista?: string | null
          data_inicio_real?: string | null
          id?: string
          numero?: string
          observacoes?: string | null
          pedido_id?: string
          plano_corte_gerado?: boolean
          prioridade?: string
          responsavel_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "production_orders_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_orders_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_orders_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      production_stage_progress: {
        Row: {
          concluido_em: string | null
          created_at: string
          id: string
          iniciado_em: string | null
          observacoes: string | null
          production_order_id: string
          responsavel_id: string | null
          stage_id: string
          status: string
        }
        Insert: {
          concluido_em?: string | null
          created_at?: string
          id?: string
          iniciado_em?: string | null
          observacoes?: string | null
          production_order_id: string
          responsavel_id?: string | null
          stage_id: string
          status?: string
        }
        Update: {
          concluido_em?: string | null
          created_at?: string
          id?: string
          iniciado_em?: string | null
          observacoes?: string | null
          production_order_id?: string
          responsavel_id?: string | null
          stage_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "production_stage_progress_production_order_id_fkey"
            columns: ["production_order_id"]
            isOneToOne: false
            referencedRelation: "production_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_stage_progress_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "production_stages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_stage_progress_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      production_stages: {
        Row: {
          ativo: boolean | null
          company_id: string | null
          created_at: string
          descricao: string | null
          id: string
          nome: string
          ordem: number
          requer_confirmacao: boolean | null
          tempo_previsto_min: number | null
        }
        Insert: {
          ativo?: boolean | null
          company_id?: string | null
          created_at?: string
          descricao?: string | null
          id?: string
          nome: string
          ordem?: number
          requer_confirmacao?: boolean | null
          tempo_previsto_min?: number | null
        }
        Update: {
          ativo?: boolean | null
          company_id?: string | null
          created_at?: string
          descricao?: string | null
          id?: string
          nome?: string
          ordem?: number
          requer_confirmacao?: boolean | null
          tempo_previsto_min?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "production_stages_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          cargo: string | null
          company_id: string | null
          created_at: string
          email: string | null
          id: string
          nome: string
          telefone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          cargo?: string | null
          company_id?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nome?: string
          telefone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          cargo?: string | null
          company_id?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nome?: string
          telefone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      projetos_esquadria: {
        Row: {
          altura_mm: number
          cliente_id: string | null
          company_id: string | null
          created_at: string
          created_by: string | null
          esquadria_id: string | null
          id: string
          largura_mm: number
          nome: string
          observacoes: string | null
          quantidade: number
          updated_at: string
        }
        Insert: {
          altura_mm: number
          cliente_id?: string | null
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          esquadria_id?: string | null
          id?: string
          largura_mm: number
          nome?: string
          observacoes?: string | null
          quantidade?: number
          updated_at?: string
        }
        Update: {
          altura_mm?: number
          cliente_id?: string | null
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          esquadria_id?: string | null
          id?: string
          largura_mm?: number
          nome?: string
          observacoes?: string | null
          quantidade?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projetos_esquadria_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projetos_esquadria_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projetos_esquadria_esquadria_id_fkey"
            columns: ["esquadria_id"]
            isOneToOne: false
            referencedRelation: "modelos_esquadria"
            referencedColumns: ["id"]
          },
        ]
      }
      servico_checklist: {
        Row: {
          company_id: string | null
          concluida: boolean
          concluida_em: string | null
          concluida_por: string | null
          created_at: string
          etapa: string
          id: string
          observacoes: string | null
          servico_id: string
          updated_at: string
        }
        Insert: {
          company_id?: string | null
          concluida?: boolean
          concluida_em?: string | null
          concluida_por?: string | null
          created_at?: string
          etapa: string
          id?: string
          observacoes?: string | null
          servico_id: string
          updated_at?: string
        }
        Update: {
          company_id?: string | null
          concluida?: boolean
          concluida_em?: string | null
          concluida_por?: string | null
          created_at?: string
          etapa?: string
          id?: string
          observacoes?: string | null
          servico_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "servico_checklist_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "servico_checklist_servico_id_fkey"
            columns: ["servico_id"]
            isOneToOne: false
            referencedRelation: "servicos"
            referencedColumns: ["id"]
          },
        ]
      }
      servicos: {
        Row: {
          cliente_id: string | null
          company_id: string | null
          created_at: string
          created_by: string | null
          data_agendada: string | null
          data_conclusao: string | null
          descricao: string | null
          endereco: string | null
          id: string
          numero: number
          observacoes: string | null
          pedido_id: string | null
          responsavel: string | null
          status: Database["public"]["Enums"]["servico_status"]
          tipo: string | null
          updated_at: string
          valor: number | null
        }
        Insert: {
          cliente_id?: string | null
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          data_agendada?: string | null
          data_conclusao?: string | null
          descricao?: string | null
          endereco?: string | null
          id?: string
          numero?: number
          observacoes?: string | null
          pedido_id?: string | null
          responsavel?: string | null
          status?: Database["public"]["Enums"]["servico_status"]
          tipo?: string | null
          updated_at?: string
          valor?: number | null
        }
        Update: {
          cliente_id?: string | null
          company_id?: string | null
          created_at?: string
          created_by?: string | null
          data_agendada?: string | null
          data_conclusao?: string | null
          descricao?: string | null
          endereco?: string | null
          id?: string
          numero?: number
          observacoes?: string | null
          pedido_id?: string | null
          responsavel?: string | null
          status?: Database["public"]["Enums"]["servico_status"]
          tipo?: string | null
          updated_at?: string
          valor?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "servicos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "servicos_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "servicos_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          active: boolean
          created_at: string
          expires_at: string | null
          id: string
          plan: Database["public"]["Enums"]["plan_tipo"]
          started_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          expires_at?: string | null
          id?: string
          plan?: Database["public"]["Enums"]["plan_tipo"]
          started_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          expires_at?: string | null
          id?: string
          plan?: Database["public"]["Enums"]["plan_tipo"]
          started_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      workflow_templates: {
        Row: {
          company_id: string | null
          created_at: string | null
          field_type: string
          icon: string | null
          id: string
          name: string
          sort_order: number
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          field_type?: string
          icon?: string | null
          id?: string
          name: string
          sort_order?: number
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          field_type?: string
          icon?: string | null
          id?: string
          name?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "workflow_templates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      window_models: {
        Row: {
          ativo: boolean
          altura_max: number | null
          altura_min: number | null
          codigo: string
          company_id: string | null
          created_at: string
          descricao: string | null
          id: string
          imagem_url: string | null
          largura_max: number | null
          largura_min: number | null
          nome: string
          num_folhas: number
          tipo: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          altura_max?: number | null
          altura_min?: number | null
          codigo: string
          company_id?: string | null
          created_at?: string
          descricao?: string | null
          id?: string
          imagem_url?: string | null
          largura_max?: number | null
          largura_min?: number | null
          nome: string
          num_folhas?: number
          tipo: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          altura_max?: number | null
          altura_min?: number | null
          codigo?: string
          company_id?: string | null
          created_at?: string
          descricao?: string | null
          id?: string
          imagem_url?: string | null
          largura_max?: number | null
          largura_min?: number | null
          nome?: string
          num_folhas?: number
          tipo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "window_models_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      window_parts: {
        Row: {
          created_at: string
          formula_comprimento: string
          id: string
          observacao: string | null
          perfil_aluminio_id: string | null
          posicao: string
          quantidade_formula: string
          sort_order: number | null
          window_model_id: string
        }
        Insert: {
          created_at?: string
          formula_comprimento: string
          id?: string
          observacao?: string | null
          perfil_aluminio_id?: string | null
          posicao: string
          quantidade_formula?: string
          sort_order?: number | null
          window_model_id: string
        }
        Update: {
          created_at?: string
          formula_comprimento?: string
          id?: string
          observacao?: string | null
          perfil_aluminio_id?: string | null
          posicao?: string
          quantidade_formula?: string
          sort_order?: number | null
          window_model_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "window_parts_window_model_id_fkey"
            columns: ["window_model_id"]
            isOneToOne: false
            referencedRelation: "window_models"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "window_parts_perfil_aluminio_id_fkey"
            columns: ["perfil_aluminio_id"]
            isOneToOne: false
            referencedRelation: "perfis_aluminio"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_items: {
        Row: {
          id: string
          company_id: string
          codigo: string
          nome: string
          tipo: 'perfil' | 'vidro' | 'ferragem' | 'acessorio' | 'outro'
          perfil_aluminio_id: string | null
          glass_type_id: string | null
          hardware_id: string | null
          quantidade_disponivel: number
          quantidade_reservada: number
          quantidade_minima: number
          unidade: string
          localizacao: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          codigo: string
          nome: string
          tipo: 'perfil' | 'vidro' | 'ferragem' | 'acessorio' | 'outro'
          perfil_aluminio_id?: string | null
          glass_type_id?: string | null
          hardware_id?: string | null
          quantidade_disponivel?: number
          quantidade_reservada?: number
          quantidade_minima?: number
          unidade?: string
          localizacao?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          codigo?: string
          nome?: string
          tipo?: 'perfil' | 'vidro' | 'ferragem' | 'acessorio' | 'outro'
          perfil_aluminio_id?: string | null
          glass_type_id?: string | null
          hardware_id?: string | null
          quantidade_disponivel?: number
          quantidade_reservada?: number
          quantidade_minima?: number
          unidade?: string
          localizacao?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_items_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          }
        ]
      }
      cutting_plans: {
        Row: {
          id: string
          company_id: string
          orcamento_id: string | null
          numero: string
          algoritmo: 'FFD' | 'BFD'
          aproveitamento_medio: number
          total_barras: number
          total_pecas: number
          comprimento_barra_mm: number
          status: 'pendente' | 'calculando' | 'gerado' | 'pronto' | 'executado'
          barras_json: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          orcamento_id?: string | null
          numero: string
          algoritmo?: 'FFD' | 'BFD'
          aproveitamento_medio?: number
          total_barras?: number
          total_pecas?: number
          comprimento_barra_mm?: number
          status?: 'pendente' | 'calculando' | 'gerado' | 'pronto' | 'executado'
          barras_json?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          orcamento_id?: string | null
          numero?: string
          algoritmo?: 'FFD' | 'BFD'
          aproveitamento_medio?: number
          total_barras?: number
          total_pecas?: number
          comprimento_barra_mm?: number
          status?: 'pendente' | 'calculando' | 'gerado' | 'pronto' | 'executado'
          barras_json?: Json | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cutting_plans_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          }
        ]
      }
      purchase_orders: {
        Row: {
          id: string
          company_id: string
          production_order_id: string | null
          numero: string
          status: 'rascunho' | 'enviado' | 'confirmado' | 'recebido' | 'cancelado'
          gerado_automaticamente: boolean
          observacoes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          production_order_id?: string | null
          numero: string
          status?: 'rascunho' | 'enviado' | 'confirmado' | 'recebido' | 'cancelado'
          gerado_automaticamente?: boolean
          observacoes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          production_order_id?: string | null
          numero?: string
          status?: 'rascunho' | 'enviado' | 'confirmado' | 'recebido' | 'cancelado'
          gerado_automaticamente?: boolean
          observacoes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          }
        ]
      }
      ai_import_jobs: {
        Row: {
          id: string
          company_id: string
          nome_arquivo: string
          status: 'pendente' | 'processando' | 'concluido' | 'erro' | 'revisao'
          perfis_encontrados: number
          modelos_encontrados: number
          ai_raw_output: Json | null
          dados_para_import: Json | null
          erro_mensagem: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          nome_arquivo: string
          status?: 'pendente' | 'processando' | 'concluido' | 'erro' | 'revisao'
          perfis_encontrados?: number
          modelos_encontrados?: number
          ai_raw_output?: Json | null
          dados_para_import?: Json | null
          erro_mensagem?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          nome_arquivo?: string
          status?: 'pendente' | 'processando' | 'concluido' | 'erro' | 'revisao'
          perfis_encontrados?: number
          modelos_encontrados?: number
          ai_raw_output?: Json | null
          dados_para_import?: Json | null
          erro_mensagem?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_import_jobs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_company_id: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "gerente" | "funcionario"
      conta_status: "pendente" | "pago" | "vencido" | "cancelado"
      contrato_status: "ativo" | "encerrado" | "cancelado" | "rascunho"
      nf_status: "emitida" | "cancelada" | "pendente"
      nf_tipo: "nfe" | "nfse" | "nfce"
      orcamento_status:
        | "rascunho"
        | "enviado"
        | "aprovado"
        | "rejeitado"
        | "expirado"
      pedido_status:
        | "pendente"
        | "em_producao"
        | "pronto"
        | "entregue"
        | "cancelado"
      plan_tipo: "basico" | "essencial" | "avancado"
      servico_status: "agendado" | "em_andamento" | "concluido" | "cancelado"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

// ─── Referências de Tipos Consolidadas ──────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "gerente", "funcionario"],
      conta_status: ["pendente", "pago", "vencido", "cancelado"],
      contrato_status: ["ativo", "encerrado", "cancelado", "rascunho"],
      nf_status: ["emitida", "cancelada", "pendente"],
      nf_tipo: ["nfe", "nfse", "nfce"],
      orcamento_status: [
        "rascunho",
        "enviado",
        "aprovado",
        "rejeitado",
        "expirado",
      ],
      pedido_status: [
        "pendente",
        "em_producao",
        "pronto",
        "entregue",
        "cancelado",
      ],
      plan_tipo: ["basico", "essencial", "avancado"],
      servico_status: ["agendado", "em_andamento", "concluido", "cancelado"],
    },
  },
} as const
