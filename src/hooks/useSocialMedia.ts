/**
 * useSocialMedia — Hook principal para o módulo de Redes Sociais.
 *
 * Modo polling (padrão):
 *   Sem config especial — consulta o provider a cada VITE_SOCIAL_POLL_INTERVAL_MS.
 *
 * Modo Realtime (recomendado para produção):
 *   VITE_META_WEBHOOK_ENABLED=true → polling desabilitado, Supabase Realtime
 *   invalida as queries automaticamente quando o banco recebe dados do webhook.
 */

import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getSocialMediaService } from '@/services/social-media/social-media.service';
import { supabase } from '@/integrations/supabase/client';
import type { SendMessageRequest } from '@/services/social-media/social-media.service';

// ── Config ───────────────────────────────────────────────────

const POLL_INTERVAL_MS =
  Number(import.meta.env.VITE_SOCIAL_POLL_INTERVAL_MS) || 15_000;

const WEBHOOK_ENABLED =
  import.meta.env.VITE_META_WEBHOOK_ENABLED === 'true';

// ── Query Keys ───────────────────────────────────────────────

export const socialKeys = {
  all: ['social-media'] as const,
  conversations: () => [...socialKeys.all, 'conversations'] as const,
  messages: (contactId: string) => [...socialKeys.all, 'messages', contactId] as const,
  channelStatus: () => [...socialKeys.all, 'channel-status'] as const,
};

// ── Hooks ────────────────────────────────────────────────────

/**
 * Retorna a lista de conversas.
 * Em modo Realtime (VITE_META_WEBHOOK_ENABLED=true): sem polling.
 * Em modo polling: refetch a cada POLL_INTERVAL_MS.
 */
export function useSocialConversations() {
  const queryClient = useQueryClient();

  // Supabase Realtime — ativo apenas quando webhook habilitado
  useEffect(() => {
    if (!WEBHOOK_ENABLED) return;

    const channel = supabase
      .channel('social-conversations-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'social_conversations',
        },
        () => {
          void queryClient.invalidateQueries({ queryKey: socialKeys.conversations() });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return useQuery({
    queryKey: socialKeys.conversations(),
    queryFn: () => getSocialMediaService().getConversations(),
    refetchInterval: WEBHOOK_ENABLED ? false : POLL_INTERVAL_MS,
    staleTime: WEBHOOK_ENABLED ? Infinity : POLL_INTERVAL_MS / 2,
  });
}

/**
 * Retorna as mensagens de uma conversa.
 * Em modo Realtime: subscription por conversation_id.
 */
export function useSocialMessages(contactId: string | null) {
  const queryClient = useQueryClient();

  // Realtime por mensagem — filtrado pelo conversation_id
  useEffect(() => {
    if (!WEBHOOK_ENABLED || !contactId) return;

    const channel = supabase
      .channel(`social-messages-${contactId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'social_messages',
          filter: `conversation_id=eq.${contactId}`,
        },
        () => {
          void queryClient.invalidateQueries({ queryKey: socialKeys.messages(contactId) });
          void queryClient.invalidateQueries({ queryKey: socialKeys.conversations() });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [contactId, queryClient]);

  return useQuery({
    queryKey: socialKeys.messages(contactId ?? ''),
    queryFn: () => getSocialMediaService().getMessages(contactId!),
    enabled: Boolean(contactId),
    refetchInterval: WEBHOOK_ENABLED ? false : POLL_INTERVAL_MS,
    staleTime: WEBHOOK_ENABLED ? Infinity : POLL_INTERVAL_MS / 2,
  });
}

/**
 * Retorna o status de conexão de cada canal.
 */
export function useSocialChannelStatus() {
  return useQuery({
    queryKey: socialKeys.channelStatus(),
    queryFn: () => getSocialMediaService().getChannelStatus(),
    staleTime: 60_000,
  });
}

/**
 * Mutation para enviar uma mensagem.
 */
export function useSendSocialMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: SendMessageRequest) =>
      getSocialMediaService().sendMessage(request),
    onSuccess: (_result, variables) => {
      void queryClient.invalidateQueries({ queryKey: socialKeys.conversations() });
      void queryClient.invalidateQueries({ queryKey: socialKeys.messages(variables.contactId) });
    },
  });
}

/**
 * Mutation para marcar conversa como lida.
 */
export function useMarkSocialAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (contactId: string) =>
      getSocialMediaService().markAsRead(contactId),
    onSuccess: (_result, contactId) => {
      void queryClient.invalidateQueries({ queryKey: socialKeys.conversations() });
      void queryClient.invalidateQueries({ queryKey: socialKeys.messages(contactId) });
    },
  });
}

/**
 * Invalida manualmente as queries de conversas.
 * Útil para forçar refresh fora de hooks (ex: callback de push notification).
 */
export function invalidateSocialConversations(
  queryClient: ReturnType<typeof useQueryClient>
): void {
  void queryClient.invalidateQueries({ queryKey: socialKeys.conversations() });
}
