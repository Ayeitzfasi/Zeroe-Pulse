# Claude Code Guidelines for Zeroe Pulse AI

> This document defines how Claude Code should approach development of Zeroe Pulse AI.

---

## Project Context

**Zeroe Pulse AI** is an internal tool for Zeroe.io consisting of:
- **Web Platform** (Next.js 14) - Dashboard for deals, AI chat, skills management
- **Chrome Extension** (Manifest V3) - HubSpot sidebar for contextual AI assistance
- **Backend API** (Express + Supabase) - Shared API for both interfaces

**Developer**: Solo developer using Claude Code
**Infrastructure**: Starting fresh (Supabase, hosting, etc. need setup)
**Timeline**: Flexible/ongoing - prioritize quality over speed

---

## Core Principles

### 1. Keep It Minimal
- Only build what's specified in the planning documents
- Prefer simple solutions over complex ones
- Don't over-engineer or add features not requested
- A working MVP is better than a perfect plan

### 2. Follow the Brand
All UI must follow Zeroe Brand Guidelines:
- **Primary**: Zeroe Blue `#2673EA`
- **Text**: Charcoal `#0D1318`
- **Accents**: Dusty Rose `#C17B7E`, Slate Blue `#6B7FA3`, Coral `#E07065`
- **Fonts**: Inter (headings/900,500), Work Sans (body/400)
- **Gradient**: `linear-gradient(90deg, #2673EA 0%, #8B7B9E 50%, #E07065 100%)`

### 3. TypeScript Everywhere
- Use TypeScript for all code
- Define interfaces for data shapes
- Use type unions for constrained values
- Shared types go in `/packages/shared/types/`

### 4. Standard Libraries Only
- Don't introduce exotic dependencies
- Use well-established packages
- Prefer built-in solutions when available

### 5. Explain Your Work
After each implementation:
- Explain what changed and why
- List files created/modified
- Provide test instructions
- Suggest next steps

---

## File Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| React Components | PascalCase.tsx | `DealCard.tsx` |
| Utilities/Services | camelCase.ts | `dealService.ts` |
| Types | types.ts or {feature}.types.ts | `deal.types.ts` |
| API Routes | camelCase.ts | `deals.ts` |
| Database Migrations | NNN_name.sql | `001_users.sql` |

---

## Code Style

### TypeScript
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

### React Components
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

### API Routes (Express)
```typescript
router.get('/deals', authenticate, async (req, res, next) => {
  try {
    const deals = await dealService.findAll(req.query);
    res.json(deals);
  } catch (error) {
    next(error);
  }
});
```

---

## Project Structure

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
│   │   │   ├── background/     # Service worker
│   │   │   ├── content/        # Content scripts
│   │   │   └── sidepanel/      # Sidebar React app
│   │   └── public/
│   │       └── manifest.json
│   │
│   └── api/                    # Backend API
│       ├── src/
│       │   ├── routes/         # Express routes
│       │   ├── services/       # Business logic
│       │   ├── integrations/   # HubSpot, Confluence, Claude
│       │   └── middleware/     # Auth, error handling
│       └── Dockerfile
│
├── packages/
│   └── shared/                 # Shared types, utilities
│       └── types/
│
├── supabase/
│   └── migrations/             # Database migrations
│
├── claude.md                   # THIS FILE
├── progress.md                 # Progress tracking
├── changelog.md                # Change log
└── Final_Plan.md               # Implementation plan
```

---

## When Starting a Feature

1. **Confirm scope** - Restate what will be built
2. **List files** - Show files to create/modify
3. **Implement step by step** - One file at a time
4. **Test instructions** - How to verify it works
5. **What's next** - Suggest the logical next step

---

## Local Development Workflow

### Running the Apps
```bash
# From project root - runs all apps
npm run dev

# Or individually:
cd apps/web && npm run dev      # http://localhost:3000
cd apps/api && npm run dev      # http://localhost:3001
cd apps/extension && npm run dev # Load unpacked in Chrome
```

### After Each Implementation
1. Tell user what changed
2. Provide specific URL/action to verify (e.g., "Visit http://localhost:3000/login")
3. Wait for user feedback
4. Address any issues
5. Update `progress.md` with completed items
6. **Ask user**: "Ready to commit and push to GitHub?"
7. If approved, commit with descriptive message and push

### Verification Pattern
After implementing a feature, always provide:
- **What to check**: Specific URL or action
- **Expected result**: What user should see
- **Troubleshooting**: Common issues if something doesn't work

---

## Documentation Updates

When completing work:
- Update `progress.md` with completed items
- Update `changelog.md` with significant changes
- Keep `Final_Plan.md` as the source of truth for phases

---

## Security Considerations

- Never log sensitive data (tokens, passwords)
- Encrypt stored API tokens
- Validate all inputs with Zod schemas
- Use parameterized queries (Supabase handles this)
- JWT tokens expire in 24 hours
- Rate limit API endpoints (100 req/min/user)

---

## Questions to Ask

If unsure about something, ask:
- "Should this be private or shared by default?"
- "Do you want technical or user-friendly error messages?"
- "Should this action require confirmation?"
- "Is this the right place for this component?"

---

## Commit Message Format

```
feat(deals): add deals list page with filtering
fix(auth): handle expired token redirect
refactor(api): extract HubSpot service
docs: update README with setup instructions
```

---

## Reference Documents

- `/zeroe-pulse-ai-planning-doc.md` - Full project specification
- `/PRD-Draft.json` - User stories and acceptance criteria
- `/Brand Guide/Zeroe-Brand-Guidelines-2026.html` - Visual identity
- `/Skills/meeting-processor.skill` - Reference skill implementation
