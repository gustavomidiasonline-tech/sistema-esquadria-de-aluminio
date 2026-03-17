export type SocialChannel = 'whatsapp' | 'instagram' | 'facebook';

export interface SocialMessage {
  id: string;
  text: string;
  timestamp: string;
  fromMe: boolean;
  read: boolean;
}

export interface SocialContact {
  id: string;
  name: string;
  avatar?: string;
  channel: SocialChannel;
  lastMessage: string;
  lastMessageTime: string;
  unread: number;
  starred: boolean;
  online: boolean;
  messages: SocialMessage[];
}
