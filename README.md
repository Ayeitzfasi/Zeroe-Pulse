# Zeroe Pulse AI

AI-powered sales intelligence platform for Zeroe.io.

## Overview

Zeroe Pulse AI consolidates sales context from HubSpot, Confluence, and meeting transcripts into one AI-powered interface, featuring:

- **Web Platform** - Dashboard for deals, AI chat, and skills management
- **Chrome Extension** - HubSpot sidebar for contextual AI assistance
- **Backend API** - Shared API serving both interfaces

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend - Platform | Next.js 14 (App Router), Tailwind CSS |
| Frontend - Extension | React + Vite |
| Backend | Node.js + Express |
| Database | Supabase (PostgreSQL) |
| AI | Claude API (Anthropic) |

## Project Structure

```
zeroe-pulse-ai/
├── apps/
│   ├── web/           # Next.js platform
│   ├── api/           # Express API server
│   └── extension/     # Chrome extension
├── packages/
│   └── shared/        # Shared TypeScript types
└── supabase/          # Database migrations
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm 10+
- Supabase account

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd zeroe-pulse-ai
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   # Copy example files
   cp .env.example .env
   cp apps/web/.env.example apps/web/.env.local
   cp apps/api/.env.example apps/api/.env
   cp apps/extension/.env.example apps/extension/.env

   # Edit each file with your values
   ```

4. Start development servers:
   ```bash
   npm run dev
   ```

### Local Development URLs

- **Web Platform**: http://localhost:3000
- **API Server**: http://localhost:3001
- **Chrome Extension**: Load `apps/extension/dist` as unpacked extension

## Development Workflow

1. Make changes to the code
2. Test locally in browser/extension
3. Commit with descriptive message
4. Push to GitHub

### Commit Message Convention

```
feat(phase): description
fix(component): what was fixed
docs: documentation updates
```

## Scripts

```bash
npm run dev        # Start all apps in development mode
npm run build      # Build all apps for production
npm run lint       # Run linting across all apps
npm run typecheck  # Run TypeScript type checking
```

## Brand Guidelines

- **Primary**: Zeroe Blue `#2673EA`
- **Text**: Charcoal `#0D1318`
- **Accents**: Dusty Rose `#C17B7E`, Slate Blue `#6B7FA3`, Coral `#E07065`
- **Fonts**: Inter (headings), Work Sans (body)
