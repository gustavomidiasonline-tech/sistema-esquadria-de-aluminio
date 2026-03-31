import { useState, useRef, useEffect } from 'react';
import { Send, Phone, Video, MoreVertical, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ChannelIcon, ChannelBadge } from '@/components/redes-sociais/ChannelIcon';
import type { SocialContact, SocialMessage } from '@/components/redes-sociais/types';

interface ConversationChatProps {
  contact: SocialContact | null;
  messages: SocialMessage[];
  onSend: (text: string) => void;
  onBack?: () => void;
}

export function ConversationChat({ contact, messages, onSend, onBack }: ConversationChatProps) {
  const [text, setText] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!contact) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground/30 gap-4">
        <div className="h-16 w-16 rounded-full bg-secondary border border-border flex items-center justify-center">
          <svg className="h-8 w-8 text-muted-foreground/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-muted-foreground/60">Selecione uma conversa</p>
          <p className="text-xs text-muted-foreground/40 mt-1">Escolha um contato para começar a conversar</p>
        </div>
      </div>
    );
  }

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
        {onBack && (
          <button onClick={onBack} className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors md:hidden">
            <ArrowLeft className="h-4 w-4" />
          </button>
        )}
        <div className="relative">
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 border border-border flex items-center justify-center text-primary font-bold text-sm">
            {contact.name.charAt(0)}
          </div>
          <div className="absolute -bottom-0.5 -right-0.5">
            <ChannelIcon channel={contact.channel} size={14} />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-foreground">{contact.name}</span>
            <ChannelBadge channel={contact.channel} />
          </div>
          <p className={cn(
            'text-[11px]',
            contact.online ? 'text-primary uppercase font-bold tracking-tight' : 'text-muted-foreground/60'
          )}>
            {contact.online ? 'Online agora' : 'Offline'}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
            <Phone className="h-4 w-4" />
          </button>
          <button className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
            <Video className="h-4 w-4" />
          </button>
          <button className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
            <MoreVertical className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn('flex', msg.fromMe ? 'justify-end' : 'justify-start')}
          >
            <div className={cn(
              'max-w-[70%] rounded-2xl px-4 py-2.5 text-sm',
              msg.fromMe
                ? 'bg-primary text-primary-foreground font-medium rounded-br-sm shadow-sm'
                : 'bg-secondary text-foreground border border-border rounded-bl-sm shadow-sm'
            )}>
              <p className="leading-relaxed">{msg.text}</p>
              <p className={cn(
                'text-[10px] mt-1',
                msg.fromMe ? 'text-primary-foreground/60 text-right' : 'text-muted-foreground/50'
              )}>
                {msg.timestamp}
              </p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-border">
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder={`Responder via ${contact.channel === 'whatsapp' ? 'WhatsApp' : contact.channel === 'instagram' ? 'Instagram' : 'Facebook'}...`}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm text-foreground/80 placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/40 transition-colors"
          />
          <button
            onClick={handleSend}
            disabled={!text.trim()}
            className={cn(
              'p-2.5 rounded-xl transition-all',
              text.trim()
                ? 'bg-primary text-primary-foreground hover:opacity-90 shadow-sm'
                : 'bg-secondary text-muted-foreground/30 cursor-not-allowed'
            )}
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
        <p className="text-[10px] text-muted-foreground/40 mt-1.5 text-center">
          As mensagens são enviadas diretamente pelo canal conectado
        </p>
      </div>
    </div>
  );
}
