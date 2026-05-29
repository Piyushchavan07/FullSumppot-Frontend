# Full Sumppot

A creator-community platform where YouTube content creators share links, grow audiences, and earn points by supporting each other.

---

## Tech Stack

| Layer | Technology |
|---|---|
| UI Framework | React 19 + TypeScript |
| Build Tool | Vite 8 |
| Styling | Tailwind CSS 3 |
| State Management | Zustand (auth) + TanStack Query v5 (server state) |
| Real-time | SignalR (`@microsoft/signalr`) |
| Forms | React Hook Form + Zod |
| Routing | React Router v7 |
| Notifications | Sonner |

---

## Project Structure

```
src/
├── components/       # Shared UI components (Navbar, ProtectedLayout)
├── hooks/            # Custom hooks (useSignalR)
├── lib/              # Utilities (api re-export, cn, getAssetUrl)
├── pages/            # Route-level page components
├── services/         # API client (native fetch wrappers)
├── store/            # Zustand auth store
└── types/            # Shared TypeScript interfaces
```

### State & Data Flow

```
User Action
    │
    ▼
React Component
    │
    ├─► TanStack Query (server state cache)
    │       │
    │       └─► services/api.ts (fetch → backend REST API)
    │
    └─► Zustand authStore (token, user identity)
            │
            └─► useSignalR hook (WebSocket hub)
                    │
                    └─► Invalidates TQ cache on push events
```

**SignalR lifecycle** is tied directly to Zustand auth state — the hub connects on login and disconnects on logout. Polling intervals (30 s) act as a fallback only when the WebSocket is unavailable.

---

## Setup & Installation

### Prerequisites

- Node.js ≥ 18
- A running instance of the Full Sumppot .NET backend on port `5230` (or configure via env)

### Steps

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env if your backend runs on a different port

# 3. Start development server
npm run dev
```

### Environment Variables

| Variable | Default | Description |
|---|---|---|
| `VITE_API_URL` | `http://localhost:5230/api` | Backend REST API base URL |
| `VITE_HUB_URL` | `http://localhost:5230/hubs/chat` | SignalR hub URL |

> `.env` is git-ignored. Never commit secrets. Use `.env.example` as the template.

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | Type-check + production bundle |
| `npm run lint` | ESLint check |
| `npm run preview` | Preview production build locally |

---

## Deployment

1. Set `VITE_API_URL` and `VITE_HUB_URL` to your production backend URLs.
2. Run `npm run build` — output goes to `dist/`.
3. Serve `dist/` from any static host (Vercel, Netlify, Nginx, etc.).
4. Configure your host to redirect all routes to `index.html` for client-side routing.

---

## Key Architecture Decisions

- **No axios** — the project uses native `fetch` with a thin `handleResponse` wrapper for consistent error handling.
- **`getAssetUrl`** in `src/lib/utils.ts` is the single source of truth for resolving relative asset paths from the backend to absolute URLs.
- **`src/config.ts`** centralises all environment-driven configuration. No URL strings are hardcoded in components.
- **SignalR + polling hybrid** — real-time updates via WebSocket push; 30 s polling as a silent fallback.
