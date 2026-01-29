# Zeroe Pulse AI - Final Implementation Plan

> Version: 1.0 | Last Updated: January 30, 2026

---

## Executive Summary

**Zeroe Pulse AI** is an internal tool for Zeroe.io that consolidates sales context from HubSpot, Confluence, and meeting transcripts into one AI-powered interface.

### Components
1. **Web Platform** (Next.js 14) - Dashboard for deals, AI chat, skills management
2. **Chrome Extension** (Manifest V3) - HubSpot sidebar for contextual AI assistance
3. **Backend API** (Express + Supabase) - Shared API for both interfaces

### Key Value Propositions
- Consolidated context from 3 data sources
- Reusable Claude Skills for standardized workflows
- AI-generated BANT/MEDIC deal analysis
- 30 minutes of searching → 30 seconds

### Project Setup
- **Developer**: Solo developer with Claude Code
- **Infrastructure**: Starting fresh
- **MVP Skill**: Meeting Summary
- **Timeline**: Flexible/ongoing (quality-focused)

---

## Tech Stack

| Layer | Technology | Notes |
|-------|------------|-------|
| Frontend - Platform | Next.js 14 (App Router) | Tailwind CSS, React Query |
| Frontend - Extension | React + Vite | Manifest V3 Side Panel |
| Backend | Node.js + Express | TypeScript |
| Database | Supabase (PostgreSQL) | Managed Postgres + Auth |
| AI | Claude API (Anthropic) | Claude 3.5 Sonnet |
| Hosting - Frontend | Vercel | Optimized for Next.js |
| Hosting - Backend | Google Cloud Run | Container-based |
| Scheduler | Google Cloud Scheduler | Daily sync jobs |

---

## Implementation Phases

### Phase 0: Project Foundation
**Goal**: Repository structure, dev environment, core configuration

| Task | Priority | Complexity |
|------|----------|------------|
| Initialize Turborepo monorepo | Must Have | Low |
| Set up apps/web (Next.js 14) | Must Have | Low |
| Set up apps/api (Express + TS) | Must Have | Low |
| Set up apps/extension (Vite) | Must Have | Low |
| Set up packages/shared | Must Have | Low |
| Configure Tailwind + Zeroe colors | Must Have | Low |
| Set up Supabase project | Must Have | Medium |
| Environment variables template | Must Have | Low |

**Key Deliverable**: Running monorepo with three apps that compile

---

### Phase 1: Authentication System
**Goal**: Users can log in to platform and extension

| Task | Priority | Complexity |
|------|----------|------------|
| Users table migration | Must Have | Low |
| POST /auth/login | Must Have | Medium |
| POST /auth/change-password | Must Have | Medium |
| GET /auth/me | Must Have | Low |
| JWT middleware | Must Have | Medium |
| Login page UI | Must Have | Medium |
| Change password page | Must Have | Low |
| Auth context/provider | Must Have | Medium |
| Protected route wrapper | Must Have | Low |
| Extension login state | Must Have | Medium |
| Extension token storage | Must Have | Low |

**Key Deliverable**: User can log in on platform, extension detects auth state

---

### Phase 2: Platform Layout & Navigation
**Goal**: Authenticated shell with navigation

| Task | Priority | Complexity |
|------|----------|------------|
| Main layout component | Must Have | Medium |
| Sidebar navigation | Must Have | Low |
| Header with user menu | Must Have | Low |
| Route structure | Must Have | Low |
| Placeholder pages | Must Have | Low |
| Zeroe brand styling | Must Have | Medium |

**Key Deliverable**: User can navigate between empty pages

---

### Phase 3: Deals Feature (Basic)
**Goal**: Display deals from HubSpot (no AI analysis yet)

