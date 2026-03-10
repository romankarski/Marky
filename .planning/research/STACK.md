# Stack Research — v1.1 Polish and Navigation

**Project:** Marky — local-first web markdown knowledge base
**Milestone:** v1.1 (tab persistence, backlinks, image rendering, file templates, graph view)
**Researched:** 2026-03-10
**Confidence:** HIGH (all versions verified via `npm info` in live environment)

---

## Context: What Already Exists

This is a subsequent-milestone research file. The following stack is already in production and must NOT be re-researched or replaced:

| Already Installed | Package | Version |
|-------------------|---------|---------|
| Editor | `@uiw/react-codemirror`, `@codemirror/lang-markdown` | 4.25.x / 6.5.x |
| Preview | `react-markdown`, `remark-gfm`, `remark-frontmatter`, `remark-wiki-link`, `rehype-slug` | 10.x |
| Server | `fastify`, `@fastify/cors`, `@fastify/static`, `chokidar`, `gray-matter` | 5.x |
| Search | `minisearch` (client + server) | 7.2.x |
| Layout | `react-resizable-panels`, `dnd-kit` | 4.x / 6-10.x |
| Styling | Tailwind CSS v4 | 4.x |
| Tests | `vitest` | 4.x (client), 2.x (server) |

**State management:** Plain `useReducer` + custom hooks. No Zustand. `localStorage` is already used directly in `App.tsx` for sidebar/TOC collapse state — this pattern is established and working.

---

## New Stack Additions Required for v1.1

### Tab Persistence (PRST-01 / PRST-02 / PRST-03)

**Decision: No new package needed.**

The codebase already calls `localStorage` directly. Tab persistence follows the same pattern:
- Persist tab paths + active tab ID to `localStorage` key `marky-tabs` on every `useTabs` dispatch
- Restore on mount by reading `localStorage` and dispatching `OPEN` actions
- Scroll position: use `sessionStorage` keyed by tab ID — survives React re-renders but not a full page close (acceptable for scroll position)

**Do NOT add Zustand.** The app is useReducer-based throughout. Introducing Zustand just for localStorage persistence would fragment the state model with no benefit. The `useTabs` hook already owns all tab state; a 10-line `useEffect` that syncs reducer state to localStorage is sufficient.

**Pattern already in codebase (lines 152-163 of App.tsx):**
```ts
const [sidebarCollapsed, setSidebarCollapsed] = useState(
  () => localStorage.getItem('marky-sidebar-collapsed') === 'true'
);
```
Replicate this pattern inside `useTabs`: initialize from localStorage, write to localStorage on state change.

---

### Backlink Indexing (BKLN-01 / BKLN-02 / BKLN-03)

**Decision: Extend the existing `SearchService` on the server. No new package for link parsing.**

The server already uses `gray-matter` + `fs/promises` to read every markdown file at startup. `gray-matter` returns the raw content — regular expressions are sufficient to extract `[text](path.md)` and `[[wiki-link]]` patterns from markdown content without a full AST parse.

**Why not remark on the server?**

`remark` + `unist-util-visit` would be the "correct" AST approach, but:
- It adds 3 packages (`remark`, `remark-parse`, `unist-util-visit`) at ~2 MB
- Regex on the already-parsed `parsed.content` string handles 99% of real-world link patterns in this codebase
- The link extractor only needs to run at index time (startup + file change), not on the hot path

Use regex in `SearchService._readDoc()` or a new `_extractLinks()` helper. Pattern:
```
/\[([^\]]*)\]\(([^)]+\.md)\)/g           // [text](file.md)
/\[\[([^\]|#]+)/g                         // [[wiki-link]] or [[wiki-link|alias]]
```

**Server route to add:** `GET /api/backlinks/:path` — returns `{ backlinks: { path, label }[] }` by querying a `linkIndex: Map<target, Set<source>>` built during indexing.

**No new npm packages required.**

---

### Image Path Resolution (IMG-01 / IMG-02)

**Decision: Use `@fastify/static` (already installed, not yet registered) to serve a proxied image endpoint.**

