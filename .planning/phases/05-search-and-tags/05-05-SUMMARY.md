---
phase: 05-search-and-tags
plan: "05"
subsystem: ui
tags: [react, minisearch, tailwind, search, tags, frontmatter]

# Dependency graph
requires:
  - phase: 05-search-and-tags
    provides: useSearch + useTags hooks, server search index, PATCH /api/files/*/tags endpoint
  - phase: 05-search-and-tags
    provides: SearchPanel.test.tsx RED stub from Plan 02

provides:
  - SearchPanel component (props-based results list; no internal hook ownership)
  - TagFilter component (tag pill filter + per-file tag editor with PATCH writes)
  - FileTree updated with filterPaths prop for tag-based tree filtering
  - App.tsx wired with useSearch + useTags; search input in sidebar; SearchPanel shown when query active

affects:
  - phase 05 gap-closure plan (tree auto-reveal, tag editor placement, TOC split-view bug)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - SearchPanel is purely presentational — App.tsx owns useSearch state and passes results as props
    - afterEach cleanup pattern required in SearchPanel tests — vitest jsdom does not auto-cleanup without globals:true
    - filterPaths propagated recursively through FileNodeItem so child nodes are filtered correctly

key-files:
  created:
    - client/src/components/SearchPanel.tsx
    - client/src/components/TagFilter.tsx
  modified:
    - client/src/components/FileTree.tsx
    - client/src/App.tsx
    - client/src/__tests__/SearchPanel.test.tsx

key-decisions:
  - "SearchPanel receives results as props — vi.mock approach from Plan 02 stub replaced with explicit prop passing; test updated as part of GREEN phase"
  - "afterEach(cleanup) added to SearchPanel.test.tsx — vitest jsdom without globals:true does not run @testing-library/react auto-cleanup between tests, causing multiple-element match failures"
  - "TagFilter placed in sidebar below FileTree (plan spec) — human review found this unintuitive; gap logged for closure plan (move to right TOC panel as File Info section)"
  - "Tree auto-reveal after search clear not implemented — gap logged for closure plan"

patterns-established:
  - "Pure presentational components receive data as props; App.tsx owns all hook state — consistent with hook pattern in STATE.md"
  - "filterPaths: Set<string> | null — null means show all; non-null hides any node whose path is not in the Set (ancestors included by useTags so parent dirs survive filter)"

requirements-completed: [SRCH-01, SRCH-02, SRCH-03, TAG-01, TAG-02, TAG-03]

# Metrics
duration: 8min
completed: 2026-03-10
---

# Phase 5 Plan 05: Search and Tags UI — Summary

**SearchPanel + TagFilter UI components wired into App.tsx with MiniSearch results, tag pill filter, and frontmatter tag editor — six requirements implemented but two UX gaps and one pre-existing bug found during human verification**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-03-10T09:36:34Z
- **Completed:** 2026-03-10T09:44:00Z
- **Tasks:** 2/2 auto tasks complete (Task 3 was human-verify checkpoint)
- **Files modified:** 4

## Accomplishments

- SearchPanel component created as pure presentational component — receives `results` as props, renders file name + path + context snippet, returns null when results is empty
- TagFilter component created with dual function: tag pill filter bar (clicks set active tag, second click clears) and per-file tag editor (add/remove tags via inline input + PATCH `/api/files/*/tags`)
- FileTree updated with optional `filterPaths?: Set<string> | null` prop — hides nodes not in the Set, propagates filter recursively so ancestor dirs survive the filter
- App.tsx wired with `useSearch` + `useTags`; search input in sidebar; SearchPanel replaces file tree when query is active; TagFilter appears below tree when idle
- SearchPanel.test.tsx updated from `vi.mock('../hooks/useSearch')` approach to direct prop passing — cleaner test with explicit `afterEach(cleanup)` for vitest jsdom environment
- All 44 client tests GREEN; TypeScript build clean (359 modules, 0 errors)

## Task Commits

1. **Task 1: Create SearchPanel + TagFilter components; update FileTree filterPaths** - `f68dcc9` (feat)
2. **Task 2: Wire search and tags into App.tsx** - `e7b2285` (feat)

## Files Created/Modified

- `client/src/components/SearchPanel.tsx` — Pure presentational results list; extractSnippet helper inline; default + named export
- `client/src/components/TagFilter.tsx` — Tag filter pills + file tag editor; local tag state synced when active file changes; PATCH on add/remove
- `client/src/components/FileTree.tsx` — Added `filterPaths` to FileTreeProps and FileNodeProps; early-return null when node not in Set; prop passed recursively
- `client/src/App.tsx` — Added useSearch, useTags, SearchPanel, TagFilter imports; hooks at top of App(); currentFileTags derived via useMemo; sidebar restructured with search input + conditional SearchPanel vs tree+tags
- `client/src/__tests__/SearchPanel.test.tsx` — Replaced vi.mock approach with props-based interface; added afterEach(cleanup) for jsdom stability

## Decisions Made

- **SearchPanel receives results as props** — vi.mock approach from Plan 02 RED stub replaced with explicit prop-passing. Tests no longer mock the hook; cleaner, more maintainable interface.
- **afterEach(cleanup) required in SearchPanel.test.tsx** — Vitest jsdom without `globals: true` does not trigger @testing-library/react auto-cleanup between tests. Without it, DOM from test 1 persists into test 2, causing "multiple elements found" errors on `getByText`.
- **TagFilter placed in sidebar per plan spec** — human review found this unintuitive; gap closure plan should move it to the right TOC panel as a "File Info" section.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Added `afterEach(cleanup)` to SearchPanel.test.tsx**
- **Found during:** Task 1 (GREEN phase — running tests)
- **Issue:** `screen.getByText('hello')` matched two elements because test 1's rendered DOM was not cleaned up before test 2 ran. Vitest jsdom without `globals: true` skips @testing-library/react's automatic cleanup registration.
- **Fix:** Added `import { afterEach } from 'vitest'` + `import { cleanup } from '@testing-library/react'` + `afterEach(() => { cleanup(); })` at top of test file.
- **Files modified:** `client/src/__tests__/SearchPanel.test.tsx`
- **Verification:** All 3 SearchPanel tests pass; 44 total client tests GREEN.
- **Committed in:** f68dcc9 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 — test cleanup bug)
**Impact on plan:** Fix necessary for test correctness. No scope creep.

## Issues Encountered

### Pre-existing server test flakiness (out of scope)

The `LIVE-01` test in `server/tests/routes/watch.test.ts` ("app PUT write does NOT trigger SSE event (write-lock)") fails intermittently due to a write-lock timing race condition. This failure predates Plan 05 and is unrelated to search/tag work. Verified by running `npm run test --workspace=server` on the commit prior to any Plan 05 changes — same failure present.

**Logged to deferred items** — not fixed in this plan.

## Gaps Found During Human Verification

Human review of the running app identified three issues. Two are UX gaps to close in a follow-up plan; one is a pre-existing bug.

### Gap 1: SRCH-03 — Tree auto-reveal after search clear (UX gap)

**Requirement:** After clearing the search input and returning to the file tree, the currently open file should be highlighted with its ancestor folders auto-expanded.

**Current behavior:** File tree returns as-is when query is cleared. The active file's location is not revealed — its parent folders may be collapsed.

**Impact:** SRCH-03 is partially met (click opens file) but the return-to-tree flow is disorienting.

**Closure:** Needs a `useEffect` in App.tsx that calls `expandFolder(activeTab.path)` when `query` transitions from non-empty to empty and a tab is open.

### Gap 2: TAG-03 — Tag editor placement (UX gap)

**Requirement:** Tag editor should be clearly associated with the open file, not the navigation sidebar.

**Current behavior:** TagFilter renders at the bottom of the left sidebar, below the file tree. The association with "this file's tags" is not visually clear.

**Proposed fix:** Move the file tag editor section to the right panel (where the TOC lives), as a "File info" section above the TOC links. The tag filter pill list (all-tags filter) can remain in the left sidebar.

**Impact:** TAG-03 is functionally implemented (PATCH writes work) but the UX placement is confusing.

### Gap 3: TOC split-view bug (pre-existing)

**Description:** In split view, the TOC header links always navigate to the first pane's file content, not the focused pane's file. Header links also behave inconsistently.

**Pre-existing:** This issue was introduced in Phase 2/3 split-view work and is not caused by Plan 05 changes.

**Impact:** Does not affect any Phase 5 requirements. Affects Phase 3 EDIT-05 (split-screen).

**Closure:** Requires TableOfContents to receive the active pane's file content and dispatch navigation to the focused pane. Deferred to gap-closure plan.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- All six Phase 5 requirements (SRCH-01 through TAG-03) are functionally implemented and verified by automated tests
- Two UX gaps and one pre-existing bug found during human review — require a gap-closure plan before Phase 5 can be marked complete
- Gap closure plan needs: tree auto-reveal on search clear, tag editor moved to right TOC panel, TOC split-view fix

---
*Phase: 05-search-and-tags*
*Completed: 2026-03-10*
*Status: Gaps found — requires closure plan*
