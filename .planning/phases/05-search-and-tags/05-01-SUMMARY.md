---
phase: 05-search-and-tags
plan: "01"
subsystem: testing
tags: [minisearch, tdd, vitest, search, tags, frontmatter]

requires:
  - phase: 04-live-reload
    provides: buildApp factory, FileWatcherService, tmpDir fixture pattern

provides:
  - "server/tests/lib/search.test.ts — failing RED test stubs for SearchService (SRCH-01, SRCH-02, TAG-01)"
  - "server/tests/routes/search.test.ts — failing RED route integration test stubs (SRCH-01 via route, TAG-03)"
  - "minisearch installed in server workspace"

affects:
  - 05-search-and-tags-03

tech-stack:
  added:
    - "minisearch ^3.x (server workspace) — full-text search index"
  patterns:
    - "Wave 0 TDD: test stubs written before implementation; import errors = RED state"
    - "MiniSearch.loadJSON in tests to deserialize SearchService index and verify search"
    - "buildApp + tmpDir fixture pattern reused from watch.test.ts"

key-files:
  created:
    - "server/tests/lib/search.test.ts"
    - "server/tests/routes/search.test.ts"
  modified:
    - "server/package.json (minisearch dependency added)"
    - "package-lock.json"

key-decisions:
  - "MiniSearch.loadJSON used in unit tests to verify search correctness without adding .search() to SearchService API"
  - "Route test stubs use /api/files/notes/hello.md/tags (slashes in Fastify wildcard * param) not URL-encoded form"
  - "minisearch installed as dependency (not devDependency) — will be used at runtime in SearchService"

patterns-established:
  - "Wave 0 TDD stub pattern: import from non-existent module = RED; no stub code in test itself"
  - "MiniSearch deserialization pattern: getIndexJSON() + MiniSearch.loadJSON() in tests decouples test from internal SearchService storage"

requirements-completed:
  - SRCH-01
  - SRCH-02
  - TAG-01
  - TAG-03

duration: 10min
completed: 2026-03-10
---

# Phase 05 Plan 01: Search and Tags Wave 0 TDD Stubs Summary

**Failing RED test stubs for SearchService unit tests and route integration tests using MiniSearch, covering SRCH-01, SRCH-02, TAG-01, TAG-03**

## Performance

- **Duration:** ~10 min
- **Started:** 2026-03-10T09:14:41Z
- **Completed:** 2026-03-10T09:26:00Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- SearchService unit test stubs in RED state covering buildFromDir, getAllTags, getTagMap, updateDoc, removeDoc
- Route integration test stubs in RED state covering GET /api/search/index and PATCH /api/files/*/tags
- MiniSearch installed in server workspace — available for Plan 03 implementation
- Established clean SearchService contract: getIndexJSON() + MiniSearch.loadJSON() decouples tests from internal storage

## Task Commits

1. **Task 1: Write failing SearchService unit test stubs** - `e788a1a` (test)
2. **Task 2: Write failing route integration test stubs** - `0596967` (test)

## Files Created/Modified

- `server/tests/lib/search.test.ts` — SearchService unit stubs (SRCH-01, SRCH-02, TAG-01), RED state via import error
- `server/tests/routes/search.test.ts` — Route integration stubs (SRCH-01, TAG-03), RED state via 404s
- `server/package.json` — minisearch dependency added
- `package-lock.json` — lockfile updated

## Decisions Made

- MiniSearch.loadJSON used in tests to deserialize the index — keeps SearchService API clean (no `.search()` method needed; Plan 03 can expose it later if desired)
- Route tests use `/api/files/notes/hello.md/tags` (unencoded slashes) — Fastify wildcard `*` params handle slashes natively
- minisearch added as runtime dependency (not devDependency) — SearchService will use it at runtime

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Installed missing minisearch dependency**

- **Found during:** Task 1 (writing search.test.ts with MiniSearch import)
- **Issue:** minisearch not in server/package.json — test would fail with module-not-found at MiniSearch import, not at search.ts import
- **Fix:** Ran `npm install minisearch --workspace=server`
- **Files modified:** server/package.json, package-lock.json
- **Verification:** MiniSearch import succeeds; RED state correctly shows search.ts import error
- **Committed in:** e788a1a (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Required for correct RED state — otherwise test would fail at wrong import. No scope creep.

## Issues Encountered

None — both test files reach the correct RED state on first run.

## Next Phase Readiness

- Wave 0 complete: two RED test files establish the SearchService contract
- Plan 02 (if any) can build on these stubs
- Plan 03 will create `server/src/lib/search.ts` (SearchService) and register search routes in `app.ts` to turn these RED tests GREEN

---
*Phase: 05-search-and-tags*
*Completed: 2026-03-10*
