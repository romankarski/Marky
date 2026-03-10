# Pitfalls Research

**Domain:** Adding tab persistence, backlinks, image rendering, file templates, and graph view to an existing React + Fastify markdown workspace app
**Project:** Marky v1.1
**Researched:** 2026-03-10
**Confidence:** HIGH for integration-specific pitfalls (derived from direct codebase analysis + verified patterns); MEDIUM for library-specific pitfalls (WebSearch + official docs)

---

## Critical Pitfalls

### Pitfall 1: localStorage Tab Persistence Overwrites Stale Content on Reload

**What goes wrong:**
Tab paths are persisted to localStorage and restored on reload. But the `Tab` type stores `content: string | null` — when tabs are rehydrated from storage, content is `null` and must be re-fetched. If the restore logic dispatches `OPEN` actions for all saved paths _before_ the file tree is ready, the content fetch fires against a server that hasn't finished indexing. Content arrives stale or partially, and `SET_CONTENT` may be dispatched for a path that no longer matches the open tab (if the user quickly opens another file before the fetch completes).

**Why it happens:**
The `useTabs` reducer stores tabs in ephemeral React state. Adding localStorage means serializing this state on every change and rehydrating on mount — but the reducer was not designed with rehydration in mind. Developers serialize the full Tab object (including transient fields like `loading`, `dirty`, `editMode`) and restore it verbatim, causing stale flags.

**How to avoid:**
- Persist only the minimal shape: `{ paths: string[], activeTabId: string | null }` — never persist `content`, `loading`, `dirty`, `editMode`, or `deleted`.
- On restore, dispatch `OPEN` actions (not a direct state override) so the reducer initializes each tab correctly (`loading: true`, `content: null`).
- Add a `RESTORE_TABS` action to the reducer that accepts `paths[]` and sets initial loading state cleanly.
- Guard the restore with a version key (`marky-tabs-v1`) so schema changes don't cause a crash from malformed stored data. On version mismatch, clear and ignore stored tabs.
- Deleted files: restored tab paths must be validated against the current file tree before opening. A path that no longer exists on disk should be silently dropped, not rendered as an error tab.

**Warning signs:**
- `dirty: true` tabs restored from storage that re-prompt the user to save after reload.
- `Tab.content` serialized into the localStorage value (huge storage payload; stale content shown before fetch completes).
- No version key in the localStorage key name.
- No guard against files that were deleted between sessions.

**Phase to address:** Tab Persistence phase (PRST-01 / PRST-02). Must get the serialize/deserialize contract right from the start — retrofitting causes subtle re-render and dirty-state bugs.

---

### Pitfall 2: Backlink Index Out of Sync with Search Index

**What goes wrong:**
The existing `SearchService` in `server/src/lib/search.ts` already parses each file and stores content. Backlinks require a second pass: scan each file's content for `[[wikilinks]]` and `[text](path.md)` links, build an inverted index mapping `target → [source, source, ...]`. If the backlink index is built separately from the search index, both indexes get updated independently on file changes — but they can diverge. A file that was updated in the search index may not have had its link targets re-extracted, so backlinks are stale.

**Why it happens:**
Backlinks feel like a "display feature" and are often bolted onto a separate data structure with its own update path. Developers add a `BacklinkService` that is triggered by the same watcher events, but the two services have separate state, separate initialization order, and separate error handling.

**How to avoid:**
- Extract backlinks during the same `_readDoc` call in `SearchService`, or extend `SearchDoc` to include a `links: string[]` field.
- Build the backlink inverted index as a derived view over `SearchService.docs` — not a separate data structure with its own write path.
- The `/api/backlinks/:path` endpoint should query the same service that `updateDoc` / `removeDoc` keeps current.
- For the initial implementation, a synchronous scan of `SearchService.docs.values()` on each backlink request is acceptable for a single-user vault of ~500 files (< 5ms). Avoid premature optimization with a separate index.

**Warning signs:**
- A `BacklinkService` or `backlinkIndex` Map that is updated in a separate watcher callback from `SearchService.updateDoc`.
- Backlink API endpoint reads files directly from disk instead of querying the in-memory index.
- Backlinks show stale results after a file rename or delete.

