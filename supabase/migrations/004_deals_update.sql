-- Migration: 004_deals_update
-- Description: Add new columns for contacts, companies, stage label, and engagement tracking
-- Created: 2026-01-30

-- Add new columns to deals table
ALTER TABLE deals ADD COLUMN IF NOT EXISTS company_id VARCHAR(255);
ALTER TABLE deals ADD COLUMN IF NOT EXISTS stage_label VARCHAR(255);
ALTER TABLE deals ADD COLUMN IF NOT EXISTS hubspot_stage_id VARCHAR(255);
ALTER TABLE deals ADD COLUMN IF NOT EXISTS pipeline_id VARCHAR(255);
ALTER TABLE deals ADD COLUMN IF NOT EXISTS pipeline_name VARCHAR(255);
ALTER TABLE deals ADD COLUMN IF NOT EXISTS last_engagement_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS contacts JSONB DEFAULT '[]';
ALTER TABLE deals ADD COLUMN IF NOT EXISTS companies JSONB DEFAULT '[]';

-- Create index for engagement tracking
CREATE INDEX IF NOT EXISTS idx_deals_last_engagement ON deals(last_engagement_date);

-- Create index for stage filtering
CREATE INDEX IF NOT EXISTS idx_deals_hubspot_stage ON deals(hubspot_stage_id);

-- Create index for pipeline filtering
CREATE INDEX IF NOT EXISTS idx_deals_pipeline ON deals(pipeline_id);

-- Add comments
COMMENT ON COLUMN deals.company_id IS 'Primary associated company HubSpot ID';
COMMENT ON COLUMN deals.stage_label IS 'Human-readable stage label from HubSpot pipeline';
COMMENT ON COLUMN deals.hubspot_stage_id IS 'Original HubSpot pipeline stage ID for filtering';
COMMENT ON COLUMN deals.pipeline_id IS 'HubSpot pipeline ID this deal belongs to';
COMMENT ON COLUMN deals.pipeline_name IS 'Human-readable pipeline name';
COMMENT ON COLUMN deals.last_engagement_date IS 'Most recent engagement activity date';
COMMENT ON COLUMN deals.contacts IS 'Associated contacts as JSON array';
COMMENT ON COLUMN deals.companies IS 'Associated companies as JSON array';

-- Create hubspot_config table for storing portal and pipeline settings
CREATE TABLE IF NOT EXISTS hubspot_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portal_id INTEGER NOT NULL,
  pipeline_id VARCHAR(255) NOT NULL,
  pipeline_name VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Only allow one config row
CREATE UNIQUE INDEX IF NOT EXISTS idx_hubspot_config_singleton ON hubspot_config ((true));

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_hubspot_config_updated_at ON hubspot_config;
CREATE TRIGGER update_hubspot_config_updated_at
  BEFORE UPDATE ON hubspot_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE hubspot_config ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Authenticated users can read hubspot_config" ON hubspot_config
  FOR SELECT USING (true);

CREATE POLICY "Service role full access on hubspot_config" ON hubspot_config
  FOR ALL USING (true) WITH CHECK (true);
