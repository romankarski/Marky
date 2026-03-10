# Feature Research

**Domain:** Web markdown workspace — v1.1 Polish and Navigation features
**Researched:** 2026-03-10
**Confidence:** HIGH (codebase inspected directly; patterns verified against Obsidian/PKM ecosystem via live web research)

---

## Context: Existing Foundation

The following are already built and must not be reimplemented:

- Multi-tab system (`useTabs` reducer in `client/src/hooks/useTabs.ts`)
- File tree, split view, sidebar/TOC collapsible panels with localStorage persistence
- Markdown preview via `react-markdown` with `remark-gfm`, `remark-wiki-link`, `rehype-slug`
- Image stub: local images currently render as `[alt text]` placeholder — comment in `MarkdownPreview.tsx` explicitly defers this to a later phase
- Full-text search index via MiniSearch; `tagMap: Record<string, string[]>` already returned by `/api/search/index`
- Tag editor in right panel (`FileInfo.tsx`)
- `WelcomeScreen.tsx` exists but shows only a static "select a file" message

The five v1.1 features build on this foundation without replacing any of it.

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features that a "permanent workspace" must have. Missing these makes the app feel like a prototype.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Tab persistence across reloads** (PRST-01) | Every multi-tab editor (VS Code, browser) restores tabs on reload. Users treat reloads as routine; losing tabs feels like a crash. | LOW | `localStorage` key stores `[{path, editMode}]` and `activeTabId`. `useTabs` initializer reads on mount; an effect writes on every state change. Content is NOT persisted — always re-fetched. The `dirty` state is not persisted (auto-save already handles it). |
| **Recent files on welcome screen** (PRST-02) | Any file manager or IDE shows recently opened files. The welcome screen currently shows nothing actionable. | LOW | Maintain a `marky-recents` array in localStorage (max 10, deduplicated, newest first). Update on every tab open. `WelcomeScreen` receives list as prop and renders clickable file names. |
| **Inline image rendering** (IMG-01, IMG-02) | Users write `![alt](./assets/screenshot.png)` and expect to see the image. Broken image placeholders are jarring in a "beautiful rendering" product. | LOW-MEDIUM | The browser blocks `file://` access from localhost. Add a `/api/images/*` route on the server that reads files and returns them with correct MIME type. In `MarkdownPreview.tsx`, replace the existing stub `img` component: rewrite `src` to `/api/images/<resolved-path>`. For relative paths, resolve against the current file's directory (passed as a new `filePath` prop). Absolute paths: strip the leading `/` and treat as root-relative. |
| **Scroll position restore** (PRST-03) | Users open long documents, reload, and expect to be back where they were. This is the single most-requested Obsidian feature — a forum thread has had 90+ replies since June 2020 with no built-in resolution. | LOW-MEDIUM | Store `marky-scroll-<encodedPath>` in localStorage. In the preview container, record `scrollTop` on unmount/blur. On mount, restore after content renders (useEffect after content is set, not during loading state). |

### Differentiators (Competitive Advantage)

Features that make Marky feel more capable than a plain markdown viewer.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Backlinks panel** (BKLN-01, BKLN-02, BKLN-03) | Surfaces the knowledge graph without requiring a full graph view. Obsidian and Logseq both treat backlinks as a first-class feature. Shows which files reference the current doc. | MEDIUM | Requires a link index. Extend `SearchService._readDoc` to extract outgoing links (markdown `[text](path.md)` and wiki-links `[[name]]`). Add `getBacklinks(targetPath)` method. Add `GET /api/backlinks/*` route. In the right panel, add a collapsible `BacklinksPanel` below `FileInfo` and above `TableOfContents`. Header shows count. Clicking a backlink calls `openTab`. |
| **Tag-based graph view** (GRPH-01, GRPH-02, GRPH-03, GRPH-04) | Makes the tag system visual. Shows knowledge structure and clusters. Strong differentiator for a PKM workspace — turns tags from metadata into navigation. | HIGH | The `tagMap` from `indexPayload` is already available client-side — no new server endpoint needed. Use D3.js `d3-force` for layout. Nodes = files, edges = shared tags. Tag nodes can serve as cluster hubs. Clicking a node calls `openTab`. Active file gets a highlighted ring. Graph lives in a dedicated panel (requirement GRPH-04 — not a modal). |
| **File templates** (TMPL-01, TMPL-02, TMPL-03) | Speeds up note creation for structured knowledge work. Daily notes, meeting notes, decision records cover 80% of structured note needs. | MEDIUM | Built-in templates are TypeScript objects (embedded markdown strings) in the client. When user triggers "New file" in the file tree, show a template picker modal instead of immediately prompting for filename. Filename pre-fills based on template type (e.g., `YYYY-MM-DD.md` for daily note). Custom templates: a "Save as template" action copies file content to `templates/` folder in workspace root via existing `POST /api/files/*`. Template variables: `{{date}}`, `{{datetime}}`, `{{filename}}` replaced with string substitution at creation time. |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| **Full link-based graph** (wikilinks / markdown links as edges) | Obsidian-style web of notes looks impressive | Parsing all link variants (relative paths, wiki-link aliases, broken links) correctly is fragile. For 100–1000 file knowledge bases, link-dense graphs are unreadable. Keeping the link index fresh as files change adds maintenance surface. | Tag-based graph (GRPH-01) is far more readable and leverages existing tag infrastructure. Backlinks panel covers "what links here" directly where it matters. |
| **3D graph visualization** | Visually impressive | Requires three.js or similar (large dep), terrible performance beyond ~200 nodes, hard to navigate, provides no practical benefit over 2D force graph | 2D D3 force graph is fast, standard, and debuggable |
| **Template variables with logic/expressions** | Power users want `{% if weekday %}` blocks | Requires a template engine (Handlebars, Nunjucks) — adds complexity, potential security surface if templates are eval'd, and breaks plain markdown semantics of template files | Simple `{{placeholder}}` string replacement covers 95% of real usage |
| **Pinned tabs / tab groups** | Nice for heavy multi-tab users | Adds persistent UI state complexity before the basic persistence story is even in place | Tab persistence + recent files covers the core need. Defer tab pinning to v1.2+. |
| **Image upload / paste-to-upload** | Drag an image into the editor and have it saved locally | Requires a write path for binary files, a storage location decision, and editor integration — significant additional scope | Not needed for this knowledge base. Images already exist on disk. Just render what's there (IMG-01/02). |

