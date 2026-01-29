export interface Conversation {
  id: string;
  userId: string;
  dealId: string | null;
  title: string;
  context: ConversationContext;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationContext {
  source: 'platform' | 'extension';
  dealName?: string;
  companyName?: string;
  hubspotRecordType?: 'deal' | 'contact' | 'company';
  hubspotRecordId?: string;
}

export interface Message {
  id: string;
  conversationId: string;
  role: MessageRole;
  content: string;
  skillId: string | null;
  createdAt: string;
}

export type MessageRole = 'user' | 'assistant';

export interface SendMessageRequest {
  content: string;
  skillId?: string;
}

export interface ConversationWithMessages extends Conversation {
  messages: Message[];
}

export interface ConversationListParams {
  dealId?: string;
  limit?: number;
  offset?: number;
}
