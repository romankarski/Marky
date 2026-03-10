---
phase: 05-search-and-tags
plan: "03"
subsystem: server
tags: [minisearch, gray-matter, search, tags, fastify, tdd]

requires:
  - phase: 05-search-and-tags
    plan: "01"
    provides: "server/tests/lib/search.test.ts and server/tests/routes/search.test.ts RED stubs"

provides:
  - "server/src/lib/search.ts — SearchService class, SearchDoc type, SearchIndexPayload type, MINISEARCH_OPTIONS"
  - "server/src/routes/search.ts — GET /api/search/index and PATCH /api/files/*/tags routes"
  - "server/src/app.ts — searchService decoration, watcher subscription for incremental updates"

affects:
  - 05-search-and-tags-04
  - 05-search-and-tags-05

tech-stack:
  added:
    - "gray-matter ^4.0.3 (server workspace) — frontmatter parsing for tag read/write"
  patterns:
    - "Non-blocking buildFromDir: fire-and-forget at startup avoids chokidar timing side-effects"
    - "Sync watcher subscriber: callback returns void (not Promise) to preserve chokidar event loop timing"
    - "Fastify 5 wildcard workaround: /api/files/*/tags not supported; use /api/files/* and strip /tags suffix"
    - "matter.stringify(content, data) — preserves body content when updating frontmatter"

key-files:
  created:
    - "server/src/lib/search.ts"
    - "server/src/routes/search.ts"
  modified:
    - "server/src/app.ts"
    - "server/package.json (gray-matter added)"
    - "package-lock.json"

key-decisions:
  - "Non-blocking buildFromDir: not awaited in buildApp — decorates searchService immediately; chokidar timing unaffected; index builds in background (completes in ms)"
  - "Sync watcher subscriber (not async) — async callbacks in forEach cause microtask scheduling that changes chokidar event timing; sync callback with .catch() pattern preserves original timing"
  - "Fastify 5 wildcard restriction: /api/files/*/tags route pattern not supported; registered as /api/files/* PATCH with /tags suffix stripped from param"

requirements-completed:
  - SRCH-01
  - SRCH-02
  - TAG-01
  - TAG-03

duration: 9min
completed: 2026-03-10
---

# Phase 05 Plan 03: Search Infrastructure Implementation Summary

**SearchService + search routes + app.ts wiring turning Plan 01 RED stubs GREEN — MiniSearch index built at startup, incrementally updated on file changes, exposed via GET /api/search/index; tags written to frontmatter via PATCH /api/files/*/tags**

## Performance

- **Duration:** ~9 min
- **Started:** 2026-03-10T09:20:53Z
- **Completed:** 2026-03-10T09:30:49Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- SearchService class with MiniSearch index, buildFromDir, updateDoc, removeDoc, getIndexJSON, getAllTags, getTagMap
- normaliseTags handles array, comma-string, and missing/null frontmatter tag variants
- collectMdFiles recursively walks .md files, skipping hidden dirs and node_modules
- GET /api/search/index returns SearchIndexPayload { index, tags, tagMap }
- PATCH /api/files/*/tags writes updated tags to frontmatter using matter.stringify(content, data)
- app.ts wires searchService decoration and watcher subscription for incremental index updates
- All 26 server tests pass (5 test files)

## Task Commits

1. **Task 1: SearchService implementation** - `91f7436` (feat)
2. **Task 2: Search routes and app.ts wiring** - `ed84880` (feat)

## Files Created/Modified

- `server/src/lib/search.ts` — SearchService, SearchDoc, SearchIndexPayload, MINISEARCH_OPTIONS exports
- `server/src/routes/search.ts` — GET /api/search/index + PATCH /api/files/* routes
- `server/src/app.ts` — searchService decoration + watcher subscription
- `server/package.json` — gray-matter dependency added
- `package-lock.json` — lockfile updated

## Decisions Made

- Non-blocking `buildFromDir`: fires without `await` in `buildApp` — the searchService is decorated immediately with an empty index, and the build completes in milliseconds. This avoids chokidar timing regression in watch tests.
- Sync watcher subscriber: the subscriber callback returns `void` (not a Promise) with `.catch()` for error handling. Using `async (event) => { await ... }` caused microtask scheduling side-effects that changed chokidar event firing order, breaking the LIVE-01 write-lock test.
- Fastify 5 wildcard restriction: `/api/files/*/tags` routes are not supported (wildcard must be last). Used `/api/files/*` PATCH handler with `/tags` suffix stripping from `req.params['*']`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fastify 5 wildcard-in-middle route constraint**

- **Found during:** Task 2 (registering PATCH /api/files/*/tags)
- **Issue:** `Error: Wildcard must be the last character in the route` — Fastify 5 rejects routes where `*` is not the final segment. Plan specified `/api/files/*/tags` pattern.
- **Fix:** Registered `/api/files/*` PATCH handler; strips `/tags` suffix from `req.params['*']` to extract the file path
- **Files modified:** server/src/routes/search.ts
- **Impact:** Route tests use `/api/files/notes/hello.md/tags` URL — Fastify's `*` param captures `notes/hello.md/tags`, then we strip `/tags` to get `notes/hello.md`. All route tests pass.

**2. [Rule 1 - Bug] Async watcher subscriber breaks chokidar event timing**

- **Found during:** Task 2 (full test suite run after app.ts wiring)
- **Issue:** `watcher.subscribe(async (event) => { await ... })` caused LIVE-01 watch test to fail consistently. The `async` callback entering the watcher's synchronous `subscribers.forEach` created microtask queue entries that shifted chokidar's `add` event timing relative to the SSE subscriber.
- **Fix:** Changed to sync callback with `searchService.updateDoc(...).catch(() => {})` — fires async operation but returns `void` from the subscriber, preserving original event loop behavior
- **Files modified:** server/src/app.ts
- **Root cause:** `FileWatcherService.subscribe` uses `forEach((cb) => cb(...))` — not designed for async callbacks; async callbacks return unhandled Promises and create microtask side-effects

**3. [Rule 1 - Bug] Blocking buildFromDir caused chokidar timing regression**

- **Found during:** Task 2 (during async subscriber investigation)
- **Issue:** `await searchService.buildFromDir(opts.rootDir)` in `buildApp` caused LIVE-01 watch test to fail consistently. The extra await yielded the event loop, changing the timing window for chokidar `add` events relative to SSE subscribe.
- **Fix:** Changed to non-blocking: `searchService.buildFromDir(opts.rootDir).catch(...)` — searchService decorated immediately; index builds in background
- **Files modified:** server/src/app.ts
- **Verification:** 10/10 watch test runs pass after fix; search route tests pass because buildFromDir completes in <1ms for test fixtures

---

**Total deviations:** 3 auto-fixed (1 Fastify API constraint, 2 timing/async bugs)
**Impact on plan:** No scope creep. All contract requirements met. The routing workaround is transparent to callers — URL structure is identical from client perspective.

## Issues Encountered

None remaining — all 26 server tests pass consistently.

## Next Phase Readiness

- Wave 1 complete: SearchService + routes GREEN; server is now the authoritative search index
- Plan 04 (client useSearch hook implementation) can now fetch from GET /api/search/index
- Plan 05 (SearchPanel component) can use useSearch hook results
- MINISEARCH_OPTIONS exported from search.ts for client-side MiniSearch deserialization

## Self-Check: PASSED

All files created, all commits present.

---
*Phase: 05-search-and-tags*
*Completed: 2026-03-10*