**Phase to address:** Backlink Indexing phase (BKLN-01 / BKLN-02 / BKLN-03). Architecture decision — must be made before writing the first line of backlink code.

---

### Pitfall 3: Wikilink and Markdown Link Parsing Mismatches Between Client and Server

**What goes wrong:**
The client uses `remark-wiki-link` to parse `[[wikilinks]]` for rendering and navigation. The server must also parse the same link syntax to build the backlink index. If the two parsing implementations differ — different regex, different path resolution rules, different handling of `[[Page Name]]` vs `[[page-name]]` vs `[[notes/page-name]]` — the backlink index will miss links that the client renders, and vice versa.

**Why it happens:**
The client uses a remark plugin (AST-based) and the server uses a different approach (regex scan or a different parser) because pulling all of remark into the server feels like overkill. The two diverge subtly.

**How to avoid:**
- Share a single link-extraction utility in the `shared/` directory that both client and server import.
- The utility should handle: `[[WikiLink]]`, `[[WikiLink|alias]]`, `[text](relative.md)`, `[text](./relative.md)`, and ignore `[text](https://...)` external links.
- Path normalization: always resolve relative links against the source file's directory before storing in the backlink index. `knowledge/meetings/../decisions.md` must normalize to `knowledge/decisions.md`.
- Case sensitivity: macOS filesystem is case-insensitive but the backlink index uses string keys. Normalize all paths to lowercase before indexing.

**Warning signs:**
- Link extraction logic exists in two places (client component and server route) with no shared code.
- `[[Wiki Link With Spaces]]` not found as a backlink because the index uses `wiki-link-with-spaces` (slugified) but the client renders `Wiki Link With Spaces` (display form).
- Backlinks count in the panel header doesn't match what a text search for the filename finds.

**Phase to address:** Backlink Indexing phase. Define the shared link parser before writing either the server index or the client panel.

---

### Pitfall 4: Image Path Resolution Breaking the Path Security Layer

**What goes wrong:**
Images in markdown use relative paths: `![alt](./images/diagram.png)`. The client needs to request this image from the server at a URL like `/api/images/knowledge/architecture/images/diagram.png`. The path must be resolved relative to the **source markdown file's directory**, not the app root. If path resolution is wrong, the image route receives a path like `images/diagram.png` (missing the parent directory), hits the `resolveSafePath` guard, and returns a 404. Or worse: a path like `../../private.png` bypasses incomplete security checks.

**Why it happens:**
The existing `resolveSafePath` in `server/src/lib/pathSecurity.ts` already handles path traversal correctly. But image paths arrive at the server as **already-relative** paths — they've been stripped of their context (the source file's directory) by the time the client constructs the image URL. The client component renders `<img src="/api/images/images/diagram.png">` but the actual file is at `knowledge/architecture/images/diagram.png`.

**How to avoid:**
- Pass the source file path as a query parameter to the image endpoint: `/api/images?path=images/diagram.png&from=knowledge/architecture/page.md`
- Server resolves: `dirname(from) + '/' + path` = `knowledge/architecture/images/diagram.png`, then passes through `resolveSafePath`.
- Alternative: in the `MarkdownPreview` component's `img` handler (which already exists as a placeholder stub at line 74–82), pass `activeFilePath` as a prop and construct the full path before building the `src` URL.
- The existing `resolveSafePath` already handles `../` traversal — extend it, don't replace it.

**Warning signs:**
- Image endpoint accepts a `path` parameter without a `from` context parameter.
- Images in subdirectories (`knowledge/subfolder/images/x.png`) 404 while images at root level work.
- Path traversal test: `![x](../../server/src/lib/pathSecurity.ts)` renders as text — verify it returns 403, not 200.

**Phase to address:** Image Rendering phase (IMG-01 / IMG-02). The `MarkdownPreview` component already has the stub and the comment "Defer proxy to Phase 4" — this is the planned location. Use it.

---

### Pitfall 5: D3 Force Simulation Not Cleaned Up on Component Unmount

**What goes wrong:**
A D3 force simulation runs continuously after being started (`simulation.on('tick', ...)`) and maintains internal RAF/timer loops. If the graph component is unmounted (user switches from graph view to a file) without calling `simulation.stop()`, the simulation continues running in the background, firing tick callbacks that call `setState` or `dispatch` on an unmounted component. React logs warnings; on slower machines this burns CPU.

