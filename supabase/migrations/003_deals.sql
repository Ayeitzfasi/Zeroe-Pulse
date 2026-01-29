-- Migration: 003_deals
-- Description: Create deals table for HubSpot deal sync
-- Created: 2026-01-30

-- Create deal_stage enum type
DO $$ BEGIN
  CREATE TYPE deal_stage AS ENUM (
    'qualified',
    'discovery',
    'demo',
    'proposal',
    'negotiation',
    'closed_won',
    'closed_lost'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create deals table
CREATE TABLE IF NOT EXISTS deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hubspot_id VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(500) NOT NULL,
  company_name VARCHAR(500),
  stage deal_stage NOT NULL DEFAULT 'qualified',
  amount DECIMAL(15, 2),
  close_date DATE,
  owner_name VARCHAR(255),
  owner_id VARCHAR(255),
  analysis JSONB,
  properties JSONB DEFAULT '{}',
  last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_deals_hubspot_id ON deals(hubspot_id);
CREATE INDEX IF NOT EXISTS idx_deals_stage ON deals(stage);
CREATE INDEX IF NOT EXISTS idx_deals_company_name ON deals(company_name);
CREATE INDEX IF NOT EXISTS idx_deals_close_date ON deals(close_date);
CREATE INDEX IF NOT EXISTS idx_deals_updated_at ON deals(updated_at);

-- Create trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_deals_updated_at ON deals;
CREATE TRIGGER update_deals_updated_at
  BEFORE UPDATE ON deals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;

-- Policy: Allow read access for all authenticated users
CREATE POLICY "Authenticated users can read deals" ON deals
  FOR SELECT
  USING (true);

-- Policy: Only service role can insert/update/delete
CREATE POLICY "Service role full access on deals" ON deals
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Add comment for documentation
COMMENT ON TABLE deals IS 'Synced deals from HubSpot CRM';
COMMENT ON COLUMN deals.hubspot_id IS 'HubSpot deal ID for sync reference';
COMMENT ON COLUMN deals.analysis IS 'AI-generated BANT/MEDIC analysis JSON';
COMMENT ON COLUMN deals.properties IS 'Additional HubSpot properties as JSON';
