/**
 * Social Media Provider Interface
 *
 * Contrato que toda implementação (Mock, Meta API, etc.) deve seguir.
 * Para adicionar um novo canal: implemente esta interface e registre no factory.
 */

import type { SocialContact, SocialMessage } from '@/components/redes-sociais/types';

// ──────────────────────────────────────────────────────────────
// Tipos de request/response da camada de serviço
// ──────────────────────────────────────────────────────────────

export interface SendMessageRequest {
  contactId: string;
  text: string;
}

export interface SendMessageResult {
  messageId: string;
  timestamp: string;
  status: 'sent' | 'delivered' | 'failed';
}

export interface ChannelStatus {
  channel: 'whatsapp' | 'instagram' | 'facebook';
  connected: boolean;
  accountName?: string;
  errorMessage?: string;
}

// ──────────────────────────────────────────────────────────────
// Interface do Provider
// ──────────────────────────────────────────────────────────────

export interface ISocialMediaProvider {
  /**
   * Retorna todas as conversas/contatos ativos.
   * Chamado a cada intervalo de polling ou via webhook trigger.
   */
  getConversations(): Promise<SocialContact[]>;

  /**
   * Retorna as mensagens de uma conversa específica.
   */
  getMessages(contactId: string): Promise<SocialMessage[]>;

  /**
   * Envia uma mensagem para um contato pelo canal correspondente.
   */
  sendMessage(request: SendMessageRequest): Promise<SendMessageResult>;

  /**
   * Retorna o status de conexão de cada canal configurado.
   */
  getChannelStatus(): Promise<ChannelStatus[]>;

  /**
   * Marca todas as mensagens de uma conversa como lidas.
   */
  markAsRead(contactId: string): Promise<void>;
}
