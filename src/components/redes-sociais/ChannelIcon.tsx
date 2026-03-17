import type { SocialChannel } from '@/components/redes-sociais/types';

interface ChannelIconProps {
  channel: SocialChannel;
  size?: number;
  className?: string;
}

export function ChannelIcon({ channel, size = 16, className = '' }: ChannelIconProps) {
  if (channel === 'whatsapp') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <circle cx="12" cy="12" r="12" fill="#25D366" />
        <path
          d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"
          fill="white"
        />
      </svg>
    );
  }

  if (channel === 'instagram') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <defs>
          <radialGradient id="ig-grad" cx="30%" cy="107%" r="140%">
            <stop offset="0%" stopColor="#fdf497" />
            <stop offset="5%" stopColor="#fdf497" />
            <stop offset="45%" stopColor="#fd5949" />
            <stop offset="60%" stopColor="#d6249f" />
            <stop offset="90%" stopColor="#285AEB" />
          </radialGradient>
        </defs>
        <circle cx="12" cy="12" r="12" fill="url(#ig-grad)" />
        <rect x="7" y="7" width="10" height="10" rx="3" stroke="white" strokeWidth="1.5" fill="none" />
        <circle cx="12" cy="12" r="2.5" stroke="white" strokeWidth="1.5" fill="none" />
        <circle cx="15.5" cy="8.5" r="0.8" fill="white" />
      </svg>
    );
  }

  // facebook
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="12" fill="#1877F2" />
      <path
        d="M15.5 8H13.5C13.2 8 13 8.2 13 8.5V10H15.5L15.2 12.5H13V19H10.5V12.5H9V10H10.5V8.5C10.5 6.6 11.6 5 13.5 5H15.5V8Z"
        fill="white"
      />
    </svg>
  );
}

export function ChannelBadge({ channel }: { channel: SocialChannel }) {
  const labels: Record<SocialChannel, string> = {
    whatsapp: 'WhatsApp',
    instagram: 'Instagram',
    facebook: 'Facebook',
  };
  const colors: Record<SocialChannel, string> = {
    whatsapp: 'bg-green-500/20 text-green-400 border-green-500/30',
    instagram: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
    facebook: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  };

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${colors[channel]}`}>
      <ChannelIcon channel={channel} size={10} />
      {labels[channel]}
    </span>
  );
}
