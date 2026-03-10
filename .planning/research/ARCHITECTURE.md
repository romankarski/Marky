# Architecture Research

**Domain:** v1.1 feature integration — existing Fastify + React markdown workspace
**Researched:** 2026-03-10
**Confidence:** HIGH (based on direct codebase analysis; all integration points verified against actual source files)

---

> **Note:** This file supersedes the original v1.0 ARCHITECTURE.md (which was written before the app existed).
> The app is now fully built. This document maps each v1.1 feature to exact integration points in the actual codebase.

---

## System Overview

Current architecture as built (verified against source):

```
┌──────────────────────────────────────────────────────────────────────┐
│  Browser (React 19 + Vite 6)                                         │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │  App.tsx  (orchestrator — all state lives here)                 │ │
│  │  - useTabs()        → tabs[], activeTabId, dispatch             │ │
│  │  - useSearch()      → indexPayload, tagMap, refetchIndex        │ │
│  │  - useTags()        → activeTags, filterPaths, allTags          │ │
│  │  - useFileWatcher() → SSE listener, triggers dispatch/refetch   │ │
│  │  - useFileTree()    → tree nodes                                │ │
│  └──────┬──────────────┬───────────────────────┬───────────────────┘ │
│         │              │                       │                      │
│  ┌──────▼───┐  ┌───────▼──────────────┐  ┌────▼──────────────────┐  │
│  │ Sidebar  │  │    Main Content      │  │   Right Panel         │  │
│  │ FileTree │  │  TabBar + EditorPane │  │  FileInfo (tags)      │  │
│  │ TagFilter│  │  SplitView (opt)     │  │  TableOfContents      │  │
│  │ Search   │  │  WelcomeScreen       │  │                       │  │
│  └──────────┘  └──────────────────────┘  └───────────────────────┘  │
└──────────────────────────────────────────────────────────────────────┘
                              │ REST + SSE
┌─────────────────────────────▼────────────────────────────────────────┐
│  Fastify 5 Server (Node.js)                                          │
│                                                                       │
│  app.ts decorators:                                                  │
│    fastify.rootDir       — resolved filesystem root                  │
│    fastify.fileWatcher   — FileWatcherService (chokidar)             │
│    fastify.searchService — SearchService (MiniSearch + tags)         │
│                                                                       │
│  Routes:                                                              │
│    GET/POST/PUT/DELETE  /api/files/*  — file CRUD                    │
│    PATCH                /api/files/*  — tag frontmatter update       │
│    GET                  /api/watch    — SSE file-change stream       │
│    GET                  /api/search/index — full index payload       │
└──────────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────▼────────────────┐
              │  Local Filesystem (rootDir)    │
              │  knowledge/ + notes/           │
              └────────────────────────────────┘
```

---

## Existing Component Inventory

Key facts for integration decisions:

| Component | File | State Home | Notes |
|-----------|------|------------|-------|
| Tab state | `hooks/useTabs.ts` | `useReducer` in App.tsx | `tabs[]` + `activeTabId`; Tab has `id`, `path`, `content`, `dirty`, `editMode`, `deleted` |
| Tab type | `types/tabs.ts` | — | No `scrollPosition` field yet; no `createdAt` field |
| Search index | `hooks/useSearch.ts` | `useRef` + `useState` | Fetches `/api/search/index` on mount and on `version` bump; `indexPayload` has `{ index, tags, tagMap }` |
| File watcher | `hooks/useFileWatcher.ts` | SSE in effect | Listens to `/api/watch`; dispatches `SET_CONTENT` / `SET_DELETED` / triggers `refetch` |
| Preview | `components/MarkdownPreview.tsx` | stateless | `img` handler explicitly deferred: returns placeholder span for local images |
| Right panel | App.tsx inline | `useState` | `FileInfo` (tags) + `TableOfContents` stacked vertically; panel is collapsible |
| File create | `components/FileTree.tsx` | local | `POST /api/files/*` with `{ content: '' }`; no template support |
| Welcome screen | `components/WelcomeScreen.tsx` | stateless | Static text only; no recent files list |
| SearchService | `server/src/lib/search.ts` | in-process | Stores `SearchDoc { id, name, path, text, tags }`; no link/backlink extraction |
| Panel collapse | App.tsx | `localStorage` | `marky-sidebar-collapsed`, `marky-toc-collapsed` keys already written |

