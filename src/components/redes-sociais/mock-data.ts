import type { SocialContact } from '@/components/redes-sociais/types';

/**
 * MOCK_CONTACTS — Estrutura pronta para receber APIs reais
 *
 * Removidas falsas mensagens. Sistema aguarda integração com:
 * - Meta API (WhatsApp, Instagram, Facebook)
 * - Webhook real para sincronizar conversas
 *
 * TODO: Integrar com social-media.service.ts para carregar dados reais
 */
export const MOCK_CONTACTS: SocialContact[] = [];
