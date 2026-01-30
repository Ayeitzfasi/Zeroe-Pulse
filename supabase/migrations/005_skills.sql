-- Migration: 005_skills
-- Description: Create skills table for reusable AI prompts/workflows
-- Created: 2026-01-30

-- Create skills table
CREATE TABLE IF NOT EXISTS skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  prompt TEXT NOT NULL,
  category VARCHAR(100),
  is_shared BOOLEAN DEFAULT false,
  icon VARCHAR(50) DEFAULT 'sparkles',
  variables JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_skills_user_id ON skills(user_id);
CREATE INDEX IF NOT EXISTS idx_skills_is_shared ON skills(is_shared);
CREATE INDEX IF NOT EXISTS idx_skills_category ON skills(category);
CREATE INDEX IF NOT EXISTS idx_skills_name ON skills(name);

-- Add comments
COMMENT ON TABLE skills IS 'Reusable AI prompts and workflows';
COMMENT ON COLUMN skills.user_id IS 'Owner of the skill';
COMMENT ON COLUMN skills.name IS 'Display name of the skill';
COMMENT ON COLUMN skills.description IS 'Brief description of what the skill does';
COMMENT ON COLUMN skills.prompt IS 'The AI prompt template';
COMMENT ON COLUMN skills.category IS 'Category for organizing skills (e.g., sales, analysis, writing)';
COMMENT ON COLUMN skills.is_shared IS 'Whether the skill is visible to all users';
COMMENT ON COLUMN skills.icon IS 'Icon identifier for the skill';
COMMENT ON COLUMN skills.variables IS 'JSON array of variable definitions for the prompt';

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_skills_updated_at ON skills;
CREATE TRIGGER update_skills_updated_at
  BEFORE UPDATE ON skills
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;

-- Policies
-- Users can read their own skills and shared skills
CREATE POLICY "Users can read own and shared skills" ON skills
  FOR SELECT USING (
    user_id = auth.uid() OR is_shared = true
  );

-- Users can insert their own skills
CREATE POLICY "Users can create own skills" ON skills
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can update their own skills
CREATE POLICY "Users can update own skills" ON skills
  FOR UPDATE USING (user_id = auth.uid());

-- Users can delete their own skills
CREATE POLICY "Users can delete own skills" ON skills
  FOR DELETE USING (user_id = auth.uid());

-- Service role has full access
CREATE POLICY "Service role full access on skills" ON skills
  FOR ALL USING (true) WITH CHECK (true);
