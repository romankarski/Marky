---
phase: 05-search-and-tags
plan: 08
subsystem: ui
tags: [react, app-tsx, split-view, tag-filter, file-info, file-tree]

# Dependency graph
requires:
  - phase: 05-search-and-tags
    provides: TagFilter, FileInfo, FileTree, SearchPanel, and split-view infrastructure in App.tsx
provides:
  - TagFilter rendered above FileTree (directly below search input) in sidebar
  - FileInfo and currentFileTags driven by focused pane's active tab in split mode
  - Tree auto-reveal useEffect covering tab switch, file open, and pane focus change
affects: [05-search-and-tags]

# Tech tracking
tech-stack:
  added: []
  patterns: [activeFocusedTab derived variable pattern for split-mode pane awareness]

key-files:
  created: []
  modified:
    - client/src/App.tsx

key-decisions:
  - "activeFocusedTab derived variable: computed from splitMode + activePaneId to give a single source of truth for the focused pane's active tab; avoids scattering ternaries throughout JSX"
  - "currentFileTags moved after activeFocusedTab declaration: const initialisation order in JS function bodies is sequential — useMemo at line 34 cannot reference const at line 62 without a TDZ error at runtime"
  - "Single commit for Tasks 1 and 2: both tasks modify only App.tsx and Task 2 explicitly depends on activeFocusedTab from Task 1; atomic commit captures the coherent set of changes"

patterns-established:
  - "activeFocusedTab pattern: splitMode ? (activePaneId === 'right' ? rightTab : leftTab) : activeTab — reusable for any pane-aware derived value"
  - "Tree reveal useEffect: watches activeFocusedTab?.path, calls expandFolder(path) — keeps file tree always in sync with active file across tab switch, file open, pane focus"

requirements-completed:
  - SRCH-03
  - TAG-02
  - TAG-03

# Metrics
duration: 2min
completed: 2026-03-10
---

# Phase 5 Plan 08: UX Gap Closure — TagFilter Position, FileInfo Pane Awareness, Tree Auto-Reveal Summary

**Three App.tsx wiring fixes: TagFilter moved above FileTree, FileInfo driven by focused pane's tab in split mode, file tree ancestor expansion on every tab switch**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-03-10T13:29:40Z
- **Completed:** 2026-03-10T13:31:19Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments

- TagFilter pills now render directly below the search input, above the file tree — users can filter tags before browsing files
- In split view, FileInfo and tag display track the focused pane's active file instead of always showing the left pane's file
- New `activeFocusedTab` variable provides a single source of truth for the focused tab across single and split mode
- `useEffect` watching `activeFocusedTab?.path` expands ancestor folders automatically on every tab switch, file open, and pane focus change

## Task Commits

Each task was committed atomically:

1. **Task 1 + Task 2: TagFilter position, FileInfo pane awareness, tree auto-reveal** - `7647f04` (feat)

_Note: Tasks 1 and 2 share a single commit because Task 2 explicitly depends on `activeFocusedTab` introduced in Task 1, making them a single coherent change set._

## Files Created/Modified

- `client/src/App.tsx` - Added `activeFocusedTab`, moved `currentFileTags` useMemo after its dependency, moved TagFilter above FileTree in JSX, wired FileInfo to `activeFocusedTab?.path`, added tree auto-reveal useEffect

## Decisions Made

- `activeFocusedTab` derived variable introduced as a single source of truth: `splitMode ? (activePaneId === 'right' ? rightTab : leftTab) : activeTab` — avoids scattering pane ternaries throughout JSX and useMemo deps
- Fixed initialization order: `currentFileTags` useMemo moved to after `activeFocusedTab` declaration to avoid a temporal dead zone (TDZ) runtime error — TypeScript build passes either way but JS const semantics require sequential declaration
- Both tasks committed together: Task 2 depends on `activeFocusedTab` from Task 1; splitting commits would leave Task 1 in a broken intermediate state

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed `currentFileTags` declaration order to avoid TDZ runtime error**
- **Found during:** Task 1 (applying changes to App.tsx)
- **Issue:** Plan placed `currentFileTags` useMemo at line 34 before `activeFocusedTab` was declared at line 62. JavaScript `const` bindings are not hoisted — reading `activeFocusedTab` before its declaration causes a ReferenceError at runtime, even though the TypeScript compiler passes it
- **Fix:** Removed `currentFileTags` useMemo from its original position (before split-mode state), re-inserted it immediately after `activeFocusedTab` declaration (after line 64)
- **Files modified:** `client/src/App.tsx`
- **Verification:** Build passes clean; `activeFocusedTab` is in scope when useMemo references it
- **Committed in:** `7647f04` (task commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - Bug: initialization order)
**Impact on plan:** Fix was necessary for correct runtime behaviour. No scope creep.

## Issues Encountered

None beyond the initialization order issue documented above.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All three UX gaps from the Phase 5 human review are now closed: SRCH-03, TAG-02, TAG-03
- Phase 5 gap closure is complete; phase can now be marked done
- No blockers for phase completion

---
*Phase: 05-search-and-tags*
*Completed: 2026-03-10*
