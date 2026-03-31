import { useState, useMemo, useCallback, useEffect } from 'react';
import { Radio, Wifi, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ConversationList } from '@/components/redes-sociais/ConversationList';
import { ConversationChat } from '@/components/redes-sociais/ConversationChat';
import { SocialConnect } from '@/components/redes-sociais/SocialConnect';
import {
  useSocialConversations,
  useSocialMessages,
  useSendSocialMessage,
  useMarkSocialAsRead,
} from '@/hooks/useSocialMedia';
import type { SocialContact, SocialChannel } from '@/components/redes-sociais/types';

type ActiveView = 'inbox' | 'chat' | 'connect';

export function SocialInbox() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<SocialChannel | 'all'>('all');
  const [activeView, setActiveView] = useState<ActiveView>('inbox');
  const [liveIndicator, setLiveIndicator] = useState(true);

  // ── Queries ────────────────────────────────────────────────
  const { data: contacts = [], isLoading: loadingContacts } = useSocialConversations();
  const { data: messages = [] } = useSocialMessages(selectedId);
  const sendMessage = useSendSocialMessage();
  const markAsRead = useMarkSocialAsRead();

  // Pulse "AO VIVO"
  useEffect(() => {
    const id = setInterval(() => setLiveIndicator((prev) => !prev), 2000);
    return () => clearInterval(id);
  }, []);

  // ── Derived ────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return contacts.filter((c) => {
      const matchFilter = filter === 'all' || c.channel === filter;
      const matchSearch =
        !search ||
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.lastMessage.toLowerCase().includes(search.toLowerCase());
      return matchFilter && matchSearch;
    });
  }, [contacts, filter, search]);

  const totalUnread = useMemo(
    () => contacts.reduce((acc, c) => acc + c.unread, 0),
    [contacts]
  );

  const selectedContact = useMemo(
    () => contacts.find((c) => c.id === selectedId) ?? null,
    [contacts, selectedId]
  );

  const stats = useMemo(
    () => ({
      whatsapp: contacts.filter((c) => c.channel === 'whatsapp').length,
      instagram: contacts.filter((c) => c.channel === 'instagram').length,
      facebook: contacts.filter((c) => c.channel === 'facebook').length,
    }),
    [contacts]
  );

  // ── Handlers ───────────────────────────────────────────────
  const handleSelect = useCallback(
    (contact: SocialContact) => {
      setSelectedId(contact.id);
      setActiveView('chat');
      if (contact.unread > 0) {
        markAsRead.mutate(contact.id);
      }
    },
    [markAsRead]
  );

  const handleSend = useCallback(
    (text: string) => {
      if (!selectedId) return;
      sendMessage.mutate({ contactId: selectedId, text });
    },
    [selectedId, sendMessage]
  );

  // ── Render ─────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full gap-4" style={{ minHeight: 'calc(100vh - 120px)' }}>
      {/* Top bar */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary/20 to-blue-500/20 border border-border flex items-center justify-center">
            <Radio className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">Redes Sociais</h1>
            <div className="flex items-center gap-1.5">
              {loadingContacts ? (
                <Loader2 className="h-3 w-3 text-muted-foreground/40 animate-spin" />
              ) : (
                <div
                  className={cn(
                    'h-1.5 w-1.5 rounded-full transition-opacity duration-500',
                    liveIndicator ? 'bg-[#00ff88] opacity-100' : 'opacity-30 bg-[#00ff88]'
                  )}
                />
              )}
              <span className="text-[10px] text-[#00ff88] font-medium">
                {loadingContacts ? 'Carregando...' : 'AO VIVO'}
              </span>
            </div>
          </div>
        </div>

        {/* Stats + action */}
        <div className="flex items-center gap-2">
          <StatPill label="WhatsApp" count={stats.whatsapp} color="bg-green-500/20 text-green-400 border-green-500/30" />
          <StatPill label="Instagram" count={stats.instagram} color="bg-pink-500/20 text-pink-400 border-pink-500/30" />
          <StatPill label="Facebook" count={stats.facebook} color="bg-blue-500/10 text-blue-600 border-blue-500/20" />
          <button
            onClick={() => setActiveView(activeView === 'connect' ? 'inbox' : 'connect')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary hover:bg-secondary/80 border border-border text-foreground/70 hover:text-foreground text-xs font-medium transition-all"
          >
            <Wifi className="h-3.5 w-3.5" />
            Conectar Canais
          </button>
        </div>
      </div>

      {/* Main panel */}
      <div
        className="flex-1 rounded-2xl overflow-hidden border border-border bg-card/40 backdrop-blur-md shadow-sm"
        style={{
          display: 'grid',
          gridTemplateColumns: activeView === 'connect' ? '1fr' : '320px 1fr',
        }}
      >
        {activeView === 'connect' ? (
          <SocialConnect onBack={() => setActiveView('inbox')} />
        ) : (
          <>
            {/* Conversation list */}
            <div className={cn('h-full', activeView === 'chat' ? 'hidden md:block' : 'block')}>
              <ConversationList
                contacts={filtered}
                selectedId={selectedId}
                onSelect={handleSelect}
                search={search}
                onSearch={setSearch}
                filter={filter}
                onFilter={setFilter}
                totalUnread={totalUnread}
              />
            </div>

            {/* Chat panel */}
            <div
              className={cn(
                'h-full border-l border-border',
                activeView === 'inbox' ? 'hidden md:block' : 'block'
              )}
            >
              <ConversationChat
                contact={selectedContact}
                messages={messages}
                onSend={handleSend}
                onBack={() => setActiveView('inbox')}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

interface StatPillProps {
  label: string;
  count: number;
  color: string;
}

function StatPill({ label, count, color }: StatPillProps) {
  return (
    <span
      className={cn(
        'hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium border',
        color
      )}
    >
      {count} {label}
    </span>
  );
}
