<!-- 22b37f0b-be8e-4777-b5fd-515a0d62d73a b2b06b5e-c96b-4119-93af-4724aad81f59 -->
# WellBuddy Full MVP Implementation

## Current State

- Expo 54 with Expo Router configured
- Clerk + Convex integration wired in `app/_layout.tsx`
- Basic auth screens exist
- Convex initialized but empty (no schema/functions)

## Phase 1: Convex Backend Foundation

### 1.1 Database Schema

Create `convex/schema.ts` with all tables:

- `users` - profiles with `clerkId`, `messengerPsid`, health profile, preferences
- `activities` - workout/sleep/hydration/meal logs
- `userStreaks` - streak tracking per activity type
- `userGoals` - targets with AI-adjustable flag
- `embeddings` - RAG vector storage
- `messengerConversations` - chat history
- `webhookEvents` - audit trail

### 1.2 Core Convex Functions

Create in `convex/`:

- `users.ts` - CRUD + lookup by Clerk ID / Messenger PSID
- `activities.ts` - log activities, query by date/type
- `streaks.ts` - update/calculate streaks
- `goals.ts` - goal management, progress tracking
- `dashboard.ts` - aggregated queries for Expo UI

## Phase 2: AI Integration (Gemini + RAG)

### 2.1 AI Utilities

Create `convex/ai/` folder:

- `intentParser.ts` - Gemini prompt for NLP intent extraction
- `ragRetrieval.ts` - embedding generation + cosine similarity search
- `agentReasoning.ts` - multi-step reasoning loop with structured JSON output

### 2.2 Embedding Management

Create `convex/embeddings.ts`:

- Store activity summaries as embeddings
- Query similar context for RAG

### 2.3 Internal Mutation Executor

Create `convex/internalMutations.ts`:

- Generic executor for agent-generated actions
- Switch on mutation type (activity.log, streaks.update, goals.adjust)

## Phase 3: Facebook Messenger Webhook

### 3.1 HTTP Router

Create `convex/http.ts`:

- GET `/webhook` - verification endpoint (hub.verify_token)
- POST `/webhook` - message receiver with X-Hub-Signature validation

### 3.2 Message Processing Action

Create `convex/actions/messenger.ts`:

- `processMessage` action orchestrates the full flow:

  1. Lookup/create user by PSID
  2. Parse intent via Gemini
  3. Retrieve context via RAG
  4. Run agentic reasoning
  5. Execute mutations
  6. Store conversation
  7. Send response via Graph API

### 3.3 Clerk Webhook

Add to `convex/http.ts`:

- POST `/clerk-webhook` - handles Clerk user events
  - `user.created` - create user in Convex with clerkId, email, displayName
  - `user.updated` - sync profile changes to Convex
  - `user.deleted` - soft delete or remove user data
- Verify webhook signature using `svix` library

Create `convex/clerkWebhook.ts`:

- `handleUserCreated` - insert new user with default health profile
- `handleUserUpdated` - patch user fields
- `handleUserDeleted` - cleanup user and related data

### 3.4 Environment Variables

Configure in Convex dashboard:

- `GEMINI_API_KEY` - Google Gemini API key
- `ACCESS_TOKEN` - Facebook Page Access Token
- `APP_ID` - Facebook App ID
- `APP_SECRET` - Facebook App Secret
- `VERIFY_TOKEN` - Webhook verification token (you define this)
- `CLERK_WEBHOOK_SECRET` - Clerk webhook signing secret (from Clerk dashboard)

## Phase 4: Expo Dashboard UI

### 4.1 Dashboard Screen

Replace `app/(tabs)/index.tsx` with wellness dashboard:

- Real-time queries using `useQuery` hooks
- Daily stats cards (steps, workouts, water, sleep)
- Streak display with fire emoji indicators
- Goal progress bars

### 4.2 Additional Screens

- `app/(tabs)/stats.tsx` - weekly/monthly trends
- `app/(tabs)/profile.tsx` - user health profile display

### 4.3 Shared Components

Create in `components/`:

- `StatCard.tsx` - reusable stat display with progress
- `StreakBadge.tsx` - streak visualization
- `GoalProgress.tsx` - progress bar component

## Key Files to Create

| File | Purpose |

|------|---------|

| `convex/schema.ts` | Database schema (7 tables) |

| `convex/users.ts` | User queries/mutations |

| `convex/activities.ts` | Activity logging |

| `convex/streaks.ts` | Streak management |

| `convex/goals.ts` | Goal tracking |

| `convex/dashboard.ts` | Dashboard aggregations |

| `convex/embeddings.ts` | RAG storage |

| `convex/http.ts` | Webhook HTTP router |

| `convex/actions/messenger.ts` | Message processing |

| `convex/ai/intentParser.ts` | Gemini NLP |

| `convex/ai/ragRetrieval.ts` | Context retrieval |

| `convex/ai/agentReasoning.ts` | Agent loop |

| `convex/internalMutations.ts` | Action executor |

| `app/(tabs)/index.tsx` | Dashboard home |

| `app/(tabs)/stats.tsx` | Stats/trends |

| `app/(tabs)/profile.tsx` | User profile |

| `components/StatCard.tsx` | Stat card UI |

## Dependencies to Add

```bash
bun add @google/generative-ai
```

## Implementation Order

1. Schema + core Convex functions (foundation)
2. AI integration (intent + RAG + reasoning)
3. HTTP webhook + messenger action (chatbot works)
4. Dashboard UI (visualization)