---

## v1.1 Feature Integration Map

### Feature 1: Tab Persistence (PRST-01, PRST-02, PRST-03)

**What needs to change:**

| Layer | Change | New vs Modified |
|-------|--------|-----------------|
| `types/tabs.ts` | Add `scrollPosition?: number` to `Tab` | MODIFIED |
| `hooks/useTabs.ts` | Add `RESTORE` action and `SET_SCROLL` action to `tabReducer`; wrap `useReducer` initializer to load from `localStorage` | MODIFIED |
| `components/WelcomeScreen.tsx` | Accept `recentPaths: string[]` prop and `onOpen` callback; render clickable recent files list | MODIFIED |
| `App.tsx` | Pass `recentPaths` to WelcomeScreen; add `useEffect` to persist `{ tabs: [{path, label}], activeTabId }` to localStorage on state change | MODIFIED |
| `components/EditorPane.tsx` / `MarkdownPreview.tsx` | Track `scrollTop` of the preview scroll container in a ref; on blur or tab switch, call `SET_SCROLL`; on tab focus, restore `scrollTop` | MODIFIED |

**localStorage key design:**

```
marky-tabs          → JSON: { paths: string[], activeIndex: number }
marky-recent        → JSON: string[]  (last 10 opened paths, newest first)
```

Do NOT persist `content` in localStorage — file content is large and always fresh from disk. Persist only `path` and `label`. On restore, dispatch `OPEN` for each saved path to trigger the existing fetch-on-demand logic.

**Restore flow:**

```
App mounts
  → read marky-tabs from localStorage
  → dispatch OPEN for each saved path (lazy content fetch as today)
  → dispatch FOCUS for saved activeTabId
  → useEffect on indexPayload to verify paths still exist; close tabs for missing files
```

**Scroll position pattern:**

Use a `ref` on the scrollable container inside `MarkdownPreview`. On `activeTabId` change in parent, read `scrollContainerRef.current.scrollTop`, dispatch `SET_SCROLL { id, scrollTop }`. On mount / tab switch in, apply the stored value via `scrollContainerRef.current.scrollTop = tab.scrollPosition`.

---

### Feature 2: Backlinks Panel (BKLN-01, BKLN-02, BKLN-03)

**What needs to change:**

| Layer | Change | New vs Modified |
|-------|--------|-----------------|
| `server/src/lib/search.ts` | Add `links: string[]` field to `SearchDoc`; extract `[[wiki-link]]` and `[text](./relative.md)` patterns from content at index time; add `getBacklinks(path)` method | MODIFIED |
| `server/src/routes/search.ts` | Add `GET /api/backlinks/:path` route that calls `searchService.getBacklinks(path)` | NEW route in existing file |
| `shared/src/types.ts` | Add `BacklinksResponse { links: Array<{ path: string; label: string }> }` | MODIFIED |
| `client/src/components/BacklinksPanel.tsx` | New component: fetches `/api/backlinks/${activeFilePath}`, renders list, clicking calls `onOpen(path)` | NEW |
| App.tsx right panel | Render `BacklinksPanel` above `FileInfo` and below the panel header; pass `activeFocusedTab?.path` and `openTab` | MODIFIED |

**Link extraction approach (server-side):**

Parse during `_readDoc` in `SearchService`. Use two regex patterns against `parsed.content`:
- `[[wiki-link]]` → extract `wiki-link`, normalize to `wiki-link.md`
- `[text](./path.md)` or `[text](path.md)` → extract the href if it ends in `.md` or lacks a protocol

Store extracted paths (normalized to root-relative) in `SearchDoc.links`. `getBacklinks(targetPath)` iterates all docs and returns docs where `links` includes `targetPath`.