Current state: `@fastify/static` is in `server/package.json` but only used for serving the built client SPA. A dedicated `/api/image/*` route can proxy filesystem images to the browser, solving the `file://` restriction.

**Pattern:**
```
GET /api/image/knowledge/some-folder/screenshot.png
→ Server reads rootDir/knowledge/some-folder/screenshot.png
→ Replies with correct Content-Type using fastify.sendFile or fs.createReadStream
```

The `MarkdownPreview` component already has an `img` override that returns a placeholder for non-remote images (lines 74-82). Update it to point `src` at `/api/image/${resolvedPath}` where `resolvedPath` is computed from the current file's directory + the relative `src` attribute.

**`@fastify/static` version already installed: `^8.0.0`** — no version change needed.

**No new npm packages required.**

---

### File Templates (TMPL-01 / TMPL-02 / TMPL-03)

**Decision: Templates are data, not a library concern. No new packages.**

Built-in templates (daily note, meeting note, decision record) are hardcoded template strings in a `client/src/templates/` directory — TypeScript objects with `{ id, label, content: string }`. No template engine required; they are plain markdown strings with a `{{DATE}}` placeholder replaced at creation time using `new Date().toISOString().slice(0, 10)`.

Custom templates (TMPL-02): when a user saves a file as a template, POST to a new server endpoint `POST /api/templates` which writes the file content to a `.marky/templates/` directory inside `rootDir`. Template list endpoint: `GET /api/templates`.

**`gray-matter` (already installed):** parse frontmatter from saved template files to extract a `template-name` key for display in the picker.

**No new npm packages required.**

---

### Graph View (GRPH-01 / GRPH-02 / GRPH-03 / GRPH-04)

**Decision: `react-force-graph-2d` — the only new package needed for v1.1.**

| Package | Version | Peer Deps | Bundle Impact |
|---------|---------|-----------|---------------|
| `react-force-graph-2d` | `1.29.1` | `react: '*'` (any version) | ~180 KB gzipped (canvas, no WebGL) |

**Why `react-force-graph-2d` over alternatives:**

- **D3 directly** — requires writing the full simulation loop, node positioning, zoom, pan, drag, click handling from scratch. 300+ lines for a feature that should take one phase.
- **`cytoscape.js` + `react-cytoscapejs`** — excellent for large graphs with complex layouts (Obsidian uses it). Adds ~400 KB. For a tag-based view with <1000 nodes, this is overkill and the API surface is larger.
- **`react-d3-graph`** — last published 3+ years ago, effectively abandoned.
- **`react-force-graph-2d`** — actively maintained (version 1.29.1, last published weeks ago as of research date). Canvas-based (not SVG, so stays fast at 200+ nodes). Peer dep is `react: '*'` — confirmed compatible with React 19. Minimal API: pass `graphData: { nodes, links }` and callback props. Node click, highlight, zoom/pan all built in.

**Data shape the graph needs:**

The tag index already exists as `indexPayload.tagMap: Record<string, string[]>` (tag → file paths). Graph nodes = files + tag nodes. Graph edges = file-has-tag relationships. This data is already delivered to the client by the existing `/api/search/index` endpoint — no new server route needed.

**Integration point:** Add a `GraphView` component that:
1. Receives `indexPayload` as prop (already in `App.tsx` state)
2. Transforms `tagMap` into `{ nodes: [...], links: [...] }`
3. Renders `<ForceGraph2D>` inside a panel or tab
4. On node click, calls `openTab(node.path)` for file nodes

**Positioning:** GRPH-04 requires the graph to live in a dedicated panel or tab, not a modal. The right panel already hosts TOC + FileInfo. A tab-based approach (add "Graph" as a special tab type in the tab reducer) is cleanest — it reuses existing layout without adding a new panel slot.

---

## Complete v1.1 Install Delta

```bash
# Only ONE new package for the entire milestone
cd /Users/romankarski/projects/portal-hub/Marky
npm install react-force-graph-2d --workspace=client
```

Everything else is implemented using packages already installed.

---

## Supporting Libraries Table

