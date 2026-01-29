-- Migration: 002_api_keys
-- Description: Add Anthropic API key column to users table
-- Created: 2026-01-30

-- Add anthropic_api_key column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS anthropic_api_key TEXT;

-- Add comment for documentation
COMMENT ON COLUMN users.anthropic_api_key IS 'User''s personal Anthropic API key for Claude AI';
COMMENT ON COLUMN users.hubspot_token IS 'User''s HubSpot private app access token';
COMMENT ON COLUMN users.confluence_token IS 'User''s Confluence API token';
