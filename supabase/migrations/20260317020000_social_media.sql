-- ============================================================
-- Migration: Social Media — Conversas e mensagens das redes sociais
-- Feature: Redes Sociais (WhatsApp, Instagram, Facebook)
-- Data: 2026-03-17
-- ============================================================

-- ──────────────────────────────────────────────────────────────
-- social_conversations — Uma linha por conversa/contato
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.social_conversations (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      uuid        NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  -- ID da conversa na plataforma (thread_id do WA, conversation_id do IG/FB)
  external_id     text        NOT NULL,
  channel         text        NOT NULL CHECK (channel IN ('whatsapp', 'instagram', 'facebook')),
  contact_name    text        NOT NULL DEFAULT 'Desconhecido',
  -- ID do contato na plataforma (phone number, PSID, IG user id)
  contact_external_id text   NOT NULL,
  last_message    text,
  last_message_at timestamptz,
  unread_count    int         NOT NULL DEFAULT 0,
  starred         boolean     NOT NULL DEFAULT false,
  metadata        jsonb       NOT NULL DEFAULT '{}',
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),

  UNIQUE (company_id, external_id, channel)
);

-- ──────────────────────────────────────────────────────────────
-- social_messages — Mensagens individuais de cada conversa
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.social_messages (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid        NOT NULL REFERENCES public.social_conversations(id) ON DELETE CASCADE,
  -- ID da mensagem na plataforma (para deduplicação de webhooks)
  external_id     text,
  text            text        NOT NULL,
  from_me         boolean     NOT NULL DEFAULT false,
  read            boolean     NOT NULL DEFAULT false,
  -- Armazena o payload bruto do webhook para auditoria
  raw_payload     jsonb       NOT NULL DEFAULT '{}',
  created_at      timestamptz NOT NULL DEFAULT now(),

  UNIQUE (conversation_id, external_id)
);

-- ──────────────────────────────────────────────────────────────
-- Índices — performance de queries comuns
-- ──────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_social_conv_company_channel
  ON public.social_conversations (company_id, channel, last_message_at DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS idx_social_conv_unread
  ON public.social_conversations (company_id, unread_count)
  WHERE unread_count > 0;

CREATE INDEX IF NOT EXISTS idx_social_msg_conv
  ON public.social_messages (conversation_id, created_at ASC);

-- ──────────────────────────────────────────────────────────────
-- RPC: incrementa unread_count de forma atômica
-- Usada pela Edge Function meta-webhook (service_role)
-- ──────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.increment_social_unread(p_conversation_id uuid)
RETURNS void LANGUAGE sql SECURITY DEFINER AS $$
  UPDATE public.social_conversations
  SET unread_count = unread_count + 1,
      updated_at   = now()
  WHERE id = p_conversation_id;
$$;

-- ──────────────────────────────────────────────────────────────
-- Trigger: atualiza updated_at automaticamente
-- ──────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.update_social_conversations_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_social_conv_updated_at ON public.social_conversations;
CREATE TRIGGER trg_social_conv_updated_at
  BEFORE UPDATE ON public.social_conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_social_conversations_updated_at();

-- ──────────────────────────────────────────────────────────────
-- RLS — Isolamento multitenancy (mesmo padrão do projeto)
-- ──────────────────────────────────────────────────────────────
ALTER TABLE public.social_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_messages      ENABLE ROW LEVEL SECURITY;

-- social_conversations
CREATE POLICY "company_social_conv_select" ON public.social_conversations
  FOR SELECT USING (company_id = get_user_company_id());

CREATE POLICY "company_social_conv_insert" ON public.social_conversations
  FOR INSERT WITH CHECK (company_id = get_user_company_id());

CREATE POLICY "company_social_conv_update" ON public.social_conversations
  FOR UPDATE USING (company_id = get_user_company_id());

CREATE POLICY "company_social_conv_delete" ON public.social_conversations
  FOR DELETE USING (company_id = get_user_company_id());

-- social_messages — acesso via JOIN na conversa (evita leak cross-company)
CREATE POLICY "company_social_msg_select" ON public.social_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.social_conversations c
      WHERE c.id = conversation_id
        AND c.company_id = get_user_company_id()
    )
  );

CREATE POLICY "company_social_msg_insert" ON public.social_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.social_conversations c
      WHERE c.id = conversation_id
        AND c.company_id = get_user_company_id()
    )
  );

CREATE POLICY "company_social_msg_update" ON public.social_messages
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.social_conversations c
      WHERE c.id = conversation_id
        AND c.company_id = get_user_company_id()
    )
  );

-- ──────────────────────────────────────────────────────────────
-- Realtime — habilitar publicação para Supabase Realtime
-- ──────────────────────────────────────────────────────────────
ALTER TABLE public.social_conversations REPLICA IDENTITY FULL;
ALTER TABLE public.social_messages      REPLICA IDENTITY FULL;

-- Adicionar à publicação realtime (se já existir a pub padrão do Supabase)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.social_conversations;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.social_messages;
  END IF;
END;
$$;

-- ──────────────────────────────────────────────────────────────
-- Edge Function config: policy para service_role (webhook)
-- O webhook usa service_role key — bypass RLS controlado
-- ──────────────────────────────────────────────────────────────
CREATE POLICY "service_role_social_conv_all" ON public.social_conversations
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "service_role_social_msg_all" ON public.social_messages
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
