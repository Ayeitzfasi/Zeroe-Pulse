-- Migration: 006_skills_source
-- Description: Add source tracking columns to skills table
-- Created: 2026-01-30

-- Add source column to track how the skill was created
ALTER TABLE skills ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'manual';

-- Add source_file column to track original filename for imports
ALTER TABLE skills ADD COLUMN IF NOT EXISTS source_file VARCHAR(255);

-- Add comments
COMMENT ON COLUMN skills.source IS 'How the skill was created: manual, import, ai_generated, extension';
COMMENT ON COLUMN skills.source_file IS 'Original filename if skill was imported from a .skill file';

-- Create index on source for filtering
CREATE INDEX IF NOT EXISTS idx_skills_source ON skills(source);
