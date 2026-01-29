# Zeroe Pulse AI — Complete Project Specification

> **Version:** 1.0  
> **Last Updated:** January 30, 2026  
> **Purpose:** Master context document for Claude Code development

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Product Overview](#2-product-overview)
3. [User Personas & Access](#3-user-personas--access)
4. [Features — MVP Scope](#4-features--mvp-scope)
5. [User Flows](#5-user-flows)
6. [Screen-by-Screen Specification](#6-screen-by-screen-specification)
7. [Data Model](#7-data-model)
8. [API Contract](#8-api-contract)
9. [Architecture & Tech Stack](#9-architecture--tech-stack)
10. [Chrome Extension Specification](#10-chrome-extension-specification)
11. [Authentication & Security](#11-authentication--security)
12. [Integrations](#12-integrations)
13. [Error Handling & Edge Cases](#13-error-handling--edge-cases)
14. [Brand Guidelines & Design System](#14-brand-guidelines--design-system)
15. [Build Order & Dependencies](#15-build-order--dependencies)
16. [Claude Code Instructions](#16-claude-code-instructions)

---

## 1. Executive Summary

### What We're Building

**Zeroe Pulse AI** is an internal tool for Zeroe.io consisting of:

1. **A web dashboard/platform** — For managing deals, viewing AI-generated analysis, creating/managing Claude skills, and chatting with an AI assistant
2. **A Chrome extension** — A sidebar that works alongside HubSpot, providing contextual AI chat that consolidates data from multiple sources

### The Problem It Solves

Sales engagement context at Zeroe is fragmented across:
- **HubSpot** — Deal records, contact/company records, emails, call notes, WhatsApp messages
- **Confluence** — Documents, proposals, client materials
- **Call transcripts** — Discovery calls, demo calls, meeting recordings (via Fireflies/meeting processor)

Team members currently have to manually search across all three systems to get full context on any deal or contact. This tool consolidates everything into one AI-powered interface.

### Who Uses It

- Sales team (proposals, follow-ups, deal context)
- Delivery team (sales-to-delivery handovers)
- Marketing team (client insights)
- CEO (deal oversight, pipeline visibility)

### Key Value Propositions

1. **Consolidated context** — Ask one question, get answers synthesized from HubSpot + Confluence + call transcripts
2. **Claude Skills** — Users can create reusable AI workflows (e.g., "Generate sales-to-delivery handover document")
3. **Deal intelligence** — Automated BANT/MEDIC analysis of all deals with strategic recommendations
4. **Speed** — What used to take 30 minutes of searching now takes 30 seconds

---

## 2. Product Overview

### Platform (Web Dashboard)

The platform is the central hub where users:
- View and interact with all HubSpot deals (with AI-enriched analysis)
- Chat with the AI assistant (with full context from all data sources)
- Create, edit, and manage Claude Skills
- View their chat history
- Manage account settings and API tokens

### Chrome Extension

The extension is the daily-use interface that:
- Lives as a sidebar within HubSpot (doesn't overlay, pushes HubSpot left)
- Detects which HubSpot page you're on (contact, company, or deal record)
- Provides contextual AI chat based on the current record
- Allows users to invoke their saved Claude Skills
- Syncs with the same backend as the platform

### Relationship Between Platform & Extension

- **Same backend** — Both use identical API endpoints
- **Same authentication** — One account works for both
- **Synced data** — Skills created in platform appear in extension
- **Chat continuity** — Chat history visible in both (though primarily managed in platform)

---

## 3. User Personas & Access

### User Type: Zeroe Team Member

All users are internal Zeroe employees. There is no public signup — accounts are created by an admin.

**Capabilities:**
- Full access to all deals (pulled from HubSpot)
- Can create private skills (only they can see/use)
- Can create shared skills (everyone in org can see/use)
- Can chat with AI in both platform and extension
- Can configure their own API tokens

### Access Model

- **No teams/workspaces** — Single shared workspace for all Zeroe users
- **No billing** — Internal tool, no payment processing
- **No role-based restrictions** — All users have same permissions
- **Skill visibility** — Private (only creator) or Shared (everyone)

### Account Creation Flow

1. Admin creates account with email + temporary password
2. User receives credentials
3. User logs in and changes password
4. User can now access both platform and extension

---

## 4. Features — MVP Scope

### Platform Features

| Feature | Description | Priority |
|---------|-------------|----------|
| **Authentication** | Email/password login, OAuth (Google/Outlook), password change | Must Have |
| **Deals View** | List all HubSpot deals with filters, sorting, key metrics | Must Have |
| **Deal Detail** | Full deal context + AI analysis (BANT/MEDIC) + chat | Must Have |
| **AI Chat** | Conversational interface with full context access | Must Have |
| **Skills Management** | Create, edit, delete, toggle private/shared skills | Must Have |
| **Skill Creation Chat** | AI-assisted skill creation workflow | Must Have |
| **Chat History** | View and continue past conversations | Must Have |
| **Settings** | API token management, password change, preferences | Must Have |
| **Data Sync** | Scheduled daily sync + manual sync button | Must Have |
| **Token Analytics** | View token usage statistics | Nice to Have |

### Extension Features

| Feature | Description | Priority |
|---------|-------------|----------|
| **Sidebar UI** | Opens as sidebar, pushes HubSpot left (like Apollo.io) | Must Have |
| **Context Detection** | Detects if on contact/company/deal page in HubSpot | Must Have |
| **AI Chat** | Same chat capabilities as platform | Must Have |
| **Skill Invocation** | Browse and use saved skills | Must Have |
| **Quick Actions** | Common actions (e.g., "Write follow-up email") | Must Have |
| **Sync Status** | Show last sync time, manual sync button | Must Have |
| **Login State** | Show logged in/out state, link to login | Must Have |
| **Chat History** | View recent chats (link to platform for full history) | Nice to Have |

### What's NOT in MVP

- Teams/workspaces management
- Billing/payments
- User role management
- Firefox/Safari/Edge support
- Mobile app
- Advanced analytics dashboards
- Skill marketplace/sharing outside org

---

## 5. User Flows

### Flow 1: New User Onboarding

```
Admin creates account → User receives credentials → 
User visits platform → Enters email/password → 
Redirected to change password → Sets new password → 
Lands on Deals dashboard → Prompted to install extension
```

### Flow 2: Daily Sales Workflow (Extension)

```
Sales rep opens HubSpot → Navigates to deal record → 
Clicks Pulse AI bookmark icon on right → 
Sidebar opens, pushes HubSpot left → 
Extension detects deal context → 
User types "What were the key requirements from our discovery call?" → 
AI queries HubSpot + call transcripts + Confluence → 
Returns consolidated answer → 
User types "Draft a follow-up email based on this" → 
AI generates email → User copies to HubSpot
```

### Flow 3: Sales-to-Delivery Handover (Extension + Skill)

```
Delivery team member sees deal moved to "Closed Won" → 
Opens deal in HubSpot → Opens Pulse AI sidebar → 
Clicks "Skills" → Selects "Sales to Delivery Handover" skill → 
Skill executes, pulling from all three data sources → 
Generates comprehensive handover document → 
User reviews and pushes to Confluence
```

### Flow 4: Creating a New Skill (Platform)

```
User opens platform → Navigates to Skills section → 
Clicks "Add New Skill" → AI chat opens → 
User describes what they want: "I want a skill that generates 
proposal outlines based on discovery call notes" → 
AI asks clarifying questions → 
AI generates skill definition → 
User reviews, names it, sets visibility (private/shared) → 
Skill appears in their list and extension
```

### Flow 5: Deal Analysis Review (Platform)

```
CEO opens platform → Goes to Deals → 
Sees list with deal stages, values, last activity → 
Clicks into specific deal → 
Sees AI-generated analysis (BANT score, MEDIC evaluation) → 
Reads strategic next steps recommendations → 
Opens chat to ask specific questions about the deal
```

---

## 6. Screen-by-Screen Specification

### Platform Screens

#### 6.1 Login Page

**URL:** `/login`

**Components:**
- Zeroe Pulse AI logo (top center)
- Email input field
- Password input field
- "Log In" button (primary)
- "Log in with Google" button (secondary)
- "Log in with Outlook" button (secondary)
- "Forgot Password?" link

**States:**
- Default (empty form)
- Loading (after submit)
- Error (invalid credentials)
- Success → redirect to `/deals`

---

#### 6.2 Password Change Page (First Login)

**URL:** `/change-password`

**Components:**
- Current password field
- New password field
- Confirm new password field
- Password requirements text
- "Update Password" button

**Validation:**
- Minimum 12 characters
- At least one uppercase, lowercase, number, special character
- Passwords must match

---

#### 6.3 Main Layout (Authenticated)

**Structure:**
```
┌─────────────────────────────────────────────────┐
│  [Logo]              [Sync Status] [User Menu]  │
├──────────┬──────────────────────────────────────┤
│          │                                      │
│  Deals   │         Main Content Area            │
│          │                                      │
│  Skills  │                                      │
│          │                                      │
│  History │                                      │
│          │                                      │
│  Settings│                                      │
│          │                                      │
└──────────┴──────────────────────────────────────┘
```

**Sidebar Navigation:**
- Deals (icon + label)
- Skills (icon + label)
- History (icon + label)
- Settings (icon + label)

**Header:**
- Zeroe Pulse AI logo (left)
- Sync status indicator + "Sync Now" button (right)
- User avatar + dropdown menu (right)

---

#### 6.4 Deals List Page

**URL:** `/deals`

**Components:**

**Filters Bar:**
- Deal stage dropdown (All, Qualified, Demo, Proposal, Negotiation, Closed Won, Closed Lost)
- Search input (search by deal name, company)
- Date range picker (created date, last activity)

**Deals Table:**
| Column | Description | Sortable |
|--------|-------------|----------|
| Deal Name | Link to deal detail | Yes |
| Company | Company name | Yes |
| Value | Deal amount | Yes |
| Stage | Current pipeline stage | Yes |
| Discovery Call | Date or "Not scheduled" | Yes |
| Demo | Date or "Not scheduled" | Yes |
| Last Activity | Relative time | Yes |
| BANT Score | AI-generated score (A/B/C/D) | Yes |

**Row Actions:**
- Click row → Navigate to deal detail
- Hover shows quick preview tooltip

**Pagination:**
- Show 25/50/100 per page
- Page numbers + prev/next

---

#### 6.5 Deal Detail Page

**URL:** `/deals/:dealId`

**Layout:**
```
┌─────────────────────────────────┬─────────────────┐
│                                 │                 │
│   Deal Overview                 │    AI Chat      │
│   + AI Analysis                 │    Panel        │
│                                 │                 │
└─────────────────────────────────┴─────────────────┘
```

**Left Panel — Deal Overview:**

**Header Section:**
- Deal name (h1)
- Company name (with link to HubSpot)
- Deal value
- Current stage badge
- Owner name
- Last activity date

**AI Analysis Section:**
- Overall health indicator (Green/Yellow/Red)
- BANT Analysis:
  - Budget: Score + summary
  - Authority: Score + summary
  - Need: Score + summary
  - Timeline: Score + summary
- MEDIC Analysis:
  - Metrics: Score + summary
  - Economic Buyer: Score + summary
  - Decision Criteria: Score + summary
  - Decision Process: Score + summary
  - Identify Pain: Score + summary
  - Champion: Score + summary
- Strategic Next Steps (AI-generated recommendations)
- Key Risks (AI-identified concerns)

**Timeline Section:**
- Chronological list of key activities
- Discovery call date + summary
- Demo date + summary
- Proposal sent date
- Key emails (condensed)

**Right Panel — AI Chat:**
- Full chat interface
- Pre-populated with deal context
- Suggested prompts:
  - "Summarize all interactions with this account"
  - "What are the key requirements?"
  - "Draft a follow-up email"
  - "What objections have been raised?"

---

#### 6.6 Skills List Page

**URL:** `/skills`

**Components:**

**Header:**
- Page title "Your Skills"
- "Add New Skill" button (top right)

**Filter Tabs:**
- All Skills
- My Skills (private)
- Shared Skills

**Skills Grid/List:**
Each skill card shows:
- Skill name
- Description (truncated)
- Visibility badge (Private/Shared)
- Created date
- Creator name (for shared skills)
- "Edit" button
- "Delete" button (only for own skills)

**Empty State:**
- Illustration
- "No skills yet. Create your first skill to automate your workflow."
- "Add New Skill" button

---

#### 6.7 Skill Detail/Edit Page

**URL:** `/skills/:skillId`

**Layout:**
```
┌─────────────────────────────────┬─────────────────┐
│                                 │                 │
│   Skill Definition              │    AI Chat      │
│   (editable form)               │    (for editing)│
│                                 │                 │
└─────────────────────────────────┴─────────────────┘
```

**Left Panel — Skill Form:**
- Skill name (editable)
- Description (editable textarea)
- Skill prompt/instructions (large editable textarea)
- Visibility toggle (Private/Shared)
- Data sources checkboxes:
  - [ ] HubSpot
  - [ ] Confluence
  - [ ] Call Transcripts
- "Save Changes" button
- "Delete Skill" button (with confirmation)

**Right Panel — AI Chat:**
- Chat interface for refining the skill
- User can describe changes, AI suggests prompt improvements
- "Apply Suggestion" button to update the skill definition

---

#### 6.8 New Skill Page

**URL:** `/skills/new`

**Layout:** Same as Skill Detail but empty form

**Flow:**
1. User opens page, sees empty form + AI chat
2. User describes desired skill in chat
3. AI asks clarifying questions
4. AI generates skill definition
5. User reviews in form, makes edits
6. User sets name, visibility
7. User clicks "Create Skill"

---

#### 6.9 Chat History Page

**URL:** `/history`

**Components:**

**Search Bar:**
- Search by keywords in chat content

**Filters:**
- Date range
- Context type (Deal, General, Skill Creation)

**Chat List:**
Each item shows:
- Title (auto-generated from first message or deal name)
- Preview of last message
- Date/time
- Context badge (Deal: X, General, Skill: Y)
- Click → Opens chat in detail view

**Chat Detail View:**
- Full scrollable chat history
- "Continue Conversation" button → Opens chat panel

---

#### 6.10 Settings Page

**URL:** `/settings`

**Sections:**

**Profile:**
- Name (editable)
- Email (read-only)
- Change Password link

**API Tokens:**
- HubSpot API Token (masked input + reveal toggle)
- Confluence API Token (masked input + reveal toggle)
- Anthropic API Key (masked input + reveal toggle)
- "Save Tokens" button
- Note: "Tokens are encrypted and stored securely"

**Preferences:**
- Default data sources for chat (checkboxes)
- Notification preferences (if applicable)

**Token Usage (Nice to Have):**
- Current month usage
- Usage by day chart
- Estimated cost

---

### Extension Screens

#### 6.11 Extension — Collapsed State

**Visual:** Small bookmark-style icon on right edge of browser
- Zeroe logo/icon
- Click to expand sidebar

---

#### 6.12 Extension — Sidebar (Expanded)

**Dimensions:** ~400px wide, full viewport height

**Layout:**
```
┌───────────────────────────────────┐
│ [Logo]  Context: Deal - Acme Corp │
│ ─────────────────────────────────│
│                                   │
│   [AI Chat Messages]              │
│                                   │
│                                   │
│                                   │
│ ─────────────────────────────────│
│ [Skills] [Sync] [Settings]        │
│ ─────────────────────────────────│
│ [Message Input]          [Send]   │
└───────────────────────────────────┘
```

**Header:**
- Zeroe Pulse AI logo (small)
- Context indicator: "Deal: [Deal Name]" or "Contact: [Name]" or "Company: [Name]"
- Collapse button (X or arrow)

**Main Area — Chat:**
- Scrollable chat history
- AI messages with markdown rendering
- User messages
- Typing indicator when AI responding

**Quick Actions Bar:**
- Skills button → Opens skill picker drawer
- Sync button → Triggers manual sync
- Settings → Opens mini settings (or links to platform)

**Input Area:**
- Text input (expandable)
- Send button
- Suggested prompts (contextual)

---

#### 6.13 Extension — Skill Picker Drawer

**Triggered by:** Clicking "Skills" button

**Layout:** Slides up from bottom or overlays

**Components:**
- Search input
- Recent skills (last 3 used)
- All skills list (grouped by visibility)
- Each skill shows: name, description preview
- Click skill → Executes skill in chat context

---

#### 6.14 Extension — Logged Out State

**Components:**
- Zeroe Pulse AI logo
- "Please log in to continue"
- "Log In" button → Opens platform login in new tab
- After login, extension auto-detects auth state

---

## 7. Data Model

### Core Entities

#### User
```typescript
interface User {
  id: string;                    // UUID
  email: string;                 // Unique
  passwordHash: string;          // bcrypt hash
  name: string;
  createdAt: DateTime;
  updatedAt: DateTime;
  lastLoginAt: DateTime;
  mustChangePassword: boolean;   // True on first login
  
  // Encrypted token storage
  hubspotToken?: string;         // Encrypted
  confluenceToken?: string;      // Encrypted
  anthropicApiKey?: string;      // Encrypted
  
  // Preferences
  preferences: {
    defaultDataSources: string[];
  };
}
```

#### Skill
```typescript
interface Skill {
  id: string;                    // UUID
  creatorId: string;             // FK to User
  name: string;
  description: string;
  prompt: string;                // The actual skill instructions
  dataSources: string[];         // ['hubspot', 'confluence', 'transcripts']
  visibility: 'private' | 'shared';
  createdAt: DateTime;
  updatedAt: DateTime;
}
```

#### Deal (Synced from HubSpot)
```typescript
interface Deal {
  id: string;                    // UUID (internal)
  hubspotId: string;             // HubSpot deal ID
  name: string;
  companyName: string;
  companyHubspotId: string;
  value: number;
  currency: string;
  stage: string;
  ownerId: string;               // HubSpot owner ID
  ownerName: string;
  discoveryCallDate?: DateTime;
  demoDate?: DateTime;
  lastActivityAt: DateTime;
  createdAt: DateTime;           // In HubSpot
  
  // AI-generated analysis (updated on sync)
  analysis?: DealAnalysis;
  
  // Sync metadata
  lastSyncedAt: DateTime;
}

interface DealAnalysis {
  overallHealth: 'green' | 'yellow' | 'red';
  bantScore: {
    budget: { score: string; summary: string; };
    authority: { score: string; summary: string; };
    need: { score: string; summary: string; };
    timeline: { score: string; summary: string; };
  };
  medicScore: {
    metrics: { score: string; summary: string; };
    economicBuyer: { score: string; summary: string; };
    decisionCriteria: { score: string; summary: string; };
    decisionProcess: { score: string; summary: string; };
    identifyPain: { score: string; summary: string; };
    champion: { score: string; summary: string; };
  };
  nextSteps: string[];
  risks: string[];
  generatedAt: DateTime;
}
```

#### Conversation
```typescript
interface Conversation {
  id: string;                    // UUID
  userId: string;                // FK to User
  title: string;                 // Auto-generated or user-set
  contextType: 'deal' | 'general' | 'skill_creation';
  contextId?: string;            // Deal ID if contextType is 'deal'
  createdAt: DateTime;
  updatedAt: DateTime;
}
```

#### Message
```typescript
interface Message {
  id: string;                    // UUID
  conversationId: string;        // FK to Conversation
  role: 'user' | 'assistant';
  content: string;
  metadata?: {
    skillId?: string;            // If skill was invoked
    dataSources?: string[];      // What sources were queried
    tokenCount?: number;
  };
  createdAt: DateTime;
}
```

#### SyncLog
```typescript
interface SyncLog {
  id: string;                    // UUID
  type: 'scheduled' | 'manual';
  status: 'running' | 'completed' | 'failed';
  dealsProcessed: number;
  errors?: string[];
  startedAt: DateTime;
  completedAt?: DateTime;
}
```

### Database Schema (PostgreSQL via Supabase)

```sql
-- Users
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

-- Skills
CREATE TABLE skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  prompt TEXT NOT NULL,
  data_sources TEXT[] DEFAULT ARRAY['hubspot', 'confluence', 'transcripts'],
  visibility VARCHAR(20) DEFAULT 'private' CHECK (visibility IN ('private', 'shared')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Deals (synced from HubSpot)
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

-- Conversations
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255),
  context_type VARCHAR(50) DEFAULT 'general',
  context_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sync logs
CREATE TABLE sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(20) NOT NULL CHECK (type IN ('scheduled', 'manual')),
  status VARCHAR(20) NOT NULL CHECK (status IN ('running', 'completed', 'failed')),
  deals_processed INTEGER DEFAULT 0,
  errors JSONB,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_skills_creator ON skills(creator_id);
CREATE INDEX idx_skills_visibility ON skills(visibility);
CREATE INDEX idx_deals_stage ON deals(stage);
CREATE INDEX idx_deals_last_activity ON deals(last_activity_at DESC);
CREATE INDEX idx_conversations_user ON conversations(user_id);
CREATE INDEX idx_conversations_context ON conversations(context_type, context_id);
CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_created ON messages(created_at DESC);
```

---

## 8. API Contract

### Base URL
- Development: `http://localhost:3000/api`
- Production: `https://api.pulse.zeroe.io/api` (or similar)

### Authentication

All authenticated endpoints require:
```
Authorization: Bearer <jwt_token>
```

### Endpoints

#### Auth

```
POST /auth/login
Body: { email: string, password: string }
Response: { token: string, user: User, mustChangePassword: boolean }

POST /auth/login/google
Body: { credential: string }  // Google OAuth token
Response: { token: string, user: User }

POST /auth/login/outlook
Body: { code: string }  // Outlook OAuth code
Response: { token: string, user: User }

POST /auth/change-password
Body: { currentPassword: string, newPassword: string }
Response: { success: boolean }

POST /auth/logout
Response: { success: boolean }

GET /auth/me
Response: User
```

#### Deals

```
GET /deals
Query: { 
  stage?: string, 
  search?: string, 
  sortBy?: string, 
  sortOrder?: 'asc' | 'desc',
  page?: number,
  limit?: number 
}
Response: { deals: Deal[], total: number, page: number, totalPages: number }

GET /deals/:id
Response: Deal (with full analysis)

POST /deals/sync
Response: { syncLogId: string, status: 'started' }

GET /deals/sync/status
Response: SyncLog (most recent)
```

#### Skills

```
GET /skills
Query: { visibility?: 'private' | 'shared' | 'all' }
Response: Skill[]

GET /skills/:id
Response: Skill

POST /skills
Body: { name: string, description: string, prompt: string, dataSources: string[], visibility: string }
Response: Skill

PUT /skills/:id
Body: { name?: string, description?: string, prompt?: string, dataSources?: string[], visibility?: string }
Response: Skill

DELETE /skills/:id
Response: { success: boolean }
```

#### Conversations & Chat

```
GET /conversations
Query: { contextType?: string, page?: number, limit?: number }
Response: { conversations: Conversation[], total: number }

GET /conversations/:id
Response: { conversation: Conversation, messages: Message[] }

POST /conversations
Body: { contextType: string, contextId?: string }
Response: Conversation

POST /conversations/:id/messages
Body: { content: string, skillId?: string }
Response: Message (assistant response)
// This endpoint handles:
// 1. Saving user message
// 2. Querying relevant data sources
// 3. Calling Claude API
// 4. Saving and returning assistant response

DELETE /conversations/:id
Response: { success: boolean }
```

#### Settings

```
GET /settings/tokens
Response: { 
  hasHubspotToken: boolean, 
  hasConfluenceToken: boolean, 
  hasAnthropicKey: boolean 
}

PUT /settings/tokens
Body: { hubspotToken?: string, confluenceToken?: string, anthropicApiKey?: string }
Response: { success: boolean }

GET /settings/usage
Response: { 
  currentMonth: { tokens: number, cost: number },
  byDay: { date: string, tokens: number }[] 
}
```

#### Context (for Extension)

```
GET /context/deal/:hubspotId
Response: { deal: Deal, recentMessages: Message[] }
// Used by extension to get context for a specific HubSpot deal

GET /context/contact/:hubspotId
Response: { contact: ContactSummary, relatedDeals: Deal[], recentMessages: Message[] }

GET /context/company/:hubspotId
Response: { company: CompanySummary, deals: Deal[], contacts: ContactSummary[], recentMessages: Message[] }
```

---

## 9. Architecture & Tech Stack

### Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend                                 │
│  ┌─────────────────────┐    ┌─────────────────────────────────┐ │
│  │   Web Platform      │    │      Chrome Extension           │ │
│  │   (Next.js/React)   │    │      (React + Chrome APIs)      │ │
│  │   Hosted: Vercel    │    │      Chrome Web Store           │ │
│  └─────────┬───────────┘    └─────────────┬───────────────────┘ │
└────────────┼──────────────────────────────┼─────────────────────┘
             │                              │
             └──────────────┬───────────────┘
                            │ HTTPS
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Backend                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    API Server                                ││
│  │                 (Node.js + Express)                          ││
│  │                 Hosted: Google Cloud Run                     ││
│  └───────────┬─────────────────┬─────────────────┬─────────────┘│
│              │                 │                 │               │
│              ▼                 ▼                 ▼               │
│  ┌───────────────┐  ┌─────────────────┐  ┌─────────────────┐   │
│  │   Supabase    │  │  External APIs  │  │   Claude API    │   │
│  │  (PostgreSQL) │  │  - HubSpot      │  │   (Anthropic)   │   │
│  │  (Auth)       │  │  - Confluence   │  │                 │   │
│  └───────────────┘  │  - Fireflies    │  └─────────────────┘   │
│                     └─────────────────┘                         │
└─────────────────────────────────────────────────────────────────┘
```

### Tech Stack Decisions

| Layer | Technology | Rationale |
|-------|------------|-----------|
| **Frontend - Platform** | Next.js 14 (App Router) | Modern React, good DX, Vercel optimized |
| **Frontend - Extension** | React + Vite | Fast builds, lightweight for extension |
| **Backend** | Node.js + Express | Simple, widely supported, good for Claude Code |
| **Database** | Supabase (PostgreSQL) | Managed Postgres, built-in auth, real-time |
| **Authentication** | Supabase Auth | Supports email/password + OAuth providers |
| **File Storage** | Supabase Storage | For any uploaded files (future) |
| **AI** | Claude API (Anthropic) | Required for AI chat functionality |
| **Hosting - Frontend** | Vercel | Optimal for Next.js, easy deploys |
| **Hosting - Backend** | Google Cloud Run | Container-based, auto-scaling, cost-effective |
| **Scheduler** | Google Cloud Scheduler | For daily sync jobs |

### Project Structure (Monorepo)

```
zeroe-pulse-ai/
├── apps/
│   ├── web/                    # Next.js platform
│   │   ├── app/                # App router pages
│   │   ├── components/         # React components
│   │   ├── lib/                # Utilities, API client
│   │   └── styles/             # Global styles
│   │
│   ├── extension/              # Chrome extension
│   │   ├── src/
│   │   │   ├── popup/          # Extension popup (if needed)
│   │   │   ├── sidebar/        # Sidebar React app
│   │   │   ├── background/     # Service worker
│   │   │   └── content/        # Content scripts
│   │   ├── public/
│   │   │   └── manifest.json
│   │   └── vite.config.ts
│   │
│   └── api/                    # Backend API
│       ├── src/
│       │   ├── routes/         # Express routes
│       │   ├── services/       # Business logic
│       │   ├── integrations/   # HubSpot, Confluence, Claude
│       │   ├── middleware/     # Auth, error handling
│       │   └── utils/          # Helpers
│       ├── Dockerfile
│       └── package.json
│
├── packages/
│   └── shared/                 # Shared types, utilities
│       ├── types/              # TypeScript interfaces
│       └── utils/              # Shared functions
│
├── supabase/
│   ├── migrations/             # Database migrations
│   └── seed.sql                # Initial data
│
├── package.json                # Root package.json (workspaces)
├── turbo.json                  # Turborepo config
└── README.md
```

### Key Dependencies

**Platform (Next.js):**
```json
{
  "next": "^14.0.0",
  "react": "^18.2.0",
  "@supabase/supabase-js": "^2.0.0",
  "tailwindcss": "^3.4.0",
  "@tanstack/react-query": "^5.0.0",
  "zustand": "^4.5.0",
  "react-markdown": "^9.0.0"
}
```

**Extension:**
```json
{
  "react": "^18.2.0",
  "vite": "^5.0.0",
  "@anthropic-ai/sdk": "^0.20.0"
}
```

**Backend:**
```json
{
  "express": "^4.18.0",
  "@supabase/supabase-js": "^2.0.0",
  "@anthropic-ai/sdk": "^0.20.0",
  "@hubspot/api-client": "^10.0.0",
  "jsonwebtoken": "^9.0.0",
  "bcrypt": "^5.1.0",
  "zod": "^3.22.0"
}
```

---

## 10. Chrome Extension Specification

### Manifest V3 Configuration

```json
{
  "manifest_version": 3,
  "name": "Zeroe Pulse AI",
  "version": "1.0.0",
  "description": "AI-powered sales intelligence for Zeroe",
  
  "permissions": [
    "storage",
    "activeTab",
    "sidePanel"
  ],
  
  "host_permissions": [
    "https://*.hubspot.com/*"
  ],
  
  "background": {
    "service_worker": "background.js",
    "type": "module"
  },
  
  "side_panel": {
    "default_path": "sidepanel.html"
  },
  
  "content_scripts": [
    {
      "matches": ["https://*.hubspot.com/*"],
      "js": ["content.js"],
      "css": ["content.css"]
    }
  ],
  
  "icons": {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  },
  
  "action": {
    "default_icon": "icons/icon48.png",
    "default_title": "Open Zeroe Pulse AI"
  }
}
```

### Extension Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Chrome Browser                          │
│                                                             │
│  ┌─────────────────┐     ┌─────────────────────────────┐   │
│  │  Content Script │ ──► │      Background Worker      │   │
│  │  (HubSpot page) │     │   (handles API requests)    │   │
│  │                 │     │                             │   │
│  │  - Detects page │     │  - Auth token management    │   │
│  │    context      │     │  - API calls to backend     │   │
│  │  - Injects      │     │  - Message passing          │   │
│  │    sidebar      │     │                             │   │
│  │    trigger      │     └───────────┬─────────────────┘   │
│  └────────┬────────┘                 │                     │
│           │                          │                     │
│           ▼                          ▼                     │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                   Side Panel                         │   │
│  │              (React Application)                     │   │
│  │                                                      │   │
│  │  - Full chat UI                                      │   │
│  │  - Skill picker                                      │   │
│  │  - Context display                                   │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Context Detection Logic

The content script detects the current HubSpot page:

```typescript
// Content script context detection
function detectHubSpotContext(): Context | null {
  const url = window.location.href;
  
  // Deal record: /contacts/{portalId}/deal/{dealId}
  const dealMatch = url.match(/\/contacts\/\d+\/deal\/(\d+)/);
  if (dealMatch) {
    return { type: 'deal', hubspotId: dealMatch[1] };
  }
  
  // Contact record: /contacts/{portalId}/contact/{contactId}
  const contactMatch = url.match(/\/contacts\/\d+\/contact\/(\d+)/);
  if (contactMatch) {
    return { type: 'contact', hubspotId: contactMatch[1] };
  }
  
  // Company record: /contacts/{portalId}/company/{companyId}
  const companyMatch = url.match(/\/contacts\/\d+\/company\/(\d+)/);
  if (companyMatch) {
    return { type: 'company', hubspotId: companyMatch[1] };
  }
  
  return null;
}
```

### Sidebar Behavior

The sidebar uses Chrome's Side Panel API (Manifest V3):

1. User clicks extension icon or bookmark trigger
2. Side panel opens on the right (default 400px width)
3. Content script detects HubSpot context and sends to side panel
4. Side panel fetches relevant data and displays chat

**Key Behaviors:**
- Sidebar persists across page navigation within HubSpot
- Context updates automatically when navigating to different records
- Chat history is maintained within session
- Sidebar remembers open/closed state

### Storage Strategy

```typescript
// Extension storage structure
interface ExtensionStorage {
  // Synced across devices (chrome.storage.sync)
  sync: {
    authToken?: string;
    userId?: string;
    preferences: {
      sidebarWidth: number;
      autoOpen: boolean;
    };
  };
  
  // Local only (chrome.storage.local)
  local: {
    recentChats: string[];        // Last 10 conversation IDs
    cachedDeals: Record<string, Deal>;  // Cache for quick load
    lastSyncTime: string;
  };
}
```

---

## 11. Authentication & Security

### Authentication Flow

#### Email/Password Login
```
1. User submits email + password
2. Backend validates against database
3. If valid, generates JWT token (24h expiry)
4. Returns token + user data
5. Frontend stores token in memory + localStorage
6. Extension stores token in chrome.storage.sync
7. All subsequent requests include Bearer token
```

#### OAuth Flow (Google/Outlook)
```
1. User clicks "Login with Google"
2. Redirect to Google OAuth consent screen
3. User authorizes, redirected back with code
4. Backend exchanges code for tokens
5. Backend verifies identity, creates/updates user
6. Returns JWT token
7. Same storage as email/password
```

#### Token Refresh Strategy
```
- JWT expires in 24 hours
- Frontend checks expiry before requests
- If expired, redirect to login
- No refresh tokens for MVP (simpler)
```

### Security Measures

#### Password Security
- Minimum 12 characters
- Hashed with bcrypt (cost factor 12)
- Must change on first login

#### Token Security
- JWTs signed with RS256
- Short expiry (24h)
- Stored securely (HttpOnly cookies for web, chrome.storage for extension)

#### API Token Encryption
- User's HubSpot/Confluence/Anthropic tokens encrypted at rest
- AES-256 encryption with per-user keys
- Keys derived from secret + user ID

#### API Security
- All endpoints require authentication (except /auth/*)
- Rate limiting: 100 requests/minute per user
- Input validation with Zod schemas
- CORS restricted to known domains

#### Extension Security
- Minimal permissions (only what's needed)
- Host permissions limited to HubSpot
- Content Security Policy enforced
- No inline scripts

---

## 12. Integrations

### HubSpot Integration

**Authentication:** OAuth 2.0 or Private App Token

**Data Pulled:**
- Deals (all properties)
- Companies (associated with deals)
- Contacts (associated with deals)
- Emails (associated with deals)
- Notes (associated with deals)
- Calls (associated with deals)
- Tasks (associated with deals)
- WhatsApp messages (if available)

**API Endpoints Used:**
```
GET /crm/v3/objects/deals
GET /crm/v3/objects/deals/{dealId}
GET /crm/v3/objects/deals/{dealId}/associations/{toObjectType}
GET /crm/v3/objects/companies/{companyId}
GET /crm/v3/objects/contacts/{contactId}
GET /engagements/v1/engagements/associated/deal/{dealId}
```

**Sync Strategy:**
- Full sync on schedule (daily at 2 AM)
- Incremental sync on demand (modified since last sync)
- Webhook listener for real-time updates (future enhancement)

### Confluence Integration

**Authentication:** API Token (Basic Auth)

**Data Pulled:**
- Pages in Zeroe Sales space
- Page content (body)
- Page metadata (creator, modified date)
- Attachments (metadata only)

**Search Capability:**
- CQL search for pages mentioning company/deal names
- Content search within pages

**API Endpoints Used:**
```
GET /wiki/rest/api/content
GET /wiki/rest/api/content/{id}
GET /wiki/rest/api/content/search?cql=...
GET /wiki/rest/api/space/{spaceKey}/content
```

### Meeting Transcripts Integration

**Source:** Existing Claude Skill (Meeting Processor)

**How It Works:**
1. User has created a Claude Skill that connects to Fireflies/transcript storage
2. This skill is invoked when chat needs transcript context
3. Skill queries RAG pipeline for relevant transcripts
4. Returns summarized/relevant portions

**Integration Approach:**
- Treat as a "system skill" that can be invoked
- When user asks about calls/meetings, automatically invoke this skill
- Results incorporated into Claude's context

### Claude API Integration

**Model:** Claude 3.5 Sonnet (or Claude 3 Opus for complex analysis)

**Usage Patterns:**

1. **Chat Responses**
   - User message + context → Claude → Response
   - Context includes: deal data, relevant emails, notes, transcript summaries

2. **Deal Analysis**
   - All deal context → Claude → Structured BANT/MEDIC analysis
   - Run on sync for each deal

3. **Skill Execution**
   - Skill prompt + context + user query → Claude → Formatted output

**Context Management:**
- Limit context to ~100K tokens
- Prioritize recent and relevant information
- Summarize older content

---

## 13. Error Handling & Edge Cases

### Network Errors

| Scenario | Handling |
|----------|----------|
| API timeout | Show "Taking longer than expected..." → Retry once → Show error with retry button |
| Network offline | Show offline indicator → Queue actions → Sync when back online |
| 401 Unauthorized | Clear token → Redirect to login |
| 403 Forbidden | Show "You don't have permission" message |
| 429 Rate Limited | Show "Too many requests" → Auto-retry after delay |
| 500 Server Error | Show generic error → Log for debugging |

### Data Sync Errors

| Scenario | Handling |
|----------|----------|
| HubSpot API down | Skip HubSpot data → Show warning → Use cached data |
| Confluence API down | Skip Confluence data → Show warning → Continue with other sources |
| Partial sync failure | Log failed items → Continue with successful items → Retry failed items next sync |
| Token expired | Prompt user to re-authenticate in settings |

### Extension-Specific Errors

| Scenario | Handling |
|----------|----------|
| Not on HubSpot | Show "Open a HubSpot page to use Pulse AI" |
| Context not detected | Show "Navigate to a deal, contact, or company page" |
| Sidebar won't open | Fallback to popup mode → Suggest browser restart |
| Storage quota exceeded | Clear old cached data → Warn user |

### Chat/AI Errors

| Scenario | Handling |
|----------|----------|
| Claude API error | Show "AI temporarily unavailable" → Allow retry |
| Context too large | Summarize/truncate context → Inform user context was limited |
| Skill execution fails | Show error → Suggest checking skill definition |
| No relevant context found | Inform user → Ask if they want to proceed without context |

### Offline Behavior

**Platform:**
- Show offline banner
- Allow viewing cached deals (if implemented)
- Queue chat messages for later
- Disable actions that require API

**Extension:**
- Show offline indicator in sidebar
- Allow viewing last loaded context
- Queue messages → Send when back online
- Disable sync button

### Conflicting Data

| Scenario | Handling |
|----------|----------|
| Settings changed in dashboard while extension has old cache | Extension fetches fresh settings on focus/open |
| Deal updated in HubSpot during chat | Show "Data may be outdated" note → Offer refresh |
| Skill edited while being used | Use version at start of conversation → Refresh on next use |

---

## 14. Brand Guidelines & Design System

### Color Palette

| Name | Hex | CSS Variable | Usage |
|------|-----|--------------|-------|
| Zeroe Blue | `#2673EA` | `--zeroe-blue` | Primary actions, links, key elements |
| Charcoal | `#0D1318` | `--charcoal` | Body text, dark backgrounds |
| White | `#FFFFFF` | `--white` | Backgrounds, cards |
| Dusty Rose | `#C17B7E` | `--dusty-rose` | Secondary accents, subheadings |
| Slate Blue | `#6B7FA3` | `--slate-blue` | Secondary elements, borders |
| Coral | `#E07065` | `--coral` | Highlights, alerts, CTAs |
| Muted Purple | `#8B7B9E` | `--muted-purple` | Neutral accents |
| Soft Coral | `#E8A99A` | `--soft-coral` | Backgrounds, subtle highlights |
| Light Blue | `#C5D8F7` | `--light-blue` | Info states, light accents |
| Light Grey | `#F5F5F7` | `--light-grey` | Backgrounds, disabled states |
| Warm Peach | `#FDE8E4` | `--warm-peach` | Background gradient end |

### Color Priority for Selection

1. Zeroe Blue (primary)
2. Slate Blue (secondary)
3. Dusty Rose (tertiary)
4. Coral (quaternary)
5. Muted Purple (neutral)

### Typography

| Level | Font | Weight | Size | Usage |
|-------|------|--------|------|-------|
| H1 | Inter | Black (900) | 48px | Page titles, one per page |
| H2 | Inter | Medium (500) | 36px | Section headers |
| H3 | Inter | Medium (500) | 22px | Subsection headers |
| Body | Work Sans | Regular (400) | 16px | All body copy |
| Small | Work Sans | Regular (400) | 14px | Captions, metadata |

**Font Sources:**
- Inter: https://fonts.google.com/specimen/Inter
- Work Sans: https://fonts.google.com/specimen/Work+Sans

### Signature Gradient (Headings)

```css
.gradient-heading {
  background: linear-gradient(90deg, #2673EA 0%, #8B7B9E 50%, #E07065 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
```

Use for: H1 titles, key headlines, feature headers

### Background Gradient

```css
.page-background {
  background: linear-gradient(
    135deg, 
    #F5F5F7 0%, 
    #FFFFFF 40%, 
    #FEF6F4 70%, 
    #FDE8E4 100%
  );
}
```

**Rules:**
- Apply to page backgrounds
- Keep subtle (5-15% opacity wash)
- Never use solid color backgrounds (except for cards/tables)

### Component Styling

**Buttons:**
```css
/* Primary */
.btn-primary {
  background: #2673EA;
  color: white;
  border-radius: 8px;
  padding: 12px 24px;
  font-family: 'Work Sans', sans-serif;
  font-weight: 500;
}

/* Secondary */
.btn-secondary {
  background: transparent;
  color: #2673EA;
  border: 1px solid #2673EA;
  border-radius: 8px;
}
```

**Cards:**
```css
.card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  padding: 24px;
}
```

**Tables:**
```css
.table th {
  background: #2673EA;
  color: white;
  font-weight: 500;
  padding: 14px 18px;
}

.table tr:nth-child(even) td {
  background: #F5F5F7;
}
```

**Form Inputs:**
```css
.input {
  border: 1px solid #6B7FA3;
  border-radius: 8px;
  padding: 12px 16px;
  font-family: 'Work Sans', sans-serif;
}

.input:focus {
  border-color: #2673EA;
  outline: none;
  box-shadow: 0 0 0 3px rgba(38, 115, 234, 0.1);
}
```

### Status Colors

| Status | Color | Usage |
|--------|-------|-------|
| Success | `#22C55E` | Completed actions, positive states |
| Warning | `#EAB308` | Cautions, pending states |
| Error | `#EF4444` | Errors, destructive actions |
| Info | `#2673EA` | Informational messages |

### Icons

- Use Lucide React icons (consistent with modern React apps)
- Icon size: 20px for inline, 24px for standalone
- Icon color: Match surrounding text or use Zeroe Blue

### Spacing System

```css
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-8: 32px;
--space-10: 40px;
--space-12: 48px;
--space-16: 64px;
```

### Tailwind Config (Recommended)

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        'zeroe-blue': '#2673EA',
        'charcoal': '#0D1318',
        'dusty-rose': '#C17B7E',
        'slate-blue': '#6B7FA3',
        'coral': '#E07065',
        'muted-purple': '#8B7B9E',
        'soft-coral': '#E8A99A',
        'light-blue': '#C5D8F7',
        'light-grey': '#F5F5F7',
        'warm-peach': '#FDE8E4',
      },
      fontFamily: {
        'heading': ['Inter', 'sans-serif'],
        'body': ['Work Sans', 'sans-serif'],
      },
    },
  },
}
```

---

## 15. Build Order & Dependencies

### Phase 0: Project Setup (Day 1)

**Goal:** Repository structure, dev environment, basic configuration

```
□ Initialize monorepo with Turborepo
□ Set up apps/web (Next.js)
□ Set up apps/api (Express)
□ Set up apps/extension (Vite + React)
□ Set up packages/shared (TypeScript types)
□ Configure Tailwind with Zeroe brand colors
□ Set up Supabase project (database + auth)
□ Configure environment variables
□ Create basic README
```

**Dependencies:** None (foundation)

**Deliverable:** Empty project that runs locally

---

### Phase 1: Authentication (Days 2-3)

**Goal:** Users can log in to both platform and extension

```
□ Database: Create users table
□ API: POST /auth/login endpoint
□ API: POST /auth/change-password endpoint
□ API: GET /auth/me endpoint
□ API: JWT generation and validation middleware
□ Platform: Login page UI
□ Platform: Change password page UI
□ Platform: Auth context/provider
□ Platform: Protected route wrapper
□ Extension: Login state detection
□ Extension: Token storage in chrome.storage
□ Extension: Logged-out UI state
```

**Dependencies:** Phase 0

**Deliverable:** User can log in on platform, extension detects auth state

---

### Phase 2: Platform Layout & Navigation (Days 4-5)

**Goal:** Authenticated shell with navigation

```
□ Platform: Main layout component (sidebar + header)
□ Platform: Sidebar navigation (Deals, Skills, History, Settings)
□ Platform: Header with user menu
□ Platform: Routing structure for all pages
□ Platform: Empty placeholder pages
□ Apply Zeroe brand styling throughout
```

**Dependencies:** Phase 1

**Deliverable:** User can navigate between empty pages

---

### Phase 3: Deals - Basic View (Days 6-8)

**Goal:** Display deals from HubSpot (without AI analysis)

```
□ Database: Create deals table
□ API: HubSpot integration service
□ API: GET /deals endpoint
□ API: GET /deals/:id endpoint
□ API: POST /deals/sync endpoint
□ Platform: Deals list page with table
□ Platform: Filters (stage, search)
□ Platform: Sorting
□ Platform: Pagination
□ Platform: Deal detail page (basic info only)
□ Platform: Sync button + status indicator
```

**Dependencies:** Phase 2

**Deliverable:** User sees real HubSpot deals in platform

---

### Phase 4: Skills - CRUD (Days 9-11)

**Goal:** Users can create and manage skills

```
□ Database: Create skills table
□ API: GET /skills endpoint
□ API: POST /skills endpoint
□ API: PUT /skills/:id endpoint
□ API: DELETE /skills/:id endpoint
□ Platform: Skills list page
□ Platform: Skill detail/edit page
□ Platform: New skill page (form only, no AI yet)
□ Platform: Private/shared toggle
□ Platform: Delete confirmation modal
```

**Dependencies:** Phase 2

**Deliverable:** User can CRUD skills (without AI assistance)

---

### Phase 5: Chat - Basic Implementation (Days 12-15)

**Goal:** AI chat works in platform

```
□ Database: Create conversations, messages tables
□ API: Claude integration service
□ API: GET /conversations endpoint
□ API: POST /conversations endpoint
□ API: POST /conversations/:id/messages endpoint
□ API: Context assembly (HubSpot data for now)
□ Platform: Chat UI component (reusable)
□ Platform: Message rendering (markdown support)
□ Platform: Input with send button
□ Platform: Loading/streaming state
□ Platform: Chat integrated into deal detail page
□ Platform: Chat history page
```

**Dependencies:** Phase 3, Phase 4

**Deliverable:** User can chat with AI about deals

---

### Phase 6: Extension - Sidebar UI (Days 16-19)

**Goal:** Extension opens as sidebar with chat

```
□ Extension: Manifest.json configuration
□ Extension: Background service worker
□ Extension: Content script for HubSpot detection
□ Extension: Side panel HTML/React app
□ Extension: Context detection (deal/contact/company)
□ Extension: API client (shared with platform)
□ Extension: Chat UI (based on platform component)
□ Extension: Skill picker drawer
□ Extension: Sync status indicator
□ Styling: Match platform brand
```

**Dependencies:** Phase 5

**Deliverable:** Extension works alongside HubSpot with chat

---

### Phase 7: Integrations - Confluence & Transcripts (Days 20-22)

**Goal:** Chat has access to all three data sources

```
□ API: Confluence integration service
□ API: Confluence search by company/deal name
□ API: Meeting processor skill integration
□ API: Update context assembly to include all sources
□ Platform: Settings page for API tokens
□ API: Token encryption/storage
□ Test: Chat responses now include all sources
```

**Dependencies:** Phase 5

**Deliverable:** AI responses incorporate HubSpot + Confluence + transcripts

---

### Phase 8: Deal Analysis - AI Generation (Days 23-25)

**Goal:** Deals have AI-generated BANT/MEDIC analysis

```
□ API: Analysis generation service (Claude)
□ API: Analysis prompt engineering
□ API: Run analysis on sync
□ Database: Store analysis in deals.analysis
□ Platform: Deal detail - analysis display
□ Platform: Analysis sections (BANT, MEDIC, next steps, risks)
□ Platform: Health indicator visualization
```

**Dependencies:** Phase 3, Phase 5

**Deliverable:** Each deal shows comprehensive AI analysis

---

### Phase 9: Skill Creation - AI Assisted (Days 26-27)

**Goal:** Users can create skills via AI chat

```
□ API: Skill creation conversation flow
□ Platform: New skill page with AI chat panel
□ Platform: "Apply suggestion" functionality
□ Platform: Skill editing with AI assistance
```

**Dependencies:** Phase 4, Phase 5

**Deliverable:** AI helps users create and refine skills

---

### Phase 10: Scheduled Sync & Polish (Days 28-30)

**Goal:** Production-ready with scheduled syncs

```
□ Backend: Google Cloud Scheduler setup
□ Backend: Sync job endpoint
□ Platform: Sync logs/history
□ Platform: Error handling polish
□ Extension: Error states
□ Testing: End-to-end flows
□ Documentation: Setup guide
□ Performance: Query optimization
□ Security: Final audit
```

**Dependencies:** All previous phases

**Deliverable:** Production-ready MVP

---

### Dependency Graph

```
Phase 0 (Setup)
    │
    ▼
Phase 1 (Auth)
    │
    ▼
Phase 2 (Layout)
    │
    ├────────────────┬────────────────┐
    ▼                ▼                ▼
Phase 3          Phase 4          (wait)
(Deals)          (Skills)            │
    │                │                │
    └────────┬───────┘                │
             ▼                        │
         Phase 5 ◄────────────────────┘
         (Chat)
             │
    ┌────────┼────────┐
    ▼        ▼        ▼
Phase 6  Phase 7  Phase 8
(Ext)    (Integr) (Analysis)
    │        │        │
    └────────┼────────┘
             ▼
         Phase 9
      (Skill AI)
             │
             ▼
        Phase 10
        (Polish)
```

---

## 16. Claude Code Instructions

### General Guidelines

When working on this project:

1. **Do not invent features** — Only build what's specified in this document
2. **Keep it minimal** — Prefer simple solutions over complex ones
3. **Use standard libraries** — Don't introduce exotic dependencies
4. **Explain your work** — After each implementation, explain what changed and why
5. **Follow the brand** — All UI must follow Section 14 brand guidelines
6. **TypeScript everywhere** — Use TypeScript for all code
7. **Comment complex logic** — Add comments for non-obvious code

### Project Context

Always keep this context in mind:

- **Internal tool** — No public signup, no billing
- **Three data sources** — HubSpot, Confluence, call transcripts
- **Two interfaces** — Web platform + Chrome extension
- **Same backend** — Both interfaces use identical API
- **Zeroe branding** — Specific colors, fonts, gradient treatments

### Starting a Feature

When I ask you to implement a feature:

1. **Confirm scope** — Restate what you'll build
2. **List files to create/modify** — Show the file structure
3. **Implement step by step** — One file at a time
4. **Test instructions** — Tell me how to verify it works
5. **What's next** — Suggest the logical next step

### Code Style

**TypeScript:**
```typescript
// Use interfaces for data shapes
interface Deal {
  id: string;
  name: string;
}

// Use type for unions/aliases
type DealStage = 'qualified' | 'demo' | 'proposal' | 'closed';

// Prefer async/await over .then()
async function fetchDeals(): Promise<Deal[]> {
  const response = await api.get('/deals');
  return response.data;
}
```

**React:**
```typescript
// Function components only
export function DealCard({ deal }: { deal: Deal }) {
  return (
    <div className="card">
      <h3>{deal.name}</h3>
    </div>
  );
}

// Custom hooks for logic
function useDeals() {
  const [deals, setDeals] = useState<Deal[]>([]);
  // ...
  return { deals, loading, error };
}
```

**API Routes:**
```typescript
// Express route pattern
router.get('/deals', authenticate, async (req, res, next) => {
  try {
    const deals = await dealService.findAll(req.query);
    res.json(deals);
  } catch (error) {
    next(error);
  }
});
```

### File Naming

- React components: `PascalCase.tsx` (e.g., `DealCard.tsx`)
- Utilities/services: `camelCase.ts` (e.g., `dealService.ts`)
- Types: `types.ts` or `{feature}.types.ts`
- Styles: Same name as component (e.g., `DealCard.module.css`)

### Commit Message Format

When suggesting commits:
```
feat(deals): add deals list page with filtering
fix(auth): handle expired token redirect
refactor(api): extract HubSpot service
docs: update README with setup instructions
```

### Questions to Ask Me

If you're unsure about something, ask! Especially:

- "Should this be a shared or private skill by default?"
- "Do you want error messages to be technical or user-friendly?"
- "Should this action require confirmation?"
- "Is this the right place for this component?"

---

## Appendix: Starter Prompts for Claude Code

### Prompt 1: Project Initialization

```
We're building Zeroe Pulse AI - an internal tool with a Next.js platform and Chrome extension.

Please:
1. Initialize a Turborepo monorepo
2. Create apps/web (Next.js 14 with App Router)
3. Create apps/api (Express with TypeScript)
4. Create apps/extension (Vite + React)
5. Create packages/shared (shared TypeScript types)
6. Configure Tailwind with these Zeroe brand colors:
   - zeroe-blue: #2673EA
   - charcoal: #0D1318
   - dusty-rose: #C17B7E
   - slate-blue: #6B7FA3
   - coral: #E07065
   - muted-purple: #8B7B9E
   - soft-coral: #E8A99A
   - light-grey: #F5F5F7
   - warm-peach: #FDE8E4

Set up Google Fonts: Inter (headings) and Work Sans (body).

Give me the folder structure and package.json files.
```

### Prompt 2: Authentication

```
Continuing with Zeroe Pulse AI.

Please implement authentication:
1. Supabase connection setup
2. Database migration for users table
3. API routes: POST /auth/login, POST /auth/change-password, GET /auth/me
4. JWT middleware for protected routes
5. Platform login page (matching Zeroe brand guidelines)
6. Auth context provider
7. Protected route wrapper

The login page should have email/password fields and the Zeroe gradient background.
Users created by admin must change password on first login.
```

### Prompt 3: Deals Feature

```
Continuing with Zeroe Pulse AI.

Please implement the Deals feature:
1. Database migration for deals table
2. HubSpot integration service (using @hubspot/api-client)
3. API routes: GET /deals, GET /deals/:id, POST /deals/sync
4. Deals list page with:
   - Table showing: Deal Name, Company, Value, Stage, Discovery Call, Demo, Last Activity
   - Filters: stage dropdown, search input
   - Sorting by each column
   - Pagination (25/50/100 per page)
5. Deal detail page with basic info (AI analysis comes later)
6. Sync button in header with status indicator

Follow the table styling from the brand guidelines (blue headers, alternating row colors).
```

---

*End of Document*
