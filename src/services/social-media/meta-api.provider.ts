/**
 * MetaApiProvider — Implementação real via Meta Business API v19.0
 *
 * Cobre: WhatsApp Business, Instagram Direct e Facebook Messenger
 * (todos usam o mesmo token de acesso do Meta Graph API).
 *
 * SETUP RÁPIDO:
 * 1. Crie um App no Meta for Developers: https://developers.facebook.com/
 * 2. Adicione os produtos: WhatsApp, Instagram API, Messenger
 * 3. Gere um "System User Access Token" com as permissões:
 *    - whatsapp_business_messaging
 *    - instagram_manage_messages
 *    - pages_messaging
 * 4. Adicione as variáveis de ambiente no .env:
 *    VITE_META_API_TOKEN=...
 *    VITE_WHATSAPP_PHONE_NUMBER_ID=...
 *    VITE_META_PAGE_ID=...
 * 5. Configure o Webhook no painel do Meta apontando para seu backend.
 *
 * NOTA: Chamadas diretas ao Graph API do browser não são recomendadas
 * em produção (expõe o token). Use um backend intermediário (ex: Edge Function
 * do Supabase ou serverless function) e ajuste META_API_BASE abaixo.
 *
 * @see https://developers.facebook.com/docs/whatsapp/cloud-api
 * @see https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/messaging
 * @see https://developers.facebook.com/docs/messenger-platform
 */

import type { ISocialMediaProvider, SendMessageRequest, SendMessageResult, ChannelStatus } from '@/services/social-media/social-media.provider';
import type { SocialContact, SocialMessage } from '@/components/redes-sociais/types';
import { supabase } from '@/integrations/supabase/client';

// ──────────────────────────────────────────────────────────────
// Config (injetada via variáveis de ambiente Vite)
// ──────────────────────────────────────────────────────────────

interface MetaApiConfig {
  /** Token de acesso do Meta Graph API (System User ou Page Access Token) */
  accessToken: string;
  /** ID do número de telefone WhatsApp Business */
  whatsappPhoneNumberId: string;
  /** ID da Página do Facebook / conta conectada */
  metaPageId: string;
  /**
   * URL base da API.
   * Em produção, aponte para seu backend intermediário
   * (ex: https://seu-projeto.supabase.co/functions/v1/social-media)
   * para não expor o token no frontend.
   */
  apiBase: string;
}

// ──────────────────────────────────────────────────────────────
// Tipos raw do Graph API (parciais — adicione campos conforme precisar)
// ──────────────────────────────────────────────────────────────

interface MetaConversation {
  id: string;
  participants: {
    data: Array<{ id: string; name: string; email?: string }>;
  };
  messages?: {
    data: Array<MetaMessage>;
  };
  updated_time: string;
  unread_count?: number;
}

interface MetaMessage {
  id: string;
  message: string;
  from: { id: string; name: string };
  created_time: string;
}

interface WhatsAppMessage {
  id: string;
  from: string;
  timestamp: string;
  text: { body: string };
  type: 'text';
}

// ──────────────────────────────────────────────────────────────
// Provider
// ──────────────────────────────────────────────────────────────

export class MetaApiProvider implements ISocialMediaProvider {
  private readonly config: MetaApiConfig;

  constructor(config: MetaApiConfig) {
    this.config = config;
  }

  private get headers(): HeadersInit {
    return {
      'Authorization': `Bearer ${this.config.accessToken}`,
      'Content-Type': 'application/json',
    };
  }

