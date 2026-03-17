import { ArrowLeft, CheckCircle2, ExternalLink, AlertCircle } from 'lucide-react';
import { ChannelIcon } from '@/components/redes-sociais/ChannelIcon';
import type { SocialChannel } from '@/components/redes-sociais/types';

interface SocialConnectProps {
  onBack: () => void;
}

interface ChannelConfig {
  channel: SocialChannel;
  name: string;
  description: string;
  status: 'connected' | 'disconnected' | 'pending';
  accountName?: string;
}

const CHANNELS: ChannelConfig[] = [
  {
    channel: 'whatsapp',
    name: 'WhatsApp Business',
    description: 'Receba e responda mensagens do WhatsApp Business diretamente',
    status: 'connected',
    accountName: '+55 11 99999-0000',
  },
  {
    channel: 'instagram',
    name: 'Instagram Direct',
    description: 'Gerencie DMs e comentários do Instagram em um só lugar',
    status: 'connected',
    accountName: '@minha_empresa',
  },
  {
    channel: 'facebook',
    name: 'Facebook Messenger',
    description: 'Integre as mensagens do Facebook Messenger',
    status: 'disconnected',
  },
];

const STATUS_CONFIG = {
  connected: { label: 'Conectado', color: 'text-[#00ff88] bg-[#00ff88]/10 border-[#00ff88]/30' },
  disconnected: { label: 'Desconectado', color: 'text-white/50 bg-white/5 border-white/10' },
  pending: { label: 'Pendente', color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30' },
};

export function SocialConnect({ onBack }: SocialConnectProps) {
  return (
    <div className="flex flex-col h-full p-6">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onBack}
          className="p-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h2 className="text-base font-semibold text-white">Conectar Canais</h2>
          <p className="text-xs text-white/50">Integre suas redes sociais para receber mensagens ao vivo</p>
        </div>
      </div>

      <div className="grid gap-4 max-w-2xl">
        {CHANNELS.map((ch) => {
          const status = STATUS_CONFIG[ch.status];
          return (
            <div
              key={ch.channel}
              className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-colors"
            >
              <div className="h-12 w-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                <ChannelIcon channel={ch.channel} size={28} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm font-semibold text-white">{ch.name}</span>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${status.color}`}>
                    {ch.status === 'connected' ? (
                      <CheckCircle2 className="h-2.5 w-2.5" />
                    ) : (
                      <AlertCircle className="h-2.5 w-2.5" />
                    )}
                    {status.label}
                  </span>
                </div>
                <p className="text-xs text-white/50">{ch.description}</p>
                {ch.accountName && (
                  <p className="text-[11px] text-[#00ff88] mt-1 font-medium">{ch.accountName}</p>
                )}
              </div>
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/15 hover:border-white/30 text-white/60 hover:text-white text-xs font-medium transition-all whitespace-nowrap">
                {ch.status === 'connected' ? 'Configurar' : 'Conectar'}
                <ExternalLink className="h-3 w-3" />
              </button>
            </div>
          );
        })}
      </div>

      <div className="mt-6 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-blue-400 mb-1">Integração via API Oficial</p>
            <p className="text-[11px] text-white/50 leading-relaxed">
              As integrações utilizam as APIs oficiais de cada plataforma (Meta Business API para WhatsApp, Instagram e Facebook).
              Configure suas credenciais no painel de configurações para ativar as integrações ao vivo.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
