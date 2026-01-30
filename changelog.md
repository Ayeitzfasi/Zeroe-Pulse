# Zeroe Pulse AI - Changelog

> Track all changes, decisions, and modifications to the project.

---

## [0.7.0] - 2026-01-30 (Phase 6 In Progress - Chrome Extension)

### Added
- **Improved Context Detection**
  - Background script listens for tab URL changes (`chrome.tabs.onUpdated`)
  - Background script listens for tab activation (`chrome.tabs.onActivated`)
  - Context stored in `chrome.storage.local` for persistence
  - Side panel polls for context changes every 1.5 seconds
  - Reliable SPA navigation detection for HubSpot

- **Floating Tab Toggle**
  - Floating tab now toggles side panel open/close (not just open)
  - Uses `chrome.sidePanel.close()` API (Chrome 116+)
  - State tracking in background script

- **Logo Updates**
  - Side panel header uses gradient bar + "Pulse AI" text (matches platform)
  - Login screen uses same gradient bar styling
  - Generated gradient bar extension icons (16x16, 48x48, 128x128)
  - Icons use Zeroe gradient (blue → purple → coral)

- **Contact & Company Support**
  - Detect contact pages (0-1 object type)
  - Detect company pages (0-2 object type)
  - Fetch associated deals for contacts/companies
  - Display record info in side panel header

- **HubSpot Actions**
  - Create Task button with confirmation modal
  - Log Note button with confirmation modal
  - Task fields: subject, body, due date, priority
  - Note fields: body text
  - Success notifications after actions

- **Request Cancellation**
  - Stop button appears during AI processing
  - Uses AbortController to cancel fetch requests
  - Cleans up optimistic messages on cancel

- **Markdown Formatting**
  - ReactMarkdown with remark-gfm for AI responses
  - Custom CSS for proper spacing (headers, lists, paragraphs)
  - Code block styling

- **Skill Creation from Extension**
  - Added `skillsApi` to extension with `createSkill` and `getSkills` methods
  - Skills are saved with `source: 'extension'` for tracking
  - Automatic detection of `<skill_ready>` tags in AI responses
  - Purple "Skill Ready" notification with Save/Dismiss buttons
  - One-click saving of AI-generated skills to user's account

### Changed
- Background script now manages side panel open state per tab
- Side panel notifies background on open/close for state tracking
- Extension icons regenerated with gradient design
- Updated `general` and `deal` system prompts to support skill creation
- AI now generates skills with `<skill_ready>` tags when asked to create skills

---

## [0.6.1] - 2026-01-30 (Phase 5 Enhanced - HubSpot Engagements & Skill Execution)

### Added
- **HubSpot Engagements Integration**
  - Fetch emails, calls, meetings, notes, tasks for deal context
  - Activity history with timestamps, subjects, and content previews
  - Summary counts (X emails, Y calls, Z meetings, etc.)
  - Most recent 20 activities shown in AI context

- **Automatic Skill Execution**
  - All user skills automatically loaded into conversations
  - Claude intelligently selects and applies relevant skills
  - Users can explicitly call skills: "run the [skill name] skill"
  - Skill usage indicated with "📋 **Using skill: [Name]**" prefix

### Changed
- System prompts updated with SKILLS SYSTEM instructions
- `buildSkillContext()` now provides executable instructions, not just references
- `conversationService` automatically loads all user skills

---

## [0.6.0] - 2026-01-30 (Phase 5 Complete - AI Chat Implementation)

### Added
- **Claude API Integration**
  - `claudeService.ts` - Claude API client with Anthropic SDK
  - System prompts for different conversation types (general, deal, skill_creation)
  - Deal context building for AI conversations
  - Skill context building for AI conversations
  - Title generation from first message

- **Conversations API**
  - `GET /conversations` - List with type/deal filtering and pagination
  - `POST /conversations` - Create new conversation
  - `GET /conversations/:id` - Get conversation with messages
  - `POST /conversations/:id/messages` - Send message and get AI response
  - `DELETE /conversations/:id` - Delete conversation
  - Database migration 007_conversations.sql

