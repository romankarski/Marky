# Technology Stack

**Project:** Marky — local-first web markdown knowledge base
**Researched:** 2026-03-06
**Confidence:** MEDIUM (training data through Aug 2025; external verification tools unavailable in this session — flag for version-pinning before install)

---

## Recommended Stack

### Frontend Framework

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| React | 19.x | UI component model | Largest ecosystem, best library support for editor/tab/split-pane primitives. Signals-style concurrent rendering handles real-time file-watch updates cleanly. |
| Vite | 6.x | Dev server + bundler | Fastest HMR for local dev. First-class React support, minimal config. Not Webpack — Webpack's config overhead is unjustified for a single-dev tool. |
| TypeScript | 5.x | Type safety | Non-negotiable for a project with complex state (tabs, split panes, file tree, search indices). Catches refactor bugs early. |

### Editor

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| CodeMirror 6 | 6.x (via `@codemirror/next` packages) | Markdown editor | Purpose-built for in-browser code/text editing. Far lighter than Monaco (which bundles a full VS Code language server). CodeMirror 6 has a first-class markdown language package (`@codemirror/lang-markdown`), excellent mobile support (irrelevant here but signals quality), and a clean extension API for custom keybindings, vim mode, and themes. Obsidian uses CodeMirror 6. |

**Do NOT use:**
- Monaco Editor — designed for code with language servers, ~4MB bundle, overkill for markdown. Its markdown support is basic; you'd fight the abstractions.
- ProseMirror directly — too low-level; CodeMirror 6 builds on similar architecture with better DX.
- TipTap / Lexical / Slate — rich-text WYSIWYG editors, not raw-markdown editors. Wrong abstraction for a files-on-disk workflow.

### Markdown Rendering (Preview)

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| `marked` | 12.x | Markdown → HTML | Fast, battle-tested, CommonMark compliant. Used by GitHub's docs tooling. |
| `DOMPurify` | 3.x | Sanitize HTML output | Required when rendering arbitrary markdown to prevent XSS. Local-first doesn't eliminate this — user files could contain injected content. |
| `highlight.js` | 11.x | Code block syntax highlighting | Pairs cleanly with `marked`. Lighter than Prism for this use case. |

**Alternative considered:** `remark` + `rehype` pipeline — more powerful and composable, but adds 3-4 packages and significant config for what is a straightforward render task. Use only if you need custom AST transformations (e.g., custom directives, wikilinks). Keep `marked` unless that need emerges.

### Backend (Node.js API Server)

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Fastify | 4.x | HTTP server | Fastest Node.js framework by throughput benchmark. Schema-based validation built in. Express is the alternative but has worse TypeScript support and no built-in validation — you'd add middleware that Fastify ships with. Hono is a lighter alternative if you want edge-compatibility later. |
| `chokidar` | 3.x | File system watching | The de facto standard. Wraps `fs.watch`/`inotify`/FSEvents with cross-platform normalization. Native `fs.watch` has known issues on macOS with rename events and deep directories — do not use it directly. |
| WebSocket (`ws`) | 8.x | Push file-change events to browser | Server sends file-change notifications; browser updates the open tab. Native Node.js WebSocket support landed in Node 22 but `ws` has broader compatibility and tested reliability. |

**Architecture note:** The backend is thin — it exposes file read/write/list endpoints and a WebSocket channel for file-change events. It does NOT own state; the React frontend owns UI state (open tabs, split config, etc.).

### Full-Text Search

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| `flexsearch` | 0.7.x | In-memory full-text search index | Fastest full-text search library for JavaScript. Runs entirely in-process (no search server needed). Supports async indexing, field weighting, and tokenization. Alternatives: Fuse.js (slower, fuzzy-only), lunr.js (legacy, not maintained), MiniSearch (good but slightly slower than FlexSearch for large corpora). |

**Implementation:** Index is built on server startup by scanning all markdown files. Rebuilt on file-change events. Index lives in memory on the Node.js backend; search queries hit a `/search?q=` endpoint. Do NOT send the raw index to the browser — too large for a real knowledge base.

**Do NOT use:** Elasticsearch, Meilisearch, Typesense — all require a separate running service. Gross overkill for a single-user local tool with a few thousand files.

### Semantic Search

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Anthropic SDK (`@anthropic-ai/sdk`) | 0.26.x | Claude API client | User already uses Claude ecosystem. Use claude-3-haiku for semantic search (fastest, cheapest). Strategy: embed search query + top N full-text results, ask Claude to re-rank or identify semantic matches. |
| SQLite (via `better-sqlite3`) | 9.x | Persist embeddings cache | Claude API doesn't provide embeddings directly — use Claude to score relevance. Cache per-file summaries or semantic tags in SQLite so you don't re-call the API on every search. |