---

## Feature Dependencies

```
[Tab persistence] (PRST-01)
    uses ──> localStorage (already available)
    uses ──> useTabs reducer (already built)
    enables ──> [Scroll restore] (PRST-03)

[Recent files] (PRST-02)
    uses ──> localStorage (already available)
    enhances ──> WelcomeScreen (already built, needs prop)

[Image rendering] (IMG-01, IMG-02)
    requires ──> /api/images/* route (new, server)
    uses ──> MarkdownPreview img component (existing stub — replace)
    requires ──> filePath prop on MarkdownPreview (new, for relative resolution)

[Backlinks panel] (BKLN-01, BKLN-02, BKLN-03)
    requires ──> Link extraction in SearchService._readDoc (extend existing)
    requires ──> /api/backlinks/* endpoint (new)
    integrates into ──> Right panel / FileInfo area (existing)
    enables ──> [Graph link edges] (future v1.2)

[File templates] (TMPL-01, TMPL-02, TMPL-03)
    uses ──> /api/files/* POST (existing create-file endpoint)
    integrates into ──> FileTree new-file flow (existing)
    independent of all other v1.1 features

[Tag-based graph] (GRPH-01–04)
    uses ──> tagMap from /api/search/index (already in indexPayload)
    requires ──> D3.js dependency (new)
    lives in ──> new dedicated Graph panel component (new)
    enhances ──> openTab (already available)
```

### Dependency Notes

- **Tab persistence requires no server changes** — pure client localStorage wired into `useTabs`.
- **Image rendering requires one new server route** — the browser cannot access `file://` paths when served from localhost; the server must proxy image binary files.
- **Backlinks depend on extending `SearchService`** — `_readDoc` already parses file content; adding link extraction there keeps the link index consistent with the search index lifecycle (built at startup, updated on file change via `updateDoc`).
- **Tag graph has no server dependency** — `tagMap` is already available in `indexPayload`. Graph is a pure client component consuming existing data.
- **Templates are independent** — can be built and shipped in any order relative to other features.

---

## MVP Definition for v1.1

### Launch With (all five are v1.1 scope)

- [ ] **Tab persistence** (PRST-01, PRST-02) — eliminates the biggest daily-use friction point; zero server work required
- [ ] **Image rendering** (IMG-01, IMG-02) — one new server route and one component change; high visual impact
- [ ] **Backlinks panel** (BKLN-01–03) — makes the knowledge graph tangible without building a full graph view
- [ ] **File templates** (TMPL-01–03) — speeds up structured note creation; leverages existing file creation API
- [ ] **Tag graph view** (GRPH-01–04) — most complex; builds on tagMap already available client-side

### Recommended Build Order

Based on dependencies and risk, build in this sequence:

1. **Tab persistence + recent files** — zero server changes; validates localStorage approach; ships fast
2. **Image rendering** — small server addition, high user impact, completely self-contained
3. **File templates** — self-contained; leverages existing file creation API
4. **Backlinks panel** — requires `SearchService` extension; validates link extraction logic before graph work
5. **Tag graph view** — most complex; D3 integration; benefits from stable foundation of prior features

### Defer to v1.2

- [ ] **Scroll restore** (PRST-03) — valuable but lower urgency than the five main features; ships as fast follow after persistence
- [ ] **Graph with link-based edges** — defer until backlinks are stable and the link index is proven accurate
- [ ] **Tab pinning** — not needed once persistence is in place

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Tab persistence (PRST-01/02) | HIGH | LOW | P1 |
| Image rendering (IMG-01/02) | HIGH | LOW | P1 |
| Backlinks panel (BKLN-01–03) | HIGH | MEDIUM | P1 |
| File templates (TMPL-01–03) | MEDIUM | MEDIUM | P1 |
| Tag graph view (GRPH-01–04) | MEDIUM | HIGH | P1 (v1.1 goal) |
| Scroll restore (PRST-03) | MEDIUM | LOW | P2 |
| Graph with link-based edges | LOW | HIGH | P3 |
| Tab pinning | LOW | MEDIUM | P3 |

