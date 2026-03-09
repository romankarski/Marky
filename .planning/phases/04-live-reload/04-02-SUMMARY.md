---
phase: 04-live-reload
plan: 02
subsystem: api
tags: [chokidar, sse, server-sent-events, fastify, file-watcher, write-lock, live-reload]

# Dependency graph
requires:
  - phase: 04-live-reload
    provides: Plan 01 — failing watch.test.ts stubs for SSE endpoint and write-lock behavior
affects:
  - 04-live-reload Plan 03 (client useFileWatcher hook consumes GET /api/watch SSE stream)

# Tech tracking
tech-stack:
  added:
    - chokidar (v5, ESM-only FSWatcher, recursive directory monitoring)
  patterns:
    - "FileWatcherService singleton: FSWatcher + subscriber Set + locked Set — subscribe/lock/close API"
    - "Fastify raw SSE: reply.raw + setHeader + flushHeaders + await close Promise"
    - "Write-lock via FileWatcherService.lock(): TTL-based path suppression prevents self-triggered reloads"
    - "Fastify inject stream API: response.stream() not response.body for payloadAsStream:true responses"

key-files:
  created:
    - server/src/lib/watcher.ts
    - server/src/routes/watch.ts
  modified:
    - server/src/app.ts
    - server/src/routes/files.ts
    - server/tests/routes/watch.test.ts

key-decisions:
  - "FileWatcherService owns the lock (locked Set + lock() method) — avoids circular imports between watcher.ts and files.ts"
  - "Fastify inject payloadAsStream:true exposes stream via response.stream() not response.body — test stubs needed correction"
  - "chokidar v5 named imports only: import { watch, FSWatcher } from 'chokidar' — no default export"

patterns-established:
  - "SSE route uses reply.raw exclusively — Fastify's normal reply lifecycle bypassed, raw Node http response written directly"
  - "FileWatcherService.lock(path, ttlMs=200): add to locked Set, setTimeout to delete — caller doesn't manage cleanup"

requirements-completed:
  - LIVE-01
  - LIVE-02

# Metrics
duration: 3min
completed: 2026-03-09
---

# Phase 4 Plan 02: Server SSE Live Reload Summary

**Singleton FileWatcherService (chokidar v5) with subscriber pattern, raw SSE GET /api/watch route, and write-lock suppressing self-triggered reloads — all 12 server tests GREEN**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-09T16:32:15Z
- **Completed:** 2026-03-09T16:34:53Z
- **Tasks:** 2 completed
- **Files modified:** 5

## Accomplishments
- FileWatcherService: singleton chokidar FSWatcher with subscribe/lock/close API, change + add event emission to all subscribers
- GET /api/watch SSE route: raw Node http response with proper headers, flushHeaders, subscriber lifecycle tied to client connection
- Write-lock pattern: PUT route calls fileWatcher.lock(relativePath) before fs.writeFile, suppresses self-triggered SSE events for 200ms
- All 12 server tests pass: 4 pathSecurity + 5 files + 3 watch (LIVE-01 + LIVE-02)

## Task Commits

Each task was committed atomically:

1. **Task 1: FileWatcherService + SSE route + app.ts wiring** - `a4f7df4` (feat)
2. **Task 2: Write-lock in PUT route** - `0adb933` (feat)

## Files Created/Modified
- `server/src/lib/watcher.ts` - FileWatcherService class: singleton FSWatcher, subscriber Set, locked Set, subscribe/lock/close methods
- `server/src/routes/watch.ts` - GET /api/watch Fastify plugin: raw SSE route with flushHeaders and subscriber lifecycle
- `server/src/app.ts` - Wired FileWatcherService as fastify.fileWatcher decoration, onClose hook, watchRoutes registration
- `server/src/routes/files.ts` - Added fastify.fileWatcher.lock(relativePath) call before fs.writeFile in PUT handler
- `server/tests/routes/watch.test.ts` - Fixed response.stream() API usage (was incorrectly using response.body)

## Decisions Made
- FileWatcherService owns the lock set (not files.ts): avoids circular imports, keeps coupling clean — caller passes path, service manages TTL
- chokidar v5 is ESM-only with named exports: `import { watch, FSWatcher }` not default import
- Fastify inject `payloadAsStream: true` returns stream via `response.stream()` method, not `response.body` property — test stubs from Plan 01 had this wrong

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed watch.test.ts to use correct Fastify inject stream API**
- **Found during:** Task 1 (implementing SSE route)
- **Issue:** Plan 01 test stubs used `response.body.on('data', ...)` but Fastify inject with `payloadAsStream:true` sets body to undefined; the stream is accessed via `response.stream()` method
- **Fix:** Replaced all 3 instances of `response.body.on(...)` with `response.stream().on(...)` in watch.test.ts
- **Files modified:** server/tests/routes/watch.test.ts
- **Verification:** All 3 watch tests pass (was crashing with TypeError: Cannot read properties of undefined (reading 'on'))
- **Committed in:** a4f7df4 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 — bug in test stubs)
**Impact on plan:** Necessary correction to match the actual Fastify inject API. No scope creep — all planned behavior verified.

## Issues Encountered
- Test stubs from Plan 01 used `response.body` for stream access — this is the non-streaming API. With `payloadAsStream:true`, Fastify's light-my-request library exposes the readable stream via `response.stream()`. Fixed inline.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Server SSE infrastructure complete: GET /api/watch broadcasts file changes and new-file adds to all connected clients
- Write-lock prevents self-triggered reloads from app PUT saves
- Plan 03 can now implement `useFileWatcher` hook to consume GET /api/watch and dispatch SET_CONTENT to the tab store

---
*Phase: 04-live-reload*
*Completed: 2026-03-09*