**Data flow for backlinks:**

```
User switches to file X
  → activeFocusedTab.path changes
  → BacklinksPanel useEffect fires
  → GET /api/backlinks/knowledge/page.md
  → server iterates searchService.docs, finds docs with links.includes(path)
  → returns [{ path, label }]
  → BacklinksPanel renders list with count in header
  → user clicks → openTab(path)
```

**Watcher integration:** No extra work needed. When a file changes, `searchService.updateDoc` already re-parses the file. The backlinks computed from `getBacklinks` will reflect the updated index automatically.

**Right panel layout (existing structure to extend):**

```
Right panel (vertical flex column)
  ├── FileInfo (tags) — existing, stays at top
  ├── BacklinksPanel — NEW, inserted below FileInfo
  └── TableOfContents — existing, stays at bottom
```

The panel already has `overflow-hidden` and `flex-col`. `BacklinksPanel` should have `shrink-0` with a max-height or be scrollable itself if many backlinks exist.

---

### Feature 3: Inline Image Rendering (IMG-01, IMG-02)

**What needs to change:**

| Layer | Change | New vs Modified |
|-------|--------|-----------------|
| `server/src/routes/files.ts` | Add `GET /api/images/*` route: resolves path relative to `rootDir`, sets `Content-Type` header, streams binary with `reply.sendFile` (using existing `@fastify/static` which is already installed) | NEW route in existing file |
| `client/src/components/MarkdownPreview.tsx` | Replace placeholder `img` handler: for local `src`, resolve relative to active file's directory, prepend `/api/images/`, render real `<img>` | MODIFIED |

**Image URL resolution (client-side):**

`MarkdownPreview` currently receives `content: string` but not the file's path. It needs a `filePath: string` prop added so it can resolve relative image paths.

```typescript
// In MarkdownPreview.tsx, img component override:
img: ({ src, alt }) => {
  if (!src) return null;
  const isRemote = src.startsWith('http://') || src.startsWith('https://');
  if (isRemote) return <img src={src} alt={alt} className="max-w-full rounded-lg" />;
  // Resolve relative path against file's directory
  const dir = filePath.includes('/') ? filePath.substring(0, filePath.lastIndexOf('/')) : '';
  const resolved = src.startsWith('./') ? `${dir}/${src.slice(2)}` : (src.startsWith('/') ? src.slice(1) : `${dir}/${src}`);
  return <img src={`/api/images/${resolved}`} alt={alt} className="max-w-full rounded-lg" />;
}
```

**Server route pattern:**

```typescript
// In server/src/routes/files.ts (existing file):
fastify.get<{ Params: { '*': string } }>('/api/images/*', async (req, reply) => {
  const safe = await resolveSafePath(req.params['*'], getRoot()).catch(() => {
    reply.code(400); return null;
  });
  if (!safe) return;
  // reply.sendFile is available via @fastify/static already registered
  return reply.sendFile(path.basename(safe), path.dirname(safe));
});
```

`@fastify/static` is already in `server/package.json` as a dependency. The `reply.sendFile` approach handles binary MIME types and range requests automatically.

**Callers to update:** `EditorPane.tsx` renders `MarkdownPreview` and must pass `filePath={tab.path}`. `SplitView.tsx` also renders `MarkdownPreview` and needs the same prop.

---

### Feature 4: File Templates (TMPL-01, TMPL-02, TMPL-03)

**What needs to change:**

| Layer | Change | New vs Modified |
|-------|--------|-----------------|
| `server/src/routes/files.ts` | Add `GET /api/templates` route returning list of available templates; add `GET /api/templates/:name` route returning template content | NEW routes |
| `server/src/lib/templates.ts` | New module: `BUILTIN_TEMPLATES` record (daily-note, meeting-note, decision-record); `getTemplateContent(name)` fills date placeholder using current date | NEW file |
| `client/src/components/TemplatePickerModal.tsx` | New modal: fetches `/api/templates`, shows list, user picks, calls `onConfirm(content)` | NEW |
| `client/src/components/FileTree.tsx` | Modify "New File" button flow: after user enters filename, show `TemplatePickerModal`; pass selected template content to `POST /api/files/*` body | MODIFIED |

