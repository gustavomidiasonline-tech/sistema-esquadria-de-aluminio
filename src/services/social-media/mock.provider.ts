/**
 * MockProvider — Dados simulados para desenvolvimento local.
 *
 * Usado automaticamente quando VITE_META_API_TOKEN não está configurado.
 * Simula atraso de rede (150-400ms) para comportamento realista.
 */

import type { ISocialMediaProvider, SendMessageRequest, SendMessageResult, ChannelStatus } from '@/services/social-media/social-media.provider';
import type { SocialContact, SocialMessage } from '@/components/redes-sociais/types';
import { MOCK_CONTACTS } from '@/components/redes-sociais/mock-data';

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
const randomDelay = () => delay(150 + Math.random() * 250);

export class MockProvider implements ISocialMediaProvider {
  private contacts: SocialContact[] = structuredClone(MOCK_CONTACTS);

  async getConversations(): Promise<SocialContact[]> {
    await randomDelay();
    return [...this.contacts];
  }

  async getMessages(contactId: string): Promise<SocialMessage[]> {
    await randomDelay();
    return this.contacts.find((c) => c.id === contactId)?.messages ?? [];
  }

  async sendMessage(request: SendMessageRequest): Promise<SendMessageResult> {
    await randomDelay();

    const msg: SocialMessage = {
      id: `mock-${Date.now()}`,
      text: request.text,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      fromMe: true,
      read: true,
    };

    this.contacts = this.contacts.map((c) =>
      c.id === request.contactId
        ? { ...c, lastMessage: request.text, lastMessageTime: 'Agora', messages: [...c.messages, msg] }
        : c
    );

    return { messageId: msg.id, timestamp: msg.timestamp, status: 'sent' };
  }

  async getChannelStatus(): Promise<ChannelStatus[]> {
    await randomDelay();
    return [
      { channel: 'whatsapp', connected: true, accountName: '+55 11 99999-0000 (Mock)' },
      { channel: 'instagram', connected: true, accountName: '@empresa_mock' },
      { channel: 'facebook', connected: false, errorMessage: 'Não configurado — adicione VITE_META_API_TOKEN' },
    ];
  }

  async markAsRead(contactId: string): Promise<void> {
    await randomDelay();
    this.contacts = this.contacts.map((c) =>
      c.id === contactId
        ? { ...c, unread: 0, messages: c.messages.map((m) => ({ ...m, read: true })) }
        : c
    );
  }
}
