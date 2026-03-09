---
phase: 04-live-reload
plan: 03
subsystem: ui
tags: [react, eventsource, sse, hooks, live-reload]

# Dependency graph
requires:
  - phase: 04-live-reload-02
    provides: SSE stream at /api/watch emitting named 'change' and 'add' events

provides:
  - useFileWatcher hook: EventSource listener + dirty-tab guard + SET_CONTENT dispatch + refetch wiring
  - App.tsx wired with useFileWatcher(tabs, dispatch, refetch)

affects: [04-live-reload-checkpoint, user-visible-feature]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "tabsRef / refetchRef pattern: useRef keeps latest values without re-subscribing EventSource on tab changes"
    - "addEventListener('change') / addEventListener('add') for named SSE events (not onmessage)"
    - "Silent catch in fetch: preview stays stale on error rather than crashing"

key-files:
  created:
    - client/src/hooks/useFileWatcher.ts
  modified:
    - client/src/App.tsx
    - client/src/hooks/__tests__/useFileWatcher.test.ts

key-decisions:
  - "useFileWatcher uses addEventListener('change') and addEventListener('add') for named SSE event frames — not onmessage (which only fires for unnamed frames)"
  - "tabsRef pattern: mount-only useEffect with refs keeps EventSource stable while always seeing latest tabs"
  - "Test mock refactored from Object.assign type override (broken, Event.type is read-only) to addEventListener-based mock with regular function constructor"

patterns-established:
  - "Ref-stabilized EventSource: single connection on mount, refs for fresh data access inside stale closures"
  - "Dirty-tab guard: live reload never overwrites unsaved edits (tab.dirty === true blocks SET_CONTENT)"

requirements-completed: [LIVE-01, LIVE-02]

# Metrics
duration: 15min
completed: 2026-03-09
---

# Phase 04 Plan 03: useFileWatcher Hook Summary

**React hook using EventSource with addEventListener for named SSE events, tabsRef pattern for stable subscription, and dirty-tab guard protecting unsaved edits**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-03-09T17:37:00Z
- **Completed:** 2026-03-09T17:39:45Z
- **Tasks:** 2 of 3 (Task 3 is checkpoint:human-verify)
- **Files modified:** 3

## Accomplishments
- useFileWatcher hook listens to /api/watch SSE stream; dispatches SET_CONTENT on 'change' events for open non-dirty tabs
- refetch() called on 'add' events to refresh sidebar file tree without page reload
- App.tsx wired to call useFileWatcher(tabs, dispatch, refetch) after useTabs + useFileTree

## Task Commits

Each task was committed atomically:

1. **Task 1: useFileWatcher hook** - `11d47bc` (feat + test fix)
2. **Task 2: Wire useFileWatcher into App.tsx** - `5807421` (feat)

**Plan metadata:** (pending after checkpoint)

## Files Created/Modified
- `client/src/hooks/useFileWatcher.ts` - EventSource hook with addEventListener, tabsRef pattern, dirty-tab guard
- `client/src/App.tsx` - Added useFileWatcher import and call
- `client/src/hooks/__tests__/useFileWatcher.test.ts` - Fixed test mock (addEventListener-based, proper constructor)

## Decisions Made
- Used `addEventListener('change')` and `addEventListener('add')` rather than `onmessage`, matching named SSE event frames from server
- tabsRef / refetchRef pattern chosen to avoid re-creating EventSource on every tab state change

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed broken EventSource test mock**
- **Found during:** Task 1 (useFileWatcher hook, RED verification)
- **Issue 1:** Original mock used `vi.fn().mockImplementation(arrowFn)` called with `new` — arrow functions cannot be constructors, throws TypeError
- **Issue 2:** Tests used `Object.assign(new MessageEvent('message', ...), { type: 'change' })` — `Event.type` is a read-only getter, throws TypeError
- **Fix:** Rewrote mock as a regular function constructor using `Object.defineProperty`-style, then switched to `addEventListener`-based approach (regular function + `this.addEventListener = ...`). Updated test event creation to use `new MessageEvent('change', ...)` and triggers to call `mockListeners['change']?.(event)` directly
- **Files modified:** `client/src/hooks/__tests__/useFileWatcher.test.ts`
- **Verification:** All 5 useFileWatcher tests pass, 30 total client tests green
- **Committed in:** `11d47bc` (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - bug in test mock stubs written in Plan 02)
**Impact on plan:** Required fix to make tests runnable — no scope creep. The SSE named event approach (addEventListener) matches what the plan's action code specified; only the test harness needed correction.

## Issues Encountered
- Test stubs written in Plan 02 (RED phase) had two constructor/read-only-property bugs that prevented any tests from running. Fixed inline under Rule 1 during Task 1 implementation.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Complete live-reload loop implemented: chokidar (server) + SSE stream (server) + useFileWatcher (client)
- Awaiting human verification at Task 3 checkpoint: external write refreshes preview, new files appear in sidebar, dirty-tab guard holds, no flash on auto-save
- After checkpoint approval, Phase 4 is complete

---
*Phase: 04-live-reload*
*Completed: 2026-03-09*