**Why it happens:**
D3 force simulations are imperative and stateful — they live outside React's lifecycle. Developers initialize the simulation in a `useEffect` but forget the cleanup return. With `react-force-graph` (the most common library for this use case), the component wraps a canvas element and manages the simulation internally, but the ref must be explicitly nulled or the simulation stopped via the instance API.

**How to avoid:**
- If using raw D3: always return a cleanup function from `useEffect` that calls `simulation.stop()`.
- If using `react-force-graph`: call `graphRef.current?.d3Force('simulation')?.stop()` in the cleanup, or simply unmount the component cleanly and let the library handle it (verify the library does this in its current version).
- Prefer `react-force-graph` over raw D3 for this use case — the graph view is not a core differentiator, so use the abstraction.
- Set `cooldownTicks={100}` to stop the simulation after 100 ticks instead of running indefinitely.

**Warning signs:**
- `useEffect` initializes a D3 simulation but returns nothing (no cleanup).
- React warning: "Can't perform a React state update on an unmounted component."
- CPU usage stays elevated after navigating away from the graph view.
- Browser profiler shows `tick` callbacks firing with no visible graph.

**Phase to address:** Graph View phase (GRPH-01 through GRPH-04). Must include cleanup in the first working implementation.

---

### Pitfall 6: Graph Re-Renders Every Tick, Destroying React State

**What goes wrong:**
The graph data (nodes and edges derived from the file index and tag map) is recomputed inside a `useMemo` or directly in the render function. D3's force simulation mutates node objects in-place during ticks (adding `.x`, `.y`, `.vx`, `.vy` properties). If the graph data reference is recreated on every re-render (e.g., `useMemo` with a dependency that changes too frequently), D3 loses its position state and the graph restarts its layout from scratch — nodes snap back to the center on every file open or tag filter change.

**Why it happens:**
Developers define graph data as `{ nodes: [...], links: [...] }` inline in the render function or as a memo that depends on `indexPayload` — which changes on every file watcher event. The simulation treats new node objects as new nodes, restarting the layout.

**How to avoid:**
- Separate "graph topology data" (which changes rarely: file/tag structure) from "simulation state" (node positions, which D3 owns).
- Memoize the graph data with a stable deep-equality check or a content hash of the tag map, not reference equality.
- Use `react-force-graph`'s `nodeId` prop to key nodes by file path — D3 will merge existing positions with new data on re-render.
- Alternatively, update graph data imperatively via the `graphRef` instance instead of through React props (avoids full simulation restart on data changes).

**Warning signs:**
- Graph "collapses" to center when a new file is opened or a tag filter changes.
- Console shows D3 re-initializing the simulation on every tab switch.
- Graph data is constructed with `{ nodes: files.map(...), links: tags.map(...) }` at render time.

**Phase to address:** Graph View phase. Architecture decision before writing the graph component.

---

## Moderate Pitfalls

### Pitfall 7: Tab Persistence Restoring Scroll Position Before DOM Renders

**What goes wrong:**
PRST-03 requires restoring the last scroll position of the preview pane when a tab is reloaded. The naive approach reads `scrollTop` from localStorage and calls `scrollRef.current.scrollTop = savedPosition` inside a `useEffect`. But on the restore path, content arrives asynchronously (it must be fetched from the API), so the DOM renders at zero height first, then fills in — and by the time the scroll is applied, the container is still empty. The scroll is set, the content arrives, and the container re-renders to a different height, discarding the scroll position.

**How to avoid:**
- Only apply the saved scroll position after content is confirmed loaded (`tab.content !== null && !tab.loading`).
- Use a `useLayoutEffect` (not `useEffect`) to set scroll after paint, so the DOM has the correct height.
- Store scroll position in a `Map<path, number>` ref (not in the reducer — scroll position is view-level state, not model state).
- On tab switch (not reload), save the current `scrollTop` to the map before unmounting; restore it on mount.
- For the reload case, save scroll positions to `localStorage` keyed by file path and restore them after the content fetch settles.

