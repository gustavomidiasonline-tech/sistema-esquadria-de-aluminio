import { Star, Search, SlidersHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ChannelIcon } from '@/components/redes-sociais/ChannelIcon';
import type { SocialContact, SocialChannel } from '@/components/redes-sociais/types';

interface ConversationListProps {
  contacts: SocialContact[];
  selectedId: string | null;
  onSelect: (contact: SocialContact) => void;
  search: string;
  onSearch: (v: string) => void;
  filter: SocialChannel | 'all';
  onFilter: (f: SocialChannel | 'all') => void;
  totalUnread: number;
}

const FILTER_OPTIONS: { label: string; value: SocialChannel | 'all' }[] = [
  { label: 'Todos', value: 'all' },
  { label: 'WhatsApp', value: 'whatsapp' },
  { label: 'Instagram', value: 'instagram' },
  { label: 'Facebook', value: 'facebook' },
];

export function ConversationList({
  contacts,
  selectedId,
  onSelect,
  search,
  onSearch,
  filter,
  onFilter,
  totalUnread,
}: ConversationListProps) {
  return (
    <div className="flex flex-col h-full border-r border-white/10">
      {/* Header */}
      <div className="px-4 pt-4 pb-2 border-b border-white/10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-white/90 uppercase tracking-wider">
              Caixa de Entrada
            </h2>
            {totalUnread > 0 && (
              <span className="bg-[#00ff88] text-black text-[10px] font-bold px-2 py-0.5 rounded-full">
                {totalUnread}
              </span>
            )}
          </div>
          <button className="p-1.5 rounded-lg hover:bg-white/10 text-white/50 hover:text-white/90 transition-colors">
            <SlidersHorizontal className="h-4 w-4" />
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/40" />
          <input
            type="text"
            placeholder="Buscar conversa..."
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-sm text-white/80 placeholder:text-white/30 focus:outline-none focus:border-[#00ff88]/40 transition-colors"
          />
        </div>

        {/* Channel filters */}
        <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none">
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onFilter(opt.value)}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap transition-all',
                filter === opt.value
                  ? 'bg-[#00ff88]/20 text-[#00ff88] border border-[#00ff88]/40'
                  : 'text-white/50 hover:text-white/80 hover:bg-white/8 border border-transparent'
              )}
            >
              {opt.value !== 'all' && <ChannelIcon channel={opt.value} size={12} />}
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Contacts */}
      <div className="flex-1 overflow-y-auto">
        {contacts.length === 0 && (
          <div className="flex flex-col items-center justify-center h-32 text-white/30 text-sm">
            Nenhuma conversa encontrada
          </div>
        )}
        {contacts.map((contact) => (
          <button
            key={contact.id}
            onClick={() => onSelect(contact)}
            className={cn(
              'w-full flex items-center gap-3 px-4 py-3 transition-all border-b border-white/5 text-left',
              selectedId === contact.id
                ? 'bg-white/10 border-l-2 border-l-[#00ff88]'
                : 'hover:bg-white/5'
            )}
          >
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-white/20 to-white/5 border border-white/20 flex items-center justify-center text-white font-semibold text-sm">
                {contact.name.charAt(0)}
              </div>
              {/* Channel badge */}
              <div className="absolute -bottom-0.5 -right-0.5">
                <ChannelIcon channel={contact.channel} size={14} />
              </div>
              {/* Online dot */}
              {contact.online && (
                <div className="absolute top-0 right-0 h-2.5 w-2.5 rounded-full bg-[#00ff88] border-2 border-[#1e1b4b]" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1 mb-0.5">
                <span className={cn(
                  'text-sm truncate',
                  contact.unread > 0 ? 'font-semibold text-white' : 'font-medium text-white/80'
                )}>
                  {contact.name}
                </span>
                <span className="text-[10px] text-white/40 shrink-0">{contact.lastMessageTime}</span>
              </div>
              <div className="flex items-center justify-between gap-1">
                <p className={cn(
                  'text-xs truncate',
                  contact.unread > 0 ? 'text-white/70' : 'text-white/40'
                )}>
                  {contact.lastMessage}
                </p>
                <div className="flex items-center gap-1 shrink-0">
                  {contact.starred && (
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  )}
                  {contact.unread > 0 && (
                    <span className="bg-[#00ff88] text-black text-[9px] font-bold h-4 w-4 rounded-full flex items-center justify-center">
                      {contact.unread}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
