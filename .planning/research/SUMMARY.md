# Project Research Summary

**Project:** Marky — local-first web markdown knowledge base
**Domain:** Single-user web app serving a local filesystem of markdown files
**Researched:** 2026-03-06
**Confidence:** MEDIUM

## Executive Summary

Marky is a local-first markdown knowledge base with a specific constraint that differentiates it from generic editors: it must coexist with Claude CLI agents writing files to the same filesystem in real time. This makes the file watcher and conflict detection logic first-class architectural concerns, not afterthoughts. The well-established pattern for this type of tool is a thin Node.js server that owns filesystem access + a browser client that owns rendering and UI state, communicating over HTTP REST and WebSocket. This architecture is used by Hedgedoc, siyuan-note, Zettlr, and similar tools, and is the correct choice here.

The recommended stack is React 19 + Vite 6 + TypeScript 5 on the frontend, Fastify 4 + chokidar 3 + FlexSearch on the backend, with CodeMirror 6 as the editor. The strongest differentiator — and the primary reason to build Marky instead of using VS Code — is semantic search via the Claude API (LLM-as-reranker pattern over FlexSearch candidates). All other tool choices are well-established with high confidence; the Anthropic SDK version number should be verified against npm before installation.

The critical risks are all implementation-level: file watcher race conditions causing silent data loss, full-text search re-indexing everything on every change, and semantic search triggering API calls without an embedding cache. All three are entirely preventable with upfront design decisions (dirty-state tracking, incremental FlexSearch updates, SQLite embedding cache keyed by content hash). The build order is strictly dependency-driven: server foundation first, then browser shell, then editor, then file watcher, then search — each layer depends on the previous one being solid.

---

## Key Findings

### Recommended Stack

The stack is a conventional two-package npm workspace (frontend + backend) with no Turborepo overhead. React + Vite + TypeScript handle the frontend; Fastify with chokidar and WebSocket handles the backend. CodeMirror 6 is the correct editor choice — Obsidian uses it, it handles large files via virtualized rendering, and its extension API supports vim mode, themes, and markdown-specific behavior. Monaco is explicitly wrong for this use case (4MB bundle, designed for LSP/code, markdown is second-class).

Full-text search runs in-process via FlexSearch (no external search service). Semantic search uses the LLM-as-reranker pattern: FlexSearch returns top 20 candidates, Claude (haiku) re-ranks them by meaning. This is the correct pattern because the Claude API does not expose an embeddings endpoint — vector similarity via Claude is not possible; only reranking is. Tags live in YAML frontmatter parsed by `gray-matter`, never in a sidecar database.

**Core technologies:**
- React 19 + Vite 6 + TypeScript 5: frontend framework — dominant ecosystem, first-class Vite HMR, necessary for complex tab/split-pane state
- CodeMirror 6: markdown editor — purpose-built for browser text editing, virtualized rendering, markdown language package, used by Obsidian
- Fastify 4: HTTP server — faster than Express, built-in schema validation, better TypeScript support
- chokidar 3: file watcher — de facto Node.js standard, wraps native OS events (FSEvents/inotify), handles macOS rename-event bugs that plague raw `fs.watch`
- FlexSearch 0.7.x: full-text search — fastest in-process JS search library, incremental add/update/remove, no external service
- Zustand 5: UI state — minimal, TypeScript-friendly, avoids Redux boilerplate for tab list + active file state
- `allotment`: split-pane layout — maintained React component for resizable panels (`react-split-pane` is abandoned)
- `gray-matter`: frontmatter parsing — de facto standard for YAML frontmatter in Node.js
- `better-sqlite3`: embedding cache — synchronous API fits Node.js well, zero-config, file-based
- `@anthropic-ai/sdk`: Claude API client — LLM-as-reranker for semantic search, verify version before install
- Tailwind CSS 4: styling — CSS-first config (no tailwind.config.js), fastest path to polished UI
- `marked` + DOMPurify: markdown rendering — fast, CommonMark compliant, DOMPurify required to prevent XSS

### Expected Features

The research surveyed Obsidian, Notion, Typora, Notable, Zettlr, and iA Writer to establish what users expect. Marky's specific context (single user, AI agent collaboration, semantic search differentiator) shapes the MVP scope tightly.

