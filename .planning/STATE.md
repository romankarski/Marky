---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: completed
stopped_at: Completed 05-search-and-tags-05-09-PLAN.md
last_updated: "2026-03-10T13:34:55.860Z"
last_activity: "2026-03-10 — Phase 5 Plan 05 complete with gaps: SearchPanel + TagFilter built; 3 UX/bug gaps found in human review"
progress:
  total_phases: 5
  completed_phases: 5
  total_plans: 25
  completed_plans: 25
  percent: 95
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-06)

**Core value:** Instant, beautiful markdown reading and editing with full-text search across all files — so nothing gets lost and switching between documents is effortless.
**Current focus:** Phase 2 — Browser Shell (next)

## Current Position

Phase: 5 of 5 (Search and Tags — PLAN 05 COMPLETE, GAPS FOUND)
Plan: 5 of 5 complete (all plans executed; gaps require closure plan)
Status: Phase 5 all plans complete — gaps found in human review; closure plan needed before phase marked done
Last activity: 2026-03-10 — Phase 5 Plan 05 complete with gaps: SearchPanel + TagFilter built; 3 UX/bug gaps found in human review

Progress: [█████████░] 95%

## Performance Metrics

**Velocity:**
- Total plans completed: 0
- Average duration: -
- Total execution time: 0 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| - | - | - | - |

**Recent Trend:**
- Last 5 plans: -
- Trend: -