**Semantic search strategy — important:**
Claude API does not expose an embeddings endpoint (unlike OpenAI). The correct pattern for Marky is:
1. Full-text search (FlexSearch) returns top 20 candidates
2. Send those 20 file excerpts + the user query to Claude (claude-3-haiku)
3. Claude returns ranked/filtered results with explanation
4. Cache nothing per-request (Claude call is fast enough); cache file summaries to reduce token count

This is called "LLM-as-reranker" and is the right pattern for Claude API integration. Do NOT try to generate vector embeddings via Claude — it doesn't support it. If vector embeddings are later needed, use a separate library (e.g., `transformers.js` with a small SBERT model) or a different API.

### Layout / UI

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| `allotment` | 1.x | Split-pane layout | Purpose-built React split-pane component. Supports horizontal/vertical splits, drag-to-resize, controlled/uncontrolled modes. Better maintained than `react-split-pane` (which is stale). |
| Tailwind CSS | 4.x | Utility-first styling | Fastest path to polished UI without a component library. Tailwind v4 uses a CSS-first config (no tailwind.config.js) which is cleaner. |

**Do NOT use:**
- MUI / Ant Design / Chakra — heavy component libraries that fight your custom layout requirements (split panes, custom editor panels). The UI surface area here is custom enough that a component library adds more friction than it saves.
- CSS Modules — fine but more boilerplate than Tailwind for this scope.

### State Management

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Zustand | 5.x | Global UI state | Tabs, active file, split config, search state, tag filters. Zustand is minimal, TypeScript-friendly, and avoids Redux boilerplate. Context API alone would cause unnecessary re-renders across the tab bar + editor + preview. |

**Do NOT use:** Redux Toolkit — correct tool for complex server state but Marky's state is UI-local; it doesn't need the full reducer/slice ceremony. TanStack Query is not needed because the backend is local (no async caching problem to solve).

### Tag Management Storage

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| YAML frontmatter (parsed by `gray-matter`) | 4.x | Tags stored in files | Tags live IN the markdown files as YAML frontmatter (`tags: [kb, phase2]`). This is the standard convention (Obsidian, Hugo, Jekyll all use it). Tags are extracted at index time and stored in the in-memory FlexSearch index for filtering. No separate database for tags — the files ARE the source of truth. |

**Do NOT use:** A separate tags database. If tags are in a DB, they go out of sync with file edits made by Claude CLI agents. Frontmatter in the file is the single source of truth.

### Development Tooling

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| `tsx` | 4.x | Run TypeScript Node.js files directly | Replaces `ts-node`. Faster, ESM-native. Used to run the Fastify backend in dev without a separate compile step. |
| `concurrently` | 9.x | Run frontend + backend together | Single `npm run dev` starts both Vite and Fastify. Simple, no Turborepo/Nx needed for a two-process app. |
| ESLint | 9.x | Linting | Flat config (ESLint 9+). |
| Prettier | 3.x | Formatting | Standard. |
| Vitest | 2.x | Unit + integration tests | Vite-native, fast, same config as build. Jest is the alternative but Vitest is the 2025 standard for Vite projects. |

---

## Project Structure

```
marky/
├── packages/
│   ├── frontend/          # Vite + React app
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── FileTree/
│   │   │   │   ├── TabBar/
│   │   │   │   ├── Editor/       # CodeMirror 6 wrapper
│   │   │   │   ├── Preview/      # marked renderer
│   │   │   │   ├── SplitPane/    # allotment wrapper
│   │   │   │   └── SearchPanel/
│   │   │   ├── store/            # Zustand slices
│   │   │   └── hooks/            # useFileWatch, useSearch, etc.
│   └── backend/           # Fastify server
│       ├── src/
│       │   ├── routes/
│       │   │   ├── files.ts       # read/write/list endpoints
│       │   │   ├── search.ts      # FlexSearch + Claude reranker
│       │   │   └── tags.ts        # tag index endpoint
│       │   ├── watcher.ts         # chokidar + WebSocket broadcast
│       │   └── index.ts
├── package.json           # workspaces: ["packages/*"]
└── tsconfig.json
```

