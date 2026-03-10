---
phase: 04-live-reload
plan: 03
subsystem: ui
tags: [react, eventsource, sse, hooks, live-reload, file-deletion]

# Dependency graph
requires:
  - phase: 04-live-reload-02
    provides: SSE stream at /api/watch emitting named 'change' and 'add' events

provides:
  - useFileWatcher hook: EventSource listener + dirty-tab guard + editMode guard + SET_CONTENT dispatch + SET_DELETED dispatch + refetch wiring
  - App.tsx wired with useFileWatcher(tabs, dispatch, refetch)
  - File deletion UX: deleted Tab state + "file deleted" UI in EditorPane with Close tab button
  - Auto-save content sync: onSaved(content) passes saved content back to reducer via SET_CONTENT

affects: [04-live-reload-checkpoint, user-visible-feature, phase-05]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "tabsRef / refetchRef pattern: useRef keeps latest values without re-subscribing EventSource on tab changes"
    - "addEventListener('change') / addEventListener('add') / addEventListener('unlink') for named SSE events"
    - "Silent catch in fetch: preview stays stale on error rather than crashing"
    - "deleted tab state: SET_DELETED action marks tab as deleted, EditorPane renders fallback UI"
    - "onSaved(content) signature: auto-save callback passes saved content back to reduce SSE re-fetch bounce"

key-files:
  created:
    - client/src/hooks/useFileWatcher.ts
  modified:
    - client/src/App.tsx
    - client/src/hooks/__tests__/useFileWatcher.test.ts
    - client/src/types/tabs.ts
    - client/src/hooks/useTabs.ts
    - client/src/components/EditorPane.tsx
    - client/src/hooks/useAutoSave.ts
    - server/src/lib/watcher.ts

key-decisions:
  - "useFileWatcher uses addEventListener('change') and addEventListener('add') for named SSE event frames — not onmessage (which only fires for unnamed frames)"
  - "tabsRef pattern: mount-only useEffect with refs keeps EventSource stable while always seeing latest tabs"
  - "Test mock refactored from Object.assign type override (broken, Event.type is read-only) to addEventListener-based mock with regular function constructor"
  - "editMode guard added to live-reload skip condition: dirty OR editMode prevents SET_CONTENT overwriting mid-edit state"
  - "watcher.ts switched from glob pattern to directory watch + .md filter + unlink event to match actual chokidar API"
  - "onSaved(content) passes saved content back to reducer — prevents SET_CONTENT from server SSE bouncing back stale content after auto-save"

patterns-established:
  - "Ref-stabilized EventSource: single connection on mount, refs for fresh data access inside stale closures"
  - "Dirty-tab + editMode guard: live reload never overwrites unsaved or actively-edited content"
  - "deleted boolean on Tab: external file removal marks tab as deleted without closing it, shows fallback UI"

requirements-completed: [LIVE-01, LIVE-02]

# Metrics
duration: 15min
completed: 2026-03-09
---

# Phase 04 Plan 03: useFileWatcher Hook Summary

**React EventSource hook with tabsRef pattern, dirty+editMode guard, file-deletion UX, and auto-save content sync — completing the end-to-end live reload loop**

## Performance

- **Duration:** ~15 min (+ checkpoint fixes)
- **Started:** 2026-03-09T17:37:00Z
- **Completed:** 2026-03-09T17:41:00Z (human verified)
- **Tasks:** 3 of 3 (including checkpoint:human-verify)
- **Files modified:** 10

## Accomplishments
- useFileWatcher hook listens to /api/watch SSE stream; dispatches SET_CONTENT on 'change' events for open non-dirty, non-editing tabs
- refetch() called on 'add' and 'unlink' events to refresh sidebar file tree without page reload
- App.tsx wired to call useFileWatcher(tabs, dispatch, refetch) after useTabs + useFileTree
- File deletion handled end-to-end: watcher emits 'unlink', hook dispatches SET_DELETED, EditorPane shows "file deleted" fallback UI
- Auto-save content sync: onSaved(content) ensures reducer stays in sync after PUT, preventing SSE echo bounce

## Task Commits

Each task was committed atomically:

1. **Task 1: useFileWatcher hook** - `11d47bc` (feat + test fix)
2. **Task 2: Wire useFileWatcher into App.tsx** - `5807421` (feat)
3. **Task 3: Human verification + checkpoint fixes** - `31af158` (fix)

**Plan metadata:** (pending final docs commit)

## Files Created/Modified
- `client/src/hooks/useFileWatcher.ts` - EventSource hook with addEventListener, tabsRef pattern, dirty+editMode guard, unlink handler
- `client/src/App.tsx` - Added useFileWatcher import and call
- `client/src/hooks/__tests__/useFileWatcher.test.ts` - Fixed test mock + deleted field in makeTab
- `client/src/types/tabs.ts` - Added deleted field to Tab + SET_DELETED to TabAction union
- `client/src/hooks/useTabs.ts` - SET_DELETED reducer case; deleted:false in OPEN newTab init
- `client/src/components/EditorPane.tsx` - "file deleted" UI state with Close tab button; onSaved(content) signature
- `client/src/hooks/useAutoSave.ts` - onSaved(content) signature so caller receives saved content
- `client/src/hooks/__tests__/useAutoSave.test.ts` - Updated to pass enabled:true + new signature
- `client/src/__tests__/tabReducer-editor.test.ts` - Added deleted:false to makeTab fixture
- `client/src/__tests__/useTabs.test.ts` - Added dirty/editMode/deleted to makeTab fixture
- `server/src/lib/watcher.ts` - Directory watch + .md filter + unlink event; removed glob pattern

