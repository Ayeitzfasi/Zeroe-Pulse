export type ConversationType = 'general' | 'deal' | 'skill_creation';
export type MessageRole = 'user' | 'assistant' | 'system';

export interface ConversationContext {
  source: 'platform' | 'extension';
  dealName?: string;
  companyName?: string;
  hubspotRecordType?: 'deal' | 'contact' | 'company';
  hubspotRecordId?: string;
}

export interface Conversation {
  id: string;
  userId: string;
  title: string | null;
  type: ConversationType;
  dealId: string | null;
  skillId: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  role: MessageRole;
  content: string;
  toolCalls?: unknown[];
  toolResults?: unknown[];
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface ConversationWithMessages extends Conversation {
  messages: Message[];
}

// API Request/Response types
export interface CreateConversationRequest {
  title?: string;
  type?: ConversationType;
  dealId?: string;
  skillId?: string;
  metadata?: Record<string, unknown>;
}

export interface SendMessageRequest {
  content: string;
  // Optional context to include
  includeContext?: {
    deal?: boolean;
    skills?: string[]; // skill IDs to include as context
  };
}

export interface SendMessageResponse {
  userMessage: Message;
  assistantMessage: Message;
  // If skill creation, the generated skill content
  generatedSkill?: {
    name: string;
    description: string;
    content: string;
  };
}

export interface ConversationListParams {
  type?: ConversationType;
  dealId?: string;
  limit?: number;
  offset?: number;
}

export interface ConversationListResponse {
  conversations: Conversation[];
  total: number;
}

// For streaming responses (future)
export interface StreamingMessage {
  type: 'start' | 'delta' | 'end' | 'error';
  content?: string;
  messageId?: string;
  error?: string;
}