| Task | Priority | Complexity |
|------|----------|------------|
| Deals table migration | Must Have | Low |
| HubSpot integration service | Must Have | High |
| GET /deals endpoint | Must Have | Medium |
| GET /deals/:id endpoint | Must Have | Low |
| POST /deals/sync | Must Have | Medium |
| Deals list page + table | Must Have | Medium |
| Filters (stage, search) | Must Have | Medium |
| Sorting | Must Have | Low |
| Pagination | Must Have | Low |
| Deal detail page | Must Have | Medium |
| Sync button + status | Must Have | Low |

**Key Deliverable**: User sees real HubSpot deals in platform

---

### Phase 4: Skills CRUD
**Goal**: Users can create and manage skills

| Task | Priority | Complexity |
|------|----------|------------|
| Skills table migration | Must Have | Low |
| GET /skills | Must Have | Low |
| POST /skills | Must Have | Low |
| PUT /skills/:id | Must Have | Low |
| DELETE /skills/:id | Must Have | Low |
| Skills list page | Must Have | Medium |
| Skill detail/edit page | Must Have | Medium |
| New skill page (form) | Must Have | Medium |
| Private/shared toggle | Must Have | Low |
| Delete confirmation | Must Have | Low |

**Key Deliverable**: User can CRUD skills (no AI assistance yet)

---

### Phase 5: AI Chat Implementation
**Goal**: AI chat works in platform

| Task | Priority | Complexity |
|------|----------|------------|
| Conversations table | Must Have | Low |
| Messages table | Must Have | Low |
| Claude integration service | Must Have | High |
| GET /conversations | Must Have | Low |
| POST /conversations | Must Have | Low |
| POST /conversations/:id/messages | Must Have | High |
| Context assembly service | Must Have | High |
| Chat UI component | Must Have | High |
| Markdown rendering | Must Have | Medium |
| Loading indicators | Must Have | Low |
| Chat in deal detail | Must Have | Medium |
| Chat history page | Must Have | Medium |

**Key Deliverable**: User can chat with AI about deals

---

### Phase 6: Chrome Extension
**Goal**: Extension opens as sidebar with chat in HubSpot

| Task | Priority | Complexity |
|------|----------|------------|
| Manifest.json (V3) | Must Have | Medium |
| Background service worker | Must Have | Medium |
| Content script (HubSpot) | Must Have | High |
| Side panel React app | Must Have | High |
| Context detection | Must Have | High |
| API client | Must Have | Medium |
| Chat UI | Must Have | Medium |
| Skill picker drawer | Must Have | Medium |
| Sync status | Must Have | Low |
| Brand styling | Must Have | Medium |

**Key Deliverable**: Extension works alongside HubSpot with chat

---

### Phase 7: Integrations (Confluence + Transcripts)
**Goal**: Chat has access to all three data sources

| Task | Priority | Complexity |
|------|----------|------------|
| Confluence integration | Must Have | High |
| Confluence search | Must Have | Medium |
| Meeting processor integration | Must Have | High |
| Update context assembly | Must Have | Medium |
| Settings page (tokens) | Must Have | Medium |
| Token encryption | Must Have | Medium |
| Multi-source testing | Must Have | Medium |

**Key Deliverable**: AI responses include all sources

---

### Phase 8: Deal Analysis (AI Generation)
**Goal**: Deals have AI-generated BANT/MEDIC analysis

| Task | Priority | Complexity |
|------|----------|------------|
| Analysis generation service | Must Have | High |
| BANT/MEDIC prompts | Must Have | High |
| Analysis on sync | Must Have | Medium |
| Store in deals.analysis | Must Have | Low |
| Analysis display UI | Must Have | Medium |
| Health indicator | Must Have | Low |
| Next steps/risks display | Must Have | Low |

**Key Deliverable**: Each deal shows AI analysis

---

### Phase 9: AI-Assisted Skill Creation
**Goal**: Users create skills via AI chat

| Task | Priority | Complexity |
|------|----------|------------|
| Skill creation flow | Nice to Have | Medium |
| AI chat panel | Nice to Have | Medium |
| Apply suggestion | Nice to Have | Medium |
| Edit with AI | Nice to Have | Medium |

**Key Deliverable**: AI helps users create skills