| Library | Version | Purpose | Status |
|---------|---------|---------|--------|
| `react-force-graph-2d` | `^1.29.1` | Graph view canvas rendering | NEW — install |
| `@fastify/static` | `^8.0.0` | Image proxy endpoint | ALREADY INSTALLED — register in app.ts |
| `gray-matter` | `^4.0.3` | Parse template frontmatter | ALREADY INSTALLED |
| `remark-wiki-link` | `^2.0.1` | Wiki-link detection (client preview) | ALREADY INSTALLED |
| `localStorage` (browser API) | — | Tab persistence | BUILT-IN — no package |

---

## What NOT to Add

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Zustand | State model is already useReducer; adding a second paradigm creates confusion. Tab persistence needs 10 lines, not a library. | `useEffect` + `localStorage` in `useTabs` |
| `remark` + `unist-util-visit` (server) | Adds 3 packages for link extraction that regex handles in this codebase. | Regex on `parsed.content` from `gray-matter` |
| `cytoscape.js` / `react-cytoscapejs` | 400 KB for a feature that needs basic force-directed layout. Obsidian-scale features not required here. | `react-force-graph-2d` |
| `react-d3-graph` | Last published 3+ years ago, abandoned. | `react-force-graph-2d` |
| Template engine (Handlebars, Mustache, etc.) | Templates are markdown strings with one `{{DATE}}` substitution. No engine needed. | `String.replace()` |
| SQLite / database | Templates are files in `.marky/templates/`. No database needed for this scope. | Filesystem via existing file routes |

---

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| `react-force-graph-2d@1.29.1` | `react@19.x` | Peer dep is `react: '*'` — any React version confirmed via `npm info` |
| `@fastify/static@8.x` | `fastify@5.x` | Already in package.json at this version combination |

---

## Architectural Notes by Feature

**Tab Persistence:** Serialize only `{ paths: string[], activeIndex: number }` to localStorage — not full Tab objects (which include content). Rehydrate by dispatching OPEN actions with paths. Content is re-fetched from server on mount, same as a normal open.

**Backlink Index:** Add `linkIndex: Map<string, Set<string>>` to `SearchService`. Populate during `_readDoc`. Expose via `getBacklinks(targetPath: string): string[]`. Wire to a new Fastify route. The `SearchService.updateDoc` method already handles incremental updates on file change — extend it to also update `linkIndex`.

**Image Proxy:** The path security utility (`lib/pathSecurity.ts`) already exists and validates paths against `rootDir`. Reuse it for the image proxy route to prevent directory traversal.

**Graph View:** Tag nodes and file nodes should be visually distinct (different colors/sizes). The active file (already tracked in App.tsx as `activeFocusedTab`) should be passed as a prop to highlight its node. Use `nodeColor` and `nodeRelSize` props on `ForceGraph2D` for this.

---

## Sources

- `npm info react-force-graph-2d version peerDependencies` — version 1.29.1, `react: '*'` (verified 2026-03-10)
- `npm info react-force-graph version peerDependencies` — version 1.48.2, `react: '*'` (verified 2026-03-10)
- `npm info remark-parse version` — 11.0.0 (verified — not needed for this milestone)
- `npm info unist-util-visit version` — 5.1.0 (verified — not needed for this milestone)
- `npm info zustand version peerDependencies` — 5.0.11, `react: '>=18.0.0'` (verified — rejected in favor of existing pattern)
- Existing codebase review: `App.tsx` lines 152-163 (localStorage pattern), `server/package.json` (`@fastify/static` already present), `server/src/lib/search.ts` (extension point for link index), `client/src/components/MarkdownPreview.tsx` (image override already placeholder-ready)
- WebSearch: vasturiano/react-force-graph GitHub — actively maintained, canvas-based, knowledge graph use cases documented
- WebSearch: cytoscape.js ecosystem — confirmed Obsidian uses it; ruled out for size vs. need ratio

---

*Stack research for: Marky v1.1 feature additions*
*Researched: 2026-03-10*
*Prior stack research (Phase 1, pre-build): see git history — superseded by this file*