*Updated after each plan completion*
| Phase 01 P01 | 3 | 2 tasks | 19 files |
| Phase 01 P02 | 2 | 2 tasks | 7 files |
| Phase 01 P03 | 8 | 1 tasks | 5 files |
| Phase 02-browser-shell P01 | 3 | 2 tasks | 7 files |
| Phase 02-browser-shell P03 | 5 | 2 tasks | 3 files |
| Phase 02-browser-shell P02 | 2 | 2 tasks | 2 files |
| Phase 02-browser-shell P04 | 8 | 1 tasks | 1 files |
| Phase 02-browser-shell P05 | 5 | 1 tasks | 0 files |
| Phase 03-editor P01 | 8 | 2 tasks | 2 files |
| Phase 03-editor P02 | 8 | 2 tasks | 4 files |
| Phase 03-editor P03 | 3 | 2 tasks | 4 files |
| Phase 03-editor P04 | 1 | 2 tasks | 2 files |
| Phase 03-editor P05 | ~45min | 2 tasks | 2 files |
| Phase 04-live-reload P01 | 2 | 2 tasks | 2 files |
| Phase 04-live-reload P02 | 3 | 2 tasks | 5 files |
| Phase 04-live-reload P03 | 15 | 2 tasks | 3 files |
| Phase 04-live-reload P03 | 15 | 3 tasks | 10 files |
| Phase 05-search-and-tags P01 | 10 | 2 tasks | 4 files |
| Phase 05-search-and-tags P02 | 2 | 2 tasks | 3 files |
| Phase 05-search-and-tags P03 | 9 | 2 tasks | 5 files |
| Phase 05-search-and-tags P04 | 2 | 2 tasks | 4 files |
| Phase 05-search-and-tags P05 | 8 | 2 tasks | 5 files |
| Phase 05-search-and-tags P06 | 2 | 2 tasks | 4 files |
| Phase 05-search-and-tags P07 | 7 | 2 tasks | 4 files |
| Phase 05-search-and-tags P08 | 2 | 2 tasks | 1 files |
| Phase 05-search-and-tags P09 | 2 | 2 tasks | 2 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Web-based over desktop app: local-first now, hostable later
- Claude API for semantic search: user already uses Claude ecosystem (v2 scope)
- Editor opens below preview (not side): keeps preview readable while editing
- [Phase 01-01]: npm workspaces chosen over pnpm/turborepo: simpler for two-package monorepo, no extra tooling
- [Phase 01-01]: tsconfig paths used for @marky/shared resolution to avoid NodeNext dual-import issues
- [Phase 01-01]: Tailwind v4 CSS-first config: @import tailwindcss in index.css via @tailwindcss/vite plugin, no config file
- [Phase 01]: macOS realpath fix: for non-existent files reconstruct real path via realRoot + path.relative() instead of falling back to symlinked path
- [Phase 01]: buildApp() factory with fastify.decorate('rootDir') chosen over env-based config for test isolation
- [Phase 01]: Exact GET /api/files registered before wildcard GET /api/files/* to prevent route shadowing (Fastify first-match wins)
- [Phase 01]: window.prompt/confirm used for Phase 1 CRUD inputs — explicit deferral of modal UI to Phase 2
- [Phase 01]: Hook pattern established: custom hook owns fetch + state + refetch; component receives via props
- [Phase 02-browser-shell]: tabReducer exported from useTabs.ts for unit testing without React environment
- [Phase 02-browser-shell]: skipLibCheck: true in client tsconfig — @dnd-kit/core 6.x JSX namespace incompatible with react-jsx strict mode
- [Phase 02-browser-shell]: Vitest installed for client workspace TDD; pure reducer tests require no DOM environment
- [Phase 02-browser-shell]: @dnd-kit/utilities installed separately for CSS.Transform.toString — not bundled with @dnd-kit/sortable
- [Phase 02-browser-shell]: TabBar returns null when empty; WelcomeScreen is a zero-prop sibling rendered by App.tsx
- [Phase 02-browser-shell]: yaml:()=>null component override required to suppress remark-frontmatter output in react-markdown
- [Phase 02-browser-shell]: TOC uses regex on raw markdown string for synchronous heading extraction — avoids second remark AST parse
- [Phase 02-browser-shell]: react-resizable-panels v4 uses Group/Panel/Separator exports — PanelGroup and PanelResizeHandle are v1-v2 API only
- [Phase 02-browser-shell]: useEffect for content fetch depends on activeTab.id + activeTab.path primitives (not full object) to prevent infinite re-fetch loops
- [Phase 02-browser-shell]: Visual verification gated at phase end — one checkpoint after all implementation confirms aesthetic requirements (frosted glass, orange accents) no automated test can check
- [Phase 03-editor]: CLOSE + dirty guard lives in TabBar event handler (not reducer) — no reducer test needed
- [Phase 03-editor]: useAutoSave tests use vi.useFakeTimers for deterministic debounce control
- [Phase 03-editor]: Tab type extended non-breakingly: new fields dirty/editMode added at end, existing fields unchanged
- [Phase 03-editor]: Global jsdom vitest environment chosen over environmentMatchGlobs — pure reducer tests pass in jsdom, simpler config
- [Phase 03-editor]: onSaved excluded from useAutoSave useEffect deps — stable callback responsibility is caller's; avoids infinite loops if not memoized
- [Phase 03-editor]: Local editContent state in EditorPane (not reducer) prevents cursor-jumping on every keystroke
- [Phase 03-editor]: window.confirm for dirty-tab close guard matches Phase 1 pattern established in STATE.md
- [Phase 03-editor]: Per-pane focus isolation: rightActiveTabId local to App.tsx, rightDispatch intercepts FOCUS to set it; all other actions pass to shared reducer
- [Phase 03-editor]: useAutoSave guarded to only fire when editMode active and user has made changes — prevents spurious saves on tab switch
- [Phase 04-live-reload]: Real timers for server SSE tests — chokidar filesystem events require real async IO, fake timers incompatible
- [Phase 04-live-reload]: EventSource mocked via vi.stubGlobal for jsdom — makes browser SSE API available in client unit tests
- [Phase 04-live-reload]: Wave 0 TDD: test stubs (RED) written before implementation — watch.test.ts drives Plan 02, useFileWatcher.test.ts drives Plan 03
- [Phase 04-live-reload]: FileWatcherService owns the write-lock set — avoids circular imports between watcher.ts and files.ts
- [Phase 04-live-reload]: Fastify inject payloadAsStream:true exposes stream via response.stream() not response.body — test stubs needed correction
- [Phase 04-live-reload]: addEventListener('change') and ('add') for named SSE events in useFileWatcher — not onmessage (only fires for unnamed frames)
- [Phase 04-live-reload]: tabsRef pattern: mount-only useEffect with refs keeps EventSource stable while always seeing latest tabs
- [Phase 04-live-reload]: Test mock for EventSource refactored to addEventListener-based regular function constructor — Object.assign + read-only Event.type caused failures
- [Phase 04-live-reload]: editMode guard added to live-reload skip condition: dirty OR editMode prevents SET_CONTENT overwriting mid-edit state
- [Phase 04-live-reload]: watcher.ts switched from glob pattern to directory watch + .md filter + unlink event to match actual chokidar API
- [Phase 04-live-reload]: onSaved(content) passes saved content back to reducer — prevents SET_CONTENT from server SSE bouncing back stale content after auto-save
- [Phase 05-search-and-tags]: MiniSearch.loadJSON used in tests to verify search without adding .search() to SearchService API
- [Phase 05-search-and-tags]: minisearch added as runtime dependency in server workspace — will be used by SearchService in Plan 03
- [Phase 05-search-and-tags]: Wave 0 TDD: vi.stubGlobal('fetch', fetchSpy) for useSearch hook tests enables refetchIndex call-count assertion
- [Phase 05-search-and-tags]: SearchPanel test uses vi.mock for useSearch module; Plan 05 must update stub to prop-based results when component API changes
- [Phase 05-search-and-tags]: Non-blocking buildFromDir: not awaited in buildApp — decorates searchService immediately; chokidar timing unaffected; index builds in background (completes in ms)
- [Phase 05-search-and-tags]: Sync watcher subscriber (not async) in app.ts — async callbacks in watcher.subscribe forEach cause microtask timing side-effects; sync callback with .catch() preserves chokidar event timing
- [Phase 05-search-and-tags]: Fastify 5 wildcard restriction: /api/files/*/tags not supported; registered as /api/files/* PATCH with /tags suffix stripped from param
- [Phase 05-search-and-tags]: MiniSearch.loadJSON called with JSON.stringify(payload.index) — loadJSON takes string input not raw object
- [Phase 05-search-and-tags]: version counter in useSearch (useState(0)) for refetchIndex pattern — cleaner than boolean flag, useEffect([version]) re-triggers on increment
- [Phase 05-search-and-tags]: SearchPanel receives results as props — vi.mock stub from Plan 02 replaced with explicit prop-passing; cleaner test interface
- [Phase 05-search-and-tags]: afterEach(cleanup) required in SearchPanel.test.tsx — vitest jsdom without globals:true skips @testing-library/react auto-cleanup, causing multiple-element match failures
- [Phase 05-search-and-tags]: TAG-03 gap — tag editor placed in sidebar per plan spec but human review found it unintuitive; closure plan should move it to right TOC panel as File Info section
- [Phase 05-search-and-tags]: SRCH-03 gap — tree auto-reveal after search clear not implemented; closure plan needs expandFolder(activeTab.path) on query→empty transition
- [Phase 05-06]: onHeadingClick prop delegates scroll to App.tsx — TableOfContents fires event, parent executes DOM operation; data-pane attribute scopes split-view querySelector without threading refs
- [Phase 05-06]: prevQueryRef tracks previous query value to detect non-empty→empty transition in useEffect without adding expandFolder/activeTab to deps
- [Phase 05-06]: IntersectionObserver stubbed locally via vi.stubGlobal in beforeEach — not in global vitest setup, keeps mock scope tight per test file
- [Phase 05-07]: FileInfo placed in right TOC panel above TableOfContents — associates tag editing with file metadata context, not sidebar navigation controls
- [Phase 05-07]: TagFilter slimmed to 3 props (allTags, activeTag, onTagClick) — single responsibility: global tag filter only, no per-file editing
- [Phase 05-08]: activeFocusedTab derived variable as single source of truth for focused pane's active tab in split/single mode — avoids pane ternaries throughout JSX
- [Phase 05-08]: currentFileTags useMemo moved after activeFocusedTab declaration to avoid TDZ runtime error — JS const semantics require sequential declaration even when TypeScript build passes
- [Phase 05-09]: FileInfo filename header uses text-xs font-medium text-gray-500 truncate — readable but visually subordinate to the Tags heading
- [Phase 05-09]: setActiveId called immediately on TOC click (optimistic update) before delegating scroll — gives instant visual feedback without waiting for IntersectionObserver

### Pending Todos

None yet.

### Blockers/Concerns

- Phase 2: For resizable panels, prefer react-resizable-panels over allotment (better maintained)
- Phase 2: Tailwind v4 CSS-first config is now confirmed working (used in Phase 1 with no issues)
- Phase 5+: FlexSearch 0.7.x version needs npm verification before install — MiniSearch is a fallback
- Phase 5 gap (SRCH-03): Tree auto-reveal after search clear — active file's ancestor folders not expanded when query cleared; needs expandFolder call in App.tsx
- Phase 5 gap (TAG-03): Tag editor placement — currently in left sidebar, human review found it unintuitive; should move to right TOC panel as "File Info" section above TOC links
- Phase 5 gap (pre-existing): TOC split-view bug — TOC links always target first pane's file, not focused pane's file; introduced in Phase 2/3 split-view work

## Session Continuity

Last session: 2026-03-10T13:34:55.857Z
Stopped at: Completed 05-search-and-tags-05-09-PLAN.md
Resume file: None