---

### Phase 10: Polish & Production
**Goal**: Production-ready MVP

| Task | Priority | Complexity |
|------|----------|------------|
| Cloud Scheduler setup | Must Have | Medium |
| Sync job endpoint | Must Have | Low |
| Sync logs display | Nice to Have | Low |
| Error handling polish | Must Have | Medium |
| E2E testing | Must Have | High |
| Performance optimization | Nice to Have | Medium |
| Security audit | Must Have | High |
| Documentation | Must Have | Medium |

**Key Deliverable**: Production-ready MVP

---

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  must_change_password BOOLEAN DEFAULT true,
  hubspot_token_encrypted TEXT,
  confluence_token_encrypted TEXT,
  anthropic_api_key_encrypted TEXT,
  preferences JSONB DEFAULT '{"defaultDataSources": ["hubspot", "confluence", "transcripts"]}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ
);
```

### Skills Table
```sql
CREATE TABLE skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  prompt TEXT NOT NULL,
  data_sources TEXT[] DEFAULT ARRAY['hubspot', 'confluence', 'transcripts'],
  visibility VARCHAR(20) DEFAULT 'private',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Deals Table
```sql
CREATE TABLE deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hubspot_id VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  company_name VARCHAR(255),
  company_hubspot_id VARCHAR(50),
  value DECIMAL(15, 2),
  currency VARCHAR(10) DEFAULT 'USD',
  stage VARCHAR(100),
  owner_id VARCHAR(50),
  owner_name VARCHAR(255),
  discovery_call_date TIMESTAMPTZ,
  demo_date TIMESTAMPTZ,
  last_activity_at TIMESTAMPTZ,
  hubspot_created_at TIMESTAMPTZ,
  analysis JSONB,
  last_synced_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Conversations Table
```sql
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255),
  context_type VARCHAR(50) DEFAULT 'general',
  context_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Messages Table
```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Sync Logs Table
```sql
CREATE TABLE sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(20) NOT NULL,
  status VARCHAR(20) NOT NULL,
  deals_processed INTEGER DEFAULT 0,
  errors JSONB,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);