## Decisions Made
- Used `addEventListener('change')`, `addEventListener('add')`, `addEventListener('unlink')` rather than `onmessage`, matching named SSE event frames from server
- tabsRef / refetchRef pattern chosen to avoid re-creating EventSource on every tab state change
- editMode added to live-reload guard: prevents mid-edit content replacement even before dirty flag is set
- onSaved(content) signature chosen over void — caller gets saved content, enabling SET_CONTENT dispatch to keep reducer in sync

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed broken EventSource test mock**
- **Found during:** Task 1 (useFileWatcher hook, RED verification)
- **Issue:** Original mock used arrow function as constructor (TypeError) + `Object.assign` on read-only `Event.type` (TypeError)
- **Fix:** Rewrote mock as regular function constructor with addEventListener-based approach; updated test events to use `new MessageEvent('change', ...)` and direct listener invocation
- **Files modified:** `client/src/hooks/__tests__/useFileWatcher.test.ts`
- **Verification:** All 5 useFileWatcher tests pass
- **Committed in:** `11d47bc` (Task 1 commit)

**2. [Rule 1 - Bug] watcher.ts glob pattern broken — switched to directory watch + .md filter**
- **Found during:** Task 3 checkpoint (human verification)
- **Issue:** chokidar watch() was called with a glob string which doesn't work reliably; also lacked .md filter causing noise from non-markdown files; no unlink event
- **Fix:** Switched to watching rootDir as directory, added `if (!absPath.endsWith('.md')) return` filter, added ignored pattern for .git/node_modules/.planning, added 'unlink' event handler
- **Files modified:** `server/src/lib/watcher.ts`
- **Verification:** Server tests pass (12/12); live reload confirmed in app
- **Committed in:** `31af158` (Task 3 fix commit)

**3. [Rule 2 - Missing Critical] Added editMode guard to live-reload skip condition**
- **Found during:** Task 3 checkpoint (human verification — "no flash on auto-save" scenario)
- **Issue:** dirty flag is only set after first keystroke; if user clicks Edit but hasn't typed yet, a concurrent SSE change event would overwrite editor state
- **Fix:** Added `|| match.editMode` to skip condition in useFileWatcher.ts
- **Files modified:** `client/src/hooks/useFileWatcher.ts`
- **Verification:** Test for editMode guard passes; verified in app
- **Committed in:** `31af158`

**4. [Rule 1 - Bug] onSaved passed no content — auto-save could cause SSE echo bounce**
- **Found during:** Task 3 checkpoint (human verification — "no flash on auto-save" scenario)
- **Issue:** After auto-save writes the file, chokidar emits 'change' for that same file; without write-lock re-sync, the SSE event could dispatch SET_CONTENT with server content before the local state was updated, causing a visible flicker
- **Fix:** Changed `onSaved: () => void` to `onSaved: (content: string) => void`; useAutoSave passes the saved content back; EditorPane dispatches `SET_CONTENT` immediately on save so the reducer is already in sync when the SSE echo arrives (write-lock in Plan 02 prevents the echo, but this also ensures correctness if lock races)
- **Files modified:** `client/src/hooks/useAutoSave.ts`, `client/src/components/EditorPane.tsx`, `client/src/hooks/__tests__/useAutoSave.test.ts`
- **Verification:** No flash visible on auto-save; all 30 client tests pass
- **Committed in:** `31af158`

**5. [Rule 2 - Missing Critical] Added file deletion UX (SET_DELETED action + EditorPane fallback)**
- **Found during:** Task 3 checkpoint (during watcher.ts unlink fix — once unlink events existed, needed client handling)
- **Issue:** Deleting a watched file externally would leave a zombie tab with stale content and no indication to the user
- **Fix:** Added `deleted: boolean` to Tab type + SET_DELETED to TabAction; SET_DELETED reducer in useTabs.ts; EditorPane renders "file deleted" message with Close tab button when tab.deleted is true; useFileWatcher dispatches SET_DELETED + calls refetch() on 'unlink' events
- **Files modified:** `client/src/types/tabs.ts`, `client/src/hooks/useTabs.ts`, `client/src/components/EditorPane.tsx`, `client/src/hooks/useFileWatcher.ts`, test fixtures
- **Verification:** All 30 client + 12 server tests pass
- **Committed in:** `31af158`

---

**Total deviations:** 5 auto-fixed (1x Rule 1 test mock, 1x Rule 1 watcher glob bug, 1x Rule 2 editMode guard, 1x Rule 1 auto-save content sync, 1x Rule 2 file deletion UX)
**Impact on plan:** All fixes necessary for correctness or user-visible completeness. Deletion UX and editMode guard are correctness requirements for live reload. No scope creep.

## Issues Encountered
- Test stubs written in Plan 02 (RED phase) had two constructor/read-only-property bugs that prevented any tests from running. Fixed inline under Rule 1 during Task 1 implementation.
- chokidar glob pattern in watcher.ts did not match the chokidar API for directory watching — required switching to directory path with manual filter.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Complete live-reload loop implemented and human-verified: chokidar (server) + SSE stream (server) + useFileWatcher (client)
- File deletion handled end-to-end with user-friendly fallback UI
- All 42 tests (30 client + 12 server) green
- Phase 4 is complete — ready for Phase 5

---
*Phase: 04-live-reload*
*Completed: 2026-03-09*