---

## Competitor Feature Analysis

| Feature | Obsidian | Logseq | Marky v1.1 Approach |
|---------|----------|--------|---------------------|
| Tab persistence | Yes — workspace state saved natively (Electron) | Yes — persisted per vault | localStorage; simpler, no native shell needed |
| Backlinks | Dedicated panel, shows context snippet around each link | Inline below note body with hierarchy | Collapsible panel in existing right panel; count in header; click to open |
| Image rendering | Local images render via Electron file access | Same (Electron) | Server proxy route `/api/images/*`; resolve relative paths against current file's directory |
| Templates | Via Templater plugin (community); built-in Templates plugin for basic use | Built-in template system | Built-in templates + save-as-template; no plugin system needed |
| Graph view | Force-directed graph, colors by tag group, filter by tag | Graph view available but less prominent | D3 force graph, tag-clustered, in dedicated panel; simpler than Obsidian's but functional |
| Scroll restore | Community plugin only ("Remember cursor position") — not built in as of 2025 | Partial | localStorage per file path; restore after content load |

---

## Implementation Notes by Feature

### Tab Persistence
`useTabs` uses `useReducer` with no persistence today. Change is minimal: initialize state from localStorage on first render (persist only `{ path, editMode }` per tab — not content, not dirty state), and add a `useEffect` in `App.tsx` that serializes tab list to localStorage on every state change. The `editMode` flag is safe to restore (it's display state). Content is always re-fetched from the server on tab open.

### Image Rendering
`MarkdownPreview.tsx` already has a stub with a comment pointing to this phase. The `img` component override needs: (1) a `filePath` prop on `MarkdownPreview` (the path of the file being rendered, e.g., `knowledge/decisions.md`), (2) for relative `src` values, resolve against the file's directory to produce a root-relative path, (3) rewrite `src` to `/api/images/<resolved-path>`. The server route reads the file from disk and responds with `Content-Type` based on file extension. `resolveSafePath` from `lib/pathSecurity.ts` must be used to prevent directory traversal.

### Backlinks
`SearchService` stores docs in `this.docs: Map<string, SearchDoc>`. Extend `SearchDoc` with `outgoingLinks: string[]`. In `_readDoc`, extract links from raw content using regex before frontmatter stripping. Add `getBacklinks(targetPath: string): SearchDoc[]` that filters docs where `outgoingLinks` includes `targetPath`. Add Fastify route `GET /api/backlinks/*`. In the right panel, `BacklinksPanel` sits between `FileInfo` and `TableOfContents`, using the same collapsible pattern already established for the sidebar and TOC panel.

### Templates
Built-in templates are TypeScript objects (embedded markdown strings with `{{date}}` placeholders) in the client bundle. When user clicks "New file" in the file tree, show a modal with template choices plus a "Blank file" option. Filename pre-fills based on template type. Custom templates: a context menu action ("Save as template") sends the file content to `POST /api/files/templates/<name>.md`. Template variable substitution: `{{date}}` → `YYYY-MM-DD`, `{{datetime}}` → ISO string, `{{filename}}` → the user-entered filename. All substitution happens client-side before the create API call.

### Tag Graph View
The `tagMap: Record<string, string[]>` is already available in `indexPayload` from `useSearch`. Build graph data client-side: for each pair of files sharing a tag, add an edge. Use `d3-force` with `forceLink`, `forceManyBody`, `forceCenter`. The graph component lives in a new panel accessible via a graph icon button in the sidebar header (same pattern as the gear icon for folder management). Node color encodes the primary tag (or a default if multiple). Active file gets a highlighted ring updated when `activeFocusedTab` changes.

---

## Sources

- Codebase inspection (2026-03-10): `useTabs.ts`, `MarkdownPreview.tsx`, `FileInfo.tsx`, `search.ts` (server), `files.ts` (server), `App.tsx`
- [Obsidian graph view documentation](https://help.obsidian.md/plugins/graph)
- [Obsidian scroll restore forum thread](https://forum.obsidian.md/t/remember-restore-document-position-scroll-position-cursor-note-position/962) — confirms this is an expected-but-missing feature (90+ replies, open since 2020)
- [Obsidian backlinks plugin](https://retypeapp.github.io/obsidian/plugins/backlinks/)
- [MDN Web Storage API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API) — localStorage patterns for tab and scroll persistence
- [D3.js](https://d3js.org/) — force graph for knowledge visualization
- [Obsidian vs Logseq comparison 2025](https://www.glukhov.org/post/2025/11/obsidian-vs-logseq-comparison/) — PKM UX patterns for backlinks, templates, graph

---
*Feature research for: Marky v1.1 — web markdown workspace*
*Researched: 2026-03-10*
