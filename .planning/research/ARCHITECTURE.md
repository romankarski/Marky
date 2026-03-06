# Architecture Patterns

**Project:** Marky — local-first web markdown knowledge base
**Domain:** Single-user web app serving a local filesystem of markdown files
**Researched:** 2026-03-06
**Confidence:** HIGH (well-established pattern from Obsidian, Hedgedoc, Dendron, Foam, Zettlr, and similar tools)

---

## Recommended Architecture

Marky follows the **local server + browser client** pattern used by all successful local-first web markdown tools (Hedgedoc, Joplin web clipper server, Zettlr, siyuan-note). A Node.js process owns the filesystem; the browser handles rendering and editing. Communication happens over HTTP + WebSocket.

```
┌─────────────────────────────────────────────────────────────────┐
│  Browser (localhost:PORT)                                        │
│                                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────────────────┐│
│  │  File Tree  │  │   Tab Bar   │  │   Search Panel           ││
│  │  Component  │  │  + Tabs     │  │   (full-text + semantic)  ││
│  └──────┬──────┘  └──────┬──────┘  └──────────┬───────────────┘│
│         │                │                     │                │
│  ┌──────▼────────────────▼─────────────────────▼───────────────┐│
│  │              Main Content Area                               ││
│  │  ┌─────────────────────┐  ┌──────────────────────────────┐  ││
│  │  │   Preview Pane      │  │   Editor Pane                │  ││
│  │  │   (markdown render) │  │   (CodeMirror or ProseMirror)│  ││
│  │  └─────────────────────┘  └──────────────────────────────┘  ││
│  └──────────────────────────────────────────────────────────────┘│
│                                                                  │
│  ┌──────────────────────────────────────────────────────────────┐│
│  │  Client State (React/Svelte store)                           ││
│  │  - Open files + dirty state                                  ││
│  │  - Tab list + active tab                                     ││
│  │  - Search results cache                                      ││
│  └───────────────────────────┬──────────────────────────────────┘│
└───────────────────────────────┼─────────────────────────────────┘
                                │ HTTP REST + WebSocket
┌───────────────────────────────┼─────────────────────────────────┐
│  Node.js Server (localhost)   │                                  │
│                               │                                  │
│  ┌────────────────────────────▼───────────────────────────────┐ │
│  │  API Layer (Express / Fastify)                             │ │
│  │  GET  /api/tree           — folder tree                    │ │
│  │  GET  /api/file?path=...  — file content                   │ │
│  │  PUT  /api/file?path=...  — save file                      │ │
│  │  POST /api/search/fts     — full-text search               │ │
│  │  POST /api/search/semantic— semantic search (Claude API)   │ │
│  │  WS   /ws/changes         — file-change events             │ │
│  └──────────┬──────────────────────────┬───────────────────────┘ │
│             │                          │                          │
│  ┌──────────▼──────────┐   ┌───────────▼──────────────────────┐ │
│  │  File System Layer  │   │  Search Index Layer              │ │
│  │  - fs.readFile      │   │  - FlexSearch / Lunr (FTS)       │ │
│  │  - fs.writeFile     │   │  - In-memory or SQLite index     │ │
│  │  - Directory walker │   │  - Embeddings cache (SQLite)     │ │
│  └──────────┬──────────┘   └───────────┬──────────────────────┘ │
│             │                          │                          │
│  ┌──────────▼──────────┐   ┌───────────▼──────────────────────┐ │
│  │  File Watcher       │   │  Claude API Client               │ │
│  │  - chokidar         │   │  - Embeddings via claude-3-haiku │ │
│  │  - Emits: change,   │   │    or text-embedding-3-small     │ │
│  │    add, unlink      │   │  - Similarity search over stored │ │
│  │  - Triggers index   │   │    vectors                       │ │
│  │    rebuild + WS push│   └──────────────────────────────────┘ │
│  └─────────────────────┘                                         │
└──────────────────────────────────────────────────────────────────┘
                                │
                    ┌───────────▼───────────────┐
                    │  Local Filesystem          │
                    │  /Users/.../portal-hub/    │
                    │  knowledge/                │
                    │  notes/                    │
                    └───────────────────────────┘
```

---

## Component Boundaries

| Component | Responsibility | Lives In | Communicates With |
|-----------|---------------|----------|-------------------|
| **File Tree** | Render folder/file hierarchy, tag grouping, click to open | Browser | API Layer (GET /tree), Client State |
| **Tab Bar** | Track open files, active tab, dirty state indicator | Browser | Client State |
| **Preview Pane** | Render markdown as HTML (markdown-it or unified), handle internal link clicks | Browser | API Layer (GET /file), Editor Pane |
| **Editor Pane** | Code editor for raw markdown, auto-save on change | Browser | API Layer (PUT /file), Preview Pane |
| **Search Panel** | Input, results list, highlight matches | Browser | API Layer (/search/fts, /search/semantic) |
| **Client State** | React/Svelte store: open tabs, file contents, search cache | Browser | All browser components |
| **API Layer** | HTTP endpoints + WebSocket server | Node.js | File System Layer, Search Index, Claude API Client |
| **File System Layer** | Read/write markdown files, walk directory tree | Node.js | Local filesystem |
| **File Watcher** | Detect external writes (Claude CLI changes), push updates | Node.js | File System Layer, API Layer (WS), Search Index |
| **Search Index** | Full-text index over markdown content | Node.js | File System Layer, Claude API Client |
| **Claude API Client** | Generate embeddings, execute semantic similarity search | Node.js | Claude/OpenAI API (external), Search Index |