```

---

## API Endpoints

### Authentication
| Method | Path | Description |
|--------|------|-------------|
| POST | /auth/login | Email/password login |
| POST | /auth/login/google | Google OAuth |
| POST | /auth/login/outlook | Outlook OAuth |
| POST | /auth/change-password | Change password |
| GET | /auth/me | Get current user |

### Deals
| Method | Path | Description |
|--------|------|-------------|
| GET | /deals | List deals (paginated) |
| GET | /deals/:id | Get deal details |
| POST | /deals/sync | Trigger manual sync |
| GET | /deals/sync/status | Get sync status |

### Skills
| Method | Path | Description |
|--------|------|-------------|
| GET | /skills | List skills |
| GET | /skills/:id | Get skill details |
| POST | /skills | Create skill |
| PUT | /skills/:id | Update skill |
| DELETE | /skills/:id | Delete skill |

### Conversations
| Method | Path | Description |
|--------|------|-------------|
| GET | /conversations | List conversations |
| GET | /conversations/:id | Get conversation + messages |
| POST | /conversations | Create conversation |
| POST | /conversations/:id/messages | Send message |
| DELETE | /conversations/:id | Delete conversation |

### Settings
| Method | Path | Description |
|--------|------|-------------|
| GET | /settings/tokens | Check token presence |
| PUT | /settings/tokens | Store encrypted tokens |

### Extension Context
| Method | Path | Description |
|--------|------|-------------|
| GET | /context/deal/:hubspotId | Get deal context |
| GET | /context/contact/:hubspotId | Get contact context |
| GET | /context/company/:hubspotId | Get company context |

---

## Skills Roadmap

### MVP
| Skill | Description | Data Sources |
|-------|-------------|--------------|
| Meeting Summary | Summarize call transcripts with action items | Transcripts |

### Post-MVP
| Skill | Description | Data Sources |
|-------|-------------|--------------|
| Sales-to-Delivery Handover | Generate comprehensive handover docs | All |
| Follow-up Email Generator | Draft contextual follow-up emails | HubSpot, Transcripts |
| Proposal Outline Generator | Create proposal outlines | All |
| Deal Risk Analyzer | Identify and explain risks | All |
| Competitive Intelligence | Summarize competitive positioning | Confluence |

---

## Brand Guidelines Summary

### Colors
| Name | Hex | Usage |
|------|-----|-------|
| Zeroe Blue | #2673EA | Primary, buttons, links |
| Charcoal | #0D1318 | Body text |
| Dusty Rose | #C17B7E | Accents, subheadings |
| Slate Blue | #6B7FA3 | Secondary elements |
| Coral | #E07065 | Highlights, alerts |
| Muted Purple | #8B7B9E | Neutral accents |
| Light Grey | #F5F5F7 | Backgrounds |
| Warm Peach | #FDE8E4 | Gradient end |

### Typography
| Level | Font | Weight | Size |
|-------|------|--------|------|
| H1 | Inter | Black (900) | 48px |
| H2 | Inter | Medium (500) | 36px |
| H3 | Inter | Medium (500) | 22px |
| Body | Work Sans | Regular (400) | 16px |

### Gradient
```css
.gradient-heading {
  background: linear-gradient(90deg, #2673EA 0%, #8B7B9E 50%, #E07065 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
```

---

## Project Files Reference

| File | Purpose |
|------|---------|
| `claude.md` | Development guidelines for Claude Code |
| `progress.md` | Progress tracking for all phases |
| `changelog.md` | Change log and modification history |
| `Final_Plan.md` | This file - implementation plan |
| `zeroe-pulse-ai-planning-doc.md` | Original project specification |
| `PRD-Draft.json` | User stories and acceptance criteria |

---

## Local Development Setup

### Running Locally
All three apps will run simultaneously during development so you can see changes in real-time:

```bash
# Terminal 1 - API Server (http://localhost:3001)
cd apps/api && npm run dev

# Terminal 2 - Web Platform (http://localhost:3000)
cd apps/web && npm run dev

# Terminal 3 - Extension (load unpacked in Chrome)
cd apps/extension && npm run dev
```

Or run all at once from the root:
```bash
npm run dev  # Runs all apps via Turborepo
```

### Local URLs
| Service | URL | Description |
|---------|-----|-------------|
| Web Platform | http://localhost:3000 | Next.js dashboard |
| API Server | http://localhost:3001 | Express backend |
| Supabase Studio | http://localhost:54323 | Database UI (if using local Supabase) |

### Chrome Extension Local Testing
1. Build the extension: `cd apps/extension && npm run build`
2. Open Chrome → Extensions → Enable "Developer mode"
3. Click "Load unpacked" → Select `apps/extension/dist`
4. Extension appears in toolbar, test on HubSpot

### Hot Reloading
- **Web Platform**: Next.js fast refresh (automatic)
- **API**: Nodemon for auto-restart on changes
- **Extension**: Vite build watch + manual reload in Chrome

### Development Workflow
After each feature implementation:
1. I'll tell you what to check at which URL
2. You verify in the browser
3. Provide feedback or approve
4. I update `progress.md` with completed items
5. I ask: "Ready to commit and push to GitHub?"
6. If you approve, I commit and push
7. We move to the next task

### Git Workflow
- Commits after each completed feature/milestone
- Descriptive commit messages following convention:
  ```
  feat(phase): description
  fix(component): what was fixed
  docs: documentation updates
  ```
- Always ask before pushing
- Branch: `main` (or feature branches if preferred)

---

## Next Steps

1. **Begin Phase 0**: Initialize the monorepo and set up all three apps
2. **Set up Supabase**: Create project and configure connection
3. **Configure environment**: Create `.env` templates for all apps
4. **Start local servers**: Verify all apps run at their respective URLs
5. **You review in browser**: Confirm you can access localhost:3000
