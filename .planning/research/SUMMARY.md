# Project Research Summary

**Project:** Marky — local-first web markdown knowledge base
**Domain:** PKM / markdown workspace — v1.1 Polish and Navigation
**Researched:** 2026-03-10
**Confidence:** HIGH (all research based on direct codebase analysis + verified npm versions)

## Executive Summary

Marky v1.1 is a polish-and-navigation milestone on top of a fully-built React 19 + Fastify 5 markdown workspace. The five features in scope — tab persistence, image rendering, file templates, backlinks panel, and tag-based graph view — are well-understood PKM patterns with clear implementation paths identified in existing code. All but one feature (graph view) require zero new npm packages; the entire milestone adds only `react-force-graph-2d` to the dependency tree. The recommended build order is isolation-first: start with the two zero-server-change features (tab persistence and image rendering), then templates (independent), then backlinks (server-side SearchService extension), and finally graph view (depends on knowing the right panel's final shape after backlinks are added).

The biggest risk cluster is correctness, not complexity. Three of the ten critical and moderate pitfalls involve data getting out of sync: localStorage tab state serializing too much (causing dirty-state bugs on reload), the backlink index diverging from the search index if built as a separate service, and wikilink parsing producing different results on client vs. server. Each has a clear prevention strategy: persist only paths (not content or flags), extend `SearchService._readDoc` rather than creating a parallel index, and extract link parsing into `shared/` so both sides use identical logic.

The second risk cluster is graph view architecture. Two pitfalls — D3 force simulation not stopped on unmount and graph data reference instability restarting the layout — are classic React + D3 integration traps preventable by using `react-force-graph-2d` (which manages the simulation lifecycle) and memoizing graph data with a content hash. The graph must also be implemented as a persistent right-panel mode from day one, not a modal, because GRPH-04 is an explicit requirement and retrofitting panel layout is costly.

---

## Key Findings

### Recommended Stack

The existing stack handles all v1.1 features. `localStorage` (browser built-in) covers tab persistence using the pattern already established in `App.tsx`. `@fastify/static` (already installed but not yet registered for images) handles the image proxy. `gray-matter` (already installed) parses custom template frontmatter. The only new package is `react-force-graph-2d@1.29.1` for graph rendering — canvas-based, actively maintained, compatible with React 19, and significantly lighter than alternatives. Zustand, `remark` + `unist-util-visit` on the server, `cytoscape.js`, and any template engine are all explicitly rejected.

**Core technologies:**
- `localStorage` (browser API): tab persistence and scroll position — follows established App.tsx pattern, no library needed
- `@fastify/static@^8.0.0` (already installed): image proxy endpoint — register for `/api/images/*`, reuse existing `pathSecurity.ts`
- `react-force-graph-2d@1.29.1`: graph view canvas rendering — the only new install for the entire milestone
- `gray-matter` (already installed): parse custom template frontmatter
- `SearchService` extension (existing): backlink index built inside `_readDoc`, no new service or package

### Expected Features

All five v1.1 features are confirmed scope. Build order derived from dependency analysis and risk level.

**Must have (table stakes):**
- Tab persistence across reloads (PRST-01, PRST-02) — every multi-tab tool restores state on reload; losing tabs feels like a crash; zero server changes required
- Inline image rendering (IMG-01, IMG-02) — local images currently show a placeholder stub with a comment deferring this to a later phase; one new server route, high visual impact

**Should have (PKM differentiators):**
- Backlinks panel (BKLN-01, BKLN-02, BKLN-03) — surfaces knowledge graph without graph view; Obsidian and Logseq treat this as a first-class feature; requires `SearchService` extension
- File templates (TMPL-01, TMPL-02, TMPL-03) — speeds structured note creation; daily note / meeting note / decision record cover 80% of structured needs; completely independent of other features
- Tag-based graph view (GRPH-01, GRPH-02, GRPH-03, GRPH-04) — makes tag system visual; `tagMap` already available client-side; most complex feature but no new server data needed

**Defer to v1.2:**
- Scroll position restore (PRST-03) — valuable but lower urgency; ships as fast follow after core persistence
- Link-based graph edges — defer until backlink index is proven accurate in production
- Tab pinning — redundant once basic persistence is in place

### Architecture Approach

All five features integrate into the existing 3-column layout (Sidebar / Main Content / Right Panel) and Fastify server without restructuring either. The right panel gains a `BacklinksPanel` stacked below `FileInfo` and above `TableOfContents`, plus a graph mode toggle that replaces the TOC + Backlinks view with `GraphView`. `App.tsx` remains the single state orchestrator. Server changes are purely additive: three new routes (`GET /api/images/*`, `GET /api/backlinks/:path`, `GET /api/graph`) and one new module (`server/src/lib/templates.ts`). Four new client components are created; twelve existing files are modified.

**Major components:**
1. `hooks/useTabs.ts` (modified) — add `RESTORE` and `SET_SCROLL` actions; localStorage init and persistence with slim snapshot only (`{ paths, activeTabId }`)
2. `server/src/lib/search.ts` (modified) — extend `SearchDoc` with `links: string[]`; populate in `_readDoc`; add `getBacklinks()` method
3. `client/src/components/GraphView.tsx` (new) — `react-force-graph-2d` canvas; receives `indexPayload.tagMap`; active file highlighted; calls `openTab` on node click
4. `client/src/components/BacklinksPanel.tsx` (new) — fetches `/api/backlinks/:path` on active file change; count in header; click to open
5. `client/src/components/TemplatePickerModal.tsx` (new) — modal inserted into `FileTree` new-file flow after filename input
6. `MarkdownPreview.tsx` (modified) — add `filePath` prop; replace image placeholder stub with `/api/images/` proxy

### Critical Pitfalls

1. **Serializing full Tab objects to localStorage** — persist only `{ paths: string[], activeTabId }`, never `content`, `dirty`, or `loading`; add a `marky-tabs-v1` version key and wrap parse in `try/catch`; validate restored paths against file tree before dispatching `OPEN` to prevent error tabs for deleted files

2. **Backlink index built as a separate service** — extend `SearchService._readDoc` directly so the link index stays in sync with the search index through the same `updateDoc` / `removeDoc` lifecycle; a synchronous O(n) scan of `SearchService.docs` on each `/api/backlinks/` request is sufficient for vaults under 500 files

3. **Wikilink parsing divergence between client and server** — extract a single link-parsing utility in `shared/` used by both sides; handle `[[WikiLink]]`, `[[WikiLink|alias]]`, `[text](./path.md)`, ignore `https://` links; normalize paths to lowercase to account for macOS case-insensitive filesystem

4. **Image path resolution losing source file context** — pass `filePath` as a prop to `MarkdownPreview`; construct the full root-relative path client-side before building the `/api/images/` URL; always pass image paths through the existing `resolveSafePath` in `pathSecurity.ts` to prevent directory traversal

5. **D3 force simulation not stopped on unmount** — use `react-force-graph-2d` which manages the simulation lifecycle internally; set `cooldownTicks={100}` to stop the simulation after 100 ticks; verify cleanup on unmount; CPU elevation after navigating away from graph is the warning sign

6. **Graph data reference instability restarting layout** — memoize graph data with a content hash of `tagMap`, not reference equality; never construct `{ nodes, links }` inline in render; use `react-force-graph-2d`'s `nodeId` prop to key nodes by file path so D3 merges positions on re-render

---

## Implications for Roadmap

Based on research, the five features map cleanly to four phases ordered by isolation (zero risk first) through increasingly cross-cutting changes.

### Phase 1: Tab Persistence and Image Rendering
**Rationale:** Two features requiring no coordination with each other and delivering immediate daily-use quality improvements. Tab persistence is pure client localStorage. Image rendering is one new server route plus one component prop. Both validate infrastructure before touching the more complex SearchService. Starting here de-risks the milestone and ships visible improvements fast.
**Delivers:** Tabs survive reload; recent files on welcome screen; local images render in preview
**Addresses:** PRST-01, PRST-02, IMG-01, IMG-02
**Avoids:** Pitfall 1 (stale Tab serialization) — the localStorage contract must be correct before anything else builds on it; Pitfall 4 (image path security) — `resolveSafePath` used from day one

### Phase 2: File Templates
**Rationale:** Completely independent of all other v1.1 features. New server module plus new modal component plugged into the existing `FileTree` new-file flow. Low risk, medium value. Isolating this to its own phase keeps the SearchService change in Phase 3 clean and unambiguous.
**Delivers:** Built-in daily note / meeting note / decision record templates; template picker modal in new-file flow; `{{date}}` and `{{title}}` interpolation at creation time
**Addresses:** TMPL-01, TMPL-02, TMPL-03
**Avoids:** Pitfall 8 (template token not interpolated) — interpolation defined at `createFile` call, not at template definition

### Phase 3: Backlinks Panel
**Rationale:** Requires the most consequential server-side change of the milestone — extending `SearchService._readDoc`. Building after templates means the only active change is the SearchService extension and its derived route and UI panel. This phase establishes the right panel's final layout (FileInfo + BacklinksPanel + TOC) that graph view needs to know before building its toggle.
**Delivers:** Link index in `SearchService`; `GET /api/backlinks/:path` route; collapsible `BacklinksPanel` with count header in right panel; click-to-open
**Addresses:** BKLN-01, BKLN-02, BKLN-03
**Avoids:** Pitfall 2 (index divergence), Pitfall 3 (parsing mismatch — shared link extractor in `shared/`), Pitfall 9 (right panel overcrowding — collapsible with auto-collapse at zero count)

### Phase 4: Tag Graph View
**Rationale:** Most complex feature. Placed last because its layout integration (right panel mode toggle) depends on knowing the final shape of the BacklinksPanel-extended right panel from Phase 3. `tagMap` data is already available client-side — no new server data needed beyond a `GET /api/graph` endpoint. The graph must be a persistent panel mode from the first implementation; rejecting any modal-based approach is an implementation gate.
**Delivers:** `react-force-graph-2d` canvas graph; files as nodes; shared-tag edges; active file highlighted; node click opens tab; right panel mode toggle (TOC mode vs. Graph mode)
**Addresses:** GRPH-01, GRPH-02, GRPH-03, GRPH-04
**Avoids:** Pitfall 5 (simulation cleanup), Pitfall 6 (reference instability), Pitfall 10 (modal implementation — explicit rejection gate before code is written)

### Phase Ordering Rationale

- Phases 1 and 2 have zero cross-feature dependencies and can be built in parallel by separate developers; tab persistence localStorage pattern must be correct before anything else depends on it
- Phase 3 touches `SearchService`, the core server index — isolating this change to a single phase limits blast radius and makes rollback clean
- Phase 4 depends on Phase 3 because the right panel layout with `BacklinksPanel` in place determines the graph toggle integration point
- Every phase delivers a shippable increment with visible user value; no phase is a pure setup phase

### Research Flags

Phases with well-documented patterns (standard implementation, skip deeper research):
- **Phase 1 (Tab Persistence + Images):** Pure localStorage and a static file proxy — both are standard, well-documented patterns with established precedents in the existing codebase; no novel integration needed
- **Phase 2 (Templates):** Server-side string interpolation plus modal component — no complex patterns; straightforward additive work with clear integration point in `FileTree.handleCreate`

Phases benefiting from careful implementation review (not pre-research, but validation during build):
- **Phase 3 (Backlinks):** The shared `extractLinks` utility in `shared/` should have unit tests before the panel is built; link path normalization edge cases (spaces in wiki link names, relative path resolution) must be verified with real vault content
- **Phase 4 (Graph View):** Read `react-force-graph-2d` README and type definitions before starting; `nodeCanvasObject`, `cooldownTicks`, and simulation lifecycle props need to be understood before writing the component; the panel mode toggle layout decision should be reviewed against the Phase 3 result before building

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All versions verified via `npm info` in live environment on 2026-03-10; only one new package; all others already installed and working |
| Features | HIGH | Codebase inspected directly; deferred stubs and comments in source confirm planned integration points match existing code; feature scope matches PKM ecosystem norms |
| Architecture | HIGH | All integration points verified against actual source files; modified-file list is concrete and traceable to specific functions and line numbers |
| Pitfalls | HIGH (critical) / MEDIUM (library-specific) | Critical pitfalls derived from direct codebase analysis; library pitfalls (D3 simulation lifecycle, react-force-graph reference instability) confirmed across multiple community sources |

**Overall confidence:** HIGH

### Gaps to Address

- **Scroll position restore timing (PRST-03):** The `useLayoutEffect` plus async content load interaction needs a working prototype verified against real long documents — the fix is simple but the timing edge case (scroll applied before content renders) must be confirmed not just reasoned about
- **Link path normalization edge cases:** `[[Wiki Link With Spaces]]` to file path mapping needs explicit unit test coverage; the regex handles common cases but the normalization rules (lowercase, slug vs. display form) should be codified in the shared utility with tests before Phase 3 ships
- **Graph performance ceiling:** `react-force-graph-2d` is documented as fast at 200+ nodes; Marky vaults are unlikely to exceed 500 files in v1.1 usage, but a performance check during Phase 4 development with a synthetic large dataset is prudent before declaring the feature done
- **Right panel height budget:** The three-section right panel (FileInfo + BacklinksPanel + TOC) at default window height needs a visual design review after Phase 3 to confirm all three sections are usable before Phase 4 adds the graph toggle

---

## Sources

### Primary (HIGH confidence)
- Direct codebase analysis (2026-03-10): `client/src/hooks/useTabs.ts`, `client/src/App.tsx`, `client/src/components/MarkdownPreview.tsx`, `server/src/lib/search.ts`, `server/src/lib/pathSecurity.ts`, `server/src/routes/files.ts`, `server/package.json`
- `npm info react-force-graph-2d version peerDependencies` — version 1.29.1, `react: '*'` (verified 2026-03-10)
- `npm info zustand version peerDependencies` — 5.0.11 (verified and rejected)
- `server/package.json` — confirmed `@fastify/static@^8.0.0` already present and unused for images

### Secondary (MEDIUM confidence)
- vasturiano/react-force-graph GitHub — actively maintained, canvas-based, knowledge graph use cases documented
- MDN Web Storage API — localStorage patterns for tab and scroll persistence
- Obsidian graph view documentation — PKM graph view UX patterns and norms
- Obsidian scroll restore forum thread (90+ replies, open since 2020) — confirms scroll restore is an expected but difficult feature
- D3 simulation cleanup pitfall — confirmed across multiple React + D3 community sources and open GitHub issues
- Josh W. Comeau: persisting React state in localStorage — schema versioning pattern applicable to `marky-tabs-v1` design

### Tertiary (LOW confidence)
- Obsidian backlink implementation patterns (community forum) — used for UX pattern validation only; implementation is codebase-specific
- Obsidian vs Logseq comparison 2025 — PKM feature baseline expectations

---
*Research completed: 2026-03-10*
*Ready for roadmap: yes*