**Must have (table stakes):**
- File tree with folder browser — without navigation, product is unusable
- Markdown preview with full GFM (tables, checkboxes, fenced code blocks)
- Simultaneous preview + editor split layout (no mode toggle) — core product promise
- Syntax highlighting in editor — regression vs VS Code without it
- Auto-save with debounce (500ms idle) — users must never lose work
- Full-text search, sub-100ms perceived response — second most important feature after reading
- Tab-based multi-file open — working across multiple documents is standard
- External file watcher + auto-refresh — required for the Claude agent workflow that defines Marky's unique context
- Internal link navigation (click `[text](file.md)` to open)
- Frontmatter parsing (tags)

**Should have (differentiators):**
- Semantic search via Claude API — Marky's primary justification for existing over VS Code
- Tag-based cross-folder filtering — required given the portal-hub knowledge base structure
- Scroll sync between editor and preview panels
- Recent files list
- Dark/light theme toggle

**Defer to v2:**
- Backlinks / graph view
- Command palette (Cmd+K)
- File outline / TOC panel
- Drag-and-drop file organization
- Persistent layout memory
- Focus/distraction-free mode

**Never build:**
- Real-time collaboration, cloud sync, plugin system, mobile layout, block-based editor, WYSIWYG-only mode

### Architecture Approach

Marky follows the local server + browser client pattern: a Node.js process owns all filesystem operations and search indexing; the browser handles rendering and UI state. Communication is HTTP REST for request/response and WebSocket for push notifications (file-change events). The server is intentionally thin — it does not cache file contents in memory (read from disk on request) and does not own UI state. The browser owns tabs, active file, scroll positions, and search result cache. File path is the universal document ID across all systems (tabs, watcher events, search index) — this is critical for the external-write use case where Claude CLI identifies files by path.

**Major components:**
1. File Tree (browser) — renders folder hierarchy, tag grouping, click-to-open; reads from GET /api/tree
2. Tab Bar + Client State (browser) — tracks open files, dirty state, active tab via Zustand
3. Editor Pane (browser) — CodeMirror 6 wrapper, debounced auto-save to PUT /api/file
4. Preview Pane (browser) — renders markdown via `marked`, subscribes to Client State by file path (no direct Editor coupling)
5. Search Panel (browser) — full-text and semantic search UI; calls POST /api/search/fts and POST /api/search/semantic
6. API Layer (Node.js) — Fastify routes for file CRUD, search, WebSocket endpoint
7. File System Layer (Node.js) — fs.readFile/writeFile, directory walker
8. File Watcher (Node.js) — chokidar with `awaitWriteFinish`, pushes WS events to browser and triggers incremental search index updates
9. Search Index (Node.js) — FlexSearch in-memory index, incremental updates on file change, built async at startup
10. Claude API Client (Node.js) — LLM-as-reranker for semantic search; embedding cache in SQLite keyed by (path, content_hash)

### Critical Pitfalls

1. **File watcher race condition on external writes** — track dirty state per file; on external change event, if dirty show conflict prompt instead of auto-reloading; if clean, auto-reload silently. Configure chokidar with `awaitWriteFinish: { stabilityThreshold: 100 }`. Address in Phase 1 — getting this wrong requires a state management rewrite.

2. **Full-text search re-indexes entire vault on every change** — design incremental indexing from day one: on `change`/`add` events, index only the affected file and merge into the existing FlexSearch index. Never call `indexAllFiles()` from a watcher callback.

3. **Semantic search calls embedding API without cache** — pre-compute and persist embeddings in SQLite keyed by `(path, content_hash)`. Only re-embed when content changes. At query time, embed only the query string (one API call). Debounce search input 300–500ms. Retrofitting this cache is painful; design before implementing semantic search.

4. **Preview re-renders entire document on every keystroke** — debounce preview updates 100–200ms; preserve scroll position before/after re-render; use CodeMirror 6's built-in virtualized rendering for the editor.

5. **Tag system stored outside frontmatter** — tags must live exclusively in YAML frontmatter (`tags: [...]`) parsed by `gray-matter`. A sidecar JSON file diverges from file content when Claude agents write files externally. This is a filesystem-as-source-of-truth violation that breaks the entire knowledge base contract.

---

## Implications for Roadmap

The architecture research explicitly defines a 6-phase build order based on strict dependency chains. Each phase depends on the previous being complete. This ordering is the correct one.

### Phase 1: Server Foundation + Project Scaffold

**Rationale:** Everything downstream depends on a working Node.js server that can read/write files and serve the frontend from the same origin. CORS issues (Pitfall 8) must be resolved at the scaffold level — they cannot be fixed later without breaking API callers. The split-pane library choice must also be made here since it cascades into every layout decision.

**Delivers:** Running Fastify server with GET /api/tree, GET /api/file, PUT /api/file; React + Vite app served from same origin; `allotment`-based split-pane layout shell; TypeScript configured for both packages.