**Template storage decision: in-memory on server (no filesystem)**

Builtin templates are static strings in `server/src/lib/templates.ts`. Custom templates (TMPL-02) can be implemented as a special filesystem directory (e.g., `templates/` under rootDir) in a later pass. For v1.1 scope, builtins-only is sufficient for TMPL-01 and TMPL-03; TMPL-02 (save as template) can be deferred if needed.

**Built-in template content:**

```typescript
// server/src/lib/templates.ts
export const BUILTIN_TEMPLATES: Record<string, { label: string; content: string }> = {
  'daily-note': {
    label: 'Daily Note',
    content: '---\ntags: [daily]\ndate: {{DATE}}\n---\n\n# {{DATE}}\n\n## Today\n\n## Notes\n\n## Action Items\n',
  },
  'meeting-note': {
    label: 'Meeting Note',
    content: '---\ntags: [meeting]\ndate: {{DATE}}\n---\n\n# Meeting: \n**Date:** {{DATE}}\n**Attendees:** \n\n## Agenda\n\n## Notes\n\n## Decisions\n\n## Action Items\n',
  },
  'decision-record': {
    label: 'Decision Record',
    content: '---\ntags: [decision]\ndate: {{DATE}}\n---\n\n# Decision: \n**Date:** {{DATE}}\n**Status:** Proposed\n\n## Context\n\n## Decision\n\n## Rationale\n\n## Consequences\n',
  },
};
```

`{{DATE}}` is replaced server-side at request time with the current ISO date string (`new Date().toISOString().slice(0, 10)`).

**Modal flow integration in FileTree:**

The current `FolderPickerModal` handles filename input. The simplest path is to show `TemplatePickerModal` after `FolderPickerModal` confirms the path, before the POST request is sent. `FileTree.handleCreate` currently POSTs with `{ content: '' }` — change it to POST with `{ content: templateContent }`.

---

### Feature 5: Tag-Based Graph View (GRPH-01, GRPH-02, GRPH-03, GRPH-04)

**What needs to change:**

| Layer | Change | New vs Modified |
|-------|--------|-----------------|
| `client/src/components/GraphView.tsx` | New component: `react-force-graph-2d` canvas rendering nodes (files) and edges (shared tags); active file highlighted; node click calls `onOpen(path)` | NEW |
| App.tsx | Add "Graph" panel toggle button to TabBar area or TOC panel header; render `GraphView` as an overlay panel or replace TOC panel content | MODIFIED |
| `server/src/routes/search.ts` | Add `GET /api/graph` route that transforms `searchService.getTagMap()` into `{ nodes, links }` graph data | NEW route |

**Graph data model — tag-based clustering:**

GRPH-01 specifies files as nodes clustered by shared tags. The data shape for `react-force-graph-2d`:

```typescript
interface GraphData {
  nodes: Array<{ id: string; label: string; tags: string[]; val: number }>;
  links: Array<{ source: string; target: string; tag: string }>;
}
```

Build server-side from the existing `tagMap`:

```
For each pair of files sharing at least one tag:
  → add a link { source: pathA, target: pathB, tag: sharedTag }
```

Node `val` (size) = number of tags on the file (more connected = larger node).

**Graph placement (GRPH-04: dedicated panel or tab, not a modal):**

Best approach for the current layout: add a toggle button to the right panel header that switches the right panel between "TOC + Backlinks" mode and "Graph" mode. This fits inside the existing collapsible right panel without adding a fourth layout column.

```
Right panel modes (toggled by button in panel header):
  Mode A (default): FileInfo → BacklinksPanel → TableOfContents
  Mode B: GraphView (full panel height)
```

This avoids adding a new split column or modal, keeps graph persistent during a session, and satisfies GRPH-04.

**Package to add:**

