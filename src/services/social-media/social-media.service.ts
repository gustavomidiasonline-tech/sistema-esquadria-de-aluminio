/**
 * SocialMediaService — Factory que escolhe o provider correto.
 *
 * Lógica de seleção:
 *   VITE_META_API_TOKEN presente → MetaApiProvider (produção)
 *   Sem token               → MockProvider (desenvolvimento)
 *
 * A UI nunca sabe qual provider está ativo — só usa ISocialMediaProvider.
 *
 * Para trocar para produção: adicione as variáveis no .env e reinicie o dev server.
 */

import type { ISocialMediaProvider } from '@/services/social-media/social-media.provider';
import { MockProvider } from '@/services/social-media/mock.provider';
import { MetaApiProvider } from '@/services/social-media/meta-api.provider';

// Singleton — um provider por sessão do app
let _instance: ISocialMediaProvider | null = null;

export function getSocialMediaService(): ISocialMediaProvider {
  if (_instance) return _instance;

  const token = import.meta.env.VITE_META_API_TOKEN as string | undefined;

  if (token) {
    _instance = new MetaApiProvider({
      accessToken: token,
      whatsappPhoneNumberId: import.meta.env.VITE_WHATSAPP_PHONE_NUMBER_ID ?? '',
      metaPageId: import.meta.env.VITE_META_PAGE_ID ?? '',
      // Em produção: aponte para seu backend intermediário
      // apiBase: import.meta.env.VITE_SOCIAL_API_BASE ?? 'https://graph.facebook.com/v19.0',
      apiBase: (import.meta.env.VITE_SOCIAL_API_BASE as string | undefined)
        ?? 'https://graph.facebook.com/v19.0',
    });

    console.info('[SocialMedia] Usando Meta API Provider (produção)');
  } else {
    _instance = new MockProvider();
    console.info('[SocialMedia] Usando Mock Provider (sem VITE_META_API_TOKEN)');
  }

  return _instance;
}

/**
 * Força reset do singleton (útil em testes ou troca de credenciais em runtime).
 */
export function resetSocialMediaService(): void {
  _instance = null;
}

export type { ISocialMediaProvider } from '@/services/social-media/social-media.provider';
export type { SendMessageRequest, SendMessageResult, ChannelStatus } from '@/services/social-media/social-media.provider';