- **Chat Components**
  - `ChatPanel.tsx` - Reusable chat component with markdown rendering
  - ReactMarkdown with remark-gfm for message formatting
  - Typing indicators and loading states
  - Auto-scroll to latest messages
  - `<skill_ready>` tag cleaning for display

- **Deal Page Chat**
  - Expandable AI chat panel on deal detail page
  - Deal context automatically included in AI responses
  - Persists conversation across sessions

- **Chat History Page** (`/history`)
  - Lists all conversations with filtering (All, General, Deal, Skill Creation)
  - Relative timestamps (e.g., "5m ago", "2h ago")
  - Delete conversations with confirmation
  - Pagination for large lists

- **General Chat** (`/chat`, `/chat/[id]`)
  - Standalone chat page for general conversations
  - Chat detail page for continuing existing conversations
  - URL updates after first message

---

## [0.5.0] - 2026-01-30 (Phase 4 & 9 Complete - Skills & AI Skill Creation)

### Added
- **Skills Database**
  - `005_skills.sql` - Skills table with prompt, description, is_shared fields
  - `006_skills_source.sql` - Source tracking (manual, import, ai_generated, extension)

- **Skills API**
  - `GET /skills` - List skills with pagination
  - `POST /skills` - Create skill
  - `PUT /skills/:id` - Update skill
  - `DELETE /skills/:id` - Delete skill
  - `POST /skills/import` - Import .skill file (ZIP with SKILL.md)
  - `GET /skills/:id/export` - Export skill as .skill file

- **Skills List Page** (`/skills`)
  - Grid layout with skill cards
  - Source badges (Manual, Import, AI Generated)
  - Drag & drop import zone
  - File picker for .skill import
  - Search and visibility filtering

- **Skill Detail Page** (`/skills/[id]`)
  - Markdown viewer with remark-gfm
  - Rendered/Raw toggle for viewing
  - Export as .skill file button
  - Edit and delete actions

- **AI Skill Creation** (`/skills/new`)
  - AI chat-based skill creation (no manual form)
  - Guided mode with step-by-step questions
  - Freeform mode for open iteration
  - `<skill_ready>` tag extraction
  - Preview panel with rendered markdown
  - Floating save button

- **.skill File Format Support**
  - ZIP archive containing `{skill-name}/SKILL.md`
  - YAML frontmatter parsing (name, version, description)
  - Import from meeting-processor.skill format
  - Export generates compatible ZIP

### Changed
- Tailwind config updated with typography plugin for prose styling

---

## [0.4.1] - 2026-01-30 (Phase 3 Enhanced - Deals Improvements)

### Added
- **Pipeline Selection**
  - Choose which HubSpot pipeline to sync deals from
  - Pipeline selector modal on first sync
  - Clear & Re-sync button to change pipeline

- **Pipeline Filtering** (requires migration 004)
  - Pipeline filter dropdown in deals list
  - Pipeline column in deals table
  - `GET /deals/filters/pipelines` endpoint for distinct pipelines

- **Deal Detail Enhancements**
  - Contacts section with names, emails, job titles
  - Companies section with names and domains
  - Clickable HubSpot links for deals, contacts, companies (EU1 region)
  - Last engagement date display
  - Confluence placeholder section

- **Dynamic Stage Filter**
  - Stage filter now loads stages from the selected HubSpot pipeline
  - Shows actual stage labels from HubSpot

- **Database Migration 004**
  - `pipeline_id` and `pipeline_name` columns
  - `contacts` and `companies` JSONB columns
  - `hubspot_stage_id` column for filtering
  - `last_engagement_date` column
  - `hubspot_config` table for storing sync settings

### Changed
- Stage badges now use `whitespace-nowrap` to prevent awkward wrapping
- HubSpot links use EU1 region URL format
- Improved HubSpot integration to fetch contacts, companies, and owners

### Fixed
- Stage badge styling for longer stage names

---

## [0.4.0] - 2026-01-30 (Phase 3 Complete - Deals Feature)

### Added
- **Database**
  - `003_deals.sql` migration with deals table
  - `deal_stage` enum type (qualified, discovery, demo, proposal, negotiation, closed_won, closed_lost)
  - Indexes for performance on hubspot_id, stage, company_name, close_date, updated_at