**Warning signs:**
- Preview always scrolls to top when switching between tabs.
- Saved scroll position is applied before `tab.loading` becomes `false`.
- Scroll position stored in the Tab reducer state (model) instead of a ref (view).

**Phase to address:** Tab Persistence phase (PRST-03).

---

### Pitfall 8: File Template System Creating Files Without Frontmatter Normalization

**What goes wrong:**
A daily-note template might hardcode `date: 2024-01-01` as a placeholder. When the user creates a file from the template, the app inserts the literal template string without replacing the date token. The resulting file has a wrong date in its frontmatter, breaking tag filters and sort-by-date views.

**Why it happens:**
Templates are stored as static markdown strings. The template picker calls `createFile(template.content)` without any interpolation step. The developer forgot to define which tokens are dynamic and how they are resolved at creation time.

**How to avoid:**
- Define a minimal, explicit token set: `{{date}}` → today's ISO date, `{{title}}` → the user-provided filename (without `.md`), `{{datetime}}` → full ISO datetime.
- Interpolate tokens at file creation time, before writing to disk. Do not rely on the user to edit the tokens manually.
- Built-in templates should be coded as functions returning a string, not as raw strings with tokens that depend on caller-side interpolation.
- For custom templates (TMPL-02), strip out the dynamic content of the source file and keep only the structure (headings, frontmatter shape) — avoid saving captured dates/titles from the source file.

**Warning signs:**
- `{{date}}` appears literally in a created file.
- Template stored as a static `.md` file in the repo without any interpolation at creation time.
- Custom template saves the full content of the source file including its specific dates and data.

**Phase to address:** File Templates phase (TMPL-01 / TMPL-02 / TMPL-03).

---

### Pitfall 9: Backlink Panel Showing Stale Results When the Right Panel Already Has TOC

**What goes wrong:**
The right panel (`tocWidth`, `tocCollapsed`) currently holds `FileInfo` (tags) and `TableOfContents`. Adding a backlinks panel to the same right panel means either stacking it vertically (making each section too small) or replacing the TOC (removing a feature users already have). A common mistake is adding backlinks as yet another vertically-stacked section without adjusting the layout budget, resulting in all three sections being too small to be useful.

**Why it happens:**
The right panel was designed to hold one or two collapsible sections. Adding a third section without rethinking the panel layout causes each section to fight for space. The developer adds backlinks at the bottom of the column and the user must scroll inside a 220px-wide panel to see any of the three sections properly.

**How to avoid:**
- Treat the right panel as a tabbed panel or a collapsible accordion: TOC, FileInfo/Tags, and Backlinks each get a tab or header, and only one is expanded at a time by default.
- Alternatively, give each section a `flex-shrink-0` minimum height and make the panel scrollable vertically.
- Backlinks panel must have a count indicator in the header (BKLN-03) so users know whether it's worth expanding.
- Consider: if no backlinks exist for the current file, collapse the backlinks section automatically.

**Warning signs:**
- Three sections in the right panel each with fixed heights that add up to more than the panel's available height.
- No tab or accordion toggle — all three sections always visible.
- Backlinks section has no count indicator, so users don't know if it is empty.

**Phase to address:** Backlink Panel phase (BKLN-01 / BKLN-03) — coordinate with existing right panel layout.

---

### Pitfall 10: Graph View as a Modal Instead of a Persistent Panel

**What goes wrong:**
GRPH-04 explicitly requires "graph lives in a dedicated panel or tab (not a modal)." A common implementation shortcut is wrapping the graph in a modal dialog triggered by a toolbar button. This makes the graph feel like a one-off inspection tool rather than a navigation surface, and prevents the user from keeping the graph open while reading files.

**Why it happens:**
Modals are fast to implement — no layout changes needed. The developer ships a modal to get the feature working, intending to "move it to a panel later," but the "later" never comes.

**How to avoid:**
- Implement the graph as a primary view mode from the start: a tab in the main content area (`tabs.length === 0` shows WelcomeScreen; add a `graphView: boolean` state that shows the graph instead of the welcome screen).
- The simplest correct approach: add a "Graph" button to the sidebar header that sets `graphView: true` and replaces the main content area with the graph component.
- The graph panel must respond to `openTab(path)` — clicking a node should open the file in a tab and exit graph view (or keep graph open in split mode).