`react-force-graph-2d` (latest: 1.29.x, actively maintained, canvas-based, no WebGL required for 2D). It uses `d3-force` internally and is significantly lighter than the full `react-force-graph` package which includes 3D/VR variants.

```bash
# client only
npm install react-force-graph-2d
```

`force-graph` (the underlying vanilla JS package) is ~300KB. Acceptable for a desktop-only tool; no lazy-loading needed unless graph view is rarely used (which it likely is — consider dynamic import).

**Active file highlighting (GRPH-03):**

Pass `activeFilePath` prop into `GraphView`. In the `nodeCanvasObject` callback, paint the node with a different color when `node.id === activeFilePath`.

**Data refresh:** Graph data fetched once on mount. On file change SSE events, call `refetchGraph()` (same pattern as `refetchIndex` in `useSearch`). The graph rerenders when data changes.

---

## New Files Summary

| File | Purpose |
|------|---------|
| `server/src/lib/templates.ts` | Builtin template definitions and date interpolation |
| `client/src/components/BacklinksPanel.tsx` | Backlinks list with count header, clickable entries |
| `client/src/components/TemplatePickerModal.tsx` | Modal for selecting template when creating a new file |
| `client/src/components/GraphView.tsx` | Tag-based force graph using react-force-graph-2d |

---

## Modified Files Summary

| File | What Changes |
|------|-------------|
| `shared/src/types.ts` | Add `BacklinksResponse` type |
| `types/tabs.ts` | Add `scrollPosition?: number` to `Tab` |
| `hooks/useTabs.ts` | Add `RESTORE`, `SET_SCROLL` actions; localStorage init and persistence |
| `server/src/lib/search.ts` | Add `links[]` to `SearchDoc`, link extraction in `_readDoc`, `getBacklinks()` method |
| `server/src/routes/files.ts` | Add `GET /api/images/*` and `GET/POST /api/templates/*` routes |
| `server/src/routes/search.ts` | Add `GET /api/backlinks/:path` and `GET /api/graph` routes |
| `components/MarkdownPreview.tsx` | Add `filePath` prop, fix `img` handler to proxy through `/api/images/` |
| `components/EditorPane.tsx` | Pass `filePath` to `MarkdownPreview`, wire scroll position save/restore |
| `components/SplitView.tsx` | Pass `filePath` to `MarkdownPreview` in both panes |
| `components/FileTree.tsx` | Wire `TemplatePickerModal` into "New File" flow |
| `components/WelcomeScreen.tsx` | Add `recentPaths` prop and recent files list |
| `App.tsx` | Tab persistence useEffect, pass `recentPaths` to WelcomeScreen, add `BacklinksPanel`, add graph panel toggle |

---

## Data Flow Changes

### Tab Persistence on Reload

```
App mounts
  → read 'marky-tabs' from localStorage → { paths[], activeIndex }
  → dispatch OPEN for each path (creates tabs in loading state)
  → dispatch FOCUS for activeTabId
  → existing content-fetch useEffect fires for each active tab
  → tabs populate as they always did, no new network patterns needed

State changes
  → useEffect [tabs, activeTabId] persists slim snapshot to localStorage
  → only { path, label } per tab, NOT content (content is always re-fetched)
```

### Backlinks on Tab Switch

```
activeFocusedTab.path changes in App.tsx
  → BacklinksPanel receives new activeFilePath prop
  → useEffect fires, fetches GET /api/backlinks/knowledge/page.md
  → server: searchService.getBacklinks(path) — O(n) scan of in-memory docs
  → returns { links: [{ path, label }] }
  → BacklinksPanel renders list; header shows count
```

### Image Rendering

```
MarkdownPreview receives content + filePath
  → react-markdown encounters ![alt](./images/fig.png)
  → img component: src is relative, not remote
  → resolves: dir = 'knowledge/current', resolved = 'knowledge/current/images/fig.png'
  → renders <img src="/api/images/knowledge/current/images/fig.png" />
  → browser fetches /api/images/...
  → server: resolveSafePath → reply.sendFile (binary, correct Content-Type)
```

