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
  connected: { label: 'Conectado', color: 'text-primary bg-primary/10 border-primary/30' },
  disconnected: { label: 'Desconectado', color: 'text-muted-foreground bg-secondary border-border' },
  pending: { label: 'Pendente', color: 'text-amber-600 bg-amber-500/10 border-amber-500/30' },
};

export function SocialConnect({ onBack }: SocialConnectProps) {
  return (
    <div className="flex flex-col h-full p-6">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onBack}
          className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h2 className="text-base font-bold text-foreground">Conectar Canais</h2>
          <p className="text-xs text-muted-foreground/60">Integre suas redes sociais para receber mensagens ao vivo</p>
        </div>
      </div>

      <div className="grid gap-4 max-w-2xl">
        {CHANNELS.map((ch) => {
          const status = STATUS_CONFIG[ch.status];
          return (
            <div
              key={ch.channel}
              className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors shadow-sm"
            >
              <div className="h-12 w-12 rounded-xl bg-secondary border border-border flex items-center justify-center shrink-0">
                <ChannelIcon channel={ch.channel} size={28} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm font-bold text-foreground">{ch.name}</span>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${status.color}`}>
                    {ch.status === 'connected' ? (
                      <CheckCircle2 className="h-2.5 w-2.5" />
                    ) : (
                      <AlertCircle className="h-2.5 w-2.5" />
                    )}
                    {status.label}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground/70">{ch.description}</p>
                {ch.accountName && (
                  <p className="text-[11px] text-primary mt-1 font-bold">{ch.accountName}</p>
                )}
              </div>
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-secondary hover:bg-secondary/80 text-foreground/70 hover:text-foreground text-xs font-bold transition-all whitespace-nowrap shadow-sm">
                {ch.status === 'connected' ? 'Configurar' : 'Conectar'}
                <ExternalLink className="h-3 w-3" />
              </button>
            </div>
          );
        })}
      </div>

      <div className="mt-6 p-4 rounded-xl bg-primary/5 border border-primary/20">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-primary mb-1 uppercase tracking-tight">Integração via API Oficial</p>
            <p className="text-[11px] text-muted-foreground/70 leading-relaxed uppercase font-medium">
              As integrações utilizam as APIs oficiais de cada plataforma (Meta Business API para WhatsApp, Instagram e Facebook).
              Configure suas credenciais no painel de configurações para ativar as integrações ao vivo.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
