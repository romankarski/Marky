---
phase: 04-live-reload
plan: 01
subsystem: testing
tags: [vitest, sse, eventsource, tdd, server-sent-events, wave-0]

# Dependency graph
requires:
  - phase: 03-editor
    provides: Tab/TabState/TabAction types, useTabs reducer pattern, client test infrastructure with @testing-library/react
provides:
  - Failing SSE integration test stubs for GET /api/watch (3 tests) driving Plan 02
  - Failing unit test stubs for useFileWatcher hook (5 tests) driving Plan 03
affects:
  - 04-live-reload Plan 02 (server SSE implementation must make watch.test.ts pass)
  - 04-live-reload Plan 03 (client hook implementation must make useFileWatcher.test.ts pass)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "SSE testing via app.inject with payloadAsStream:true — collect stream data events, use real timers + setTimeout(150ms)"
    - "EventSource mock via vi.stubGlobal with mockListeners record for simulating SSE message/error events in jsdom"

key-files:
  created:
    - server/tests/routes/watch.test.ts
    - client/src/hooks/__tests__/useFileWatcher.test.ts
  modified: []

key-decisions:
  - "Real timers (not vi.useFakeTimers) for SSE server tests — chokidar filesystem events require real async IO"
  - "EventSource mock uses vi.stubGlobal to make browser API available in jsdom test environment"
  - "SSE change vs add event type differentiated via Object.assign on MessageEvent to set the type field"

patterns-established:
  - "Wave 0 TDD: test stubs written first (RED), implementation follows in later plans (GREEN)"
  - "Server SSE test pattern: buildApp in beforeEach with tmpDir, payloadAsStream:true, collect data events, await setTimeout(200ms)"
  - "Client SSE hook test pattern: vi.stubGlobal EventSource mock, mockListeners record, simulate via mockListeners.message(event)"

requirements-completed:
  - LIVE-01
  - LIVE-02

# Metrics
duration: 2min
completed: 2026-03-09
---

# Phase 4 Plan 01: Wave 0 Test Stubs Summary

**Failing integration tests for SSE /api/watch (server) and useFileWatcher hook (client) — 8 stub tests that precisely describe LIVE-01/LIVE-02 behavior before any implementation begins**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-09T16:28:10Z
- **Completed:** 2026-03-09T16:30:10Z
- **Tasks:** 2 completed
- **Files modified:** 2

## Accomplishments
- Created 3 failing server SSE integration tests covering LIVE-02 (file change/add detection) and LIVE-01 (write-lock guard)
- Created 5 failing client unit tests covering LIVE-01 (SET_CONTENT dispatch, dirty-tab guard, path matching, unmount cleanup) and LIVE-02 (refetch on add)
- All 34 pre-existing tests (server + client) still pass — no regressions

## Task Commits

Each task was committed atomically:

1. **Task 1: Server SSE test stubs (watch.test.ts)** - `bc7fa2c` (test)
2. **Task 2: Client hook unit test stubs (useFileWatcher.test.ts)** - `1030fb6` (test)

## Files Created/Modified
- `server/tests/routes/watch.test.ts` - 3 failing integration tests for GET /api/watch SSE endpoint (404 until Plan 02)
- `client/src/hooks/__tests__/useFileWatcher.test.ts` - 5 failing unit tests for useFileWatcher hook (missing module until Plan 03)

## Decisions Made
- Real timers used for server SSE tests — chokidar filesystem events are genuinely async IO, fake timers would not work
- EventSource mocked via vi.stubGlobal rather than a jest-environment-dom mock — simpler, matches existing client test patterns
- SSE event types (change vs add) differentiated via Object.assign on MessageEvent to override the type property — jsdom MessageEvent constructor doesn't support custom type names

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Plan 02 can now target watch.test.ts as its verification command: `npm test --workspace=server 2>&1 | grep watch.test`
- Plan 03 can now target useFileWatcher.test.ts as its verification command: `npm test --workspace=client 2>&1 | grep useFileWatcher.test`
- Both test files compile cleanly — failures are on missing implementation, not syntax errors

---
*Phase: 04-live-reload*
*Completed: 2026-03-09*