**Monorepo approach:** npm workspaces (no Turborepo). Two packages: `frontend` and `backend`. Shared types live in `packages/shared/` if needed. This is the simplest setup that avoids path confusion between the two environments.

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Editor | CodeMirror 6 | Monaco | Monaco is VS Code's editor. 4MB+ bundle, designed for LSP/code, markdown is second-class. |
| Editor | CodeMirror 6 | TipTap | WYSIWYG (rich-text), not raw-markdown. Wrong abstraction for file-based workflow. |
| Backend | Fastify | Express | Express has no built-in validation, worse TS types, slower benchmarks. Still fine but Fastify is better. |
| Backend | Fastify | Hono | Hono is excellent but optimized for edge/worker runtimes. Fastify better for long-lived Node process with filesystem access. |
| Full-text | FlexSearch | Fuse.js | Fuse.js is fuzzy-search only, much slower for large indexes, designed for small datasets. |
| Full-text | FlexSearch | MiniSearch | Excellent alternative — API is simpler, slightly slower. If FlexSearch API feels complex, MiniSearch is a valid swap. |
| State | Zustand | Redux Toolkit | RTK is correct for complex server-state apps. Overkill here. |
| State | Zustand | Jotai | Valid alternative (atomic model). Zustand slightly easier to reason about for this shape of state (global tab list + active file). |
| Styling | Tailwind CSS | CSS Modules | More verbose for this scope without meaningful benefit. |
| Split pane | allotment | react-split-pane | react-split-pane is effectively abandoned (last major update 2021). |
| Markdown render | marked | remark/rehype | More powerful pipeline but 3x more config. Use only if wikilink / custom directive support is needed. |
| File watch | chokidar | native `fs.watch` | `fs.watch` has macOS rename-event bugs and no debouncing. Do not use directly. |

---

## Installation

```bash
# Initialize workspace
mkdir marky && cd marky
npm init -y
# add "workspaces": ["packages/*"] to package.json

# Frontend
mkdir -p packages/frontend
cd packages/frontend
npm create vite@latest . -- --template react-ts

# Backend
mkdir -p packages/backend
cd packages/backend
npm init -y

# Frontend deps
cd packages/frontend
npm install react react-dom
npm install @codemirror/view @codemirror/state @codemirror/lang-markdown @codemirror/theme-one-dark
npm install marked dompurify highlight.js
npm install allotment
npm install zustand
npm install gray-matter
npm install -D tailwindcss @tailwindcss/vite
npm install -D typescript @types/react @types/react-dom vitest

# Backend deps
cd packages/backend
npm install fastify @fastify/cors @fastify/static @fastify/websocket
npm install chokidar flexsearch gray-matter better-sqlite3
npm install @anthropic-ai/sdk
npm install -D tsx typescript @types/node
```

---

## Confidence Notes

| Area | Confidence | Basis |
|------|------------|-------|
| React + Vite + TypeScript | HIGH | Dominant ecosystem choice, stable for 3+ years |
| CodeMirror 6 for markdown | HIGH | Obsidian uses it; well-documented, active |
| Fastify | HIGH | Stable, widely adopted, clear TS support |
| chokidar for file watching | HIGH | De facto standard, no real competitor |
| FlexSearch | MEDIUM | Accurate as of mid-2025; verify 0.7.x is latest stable |
| allotment for split pane | MEDIUM | Accurate as of mid-2025; verify not abandoned |
| Zustand 5.x | MEDIUM | v5 released late 2024; API stable, verify breaking changes from v4 |
| Claude-as-reranker pattern | HIGH | Correct given Claude API has no embeddings endpoint |
| better-sqlite3 9.x | MEDIUM | Verify version number before install |
| @anthropic-ai/sdk 0.26.x | LOW | Version number based on training data; always check npm before installing |
| Tailwind v4 | MEDIUM | v4 stable as of early 2025; CSS-first config is real |

**Validation step before build:** Run `npm show [package] version` for all pinned versions above before committing to package.json. Training data is accurate through Aug 2025 but npm releases continuously.

---

## Sources

- CodeMirror 6 architecture and extension system: training data, known to be stable API since 2021
- Obsidian using CodeMirror 6: publicly documented in Obsidian developer docs
- chokidar as macOS fs.watch fix: well-documented Node.js community knowledge
- Claude API capabilities (no embeddings): Anthropic API reference as of Aug 2025
- FlexSearch vs MiniSearch vs Fuse.js: npm download trends + benchmark repos in training data
- allotment vs react-split-pane: GitHub activity comparison in training data
- Zustand v5: release notes published late 2024
- Tailwind v4: announced and shipped early 2025

*Note: External verification tools (WebSearch, WebFetch, Bash) were unavailable in this research session. All findings are from training data (cutoff Aug 2025). Confidence levels reflect this limitation. Version-pin validation via `npm show` is strongly recommended before installation.*
