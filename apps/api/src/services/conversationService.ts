import { supabase } from '../lib/supabase.js';
import * as claudeService from './claudeService.js';
import * as dealService from './dealService.js';
import * as skillService from './skillService.js';
import type {
  Conversation,
  ConversationWithMessages,
  Message,
  ConversationType,
  CreateConversationRequest,
  SendMessageRequest,
  SendMessageResponse,
  ConversationListParams,
  ConversationListResponse,
} from '@zeroe-pulse/shared';

interface DbConversation {
  id: string;
  user_id: string;
  title: string | null;
  type: ConversationType;
  deal_id: string | null;
  skill_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

interface DbMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  tool_calls: unknown[] | null;
  tool_results: unknown[] | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

function mapDbConversation(db: DbConversation): Conversation {
  return {
    id: db.id,
    userId: db.user_id,
    title: db.title,
    type: db.type,
    dealId: db.deal_id,
    skillId: db.skill_id,
    metadata: db.metadata || {},
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  };
}

function mapDbMessage(db: DbMessage): Message {
  return {
    id: db.id,
    conversationId: db.conversation_id,
    role: db.role,
    content: db.content,
    toolCalls: db.tool_calls || undefined,
    toolResults: db.tool_results || undefined,
    metadata: db.metadata || {},
    createdAt: db.created_at,
  };
}

// List conversations
export async function findAll(
  userId: string,
  params: ConversationListParams = {}
): Promise<ConversationListResponse> {
  const { type, dealId, limit = 20, offset = 0 } = params;

  let query = supabase
    .from('conversations')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (type) {
    query = query.eq('type', type);
  }
  if (dealId) {
    query = query.eq('deal_id', dealId);
  }

  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error('Error fetching conversations:', error);
    throw new Error('Failed to fetch conversations');
  }

  return {
    conversations: (data || []).map(d => mapDbConversation(d as DbConversation)),
    total: count || 0,
  };
}

// Get single conversation with messages
export async function findById(
  id: string,
  userId: string
): Promise<ConversationWithMessages | null> {
  const { data: convData, error: convError } = await supabase
    .from('conversations')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  if (convError || !convData) {
    return null;
  }

  const { data: msgData, error: msgError } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', id)
    .order('created_at', { ascending: true });

  if (msgError) {
    console.error('Error fetching messages:', msgError);
    throw new Error('Failed to fetch messages');
  }

  const conversation = mapDbConversation(convData as DbConversation);
  const messages = (msgData || []).map(m => mapDbMessage(m as DbMessage));

  return {
    ...conversation,
    messages,
  };
}

// Create new conversation
export async function create(
  userId: string,
  data: CreateConversationRequest
): Promise<Conversation> {
  const { data: newConv, error } = await supabase
    .from('conversations')
    .insert({
      user_id: userId,
      title: data.title || null,
      type: data.type || 'general',
      deal_id: data.dealId || null,
      skill_id: data.skillId || null,
      metadata: data.metadata || {},
    })
    .select()
    .single();

  if (error || !newConv) {
    console.error('Error creating conversation:', error);
    throw new Error('Failed to create conversation');
  }

  return mapDbConversation(newConv as DbConversation);
}

// Add a message to conversation
async function addMessage(
  conversationId: string,
  role: 'user' | 'assistant' | 'system',
  content: string,
  metadata: Record<string, unknown> = {}
): Promise<Message> {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      role,
      content,
      metadata,
    })
    .select()
    .single();

  if (error || !data) {
    console.error('Error adding message:', error);
    throw new Error('Failed to add message');
  }

  return mapDbMessage(data as DbMessage);
}

// Update conversation title
async function updateTitle(id: string, title: string): Promise<void> {
  await supabase
    .from('conversations')
    .update({ title })
    .eq('id', id);
}

// Send message and get AI response
export async function sendMessage(
  conversationId: string,
  userId: string,
  data: SendMessageRequest
): Promise<SendMessageResponse> {
  // Get conversation to check ownership and type
  const conversation = await findById(conversationId, userId);
  if (!conversation) {
    throw new Error('Conversation not found');
  }

  // Save user message
  const userMessage = await addMessage(conversationId, 'user', data.content);

  // Build context based on conversation type and request
  let context = '';

  // Add deal context if this is a deal conversation
  if (conversation.type === 'deal' && conversation.dealId) {
    try {
      const deal = await dealService.findById(conversation.dealId);
      if (deal) {
        context += claudeService.buildDealContext({
          name: deal.name,
          amount: deal.amount,
          stage: deal.stage,
          stageName: deal.stageLabel,
          closeDate: deal.closeDate,
          companyName: deal.companyName,
          contacts: deal.contacts?.map(c => ({
            name: c.name || 'Unknown',
            email: c.email || '',
            title: c.jobTitle || undefined,
          })),
        });
      }
    } catch (e) {
      console.warn('Failed to load deal context:', e);
    }
  }

  // Add skill context if requested
  if (data.includeContext?.skills && data.includeContext.skills.length > 0) {
    try {
      const skillsData = await Promise.all(
        data.includeContext.skills.map(id => skillService.findById(id, userId))
      );
      const validSkills = skillsData.filter(s => s !== null) as NonNullable<typeof skillsData[0]>[];
      if (validSkills.length > 0) {
        context += '\n\n' + claudeService.buildSkillContext(
          validSkills.map(s => ({
            name: s.name,
            description: s.description || undefined,
            prompt: s.prompt,
          }))
        );
      }
    } catch (e) {
      console.warn('Failed to load skill context:', e);
    }
  }

  // Get AI response
  const aiResponse = await claudeService.chat({
    conversationType: conversation.type,
    messages: conversation.messages.concat([userMessage]),
    context: context || undefined,
  });

  // Save assistant message
  const assistantMessage = await addMessage(
    conversationId,
    'assistant',
    aiResponse.content,
    {
      usage: aiResponse.usage,
    }
  );

  // Generate title if this is the first message
  if (conversation.messages.length === 0 && !conversation.title) {
    try {
      const title = await claudeService.generateTitle(data.content);
      await updateTitle(conversationId, title);
    } catch (e) {
      console.warn('Failed to generate title:', e);
    }
  }

  // Update conversation updated_at
  await supabase
    .from('conversations')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', conversationId);

  return {
    userMessage,
    assistantMessage,
    generatedSkill: aiResponse.extractedSkill,
  };
}

// Delete conversation
export async function remove(id: string, userId: string): Promise<boolean> {
  const { error } = await supabase
    .from('conversations')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) {
    console.error('Error deleting conversation:', error);
    return false;
  }

  return true;
}