---

## Data Flow

### Opening a File

```
User clicks file in tree
  → Client sends GET /api/file?path=...
  → File System Layer reads from disk
  → Returns raw markdown string
  → Preview Pane renders with markdown-it
  → Tab added to Tab Bar in Client State
```

### Editing and Saving

```
User types in Editor Pane
  → Client State marks tab as dirty
  → Debounced auto-save (500ms after last keystroke)
  → Client sends PUT /api/file with new content
  → File System Layer writes to disk
  → Preview Pane re-renders (triggered by content change event)
```

### External File Change (Claude CLI writes file)

```
Claude CLI writes file on disk
  → chokidar emits 'change' event
  → File Watcher notifies Search Index (re-index file)
  → File Watcher pushes WS message to browser: { type: 'file-changed', path }
  → Browser receives WS event
  → If file is open in a tab: fetch fresh content, re-render Preview Pane
  → If tab has unsaved edits: show conflict prompt (keep mine / reload)
```

### Full-Text Search

```
User types in Search Panel
  → Debounced (200ms) POST /api/search/fts with query string
  → Search Index runs FlexSearch query against pre-built index
  → Returns ranked results with snippet excerpts
  → Search Panel renders results list
  → User clicks result → opens file and scrolls to match
```

### Semantic Search

```
User submits semantic query
  → POST /api/search/semantic with query string
  → Claude API Client generates embedding for query
  → Compare against stored file embeddings (cosine similarity)
  → Return top-N files sorted by relevance score
  → Search Panel renders results (no snippet — concept match)
  → Embeddings for files computed on first index build, cached in SQLite
```

### Tag Filtering

```
Tags extracted from frontmatter (---\ntags: [...]\n---) at index time
  → Stored alongside file path in index
  → File Tree renders tag view as virtual folder
  → Clicking tag filters file list via in-memory index lookup (no API call)
```

---

## Suggested Build Order (Phase Dependencies)

Dependencies flow strictly: each layer must exist before the one above it uses it.

```
Phase 1: Server foundation
  File System Layer → API Layer (GET /tree, GET /file, PUT /file) → Static serving

Phase 2: Browser shell
  Client State → File Tree → Tab Bar → Preview Pane
  (Can wire to API Layer from Phase 1 immediately)

Phase 3: Editor
  Editor Pane → connects to existing Preview Pane + auto-save to existing PUT endpoint
  (Preview/Editor split layout)

Phase 4: File Watcher + live reload
  File Watcher → WebSocket endpoint in API Layer → Browser WS client handler
  (Requires Phase 1 server + Phase 2 browser to be meaningful)

Phase 5: Full-text search
  Search Index (FlexSearch) built at startup + updated by File Watcher
  → POST /api/search/fts endpoint
  → Search Panel in browser
  (Requires Phase 4 File Watcher for index freshness)

Phase 6: Semantic search
  Claude API Client → embedding generation + vector store in SQLite
  → POST /api/search/semantic endpoint
  → Extend Search Panel with semantic toggle
  (Requires Phase 5 infrastructure; can be isolated module)
```

**Critical dependency:** File Watcher must come before full-text search (otherwise index goes stale when Claude CLI writes files). Full-text search must be proven before semantic search is layered on.

---

## Patterns to Follow

### Pattern 1: File path as universal document ID

**What:** Use the absolute or root-relative file path as the key for all state — tabs, cache entries, watcher events, search results.
**When:** Always — never invent internal IDs for files.
**Why:** External writers (Claude CLI) identify files by path. Using path as ID means watcher events automatically map to open tabs without a translation layer.

```typescript
// Good
const tabKey = '/knowledge/current/decisions.md'
tabs[tabKey] = { content, dirty, scrollPos }

// Bad — internal ID breaks watcher-to-tab mapping
const tabKey = uuid()
```

### Pattern 2: Optimistic UI with conflict detection

**What:** Save immediately (optimistic), but when File Watcher fires a change event for a file with `dirty: true`, show a conflict prompt.
**When:** Any file with unsaved edits that receives an external change event.
**Why:** Claude CLI agents write files frequently. Without conflict detection, silent overwrites will happen.

### Pattern 3: Single index, incremental updates

**What:** Build the full-text index once at startup. File Watcher triggers incremental add/update/remove for changed files only.
**When:** Search index management.
**Why:** Full rebuild on every change is O(n) for a large knowledge base. FlexSearch supports incremental updates natively.

