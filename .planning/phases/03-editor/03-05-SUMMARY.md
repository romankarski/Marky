---
phase: 03-editor
plan: "05"
subsystem: ui
tags: [react, split-view, react-resizable-panels, editor, codemirror]

# Dependency graph
requires:
  - phase: 03-editor-04
    provides: EditorPane component with edit/preview toggle and dirty state
  - phase: 03-editor-03
    provides: useAutoSave hook with debounced PUT saves
  - phase: 03-editor-02
    provides: CodeMirror editor integration and TabBar dirty indicator
  - phase: 03-editor-01
    provides: Tab type extensions (dirty, editMode fields)
provides:
  - SplitView component with horizontal two-pane split using react-resizable-panels v4
  - App.tsx wired with EditorPane in single-pane mode and SplitView in split mode
  - Independent per-pane tab focus tracking via rightActiveTabId + rightDispatch
  - Split toggle button in tab bar row (single-pane ↔ split-pane)
  - Drag-to-move tabs between split panes
  - All Phase 3 editor requirements EDIT-01 through EDIT-05 and VIEW-05 delivered
affects: [phase-04-search, phase-05-launch]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Per-pane focus isolation: rightActiveTabId in App.tsx local state; rightDispatch intercepts FOCUS actions, passes all others to shared reducer"
    - "Drag-to-move tabs between panes using existing @dnd-kit/sortable DnD — file tree drops populate right pane focus"
    - "react-resizable-panels v4 Group/Panel/Separator API for resizable split layout"

key-files:
  created:
    - client/src/components/SplitView.tsx
  modified:
    - client/src/App.tsx

key-decisions:
  - "Per-pane focus isolation: rightActiveTabId local to App.tsx, rightDispatch intercepts FOCUS to set it; all other actions (CLOSE, SET_DIRTY, SET_CONTENT) pass to shared reducer"
  - "Split tab bars rendered per pane (not shared) so each pane has independent tab selection"
  - "useAutoSave guarded to only fire when editMode is active and user has made changes — prevents spurious saves on tab switch"
  - "Exit-split merges left + right pane focus to left pane for clean single-pane state"

patterns-established:
  - "Split pane pattern: two EditorPane instances inside Group/Panel/Separator, each with own Tab prop and own dispatch wrapper"
  - "Per-pane dispatch: dispatch wrapper intercepts action.type === 'FOCUS' to local state, delegates everything else"

requirements-completed: [VIEW-05, EDIT-05]

# Metrics
duration: ~45min
completed: 2026-03-09
---

# Phase 3 Plan 05: SplitView + App.tsx Wiring Summary

**Horizontal split-screen editing with independent per-pane tab focus, drag-to-move tabs between panes, and complete Phase 3 EDIT/VIEW requirement delivery**

## Performance

- **Duration:** ~45 min
- **Started:** 2026-03-09
- **Completed:** 2026-03-09
- **Tasks:** 2 (1 auto + 1 human-verify checkpoint)
- **Files modified:** 2

## Accomplishments

- Created SplitView.tsx using react-resizable-panels v4 Group/Panel/Separator with two independent EditorPane instances
- Wired App.tsx with split toggle button, rightActiveTabId local state, and rightDispatch interceptor for per-pane focus isolation
- Added drag-to-move tabs between split panes via @dnd-kit
- Fixed useAutoSave to guard against spurious saves when editMode is inactive
- Human approved all Phase 3 requirements: EDIT-01 through EDIT-05 and VIEW-05

## Task Commits

Each task was committed atomically:

1. **Task 1: Create SplitView and wire EditorPane into App.tsx** - `8de3163` (feat)
2. **[Auto-fix] Add drag-to-move tabs between split panes** - `d8446bb` (feat)
3. **[Auto-fix] Separate tab bars per pane in split mode; fix exit-split merging** - `c5a581b` (fix)
4. **[Auto-fix] Guard useAutoSave — only fire when editMode active and user has made changes** - `83a8249` (fix)

## Files Created/Modified

- `client/src/components/SplitView.tsx` - Horizontal two-pane split using react-resizable-panels v4; renders two EditorPane instances inside Group/Panel/Separator
- `client/src/App.tsx` - Split toggle button; rightActiveTabId local state; rightDispatch interceptor; conditional single-pane vs split-pane rendering

## Decisions Made

- Per-pane focus isolation via `rightActiveTabId` in App.tsx local state and a `rightDispatch` wrapper that intercepts `FOCUS` actions and routes them to `setRightActiveTabId`, passing all other actions to the shared reducer. This matches RESEARCH.md Pitfall 4 recommendation.
- Split renders two full TabBars (one per pane) so each pane has independent tab selection without any shared state conflict.
- `useAutoSave` guarded to only fire when `editMode` is `true` and the user has made changes — prevents spurious PUT saves on tab switches.
- Exit-split merges left + right active tab ID into a single left-pane focus for a clean return to single-pane mode.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added drag-to-move tabs between split panes**
- **Found during:** Task 1 (SplitView wiring)
- **Issue:** With two TabBars sharing the same tab list, users needed a way to move a tab from one pane to the other — otherwise split view was awkward to populate
- **Fix:** Extended existing @dnd-kit/sortable DnD to support cross-pane tab drops; drag from one TabBar to the other moves the tab's focus to the target pane
- **Files modified:** client/src/App.tsx, client/src/components/SplitView.tsx
- **Verification:** Drag-and-drop between panes works; existing single-pane reorder unaffected
- **Committed in:** d8446bb

**2. [Rule 1 - Bug] Fixed split tab bars and exit-split merging**
- **Found during:** Task 1 post-implementation review
- **Issue:** Initial implementation used a shared TabBar which did not provide independent tab selection per pane; also exit-split left stale rightActiveTabId
- **Fix:** Rendered separate TabBar per pane; added exit-split merge logic to collapse right pane focus into left
- **Files modified:** client/src/App.tsx
- **Verification:** Each pane tab bar operates independently; split toggle cleans up state correctly
- **Committed in:** c5a581b

**3. [Rule 1 - Bug] Guarded useAutoSave to only fire in editMode**
- **Found during:** Task 1 integration testing
- **Issue:** useAutoSave was firing PUT saves on every tab switch even when editMode was false, causing unnecessary network requests
- **Fix:** Added `editMode` guard to useAutoSave — only schedules debounced save when editMode is active and content has changed from the persisted value
- **Files modified:** client/src/hooks/useAutoSave.ts (or EditorPane.tsx where the hook is called)
- **Verification:** Network tab shows PUT only fires after actual edits with editMode on
- **Committed in:** 83a8249

---

**Total deviations:** 3 auto-fixed (1 missing critical, 2 bugs)
**Impact on plan:** All auto-fixes necessary for correct UX and correctness. No scope creep.

## Issues Encountered

None beyond the auto-fixed items above.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All Phase 3 editor requirements complete and human-verified: EDIT-01 through EDIT-05, VIEW-05
- Phase 3 complete — ready to proceed to Phase 4 (Full-Text Search)
- No blockers

---
*Phase: 03-editor*
*Completed: 2026-03-09*
