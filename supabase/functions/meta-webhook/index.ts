/**
 * meta-webhook — Supabase Edge Function
 *
 * Recebe eventos do Meta Webhook (WhatsApp, Instagram, Facebook)
 * e persiste no Supabase. O Supabase Realtime notifica o frontend
 * automaticamente via pub/sub nas tabelas social_conversations e social_messages.
 *
 * SETUP no painel do Meta:
 *   URL: https://<project>.supabase.co/functions/v1/meta-webhook
 *   Verify Token: valor de META_WEBHOOK_VERIFY_TOKEN (Supabase secret)
 *   Eventos a subscrever:
 *     - messages (WhatsApp)
 *     - instagram_direct_messages (Instagram)
 *     - messages (Messenger/Facebook)
 *
 * SECRETS necessários (supabase secrets set):
 *   META_WEBHOOK_VERIFY_TOKEN   — token de verificação do webhook
 *   META_APP_SECRET             — para validar assinatura X-Hub-Signature-256
 *   META_PAGE_ID                — ID da página para identificar mensagens de saída
 *   COMPANY_ID                  — UUID da empresa no banco (multitenancy)
 *
 * @see https://developers.facebook.com/docs/graph-api/webhooks/getting-started
 * @see https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ──────────────────────────────────────────────────────────────
// Config (Supabase secrets — injetados em runtime)
// ──────────────────────────────────────────────────────────────

const VERIFY_TOKEN  = Deno.env.get('META_WEBHOOK_VERIFY_TOKEN') ?? '';
const APP_SECRET    = Deno.env.get('META_APP_SECRET') ?? '';
const PAGE_ID       = Deno.env.get('META_PAGE_ID') ?? '';
const COMPANY_ID    = Deno.env.get('COMPANY_ID') ?? '';
const SUPABASE_URL  = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_KEY   = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

// ──────────────────────────────────────────────────────────────
// Tipos (payload bruto do Meta)
// ──────────────────────────────────────────────────────────────

interface MetaWebhookPayload {
  object: 'whatsapp_business_account' | 'instagram' | 'page';
  entry: MetaEntry[];
}

interface MetaEntry {
  id: string;
  changes?: MetaChange[];
  messaging?: MetaMessaging[];
}

interface MetaChange {
  value: {
    messaging_product?: string;
    contacts?: Array<{ wa_id: string; profile: { name: string } }>;
    messages?: Array<{
      id: string;
      from: string;
      timestamp: string;
      type: string;
      text?: { body: string };
    }>;
  };
  field: string;
}

interface MetaMessaging {
  sender: { id: string };
  recipient: { id: string };
  timestamp: number;
  message?: { mid: string; text: string };
}

// ──────────────────────────────────────────────────────────────
// Utilitário: verificar assinatura HMAC-SHA256
// ──────────────────────────────────────────────────────────────

async function verifySignature(body: string, signature: string | null): Promise<boolean> {
  if (!APP_SECRET || !signature) return !APP_SECRET; // skip se APP_SECRET não configurado
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(APP_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body));
  const hex = Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, '0')).join('');
  return signature === `sha256=${hex}`;
}

// ──────────────────────────────────────────────────────────────
// Utilitário: upsert conversa + insert mensagem
// ──────────────────────────────────────────────────────────────

interface UpsertMessageArgs {
  channel: 'whatsapp' | 'instagram' | 'facebook';
  externalConvId: string;
  contactExternalId: string;
  contactName: string;
  messageExternalId: string;
  text: string;
  fromMe: boolean;
  rawPayload: unknown;
  db: ReturnType<typeof createClient>;
}

async function upsertMessage(args: UpsertMessageArgs): Promise<void> {
  const {
    channel, externalConvId, contactExternalId, contactName,
    messageExternalId, text, fromMe, rawPayload, db,
  } = args;

  // 1. Upsert conversa (cria ou atualiza last_message)
  const { data: conv, error: convErr } = await db
    .from('social_conversations')
    .upsert(
      {
        company_id: COMPANY_ID,
        external_id: externalConvId,
        channel,
        contact_name: contactName,
        contact_external_id: contactExternalId,
        last_message: text,
        last_message_at: new Date().toISOString(),
        // Se mensagem é de entrada (não de mim), incrementa unread
        unread_count: fromMe ? 0 : 1,
      },
      {
        onConflict: 'company_id,external_id,channel',
        ignoreDuplicates: false,
      },
    )
    .select('id')
    .single();

  if (convErr) {
    console.error('[meta-webhook] Erro ao upsert conversa:', convErr);
    throw convErr;
  }

  // Se mensagem de entrada, incrementar unread via RPC segura
  if (!fromMe && conv?.id) {
    await db.rpc('increment_social_unread', { p_conversation_id: conv.id });
  }

  // 2. Insert mensagem (ignora duplicata pelo external_id)
  if (conv?.id && messageExternalId) {
    const { error: msgErr } = await db
      .from('social_messages')
      .upsert(
        {
          conversation_id: conv.id,
          external_id: messageExternalId,
          text,
          from_me: fromMe,
          read: fromMe,
          raw_payload: rawPayload as Record<string, unknown>,
        },
        { onConflict: 'conversation_id,external_id', ignoreDuplicates: true },
      );

    if (msgErr) {
      console.error('[meta-webhook] Erro ao insert mensagem:', msgErr);
    }
  }
}

// ──────────────────────────────────────────────────────────────
// Handlers por plataforma
// ──────────────────────────────────────────────────────────────

async function handleWhatsApp(entry: MetaEntry, db: ReturnType<typeof createClient>): Promise<void> {
  for (const change of entry.changes ?? []) {
    if (change.field !== 'messages') continue;
    const { contacts = [], messages = [] } = change.value;

    for (const msg of messages) {
      if (msg.type !== 'text' || !msg.text?.body) continue;

      const contact = contacts.find((c) => c.wa_id === msg.from);
      await upsertMessage({
        channel: 'whatsapp',
        externalConvId: msg.from, // Número de telefone como ID de conversa
        contactExternalId: msg.from,
        contactName: contact?.profile.name ?? msg.from,
        messageExternalId: msg.id,
        text: msg.text.body,
        fromMe: false,
        rawPayload: msg,
        db,
      });
    }
  }
}

async function handleInstagramOrFacebook(
  entry: MetaEntry,
  channel: 'instagram' | 'facebook',
  db: ReturnType<typeof createClient>,
): Promise<void> {
  for (const messaging of entry.messaging ?? []) {
    if (!messaging.message?.text) continue;

    const fromMe = messaging.sender.id === PAGE_ID;
    const contactId = fromMe ? messaging.recipient.id : messaging.sender.id;

    await upsertMessage({
      channel,
      externalConvId: contactId,
      contactExternalId: contactId,
      contactName: contactId, // Nome real requer chamada adicional à API
      messageExternalId: messaging.message.mid,
      text: messaging.message.text,
      fromMe,
      rawPayload: messaging,
      db,
    });
  }
}

// ──────────────────────────────────────────────────────────────
// Handler principal
// ──────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  const url = new URL(req.url);

  // ── Verificação do Webhook (GET) ───────────────────────────
  if (req.method === 'GET') {
    const mode      = url.searchParams.get('hub.mode');
    const token     = url.searchParams.get('hub.verify_token');
    const challenge = url.searchParams.get('hub.challenge');

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      return new Response(challenge ?? '', { status: 200 });
    }
    return new Response('Forbidden', { status: 403 });
  }

  // ── Recepção de eventos (POST) ─────────────────────────────
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const body = await req.text();

  // Verificar assinatura do Meta
  const signature = req.headers.get('x-hub-signature-256');
  const valid = await verifySignature(body, signature);
  if (!valid) {
    return new Response('Invalid signature', { status: 401 });
  }

  let payload: MetaWebhookPayload;
  try {
    payload = JSON.parse(body) as MetaWebhookPayload;
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  // Responder ao Meta imediatamente (SLA de 20s)
  // Processamento assíncrono via waitUntil quando disponível
  const db = createClient(SUPABASE_URL, SERVICE_KEY);

  try {
    for (const entry of payload.entry) {
      if (payload.object === 'whatsapp_business_account') {
        await handleWhatsApp(entry, db);
      } else if (payload.object === 'instagram') {
        await handleInstagramOrFacebook(entry, 'instagram', db);
      } else if (payload.object === 'page') {
        await handleInstagramOrFacebook(entry, 'facebook', db);
      }
    }
  } catch (err) {
    console.error('[meta-webhook] Erro no processamento:', err);
    // Retorna 200 mesmo assim para o Meta não retentar em loop
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});
