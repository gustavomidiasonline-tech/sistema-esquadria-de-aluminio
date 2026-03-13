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
      clientes: {
        Row: {
          cep: string | null
          cidade: string | null
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
        Relationships: []
      }
      contas_pagar: {
        Row: {
          categoria: string | null
          created_at: string
          created_by: string | null
          data_pagamento: string | null
          data_vencimento: string
          descricao: string
          forma_pagamento: string | null
          fornecedor: string
          id: string
          observacoes: string | null
          status: Database["public"]["Enums"]["conta_status"]
          updated_at: string
          valor: number
        }
        Insert: {
          categoria?: string | null
          created_at?: string
          created_by?: string | null
          data_pagamento?: string | null
          data_vencimento: string
          descricao: string
          forma_pagamento?: string | null
          fornecedor: string
          id?: string
          observacoes?: string | null
          status?: Database["public"]["Enums"]["conta_status"]
          updated_at?: string
          valor: number
        }
        Update: {
          categoria?: string | null
          created_at?: string
          created_by?: string | null
          data_pagamento?: string | null
          data_vencimento?: string
          descricao?: string
          forma_pagamento?: string | null
          fornecedor?: string
          id?: string
          observacoes?: string | null
          status?: Database["public"]["Enums"]["conta_status"]
          updated_at?: string
          valor?: number
        }
        Relationships: []
      }
      contas_receber: {
        Row: {
          cliente_id: string | null
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
        ]
      }
      documentos: {
        Row: {
          arquivo_url: string | null
          cliente_id: string | null
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
        ]
      }
      notas_fiscais: {
        Row: {
          cliente_id: string | null
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
          created_at: string
          descricao: string
          id: string
          largura: number | null
          orcamento_id: string
          produto_id: string | null
          quantidade: number
          valor_total: number
          valor_unitario: number
        }
        Insert: {
          altura?: number | null
          created_at?: string
          descricao: string
          id?: string
          largura?: number | null
          orcamento_id: string
          produto_id?: string | null
          quantidade?: number
          valor_total?: number
          valor_unitario?: number
        }
        Update: {
          altura?: number | null
          created_at?: string
          descricao?: string
          id?: string
          largura?: number | null
          orcamento_id?: string
          produto_id?: string | null
          quantidade?: number
          valor_total?: number
          valor_unitario?: number
        }
        Relationships: [
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
        ]
      }
      pedido_itens: {
        Row: {
          altura: number | null
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
            foreignKeyName: "perfis_aluminio_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      planos_de_corte: {
        Row: {
          altura: number
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
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          cargo: string | null
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
          created_at?: string
          email?: string | null
          id?: string
          nome?: string
          telefone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      servicos: {
        Row: {
          cliente_id: string | null
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
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
      servico_status: ["agendado", "em_andamento", "concluido", "cancelado"],
    },
  },
} as const
