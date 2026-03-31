import type { SocialChannel } from '@/components/redes-sociais/types';
import { MessageCircle, Instagram, Facebook } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChannelIconProps {
  channel: SocialChannel;
  size?: number;
  className?: string;
}

export function ChannelIcon({ channel, size = 16, className = '' }: ChannelIconProps) {
  const iconProps = {
    size,
    className: cn("shrink-0", className)
  };

  if (channel === 'whatsapp') {
    return <MessageCircle {...iconProps} className={cn(iconProps.className, "text-[#25D366]")} />;
  }

  if (channel === 'instagram') {
    return <Instagram {...iconProps} className={cn(iconProps.className, "text-[#E4405F]")} />;
  }

  if (channel === 'facebook') {
    return <Facebook {...iconProps} className={cn(iconProps.className, "text-[#1877F2]")} />;
  }

  return null;
}

export function ChannelBadge({ channel }: { channel: SocialChannel }) {
  const labels: Record<SocialChannel, string> = {
    whatsapp: 'WhatsApp',
    instagram: 'Instagram',
    facebook: 'Facebook',
  };
  const colors: Record<SocialChannel, string> = {
    whatsapp: 'bg-green-500/10 text-emerald-600 border-green-500/20',
    instagram: 'bg-pink-500/10 text-pink-600 border-pink-500/20',
    facebook: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  };

  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition-colors",
      colors[channel]
    )}>
      <ChannelIcon channel={channel} size={10} />
      {labels[channel]}
    </span>
  );
}