### Template File Creation

```
User clicks "+ New" in FileTree
  → FolderPickerModal: user enters filename + folder
  → TemplatePickerModal: user selects template (or "Blank")
  → FileTree.handleCreate(filePath, templateName)
  → GET /api/templates/:name (if not blank)
  → server fills {{DATE}}, returns content string
  → POST /api/files/knowledge/new-file.md { content: templateContent }
  → file created, watcher fires 'add', index updated
  → tree refetches, new tab opens
```

### Graph View Data

```
User clicks "Graph" toggle in right panel
  → GraphView mounts, fetches GET /api/graph
  → server: builds nodes from all docs, links from shared tags in tagMap
  → returns { nodes, links }
  → react-force-graph-2d renders canvas with force simulation
  → active file node highlighted by matching node.id === activeFilePath
  → user clicks node → onOpen(path) → openTab(path)
```

---

## Build Order for v1.1

Dependencies flow from least to most cross-cutting:

```
1. Image rendering (IMG-01, IMG-02)
   Deps: none — self-contained server route + MarkdownPreview fix
   Risk: low — @fastify/static already installed, pattern is standard

2. Tab persistence (PRST-01, PRST-02, PRST-03)
   Deps: none — localStorage layer wrapping existing useTabs hook
   Risk: low — well-understood pattern; only tricky part is scroll restoration
   Note: do PRST-01/02 first, PRST-03 (scroll) last within this feature

3. File templates (TMPL-01, TMPL-02, TMPL-03)
   Deps: none — new server module + modal component, plugs into existing FileTree flow
   Risk: low — purely additive

4. Backlinks panel (BKLN-01, BKLN-02, BKLN-03)
   Deps: SearchService must be updated before route, route before UI component
   Risk: medium — requires SearchService change (re-parse all docs to extract links);
         test that updateDoc correctly re-extracts links on file change

5. Graph view (GRPH-01, GRPH-02, GRPH-03, GRPH-04)
   Deps: tagMap already exists in SearchService (no server changes needed beyond GET /api/graph)
   Risk: medium — react-force-graph-2d bundle size; panel layout integration;
         force simulation performance with large vaults
   Note: build last because it depends on understanding the right-panel layout
         after BacklinksPanel has been added
```

**Rationale for this order:**
- Image rendering and tab persistence are fully isolated — either can go first; doing them first delivers visible quality improvements quickly.
- Templates are similarly isolated and low-risk.
- Backlinks require a SearchService change that touches the core index — ship this after low-risk features are stable.
- Graph view is last because its layout placement (right panel toggle) depends on knowing the final shape of the BacklinksPanel-extended right panel.

---

## Architectural Patterns for v1.1

### Pattern: Slim localStorage Persistence

Persist only the minimal snapshot needed to restore state — paths and active index, not content. Content is cheap to re-fetch from a local server (no network latency). Persisting content would inflate localStorage and create a stale-content problem.

**When to use:** Any state that survives page reload but has a cheap server-side source of truth.

### Pattern: Server-Owns-Index, Client-Fetches-Derived-Data

The existing pattern (client fetches `/api/search/index` and runs MiniSearch client-side) is extended for backlinks and graph — but backlinks and graph are computed server-side and returned as simple JSON, not raw index data. The client does not need to re-implement backlink traversal logic.

**Rationale:** Backlink traversal is O(n) over all docs — fine server-side (single process, in-memory), wasteful to ship the full index to the client just for this.

### Pattern: Prop-Threaded filePath for Preview Context

`MarkdownPreview` needs `filePath` for image resolution. Rather than reaching up to a context, thread it as a prop. `MarkdownPreview` is always rendered by `EditorPane` or `SplitView` which already have `tab.path` available.

**When to use:** Context is only justified when the same data is needed by many deeply-nested components. For a single component (MarkdownPreview), prop-threading is cleaner.

### Pattern: Panel Mode Toggle (not modal)

