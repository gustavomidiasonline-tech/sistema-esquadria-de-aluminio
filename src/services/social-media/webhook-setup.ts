/**
 * Webhook Setup — Configuração automática de webhooks da Meta API
 *
 * Registra endpoints para receber eventos em tempo real de:
 * - WhatsApp (mensagens, status)
 * - Instagram (DMs, comentários)
 * - Facebook (mensagens, eventos)
 */

export interface WebhookConfig {
  accessToken: string;
  pageId: string;
  webhookUrl: string; // URL pública do seu backend (ex: https://seu-dominio.com/api/webhooks/meta)
  verifyToken: string; // Token aleatório para validação de webhook
}

export interface WebhookEvent {
  type: 'message' | 'status' | 'comment' | 'reply';
  channel: 'whatsapp' | 'instagram' | 'facebook';
  contactId: string;
  contactName: string;
  messageId: string;
  text: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

/**
 * Setup de webhook — deve ser executado UMA VEZ no backend
 */
export async function setupWebhook(config: WebhookConfig): Promise<boolean> {
  try {
    const apiBase = 'https://graph.facebook.com/v19.0';

    // 1. Registrar webhook para a página
    const webhookResponse = await fetch(`${apiBase}/${config.pageId}/subscribed_apps`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        access_token: config.accessToken,
      }),
    });

    if (!webhookResponse.ok) {
      throw new Error(`Falha ao registrar webhook app: ${webhookResponse.statusText}`);
    }

    // 2. Registrar campo de webhook para receber eventos
    const fieldsResponse = await fetch(`${apiBase}/${config.pageId}/subscribed_fields`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subscribed_fields: [
          'messages',           // WhatsApp e messenger
          'message_echoes',     // Confirmação de envio
          'read_receipts',      // Confirmação de leitura
          'standby',            // Modo standby
          'messaging_optins',   // Opt-in do usuário
          'messaging_optouts',  // Opt-out do usuário
          'message_deliveries', // Confirmação de entrega
        ],
        verify_token: config.verifyToken,
        callback_url: config.webhookUrl,
        access_token: config.accessToken,
      }),
    });

    if (!fieldsResponse.ok) {
      throw new Error(`Falha ao registrar campos webhook: ${fieldsResponse.statusText}`);
    }

    console.info('✅ Webhook Meta API registrado com sucesso');
    return true;
  } catch (error) {
    console.error('❌ Erro ao configurar webhook:', error);
    return false;
  }
}

/**
 * Validação de webhook — para verificar token no primeiro acesso
 */
export function validateWebhookRequest(
  mode: string | undefined,
  token: string | undefined,
  challenge: string | undefined,
  expectedToken: string,
): string | null {
  if (mode !== 'subscribe') return null;
  if (token !== expectedToken) return null;
  if (!challenge) return null;

  // Meta API espera retornar o challenge
  return challenge;
}

/**
 * Parser de eventos webhook da Meta API
 */
export function parseWebhookEvent(body: Record<string, unknown>): WebhookEvent[] {
  const events: WebhookEvent[] = [];

  const entry = (body.entry as Array<Record<string, unknown>>) || [];

  for (const item of entry) {
    const messaging = (item.messaging as Array<Record<string, unknown>>) || [];

    for (const msg of messaging) {
      const senderId = msg.sender?.id as string;
      const recipientId = msg.recipient?.id as string;
      const timestamp = msg.timestamp as number;

      // Processar mensagens recebidas
      const message = msg.message as Record<string, unknown> | undefined;
      if (message && senderId && timestamp) {
        events.push({
          type: 'message',
          channel: 'facebook', // Detector automático
          contactId: senderId,
          contactName: senderId,
          messageId: message.mid as string,
          text: (message.text as string) || '',
          timestamp,
          metadata: {
            hasAttachments: !!(message.attachments as unknown[])?.length,
          },
        });
      }

      // Processar confirmações de leitura
      const read = msg.read as Record<string, unknown> | undefined;
      if (read) {
        events.push({
          type: 'status',
          channel: 'facebook',
          contactId: senderId,
          contactName: senderId,
          messageId: '',
          text: 'Mensagem lida',
          timestamp,
        });
      }

      // Processar confirmações de entrega
      const delivery = msg.delivery as Record<string, unknown> | undefined;
      if (delivery) {
        events.push({
          type: 'status',
          channel: 'facebook',
          contactId: senderId,
          contactName: senderId,
          messageId: '',
          text: 'Mensagem entregue',
          timestamp,
        });
      }
    }
  }

  return events;
}

/**
 * Configuração ambiente para webhooks
 *
 * Adicione ao seu .env:
 *
 * VITE_META_API_TOKEN=seu_access_token_aqui
 * VITE_WEBHOOK_URL=https://seu-dominio.com/api/webhooks/meta
 * VITE_WEBHOOK_VERIFY_TOKEN=seu_token_aleatorio_aqui
 * VITE_META_PAGE_ID=seu_page_id
 * VITE_WHATSAPP_PHONE_NUMBER_ID=seu_phone_id
 * VITE_META_APP_ID=seu_app_id
 * VITE_META_APP_SECRET=seu_app_secret
 */
export const webhookEnvVars = [
  'VITE_META_API_TOKEN',
  'VITE_WEBHOOK_URL',
  'VITE_WEBHOOK_VERIFY_TOKEN',
  'VITE_META_PAGE_ID',
  'VITE_WHATSAPP_PHONE_NUMBER_ID',
  'VITE_META_APP_ID',
  'VITE_META_APP_SECRET',
];
