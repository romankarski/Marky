---
phase: 03-editor
plan: "04"
subsystem: ui
tags: [react, codemirror, react-resizable-panels, markdown, auto-save, dirty-state]

# Dependency graph
requires:
  - phase: 03-editor/03-03
    provides: MarkdownEditor component, useAutoSave hook, Tab type extended with dirty/editMode fields

provides:
  - EditorPane component — vertical split pane (preview + editor) wired to useAutoSave and dirty state
  - TabBar dirty indicator — orange dot when tab.dirty is true
  - TabBar confirm-on-close — window.confirm guard for dirty tabs

affects:
  - 03-editor/03-05 (Plan 05 replaces App.tsx inline rendering with EditorPane)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "EditorPane owns local editContent state; reducer tab.content is only written by SET_CONTENT (initial load), never per-keystroke"
    - "useAutoSave wired via stable onSaved useCallback — dispatches CLEAR_DIRTY after PUT completes"
    - "SET_DIRTY dispatched only on first keystroke (guarded by !tab.dirty)"
    - "TOGGLE_EDIT dispatched by Edit/Preview toolbar button"

key-files:
  created:
    - client/src/components/EditorPane.tsx
  modified:
    - client/src/components/TabBar.tsx

key-decisions:
  - "Local editContent state in EditorPane (not reducer) prevents cursor-jumping on every keystroke"
  - "useEffect re-initializes editContent on tab.id change (switching tabs resets editor content)"
  - "window.confirm for dirty-tab close guard matches Phase 1 pattern (window.prompt/confirm established in STATE.md)"
  - "useAutoSave always called (not conditionally) — safe because it debounces and only PUT fires if content changes"

patterns-established:
  - "EditorPane pattern: local edit state + dispatch actions for dirty/editMode lifecycle"

requirements-completed:
  - EDIT-01
  - EDIT-02
  - EDIT-03
  - EDIT-04

# Metrics
duration: 1min
completed: 2026-03-09
---

# Phase 03 Plan 04: EditorPane + TabBar Dirty State Summary

**EditorPane with vertical split pane (preview above, CodeMirror below), useAutoSave wired for PUT after 800ms, and TabBar orange-dot dirty indicator with confirm-on-close guard**

## Performance

- **Duration:** 1 min
- **Started:** 2026-03-09T13:51:28Z
- **Completed:** 2026-03-09T13:52:26Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- EditorPane component created: toolbar with Edit/Preview toggle dispatching TOGGLE_EDIT; preview-only default mode; vertical Group/Panel/Separator split when editMode:true
- Local editContent state initialized from tab.content on editMode activation; handleChange dispatches SET_DIRTY on first keystroke only
- useAutoSave wired with stable useCallback onSaved that dispatches CLEAR_DIRTY — dirty dot disappears after save
- TabBar updated: orange dot indicator between label and close button when tab.dirty; window.confirm guard blocks close if unsaved changes

## Task Commits

Each task was committed atomically:

1. **Task 1: Create EditorPane component** - `a03650a` (feat)
2. **Task 2: Update TabBar with dirty indicator and confirm-on-close** - `1884985` (feat)

**Plan metadata:** (created in final commit)

## Files Created/Modified
- `client/src/components/EditorPane.tsx` - Vertical split pane with preview + CodeMirror editor, toolbar toggle, useAutoSave integration
- `client/src/components/TabBar.tsx` - Added dirty-state dot indicator and confirm-on-close guard

## Decisions Made
- Local editContent state in EditorPane (not dispatcher) prevents cursor-jumping pitfall documented in RESEARCH.md
- useEffect depends on `[tab.id, tab.editMode]` to reset editor content when switching tabs or toggling edit mode
- onSaved wrapped in useCallback with [dispatch, tab.id] deps for stable reference that avoids infinite loops
- useAutoSave always invoked (not inside an if) — React rules of hooks; safe since debounce only triggers PUT when content changes

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- EditorPane ready to be integrated into App.tsx in Plan 05 (replaces inline preview rendering)
- TabBar dirty state fully operational — tested via existing 25-test suite (all pass)
- EDIT-01 through EDIT-04 requirements fulfilled

---
*Phase: 03-editor*
*Completed: 2026-03-09*