**Addresses:** File tree browser, basic file read/write, responsive desktop layout.

**Avoids:** CORS issues (P8), split-pane resize bugs (P5 — use `allotment` from the start).

### Phase 2: Browser Shell (File Tree + Tabs + Preview)

**Rationale:** Users need to navigate and read before they can edit. The File Tree + Tab Bar + Preview Pane are the minimum product. Building these before the editor means the preview rendering pipeline (marked + DOMPurify) is proven before the editor is wired to it.

**Delivers:** Clickable file tree, tab-based multi-file navigation, markdown preview with GFM, internal link click handling, readable typography.

**Addresses:** File tree browser, markdown preview, tab system, external link handling, basic frontmatter display.

**Avoids:** Preview full-re-render on keystroke (P6 — debounce from the start), tight Editor/Preview coupling (Anti-Pattern 4 — Preview reads from Client State by file path, not from Editor directly).

### Phase 3: Editor + Auto-Save

**Rationale:** CodeMirror 6 is the most complex single component. Isolating it to its own phase allows the editor integration to be proven (including scroll sync with the existing Preview Pane) without search or watcher complexity.

**Delivers:** CodeMirror 6 editor pane in split layout, syntax highlighting, auto-save (500ms debounce), dirty-state tracking in Zustand, frontmatter preservation on save.

**Addresses:** Edit mode, syntax highlighting, auto-save, tab dirty indicator.

**Avoids:** CodeMirror version mismatch (P11 — use `@codemirror/` namespace packages only, `@uiw/react-codemirror` for React wrapper), file content corruption on save.

### Phase 4: File Watcher + Live Reload

**Rationale:** This phase implements the core differentiating behavior for the AI agent workflow. It must come after the editor (Phase 3) because conflict detection requires dirty-state tracking, which is built in Phase 3. The WebSocket infrastructure added here is also required for search index freshness in Phase 5.

**Delivers:** chokidar watcher with `awaitWriteFinish`, WebSocket endpoint in Fastify, browser WS client, silent auto-reload for clean tabs, conflict prompt for dirty tabs, symlink handling.

**Addresses:** External file watcher + auto-refresh (the Claude CLI use case).

**Avoids:** Race condition on external writes (P1 — dirty-state check before reload), polling anti-pattern (P2 — chokidar with native OS events), symlink infinite loops (P13 — `followSymlinks: false`).

### Phase 5: Full-Text Search + Tag System

**Rationale:** FlexSearch index should be built after the File Watcher (Phase 4) so incremental updates work from day one. Building search without the watcher produces a stale index that requires app restarts. The tag system belongs in this phase because it shares the same index infrastructure (frontmatter parsed at index time).

**Delivers:** FlexSearch index built async at startup, incremental updates on file change events, POST /api/search/fts endpoint, Search Panel in browser, tag extraction from frontmatter, tag-based filtering in File Tree.

**Addresses:** Full-text search, tag-based cross-folder filtering, recent files list.

**Avoids:** Full re-index on every change (P3 — incremental FlexSearch add/update/remove), search index not warmed on startup (P10 — async background indexing with partial results), tags stored outside frontmatter (P7 — `gray-matter` + frontmatter-only).

### Phase 6: Semantic Search

**Rationale:** Semantic search is Marky's strongest differentiator and highest-complexity feature. It can only be built after full-text search (Phase 5) because it uses FlexSearch as a pre-filter (top 20 candidates). The embedding cache in SQLite must be designed first before any API calls are made.

**Delivers:** SQLite embedding cache (path + content_hash keying), background embedding generation at startup, POST /api/search/semantic endpoint (query embedding + LLM reranking via Claude haiku), semantic toggle in Search Panel, cache model-version validation on startup.

**Addresses:** Semantic search via Claude API — the primary differentiator justifying Marky's existence.

**Avoids:** API calls per keystroke (P4 — pre-computed embeddings, 300ms debounce on query), embedding dimension mismatch on model change (P12 — model name stored in cache metadata, validated on startup).

### Phase Ordering Rationale

