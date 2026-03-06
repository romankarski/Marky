---
phase: 02-browser-shell
plan: 03
subsystem: ui
tags: [react, dnd-kit, tailwind, tabs, drag-to-reorder]

# Dependency graph
requires:
  - phase: 02-browser-shell plan 01
    provides: Tab and TabAction types from client/src/types/tabs.ts
provides:
  - TabBar component with dnd-kit sortable drag-to-reorder, orange active accent, close buttons
  - WelcomeScreen empty state with Marky branding shown when no tabs are open
affects: [02-04-PLAN, 02-05-PLAN, App.tsx integration]

# Tech tracking
tech-stack:
  added: ["@dnd-kit/utilities (CSS.Transform helper for sortable items)"]
  patterns:
    - "SortableTab inner component pattern: useSortable hook per item, DndContext wraps the list"
    - "stopPropagation on close button pointerDown prevents dnd-kit treating close as drag start"
    - "TabBar returns null when empty; parent renders WelcomeScreen instead"

key-files:
  created:
    - client/src/components/TabBar.tsx
    - client/src/components/WelcomeScreen.tsx
  modified:
    - client/package.json (added @dnd-kit/utilities)

key-decisions:
  - "@dnd-kit/utilities installed separately — not bundled with @dnd-kit/sortable; required for CSS.Transform.toString"
  - "arrayMove not imported in TabBar — reducer owns reorder logic, component only dispatches indices"
  - "Close button onPointerDown stopPropagation prevents dnd-kit drag initiation on close click"

patterns-established:
  - "SortableTab pattern: useSortable per item, style object from CSS.Transform, spread attributes+listeners on wrapper"
  - "Empty state pattern: TabBar returns null when tabs empty; WelcomeScreen is a zero-prop sibling rendered by App"

requirements-completed: [VIEW-02, VIEW-03, VIEW-04, DSNG-02, DSNG-03]

# Metrics
duration: 5min
completed: 2026-03-06
---

# Phase 2 Plan 03: TabBar and WelcomeScreen Summary

**TabBar with dnd-kit sortable drag-to-reorder (orange active accent, close buttons) and WelcomeScreen Marky-branded empty state**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-03-06T21:20:00Z
- **Completed:** 2026-03-06T21:21:24Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- TabBar renders one SortableTab per open file with stable UUID-based IDs for dnd-kit
- Active tab identified by orange bottom border (border-orange-500); close button visibility handled via CSS group-hover
- DragEnd handler computes from/to indices and dispatches REORDER action to useTabs reducer
- WelcomeScreen shows orange M logo mark, app name, and subtitle — renders when tabs array is empty

## Task Commits

Each task was committed atomically:

1. **Task 1: TabBar component with dnd-kit sortable** - `38f92e1` (feat)
2. **Task 2: WelcomeScreen component** - `4f740ae` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `client/src/components/TabBar.tsx` - Horizontal tab strip with DndContext, SortableContext, per-tab useSortable; dispatches FOCUS, CLOSE, REORDER
- `client/src/components/WelcomeScreen.tsx` - Zero-prop empty state with orange logo mark and Marky branding
- `client/package.json` - Added @dnd-kit/utilities dependency for CSS.Transform helper

## Decisions Made
- Installed `@dnd-kit/utilities` (not bundled with sortable) — required for `CSS.Transform.toString` in SortableTab style
- `arrayMove` not imported in TabBar: the reducer owns tab reorder logic; TabBar only dispatches `{ type: 'REORDER', from, to }` with computed indices
- Close button uses `onPointerDown` stopPropagation (not just `onClick`) to prevent dnd-kit from interpreting a close click as a drag start

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Installed missing @dnd-kit/utilities**
- **Found during:** Task 1 (TabBar component)
- **Issue:** Plan used `CSS.Transform.toString` from `@dnd-kit/utilities` which was not in package.json
- **Fix:** `npm install --workspace=client @dnd-kit/utilities`
- **Files modified:** client/package.json, package-lock.json
- **Verification:** TypeScript import resolves, `npx tsc --noEmit` passes with no errors
- **Committed in:** 38f92e1 (Task 1 commit)

**2. [Rule 1 - Bug] Removed unused arrayMove import**
- **Found during:** Task 1 (TabBar component)
- **Issue:** Plan skeleton imported arrayMove from @dnd-kit/sortable but TabBar never calls it (reducer owns reorder); TypeScript strict mode would flag unused import
- **Fix:** Removed arrayMove from the import statement
- **Files modified:** client/src/components/TabBar.tsx
- **Verification:** No TypeScript errors
- **Committed in:** 38f92e1 (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (1 blocking dependency install, 1 bug/unused import cleanup)
**Impact on plan:** Both fixes necessary for correctness. No scope creep.

## Issues Encountered
None beyond the deviations documented above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- TabBar and WelcomeScreen are ready for wiring into App.tsx (Plan 04)
- Both components accept the same `dispatch` from `useTabs()` hook established in Plan 01
- No blockers

---
*Phase: 02-browser-shell*
*Completed: 2026-03-06*