- **HubSpot Integration**
  - `apps/api/src/integrations/hubspot.ts` - HubSpot API client
  - Fetch all deals with pagination
  - Normalize HubSpot deals to app format
  - Fetch associated companies and owners
  - Stage mapping from HubSpot to app stages

- **Deals API**
  - `GET /deals` - List deals with pagination, filtering, sorting
  - `GET /deals/:id` - Get single deal by ID
  - `GET /deals/stats` - Get deal statistics by stage
  - `POST /deals/sync` - Sync deals from HubSpot
  - Support for user's personal HubSpot API key or env fallback

- **Deals Service**
  - `apps/api/src/services/dealService.ts` - Database operations
  - findAll with pagination, search, stage filter, sorting
  - findById, findByHubspotId
  - upsertFromHubSpot for sync operations
  - getStats for dashboard metrics

- **Web Platform**
  - `/deals` - Deals list page with full-featured table
    - Search by deal name or company
    - Filter by stage
    - Sort by name, amount, close date, updated date
    - Pagination with 25/50/100 options
    - Sync from HubSpot button with loading state
  - `/deals/[id]` - Deal detail page
    - Deal information display
    - Quick info sidebar
    - Link to view in HubSpot
    - Placeholders for AI analysis and chat (Phase 5/8)

- **API Client**
  - Added getDeals, getDeal, getDealStats, syncDeals methods

---

## [0.3.0] - 2026-01-30 (Phase 2 Complete + API Keys)

### Added
- **Platform Layout & Navigation**
  - `Sidebar.tsx` - Navigation sidebar with links to Deals, Skills, History, Settings
  - `Header.tsx` - Top header with user dropdown menu and logout
  - `AppLayout.tsx` - Main layout wrapper combining sidebar + header
  - Placeholder pages for `/deals`, `/skills`, `/history`
  - Settings page with Profile, Security, and API Keys sections

- **API Keys Management**
  - Users can add, update, and remove their own API keys
  - Anthropic (Claude AI) API key support
  - HubSpot API key support
  - Confluence API key support
  - Keys are masked when displayed for security (e.g., `sk-a••••••••xyz`)
  - `GET /auth/api-keys` - Retrieve masked API keys
  - `PUT /auth/api-keys` - Update API keys
  - Database migration `002_api_keys.sql` for `anthropic_api_key` column
  - `UserApiKeys` and `UpdateApiKeysRequest` types added to shared package

### Changed
- Updated `apps/web/src/app/dashboard/page.tsx` to use AppLayout
- Updated `apps/web/src/app/settings/password/page.tsx` to use AppLayout
- Fixed Supabase dotenv loading in `apps/api/src/lib/supabase.ts`

---

## [0.2.0] - 2026-01-30 (Phase 1 Complete)

### Added
- **Authentication System**
  - `POST /auth/login` - User login with JWT token
  - `POST /auth/change-password` - Password change for authenticated users
  - `GET /auth/me` - Get current user profile
  - JWT generation and validation middleware
  - bcryptjs password hashing

- **Web Platform Auth**
  - Login page with Zeroe branding (`/login`)
  - Dashboard page (`/dashboard`)
  - Change password page (`/settings/password`)
  - `AuthContext` for global auth state management
  - `ProtectedRoute` component for route protection
  - API client with token management

- **Chrome Extension Auth**
  - Token storage in `chrome.storage.local`
  - Auth sync from web platform via content script
  - Login state detection in sidepanel

- **Database**
  - `001_users.sql` migration with users table
  - Row Level Security policies
  - `seed.sql` with test user (admin@zeroe.io / admin123)

---

## [0.1.0] - 2026-01-30 (Phase 0 Complete)

### Added
- **Monorepo Structure**
  - Turborepo for workspace management
  - Root `package.json` with npm workspaces
  - `turbo.json` for build orchestration

- **Web Platform (`apps/web`)**
  - Next.js 14 with App Router
  - Tailwind CSS with Zeroe brand colors
  - Landing page with Zeroe branding
  - Login page (UI only, auth in Phase 1)

- **API Server (`apps/api`)**
  - Express with TypeScript
  - Health check endpoint (`GET /health`)
  - Error handling middleware
  - Supabase client setup