### Pattern 4: Embeddings are expensive — cache aggressively

**What:** Store embeddings in SQLite keyed by `(path, content_hash)`. Only call Claude API when content hash changes.
**When:** Semantic search index management.
**Why:** Claude API has latency and cost. A 500-file knowledge base with full rebuild on every startup would be unusable.

### Pattern 5: Markdown rendering is client-side only

**What:** Server returns raw markdown strings. Browser renders with markdown-it or unified. Never render HTML server-side.
**When:** All file display.
**Why:** Keeps server stateless for file reads. Allows future features (custom themes, plugins) to live entirely in the browser.

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Polling for file changes

**What:** Browser calls GET /api/file every N seconds to check for updates.
**Why bad:** Wastes I/O, introduces lag, doesn't scale to many open tabs, creates unnecessary server load.
**Instead:** Use chokidar + WebSocket push. Server notifies browser exactly when a file changes.

### Anti-Pattern 2: Storing file content in server memory

**What:** Server reads all files into RAM at startup and serves from cache.
**Why bad:** Memory bloat for large knowledge bases, stale cache bugs when files change on disk, complex invalidation logic.
**Instead:** Read from disk on request (fast enough for local SSD), use File Watcher only for search index updates.

### Anti-Pattern 3: Blocking the API on embedding generation

**What:** POST /api/search/semantic waits for real-time embedding of query + all files.
**Why bad:** First-time semantic search takes minutes for a large corpus.
**Instead:** Pre-compute file embeddings at index time (background on startup, incremental on change). Only embed the query at search time.

### Anti-Pattern 4: Tight coupling between Editor and Preview

**What:** Editor directly calls Preview's render function or shares internal state.
**Why bad:** Makes split-screen (two different files open side by side) impossible or deeply complicated.
**Instead:** Both panes subscribe to Client State by file path. Editor writes to state; Preview reads from state. No direct coupling.

### Anti-Pattern 5: One monolithic frontend component

**What:** Single React component that handles file tree, tabs, editor, preview, search.
**Why bad:** Impossible to implement split-screen layouts, hard to add tab-per-file state.
**Instead:** Each pane is a standalone component parameterized by `filePath`. The layout shell composes them.

---

## Scalability Considerations

Marky is single-user, local-first. "Scalability" here means handling large knowledge bases gracefully, not concurrent users.

| Concern | At 100 files | At 1,000 files | At 10,000 files |
|---------|-------------|----------------|-----------------|
| FTS index build time | <1s | ~2-5s | ~30s (async, non-blocking) |
| FTS index size in memory | ~1MB | ~10MB | ~100MB (consider SQLite FTS5) |
| Embedding generation (first time) | ~10s | ~2min | ~20min (background job, cache essential) |
| Embedding storage (SQLite) | <1MB | ~5MB | ~50MB (fine) |
| File tree render | instant | instant | consider virtual scroll if >5,000 nodes |
| Watcher overhead | negligible | negligible | negligible (chokidar handles 10k+ files) |

**Decision point at ~1,000 files:** Replace in-memory FlexSearch index with SQLite FTS5 (full-text search built into SQLite). FlexSearch is faster for small corpora; SQLite FTS5 handles large corpora without memory pressure and persists across restarts.

---

## Technology Choices (Architecture-Level)

| Concern | Choice | Rationale |
|---------|--------|-----------|
| File watcher | chokidar | Industry standard for Node.js, handles macOS FSEvents, cross-platform |
| Full-text search | FlexSearch (small) / SQLite FTS5 (large) | FlexSearch is zero-dependency, fast; FTS5 is persistent and scales |
| Markdown rendering | markdown-it | Fastest, extensible, supports plugins for task lists, frontmatter, etc. |
| Editor widget | CodeMirror 6 | Best markdown editing DX, lightweight, no framework dependency |
| WebSocket | ws (Node.js) | Minimal, stable, no unnecessary abstractions |
| Embedding cache | SQLite (better-sqlite3) | Zero-config, file-based, synchronous API fits Node.js well |
| Client framework | React or Svelte | Either works; Svelte produces smaller bundles and simpler state |
| API framework | Express or Fastify | Fastify is faster and has better TypeScript support |

---

## Sources

- Architecture pattern: established conventions from Hedgedoc, siyuan-note, Zettlr, Foam (VSCode extension), Obsidian plugin server model — MEDIUM confidence (training data, pre-August 2025, no live verification possible in this session)
- chokidar capabilities: HIGH confidence (stable, widely documented library)
- FlexSearch vs SQLite FTS5 tradeoffs: HIGH confidence (well-established pattern in Node.js search tooling)
- CodeMirror 6 for markdown: HIGH confidence (official CodeMirror docs, stable API since 2021)
- Claude API for embeddings: MEDIUM confidence (API shape may have evolved; verify current embedding endpoint before implementation)
