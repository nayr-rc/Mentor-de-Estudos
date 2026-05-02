# Mentor IA — Workspace

## Overview

Full-stack personal AI study tracker for ENEM prep (medicine track) and programming. Built as a pnpm monorepo with React+Vite frontend, Express API server, PostgreSQL database, and Anthropic AI integration (Claude).

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite + Tailwind v4 + shadcn/ui + Recharts + Wouter
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec → React Query hooks)
- **Build**: esbuild (CJS bundle)
- **AI**: Anthropic Claude via Replit AI Integrations (streaming SSE)
- **Fonts**: Syne (headings) + DM Sans (body)
- **Theme**: Dark by default (deep dark #0a0a0f, purple #7c6af5, mint #3ecf8e, orange #f97316, amber #fbbf24)

## Artifacts

- **mentor-ia** (`artifacts/mentor-ia`, port 18278, previewPath `/`) — React+Vite web app
- **api-server** (`artifacts/api-server`, port 8080, path `/api`) — Express API server

## DB Schema (Drizzle, `lib/db`)

Tables: `sessions`, `habits`, `questions`, `goals`, `userConfig`, `mentorInsights`, `conversations`, `messages`

## API Routes (`artifacts/api-server/src/routes/`)

- `GET/PUT /api/user/config` — user profile & priority subjects
- `GET/POST /api/sessions` — study sessions
- `GET /api/sessions/stats` — aggregated session stats
- `GET/POST /api/habits` — daily habits (sleep, exercise, mood, water)
- `GET/POST /api/questions` — question bank
- `GET /api/questions/stats` — accuracy stats by subject
- `GET/POST /api/goals` — weekly goals
- `GET /api/dashboard` — aggregate dashboard data (sessions, habits, questions, goals, indices, streak, AI insight)
- `POST /api/mentor/chat` — streaming SSE chat with Claude (claude-sonnet-4-6)
- `POST /api/mentor/insight` — non-streaming AI mentor insight

## Frontend Pages (`artifacts/mentor-ia/src/pages/`)

- `/` — Dashboard: greeting, stat cards, mentor insight, weekly progress bars, goals, quick actions
- `/register` — 3-step form: subject select → duration/quality/notes → daily habits
- `/questions` — Question bank: register form, accuracy stats bars, paginated history table
- `/habits` — Monthly calendar with mood dots, sleep trend chart, quick log panel
- `/mentor` — Streaming AI chat with suggestion chips and typing indicator
- `/analytics` — Bar + radar + horizontal charts using Recharts
- `/settings` — Name, priority subjects, keyboard shortcuts

## AI Integration

- Uses `AI_INTEGRATIONS_ANTHROPIC_BASE_URL` and `AI_INTEGRATIONS_ANTHROPIC_API_KEY` env vars (set via Replit integration)
- Streaming chat: `anthropic.messages.stream()` → SSE events `data: {"content":"..."}` and `data: {"done":true}`
- Frontend uses raw `fetch` + `ReadableStream` (NOT the generated hook) for streaming

## Keyboard Shortcuts

- `N` → Register session
- `Q` → Questions bank
- `M` → Mentor chat

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)

See the `pnpm-workspace` skill for workspace structure and package details.