- **Chrome Extension (`apps/extension`)**
  - Manifest V3 configuration
  - Vite + React build setup
  - Background service worker
  - Content script for HubSpot detection
  - Side panel React app

- **Shared Package (`packages/shared`)**
  - TypeScript types for User, Deal, Skill, Conversation
  - API response types

- **Configuration**
  - Environment variable templates for all apps
  - Tailwind with Zeroe brand colors (Blue #2673EA, etc.)
  - TypeScript configurations

- **Documentation**
  - README with setup instructions
  - Updated progress.md
  - Updated changelog.md

---

## [Unreleased]

### Planning Phase - January 30, 2026

#### Added
- **Project Documentation Structure**
  - `claude.md` - Core guidelines for Claude Code development
  - `progress.md` - Progress tracking for all phases
  - `changelog.md` - This change log
  - `Final_Plan.md` - Comprehensive implementation plan

- **Local Development Workflow**
  - Added local server URLs (web: 3000, api: 3001)
  - Added instructions for running all apps simultaneously
  - Added Chrome extension local testing instructions
  - Added verification workflow pattern for each feature

- **Git Workflow**
  - Commit and push after each completed feature
  - Always ask user before pushing to GitHub
  - Descriptive commit messages (feat/fix/docs convention)

#### Decisions Made
- **Team Setup**: Solo developer using Claude Code
- **Infrastructure**: Starting fresh (no existing Supabase/credentials)
- **MVP Skill**: Meeting Summary (integrates with meeting-processor.skill)
- **Timeline**: Flexible/ongoing - prioritize quality over speed

#### Planned Skills
| Skill | Priority | Description |
|-------|----------|-------------|
| Meeting Summary | MVP | Summarize key points from call transcripts |
| Sales-to-Delivery Handover | Post-MVP | Generate comprehensive handover documents |
| Follow-up Email Generator | Post-MVP | Draft contextual follow-up emails |
| Proposal Outline Generator | Post-MVP | Create proposal outlines from discovery |
| Deal Risk Analyzer | Post-MVP | Identify and explain deal risks |

---

## Change Request Template

When requesting changes, please use this format:

```
### Change Request: [Title]
**Date**: YYYY-MM-DD
**Requested By**: [Name]
**Priority**: High/Medium/Low

**Current Behavior**:
[Describe what currently exists or happens]

**Desired Behavior**:
[Describe what should happen instead]

**Reason**:
[Why is this change needed?]

**Impact**:
[What files/features will be affected?]
```

---

## Version History

| Version | Date | Description |
|---------|------|-------------|
| 0.7.0 | 2026-01-30 | Phase 6 In Progress - Chrome Extension Enhancements |
| 0.6.1 | 2026-01-30 | Phase 5 Enhanced - HubSpot Engagements & Skill Execution |
| 0.6.0 | 2026-01-30 | Phase 5 Complete - AI Chat Implementation |
| 0.5.0 | 2026-01-30 | Phase 4 & 9 Complete - Skills CRUD & AI Skill Creation |
| 0.4.1 | 2026-01-30 | Phase 3 Enhanced - Pipeline filtering, contacts, companies |
| 0.4.0 | 2026-01-30 | Phase 3 Complete - Deals Feature with HubSpot Integration |
| 0.3.0 | 2026-01-30 | Phase 2 Complete + API Keys Management |
| 0.2.0 | 2026-01-30 | Phase 1 Complete - Authentication System |
| 0.1.0 | 2026-01-30 | Phase 0 Complete - Project Foundation |
| 0.0.0 | 2026-01-30 | Initial Planning |

---

## How This File Is Used

1. **During Development**: Claude Code will update this file when implementing changes
2. **Change Requests**: Add change requests here before implementation
3. **Tracking**: Use this as a historical record of all modifications
4. **Context**: Helps Claude Code understand what has changed over time

---

## Categories

Changes are categorized as:
- **Added** - New features or files
- **Changed** - Modifications to existing features
- **Deprecated** - Features marked for future removal
- **Removed** - Deleted features or files
- **Fixed** - Bug fixes
- **Security** - Security-related changes
- **Decisions** - Key decisions that affect the project direction