Graph view lives inside the existing right panel (toggle between TOC mode and Graph mode) rather than in a full-screen modal or a new layout column. This keeps the 3-column layout stable and avoids a fourth split.

**When to use:** When a secondary view is useful but not constantly needed — toggle visibility within existing real estate rather than expanding the layout.

---

## Anti-Patterns to Avoid

### Anti-Pattern: Persisting Tab Content in localStorage

**What people do:** Serialize the full `tabs` array including `content` to localStorage.
**Why it's wrong:** Content can be megabytes; localStorage has a ~5MB limit; content goes stale when files change externally.
**Do this instead:** Persist only `{ path, label }` per tab. Re-fetch content on restore (same as normal open).

### Anti-Pattern: Client-Side Backlink Computation

**What people do:** Ship the full search index to the client and compute backlinks in the browser.
**Why it's wrong:** The full index JSON is already sent to the client for search — but backlink computation iterates ALL docs checking their `links` array. This is simpler to do server-side where the index lives.
**Do this instead:** Add a dedicated `/api/backlinks/:path` endpoint. Client fetches backlinks for the current file only.

### Anti-Pattern: Full Index Rebuild When Adding link Extraction

**What people do:** When changing `SearchDoc` to add `links[]`, trigger a `buildFromDir` rebuild.
**Why it's wrong:** `buildFromDir` is called on startup already. The existing `updateDoc` method handles incremental updates. The migration path is: update `_readDoc` to extract links, then restart the server (which calls `buildFromDir`). No special migration needed.
**Do this instead:** Modify `_readDoc`, restart once to rebuild. The watcher keeps links current thereafter via incremental `updateDoc` calls.

### Anti-Pattern: Re-fetching /api/graph on Every Keypress

**What people do:** Tie graph data refetch to the same `refetchIndex` call used for tags.
**Why it's wrong:** Graph computation iterates all doc pairs — it's more expensive than tag list. Tag updates happen frequently (user adds/removes tags).
**Do this instead:** Refetch graph data on `add`/`unlink` SSE events (structural changes) and on a button-press "refresh" affordance. For tag changes, the existing `refetchIndex` path is sufficient; graph can be stale between structural updates.

---

## Integration Points Summary

| Boundary | Communication | Notes |
|----------|---------------|-------|
| `useTabs` ↔ `localStorage` | Read on init, write on state change | Slim snapshot only: `[{path, label}]` + `activeIndex` |
| `BacklinksPanel` ↔ server | `GET /api/backlinks/:path` on `activeFilePath` change | New endpoint, server-side backlink traversal |
| `MarkdownPreview` ↔ server | `GET /api/images/*` for local image src | New route; `@fastify/static` already available |
| `FileTree` ↔ `TemplatePickerModal` | Modal callback returns template content before POST | UI-only boundary; server provides template content |
| `GraphView` ↔ server | `GET /api/graph` on mount + structural SSE events | New endpoint; tag data already in `searchService` |
| `SearchService` ↔ `links[]` | Internal: extracted during `_readDoc`, queried by `getBacklinks()` | No new external protocol; server-side only |
| Right panel ↔ `App.tsx` | `panelMode` state toggle in App.tsx; conditional render | No new component boundary; mode toggle only |

---

## Sources

- Direct codebase analysis (all source files read 2026-03-10): HIGH confidence
- `react-force-graph-2d` GitHub (vasturiano/react-force-graph): version 1.29.x, actively maintained — HIGH confidence
- `@fastify/static` already in `server/package.json`: verified — HIGH confidence
- `localStorage` tab persistence pattern (multiple React community sources): MEDIUM confidence — standard approach, no library needed
- Scroll position save/restore via `ref.scrollTop`: MEDIUM confidence — standard DOM pattern, React-specific timing considerations apply
- Server-side backlink extraction with regex: HIGH confidence — `remark-wiki-link` (already in client) confirms `[[wiki-link]]` syntax; regex approach sufficient for index without full AST parse

---
*Architecture research for: Marky v1.1 Polish and Navigation*
*Researched: 2026-03-10*