**Warning signs:**
- Graph component is inside a `dialog` or `Modal` component.
- No layout path to keep the graph visible while a file is open.
- Graph view state is `showGraphModal: boolean` instead of a view mode in the main layout.

**Phase to address:** Graph View phase (GRPH-01 / GRPH-04). Layout decision must be made before building the graph component.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Persist full `Tab` object (including `content`) to localStorage | No need to re-fetch on restore | 100KB+ storage payload; stale content shown before fetch completes; dirty-state bugs | Never — only persist paths and active tab ID |
| Build backlink index as a separate service from SearchService | Feels cleaner to separate concerns | Two update paths diverge; backlinks go stale after file changes | Never — extend SearchService instead |
| Use `any` type for localStorage parsed data | Fast to write | Crashes if stored schema diverges from current type; no TS protection | Only in throw-away prototype; never in production |
| Implement graph as a modal | Ships faster | Violates GRPH-04; hard to convert to persistent panel later | Never — GRPH-04 is an explicit requirement |
| Serve images by reading file with `fs.readFile` per request, no caching | Simple to implement | Slow for large images; re-reads on every render cycle | Acceptable for v1.1 (single user, local filesystem) |
| Hard-code template content as static strings in source code | No filesystem reads for templates | Custom templates (TMPL-02) need a different storage model anyway | Acceptable for built-in templates; custom templates need user-space storage |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| `useTabs` reducer + localStorage | Calling `JSON.parse(localStorage.getItem(...))` directly in initial state initializer without version check | Wrap in a `try/catch` with version validation; return `initialState` on any parse failure |
| `MarkdownPreview` `img` component + Fastify image route | Building image URL from `src` alone, losing the source file's directory context | Pass `activeFilePath` as prop to `MarkdownPreview`; construct `/api/images?path=X&from=Y` in the `img` handler |
| D3 / `react-force-graph` + React `useEffect` | Initializing simulation without a cleanup return | Always return `() => simulation.stop()` or equivalent cleanup; or use `react-force-graph` which handles this internally |
| `remark-wiki-link` (client) + server backlink parser | Two different link-extraction implementations that diverge | Extract link parsing to `shared/` as a single function used by both |
| localStorage tab paths + deleted files | Trying to open a path that no longer exists, resulting in an API 404 that shows an error tab | Validate restored paths against the file tree before dispatching `OPEN`; silently drop missing paths |
| Template insertion + frontmatter `date` token | Template string with `{{date}}` inserted without interpolation | Interpolate all tokens at `createFile` time, not at template definition time |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| D3 force simulation running continuously in background | High CPU after leaving graph view; React "update on unmounted component" warning | Return `simulation.stop()` in `useEffect` cleanup; set `cooldownTicks` | Immediately on first unmount without cleanup |
| Graph data regenerated on every render (reference instability) | Graph layout restarts from center on each tab switch | Memoize graph data with stable key (content hash of tagMap) | Immediately — visible on every tab open |
| Full-text backlink scan (`String.includes` over all docs) per panel render | Backlink panel re-queries on every render, including typing in editor | Compute backlinks server-side on file open/change; cache result in component state | ~100 files — noticeable lag; ~500 files — visible freeze |
| localStorage write on every React state change | Laggy UI when tabs are dragged (reorder fires on every mouse move) | Debounce localStorage writes (50ms); write only on `OPEN`, `CLOSE`, `FOCUS`, `REORDER` settle | Noticeable during fast drag-reorder of many tabs |
| Serving images without HTTP caching headers | Same image re-fetched on every preview render (e.g., diagram in scrollable document) | Set `Cache-Control: max-age=300` or use ETags on the image endpoint | Any document with multiple images; immediately visible on scroll |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Image endpoint that accepts arbitrary `path` without running through `resolveSafePath` | Path traversal: attacker (or a malicious markdown file) can request any file on the host filesystem | Always pass image paths through the existing `resolveSafePath` in `pathSecurity.ts` — do not add a separate image handler that bypasses it |
| Storing user data (file content, API keys) in localStorage | Content exposed to any JS running on the page; persists indefinitely | Never store file content in localStorage — only store paths. Never store API keys client-side |
| Template files stored in user-accessible directory with executable interpolation | Template `{{` tokens could be abused if templates accept arbitrary user-provided token values | Token set is fixed and closed: only `{{date}}`, `{{title}}`, `{{datetime}}` — no dynamic code evaluation, no `eval`, no template literal injection |
| Backlink endpoint returning file paths outside the root | Information disclosure: reveals filesystem structure | Filter backlink results through `resolveSafePath` before returning; or only return relative paths that are already within ROOT_DIR |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Welcome screen shows "Select a file" when there are recent files to show | User must re-find files after every reload; PRST-02 is not fulfilled | Replace "Select a file" hint with a recent-files list (last 10 opened paths) on welcome screen |
| Backlinks panel always visible even when empty | Wastes right-panel space; user ignores it | Show backlink count in header; collapse automatically when count is zero |
| Template picker shown as a full modal with a long list | Interrupts flow; slow to navigate | Show as a small popover or inline dropdown near the "new file" button with 3-4 built-in + custom templates |
| Graph nodes sized uniformly regardless of how many backlinks they have | No visual hierarchy; central hub files look the same as isolated notes | Scale node size by backlink count (or tag count); this is the primary value of the graph view |
| Graph resets zoom and pan on every file open | Disorienting; user loses spatial orientation in the graph | Persist zoom/pan state in a ref; do not reset on re-render unless the graph data structure changes |