- Server must precede browser (browser has nothing to call without it).
- Preview must precede editor (proves render pipeline; prevents tight coupling).
- Editor must precede file watcher (conflict detection requires dirty-state from editor).
- File watcher must precede search (otherwise index goes stale immediately).
- Full-text search must precede semantic search (semantic uses FTS as pre-filter; FTS infrastructure must be proven first).
- Tags belong in Phase 5 (not Phase 2) because tag filtering requires the search index infrastructure.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 6 (Semantic Search):** Claude API shape for the LLM-as-reranker pattern should be verified against current Anthropic docs before implementation. The SDK version number in STACK.md is LOW confidence. The Voyage embedding API (mentioned in PITFALLS.md as an alternative) needs clarification — Claude does not expose embeddings directly; if a vector approach is preferred over reranking, a separate embedding provider (Voyage, OpenAI) must be chosen.
- **Phase 4 (File Watcher):** chokidar `awaitWriteFinish` configuration values (stabilityThreshold, pollInterval) should be validated against the actual write patterns of Claude CLI agents on macOS before tuning.

Phases with standard patterns (skip research-phase):
- **Phase 1 (Server Foundation):** Fastify + Vite + TypeScript setup is extremely well-documented.
- **Phase 2 (Browser Shell):** React component patterns for file tree and tab management are standard.
- **Phase 3 (Editor):** CodeMirror 6 React integration has official documentation and `@uiw/react-codemirror` wrapper.
- **Phase 5 (Full-Text Search):** FlexSearch incremental indexing is well-documented; frontmatter with `gray-matter` is a solved problem.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | MEDIUM | Core choices (React, Vite, TypeScript, CodeMirror 6, Fastify, chokidar) are HIGH confidence. Package version numbers for FlexSearch, allotment, Zustand 5, better-sqlite3, and @anthropic-ai/sdk should be verified via `npm show` before installation. Training data cutoff Aug 2025. |
| Features | MEDIUM | Based on training knowledge of Obsidian, Notion, Typora, Notable, Zettlr, iA Writer. Feature classifications are reliable; no live verification of competitor current state. |
| Architecture | HIGH | Local server + browser client pattern is well-established across multiple open-source projects (Hedgedoc, siyuan-note, Zettlr). Component boundaries and data flow are standard. |
| Pitfalls | HIGH | Race conditions, incremental indexing requirements, and embedding cache design are well-documented failure modes from open-source project issue trackers. |

**Overall confidence:** MEDIUM-HIGH

### Gaps to Address

- **Anthropic SDK version + embedding API shape:** STACK.md rates `@anthropic-ai/sdk` version as LOW confidence. Verify current SDK version and confirm LLM-as-reranker API shape before Phase 6 planning. Check whether Claude haiku model names have changed since Aug 2025.
- **FlexSearch 0.7.x stability:** STACK.md notes this needs verification. If 0.7.x is not the latest stable release, evaluate whether the API has changed. MiniSearch is a valid fallback with a simpler API.
- **allotment maintenance status:** STACK.md rates this MEDIUM. Verify the library is still actively maintained before Phase 1. `react-resizable-panels` (by Brian Vaughn, who maintains react-virtualized) is a well-supported alternative.
- **Scroll sync implementation complexity:** FEATURES.md defers this to v2, but PITFALLS.md flags it as a moderate concern for Phase 1/2. Clarify during Phase 3 planning whether the CodeMirror 6 + marked combination supports line-number source maps for sync, or whether percentage-based heuristic is acceptable.
- **Tailwind v4 CSS-first config:** Rated MEDIUM. Verify Tailwind v4 is stable and the CSS-first config (no tailwind.config.js) is production-ready before Phase 1.

---

## Sources

### Primary (HIGH confidence)
- CodeMirror 6 official documentation — editor architecture, extension API, markdown language package
- chokidar GitHub (paulmillr/chokidar) — file watching configuration, `awaitWriteFinish`, platform behavior
- gray-matter GitHub (jonschlinkert/gray-matter) — frontmatter parsing API
- Anthropic API reference (as of Aug 2025) — Claude API capabilities, confirmed no embeddings endpoint

### Secondary (MEDIUM confidence)
- Obsidian developer documentation — CodeMirror 6 usage, frontmatter/tag conventions
- Hedgedoc, siyuan-note, Zettlr, Foam architecture — local server + browser client pattern validation
- FlexSearch, MiniSearch documentation — incremental indexing API
- react-resizable-panels, allotment GitHub — split-pane library comparison
- Zustand v5 release notes — breaking changes from v4
- Tailwind CSS v4 announcement — CSS-first config

### Tertiary (LOW confidence)
- General pitfall patterns from Obsidian, Foam, Dendron, Notable open-source issue trackers — observed patterns, not specific issue citations
- npm download trends for FlexSearch vs MiniSearch vs Fuse.js — training data inference

---
*Research completed: 2026-03-06*
*Ready for roadmap: yes*
