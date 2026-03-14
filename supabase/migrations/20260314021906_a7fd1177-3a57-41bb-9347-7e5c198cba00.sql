
-- =============================================
-- STEP 1: Add company_id to all business tables
-- =============================================

-- clientes
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id);

-- fornecedores
ALTER TABLE public.fornecedores ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id);

-- pedidos
ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id);

-- pedido_itens (child of pedidos, add for direct filtering)
ALTER TABLE public.pedido_itens ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id);

-- orcamentos
ALTER TABLE public.orcamentos ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id);

-- orcamento_itens (child of orcamentos)
ALTER TABLE public.orcamento_itens ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id);

-- contas_pagar
ALTER TABLE public.contas_pagar ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id);

-- contas_receber
ALTER TABLE public.contas_receber ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id);

-- pagamentos
ALTER TABLE public.pagamentos ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id);

-- notas_fiscais
ALTER TABLE public.notas_fiscais ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id);

-- contratos
ALTER TABLE public.contratos ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id);

-- servicos
ALTER TABLE public.servicos ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id);

-- servico_checklist (child of servicos)
ALTER TABLE public.servico_checklist ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id);

-- documentos
ALTER TABLE public.documentos ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id);

-- agenda_eventos
ALTER TABLE public.agenda_eventos ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id);

-- produtos
ALTER TABLE public.produtos ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id);

-- perfis_aluminio (child of produtos)
ALTER TABLE public.perfis_aluminio ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id);

-- planos_de_corte
ALTER TABLE public.planos_de_corte ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id);

-- order_progress
ALTER TABLE public.order_progress ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id);

-- fabricantes
ALTER TABLE public.fabricantes ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id);

-- ferragens
ALTER TABLE public.ferragens ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id);

-- linhas
ALTER TABLE public.linhas ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id);

-- modelos_esquadria
ALTER TABLE public.modelos_esquadria ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id);

-- componentes_modelo
ALTER TABLE public.componentes_modelo ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id);

-- lista_corte
ALTER TABLE public.lista_corte ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id);

-- projetos_esquadria
ALTER TABLE public.projetos_esquadria ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id);

-- perfis_catalogo
ALTER TABLE public.perfis_catalogo ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id);

-- config_precos
ALTER TABLE public.config_precos ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id);