---

## "Looks Done But Isn't" Checklist

- [ ] **Tab Persistence (PRST-01):** Opens tabs but does not restore the _active_ tab — verify the focused tab is also persisted and restored, not just the list.
- [ ] **Tab Persistence (PRST-02):** Recent files list on welcome screen — verify it updates in real time as files are opened, not only on page load.
- [ ] **Tab Persistence (PRST-03):** Scroll position restored — verify it works for long documents (> 2 screens), not just short ones where the scroll is always 0.
- [ ] **Backlinks (BKLN-01):** Panel renders — verify backlinks are live-updated when another file that links to the current file is saved externally (chokidar triggers re-index → panel re-queries).
- [ ] **Backlinks (BKLN-02):** Clicking a backlink opens the file — verify it opens in a tab (not a new browser tab) and focuses the correct pane in split mode.
- [ ] **Images (IMG-01):** Relative images render — verify images in nested subdirectories (e.g., `knowledge/arch/diagrams/img.png` referenced from `knowledge/arch/page.md`) render correctly, not just images at root level.
- [ ] **Images (IMG-02):** Absolute path images — verify these render AND that the path security layer rejects paths outside ROOT_DIR.
- [ ] **Templates (TMPL-01):** Date token interpolated — verify `{{date}}` in a daily note template becomes today's date, not the literal string `{{date}}`.
- [ ] **Templates (TMPL-02):** Custom template saved — verify the saved template does not include the source file's dynamic content (specific dates, names).
- [ ] **Templates (TMPL-03):** Template picker shown on new file — verify the picker is also accessible when creating a file from the file tree context menu, not only from a dedicated button.
- [ ] **Graph (GRPH-01):** Graph shows files clustered by tags — verify files with _no_ tags appear in the graph (as isolated nodes), not silently excluded.
- [ ] **Graph (GRPH-02):** Clicking a node opens the file — verify it works in both single-pane and split-pane modes.
- [ ] **Graph (GRPH-03):** Active file highlighted — verify the highlight updates when the user switches tabs, not only when the graph is first opened.
- [ ] **Graph (GRPH-04):** Graph in dedicated panel — verify it is NOT a modal and the user can keep it open alongside a file.

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| localStorage schema breaking change | LOW | Add version key; detect old version on load; clear storage and restart with empty tabs (user re-opens files manually) |
| Backlink index diverges from search index | MEDIUM | Add a `/api/reindex` endpoint that rebuilds both indexes from scratch; expose a manual "Rebuild index" button in settings |
| D3 simulation memory leak discovered in production | LOW | Add `useEffect` cleanup to stop simulation on unmount; fix is a one-liner |
| Graph data reference instability causing layout restart | LOW | Wrap graph data derivation in `useMemo` with a content-hash dependency — isolated change |
| Image path resolution wrong (images 404) | LOW | Image endpoint is stateless and path-only — fix path construction in `img` handler, no data migration needed |
| Template `{{date}}` not interpolated | LOW | Add interpolation step in `createFile` handler — isolated function with no side effects |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Tab persistence: stale Tab object serialized | Tab Persistence (PRST-01) | Inspect localStorage value — must contain only `{ paths, activeTabId }`, not `content` or `dirty` |
| Tab persistence: no schema version key | Tab Persistence (PRST-01) | Change Tab type, confirm old localStorage is discarded without crash |
| Tab persistence: deleted file paths restored | Tab Persistence (PRST-01 / PRST-02) | Delete a file, reload app, confirm no error tab appears |
| Scroll position restored before content loads | Tab Persistence (PRST-03) | Open a long file, scroll to bottom, reload — confirm position is restored after content arrives |
| Backlink index diverges from search index | Backlink Indexing (BKLN-01) | Edit a file that links to another, confirm backlinks update within one watcher cycle |
| Wikilink parsing mismatch client/server | Backlink Indexing (BKLN-01) | `[[Page Name]]` with spaces must appear in backlinks panel |
| Image path resolution missing source file context | Image Rendering (IMG-01) | Image in `knowledge/subfolder/img.png` referenced from `knowledge/subfolder/page.md` must render |
| Image endpoint bypasses path security | Image Rendering (IMG-01 / IMG-02) | `![x](../../server/src/app.ts)` in a markdown file must return 403, not 200 |
| Template date token not interpolated | File Templates (TMPL-01) | Create daily note — `date` in frontmatter must be today's date |
| D3 simulation not stopped on unmount | Graph View (GRPH-01) | Open graph, switch to a file, check CPU usage and React warnings |
| Graph data reference instability | Graph View (GRPH-01) | Open graph, open a new tab — graph must not restart layout |
| Graph as modal instead of panel | Graph View (GRPH-04) | Implementation gate — reject any modal-based implementation before it ships |
| Right panel overcrowded | Backlink Panel (BKLN-01 / BKLN-03) | All three right panel sections (FileInfo, TOC, Backlinks) must each have adequate height at default window size |

