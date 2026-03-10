---
phase: 05-search-and-tags
plan: "06"
subsystem: ui
tags: [react, typescript, vitest, testing-library, split-view, toc, search]

# Dependency graph
requires:
  - phase: 05-search-and-tags
    provides: useSearch hook with query state, expandFolder function, split-view pane state in App.tsx
  - phase: 05-search-and-tags
    provides: TableOfContents component, SplitView with pane containers

provides:
  - TableOfContents with onHeadingClick prop for scoped scroll (replaces global document.getElementById)
  - SplitView panel wrappers with data-pane=left/right for DOM scoping
  - App.tsx tree auto-reveal: query non-empty→empty transition calls expandFolder(activeTab.path)
  - App.tsx tocContent derivation: focused pane content in split mode, activeTab in single mode
  - TableOfContents.test.tsx: 3 unit tests covering renders, onHeadingClick, empty content

affects:
  - Any future TOC enhancements that touch scroll behavior
  - Split-view features that add new pane interactions

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "onHeadingClick callback prop pattern: parent controls scroll target, component fires event"
    - "data-pane DOM attribute for split-view scoped queries"
    - "prevQueryRef pattern for detecting value transitions in useEffect without adding to deps"
    - "vi.stubGlobal(IntersectionObserver) in beforeEach for jsdom component tests"

key-files:
  created:
    - client/src/__tests__/TableOfContents.test.tsx
  modified:
    - client/src/components/TableOfContents.tsx
    - client/src/App.tsx
    - client/src/components/SplitView.tsx

key-decisions:
  - "onHeadingClick prop delegates scroll responsibility to App.tsx — TableOfContents stays layout-only, no DOM side-effects when prop provided"
  - "data-pane attribute on SplitView panel wrappers enables scoped querySelector without threading refs through component tree"
  - "prevQueryRef tracks previous query in useEffect without adding expandFolder/activeTab to deps — same eslint-disable pattern already in codebase"
  - "IntersectionObserver stubbed via vi.stubGlobal in beforeEach — not in vitest setup file, keeps mock local to test file scope"

patterns-established:
  - "Callback prop pattern for DOM side-effects: components fire events, parents execute DOM operations"
  - "data-* attributes for DOM scoping in split-pane layouts"

requirements-completed: [SRCH-03]

# Metrics
duration: 2min
completed: 2026-03-10
---

# Phase 5 Plan 06: Search and Tags Gap Closure (Tree Reveal + TOC Split-View) Summary

**Tree auto-reveal on search clear via prevQueryRef useEffect, TOC split-view fix via onHeadingClick prop + data-pane scoped queries, 3 new unit tests**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-03-10T11:52:32Z
- **Completed:** 2026-03-10T11:54:27Z
- **Tasks:** 2 (TDD: RED commit + GREEN commit)
- **Files modified:** 4

## Accomplishments

- Tree auto-reveal: clearing the search box with an open file now expands that file's ancestor folders using `prevQueryRef` to detect query→empty transition
- TOC split-view fix: `tocContent` derived from focused pane (not always left/activeTab), `onHeadingClick` scopes scroll to `[data-pane]` container
- `TableOfContents.test.tsx` with 3 tests covering heading renders, onHeadingClick callback invocation, and empty content null return
- All 47 client tests and 26 server tests pass

## Task Commits

Each task was committed atomically:

1. **Task 1: Write failing tests for TableOfContents heading click behavior** - `1e1baf0` (test)
2. **Task 2: Fix TableOfContents + wire App.tsx** - `700d951` (feat)

_Note: TDD tasks — RED commit then GREEN commit_

## Files Created/Modified

- `client/src/__tests__/TableOfContents.test.tsx` - 3 unit tests; IntersectionObserver stub for jsdom
- `client/src/components/TableOfContents.tsx` - Added `onHeadingClick?: (id: string) => void` prop; conditional scroll dispatch
- `client/src/App.tsx` - `tocContent` derivation, `handleTocHeadingClick` with `data-pane` scoping, `prevQueryRef` + tree auto-reveal useEffect
- `client/src/components/SplitView.tsx` - Added `data-pane="left"` and `data-pane="right"` to panel wrappers

## Decisions Made

- `onHeadingClick` callback prop pattern: TableOfContents fires the event, App.tsx owns scroll logic. This keeps the component layout-only and testable without DOM side effects.
- `data-pane` DOM attribute over threading refs through SplitView props — two-line change, no interface modification needed.
- `prevQueryRef` to detect non-empty→empty transition without adding `expandFolder`/`activeTab` to useEffect deps — follows existing `eslint-disable-line react-hooks/exhaustive-deps` pattern in codebase.
- IntersectionObserver mocked locally in test file via `vi.stubGlobal` in `beforeEach`, not in global vitest setup — keeps scope tight and doesn't affect other test files.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added IntersectionObserver mock to TableOfContents tests**
- **Found during:** Task 1 (RED test run)
- **Issue:** jsdom doesn't implement IntersectionObserver; all 3 tests crashed with `ReferenceError: IntersectionObserver is not defined` before reaching assertions
- **Fix:** Added `vi.stubGlobal('IntersectionObserver', ...)` in `beforeEach` with matching `vi.unstubAllGlobals()` in `afterEach`
- **Files modified:** client/src/__tests__/TableOfContents.test.tsx
- **Verification:** Tests mount cleanly; only the `onHeadingClick` test fails RED (prop not yet on component)
- **Committed in:** 1e1baf0 (Task 1 test commit)

---

**Total deviations:** 1 auto-fixed (missing critical test infrastructure)
**Impact on plan:** Required for test harness to function. No scope creep.

## Issues Encountered

None beyond the IntersectionObserver stub (documented above as auto-fixed deviation).

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 5 gap closure plan 06 complete — SRCH-03 (tree auto-reveal) fully resolved
- Plan 07 closes TAG-03 gap (tag editor relocation to right TOC panel)
- After plan 07, phase 5 can be marked fully done

## Self-Check: PASSED

All created files confirmed on disk. Both task commits (1e1baf0, 700d951) confirmed in git log.

---
*Phase: 05-search-and-tags*
*Completed: 2026-03-10*
