-- Migration: 007_conversations
-- Description: Create conversations and messages tables for AI chat
-- Created: 2026-01-30

-- Conversation types
-- 'general' - General chat
-- 'deal' - Deal-specific chat (linked to a deal)
-- 'skill_creation' - Creating a new skill via chat

-- Create conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255),
  type VARCHAR(50) NOT NULL DEFAULT 'general',
  -- Context references
  deal_id UUID REFERENCES deals(id) ON DELETE SET NULL,
  skill_id UUID REFERENCES skills(id) ON DELETE SET NULL,
  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  -- For tool use / function calls
  tool_calls JSONB,
  tool_results JSONB,
  -- Metadata (tokens used, model, etc.)
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_type ON conversations(type);
CREATE INDEX IF NOT EXISTS idx_conversations_deal_id ON conversations(deal_id);
CREATE INDEX IF NOT EXISTS idx_conversations_skill_id ON conversations(skill_id);
CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON conversations(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

-- Add comments
COMMENT ON TABLE conversations IS 'AI chat conversations';
COMMENT ON COLUMN conversations.user_id IS 'Owner of the conversation';
COMMENT ON COLUMN conversations.title IS 'Auto-generated or user-set title';
COMMENT ON COLUMN conversations.type IS 'Type: general, deal, skill_creation';
COMMENT ON COLUMN conversations.deal_id IS 'Associated deal for deal-type conversations';
COMMENT ON COLUMN conversations.skill_id IS 'Associated skill for skill_creation conversations';
COMMENT ON COLUMN conversations.metadata IS 'Additional metadata (context sources, settings)';

COMMENT ON TABLE messages IS 'Messages within conversations';
COMMENT ON COLUMN messages.role IS 'Message role: user, assistant, system';
COMMENT ON COLUMN messages.content IS 'Message content';
COMMENT ON COLUMN messages.tool_calls IS 'Tool/function calls made by assistant';
COMMENT ON COLUMN messages.tool_results IS 'Results from tool calls';
COMMENT ON COLUMN messages.metadata IS 'Token counts, model info, etc.';

-- Create trigger for updated_at on conversations
DROP TRIGGER IF EXISTS update_conversations_updated_at ON conversations;
CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Policies for conversations
CREATE POLICY "Users can read own conversations" ON conversations
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create own conversations" ON conversations
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own conversations" ON conversations
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own conversations" ON conversations
  FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "Service role full access on conversations" ON conversations
  FOR ALL USING (true) WITH CHECK (true);

-- Policies for messages (through conversation ownership)
CREATE POLICY "Users can read messages of own conversations" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND conversations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create messages in own conversations" ON messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND conversations.user_id = auth.uid()
    )
  );

CREATE POLICY "Service role full access on messages" ON messages
  FOR ALL USING (true) WITH CHECK (true);