---

## Sources

- Direct codebase analysis: `client/src/hooks/useTabs.ts`, `client/src/App.tsx`, `client/src/components/MarkdownPreview.tsx`, `server/src/lib/search.ts`, `server/src/lib/pathSecurity.ts` (HIGH confidence — primary source)
- remark-wiki-link: https://github.com/landakram/remark-wiki-link (MEDIUM confidence — used in existing MarkdownPreview.tsx)
- react-force-graph: https://github.com/vasturiano/react-force-graph (MEDIUM confidence — recommended library for graph view)
- D3 + React integration patterns: https://medium.com/@tibotiber/react-d3-js-balancing-performance-developer-experience-4da35f912484 (MEDIUM confidence — verified pattern)
- D3 simulation memory leak issue: https://github.com/d3/d3-selection/issues/186 (MEDIUM confidence — known issue, confirmed in multiple sources)
- localStorage state persistence: https://www.joshwcomeau.com/react/persisting-react-state-in-localstorage/ (MEDIUM confidence — well-known reference)
- Zustand localStorage migration versioning: https://dev.to/diballesteros/how-to-migrate-zustand-local-storage-store-to-a-new-version-njp (MEDIUM confidence — pattern applies to any localStorage schema)
- Scroll restoration timing pitfall: https://rehanpinjari.medium.com/how-to-handle-scroll-position-like-a-pro-in-react-efa86dfc68a9 (MEDIUM confidence)
- Obsidian backlink implementation patterns: https://forum.obsidian.md/t/high-performance-wikilink-to-markdown-conversion/59296 (LOW confidence — community discussion, not official)
- Project requirements: `.planning/PROJECT.md` (HIGH confidence — source of truth for requirement IDs)

---
*Pitfalls research for: Marky v1.1 — adding tab persistence, backlinks, image rendering, file templates, graph view to existing React + Fastify markdown workspace*
*Researched: 2026-03-10*