  private async graphGet<T>(path: string, params: Record<string, string> = {}): Promise<T> {
    const url = new URL(`${this.config.apiBase}${path}`);
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

    const res = await fetch(url.toString(), { headers: this.headers });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Meta API GET ${path} failed (${res.status}): ${body}`);
    }

    return res.json() as Promise<T>;
  }

  private async graphPost<T>(path: string, body: unknown): Promise<T> {
    const res = await fetch(`${this.config.apiBase}${path}`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Meta API POST ${path} failed (${res.status}): ${text}`);
    }

    return res.json() as Promise<T>;
  }

  // ── getConversations — lê do Supabase (fonte de verdade pós-webhook) ──

  async getConversations(): Promise<SocialContact[]> {
    const { data, error } = await supabase
      .from('social_conversations')
      .select('*')
      .order('last_message_at', { ascending: false });

    if (error) throw new Error(`MetaApiProvider.getConversations: ${error.message}`);

    return (data ?? []).map((row) => ({
      id: row.id,
      name: row.contact_name,
      channel: row.channel as SocialContact['channel'],
      lastMessage: row.last_message ?? '',
      lastMessageTime: row.last_message_at
        ? new Date(row.last_message_at).toLocaleString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        : '',
      unread: row.unread_count,
      starred: row.starred,
      online: false,
      messages: [],
    }));
  }

  // (métodos privados de fetch direto ao Graph API mantidos para referência futura)

  private async fetchInstagramConversations(): Promise<SocialContact[]> {
    /*
     * Instagram Graph API — listar conversas (DMs)
     *
     * GET /{page-id}/conversations?platform=instagram&fields=participants,messages,updated_time
     *
     * TODO: Descomente e ajuste quando o backend estiver pronto:
     *
     * const res = await this.graphGet<{ data: MetaConversation[] }>(
     *   `/${this.config.metaPageId}/conversations`,
     *   { platform: 'instagram', fields: 'participants,messages{message,from,created_time},updated_time,unread_count' }
     * );
     * return res.data.map(c => this.mapMetaConversation(c, 'instagram'));
     *
     * @see https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/messaging
     */
    return [];
  }

  private async fetchFacebookConversations(): Promise<SocialContact[]> {
    /*
     * Facebook Messenger API — listar conversas
     *
     * GET /{page-id}/conversations?fields=participants,messages,updated_time
     *
     * TODO: Descomente quando o backend estiver pronto:
     *
     * const res = await this.graphGet<{ data: MetaConversation[] }>(
     *   `/${this.config.metaPageId}/conversations`,
     *   { fields: 'participants,messages{message,from,created_time},updated_time,unread_count' }
     * );
     * return res.data.map(c => this.mapMetaConversation(c, 'facebook'));
     *
     * @see https://developers.facebook.com/docs/messenger-platform/reference/send-api
     */
    return [];
  }

  private mapMetaConversation(
    c: MetaConversation,
    channel: 'instagram' | 'facebook'
  ): SocialContact {
    const participant = c.participants.data.find((p) => p.id !== this.config.metaPageId);
    const msgs = c.messages?.data ?? [];
    const last = msgs[0];

    return {
      id: c.id,
      name: participant?.name ?? 'Desconhecido',
      channel,
      lastMessage: last?.message ?? '',
      lastMessageTime: c.updated_time,
      unread: c.unread_count ?? 0,
      starred: false,
      online: false,
      messages: msgs.map((m) => this.mapMetaMessage(m, channel)),
    };
  }

  private mapMetaMessage(m: MetaMessage, _channel: string): SocialMessage {
    return {
      id: m.id,
      text: m.message,
      timestamp: m.created_time,
      fromMe: m.from.id === this.config.metaPageId,
      read: true,
    };
  }

  // ── getMessages — lê mensagens do Supabase ───────────────

  async getMessages(contactId: string): Promise<SocialMessage[]> {
    const { data, error } = await supabase
      .from('social_messages')
      .select('*')
      .eq('conversation_id', contactId)
      .order('created_at', { ascending: true });

    if (error) throw new Error(`MetaApiProvider.getMessages: ${error.message}`);

    return (data ?? []).map((row) => ({
      id: row.id,
      text: row.text,
      timestamp: new Date(row.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      fromMe: row.from_me,
      read: row.read,
    }));
  }

  // ── sendMessage ──────────────────────────────────────────

  async sendMessage(request: SendMessageRequest): Promise<SendMessageResult> {
    /*
     * WhatsApp: POST /{phone-number-id}/messages
     * Messenger/Instagram: POST /me/messages
     *
     * O canal certo deve ser determinado pelo contactId (prefixo ou lookup no banco).
     * Exemplo para WhatsApp:
     *
     * const res = await this.graphPost<{ messages: Array<{ id: string }> }>(
     *   `/${this.config.whatsappPhoneNumberId}/messages`,
     *   {
     *     messaging_product: 'whatsapp',
     *     to: request.contactId,
     *     type: 'text',
     *     text: { body: request.text },
     *   }
     * );
     * return { messageId: res.messages[0].id, timestamp: new Date().toISOString(), status: 'sent' };
     */
    void request;
    throw new Error('MetaApiProvider.sendMessage: implemente conforme o canal do contato');
  }

  // ── getChannelStatus ─────────────────────────────────────

  async getChannelStatus(): Promise<ChannelStatus[]> {
    const hasToken = Boolean(this.config.accessToken);
    const hasWaId = Boolean(this.config.whatsappPhoneNumberId);
    const hasPageId = Boolean(this.config.metaPageId);

    return [
      {
        channel: 'whatsapp',
        connected: hasToken && hasWaId,
        accountName: hasWaId ? `ID: ${this.config.whatsappPhoneNumberId}` : undefined,
        errorMessage: !hasToken || !hasWaId ? 'Configure VITE_META_API_TOKEN e VITE_WHATSAPP_PHONE_NUMBER_ID' : undefined,
      },
      {
        channel: 'instagram',
        connected: hasToken && hasPageId,
        accountName: hasPageId ? `Page ID: ${this.config.metaPageId}` : undefined,
        errorMessage: !hasToken || !hasPageId ? 'Configure VITE_META_API_TOKEN e VITE_META_PAGE_ID' : undefined,
      },
      {
        channel: 'facebook',
        connected: hasToken && hasPageId,
        accountName: hasPageId ? `Page ID: ${this.config.metaPageId}` : undefined,
        errorMessage: !hasToken || !hasPageId ? 'Configure VITE_META_API_TOKEN e VITE_META_PAGE_ID' : undefined,
      },
    ];
  }

  // ── markAsRead ───────────────────────────────────────────

  async markAsRead(contactId: string): Promise<void> {
    /*
     * WhatsApp: marcar mensagem como lida via POST /{phone-number-id}/messages
     * { status: 'read', message_id: '...' }
     *
     * TODO: Implemente conforme o canal do contato
     */
    void contactId;
  }

  // ── Webhook helpers (uso no backend) ────────────────────

  /**
   * Verifica a assinatura do webhook (X-Hub-Signature-256).
   * Use no seu backend (Supabase Edge Function / Express) para validar payloads.
   *
   * @param payload - body raw da requisição (string)
   * @param signature - valor do header X-Hub-Signature-256
   * @param appSecret - VITE_META_APP_SECRET
   */
  static async verifyWebhookSignature(
    payload: string,
    signature: string,
    appSecret: string
  ): Promise<boolean> {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(appSecret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
    const hexSig = Array.from(new Uint8Array(sig))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    return signature === `sha256=${hexSig}`;
  }
}
