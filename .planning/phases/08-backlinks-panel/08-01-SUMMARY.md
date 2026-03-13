---
phase: 08-backlinks-panel
plan: 01
subsystem: testing
tags: [vitest, tdd, backlinks, fastify, react, testing-library]

# Dependency graph
requires: []
provides:
  - RED test stubs for BacklinkService unit tests (wikilink spaces, case normalisation, stale-entry removal)
  - RED test stubs for GET /api/backlinks/* route integration tests
  - RED test stubs for BacklinksPanel React component (render list, click-to-open, count header, empty state)
affects: [08-02-backlinks-service, 08-03-backlinks-route, 08-backlinks-panel]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "TDD Wave 0 RED-first: all test stubs created before any implementation to lock behavioral contracts"
    - "Server unit test pattern: mkdtemp + BacklinkService + writeFile fixtures + direct method calls"
    - "Server route integration test pattern: mkdtemp + buildApp + app.inject + app.close"
    - "Client unit test pattern: vi.stubGlobal('fetch', ...) + screen.findByText for async fetch"

key-files:
  created:
    - server/tests/lib/backlinks.test.ts
    - server/tests/routes/backlinks.test.ts
    - client/src/__tests__/BacklinksPanel.test.tsx
  modified: []

key-decisions:
  - "Wave 0 RED-first: three test stubs committed before any implementation exists to lock BKLN-01/02/03 contracts"
  - "Route tests assert 404 failure (route not registered) as correct RED state — not import errors"
  - "Client tests use screen.findByText (async) for fetch-dependent assertions, consistent with existing FileInfo pattern"

patterns-established:
  - "Pattern 1: BacklinkService test fixtures use fs.writeFile in tmpDir, call updateDoc directly (no HTTP layer)"
  - "Pattern 2: Route integration tests call buildApp with tmpDir, use app.inject for HTTP assertions"
  - "Pattern 3: Client component tests stub global fetch per-test with vi.stubGlobal, cleanup in afterEach"

requirements-completed: [BKLN-01, BKLN-02, BKLN-03]

# Metrics
duration: 4min
completed: 2026-03-13
---

# Phase 8 Plan 01: Backlinks Panel RED Test Stubs Summary

**Three Wave 0 RED test stub files covering BacklinkService unit behavior, route shape, and BacklinksPanel UI contracts — all failing for the right reasons before any implementation exists**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-13T15:48:05Z
- **Completed:** 2026-03-13T15:52:00Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments

- BacklinkService unit test stubs locking wikilink normalisation (spaces, aliases, case, double extension), standard md links, YAML frontmatter exclusion, stale-entry removal, and case-insensitive getBacklinks
- Route integration test stubs locking GET /api/backlinks/* response shape { backlinks: string[] } for simple paths, slash-containing paths, and nonexistent files
- BacklinksPanel component test stubs locking "Backlinks (N)" header, zero-count visibility, empty state message, clickable filename buttons, onOpen callback, and null return when no file active

## Task Commits

Each task was committed atomically:

1. **Task 1: BacklinkService unit test stubs (RED)** - `c0b1f22` (test)
2. **Task 2: Route integration test stubs (RED)** - `a1de3be` (test)
3. **Task 3: BacklinksPanel client test stubs (RED)** - `03df87a` (test)

## Files Created/Modified

- `server/tests/lib/backlinks.test.ts` - Unit tests for BacklinkService._extractTargets and getBacklinks; fails with import error (module not found)
- `server/tests/routes/backlinks.test.ts` - Integration tests for GET /api/backlinks/*; fails with 404 (route not registered)
- `client/src/__tests__/BacklinksPanel.test.tsx` - Component tests for BacklinksPanel; fails with import error (component not found)

## Decisions Made

- Wave 0 RED-first strategy: all three test stubs created before any implementation to lock behavioral contracts for BKLN-01, BKLN-02, BKLN-03
- Route tests check for 404 failures (route not registered) — this is the correct RED failure mode distinguishing them from the lib tests which fail with import errors
- Client tests use screen.findByText (async) for fetch-dependent assertions, consistent with existing testing patterns in the codebase

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## Next Phase Readiness

- All three test stubs are committed in RED state with correct failure modes
- Wave 1 can now implement BacklinkService (server/src/lib/backlinks.ts) to make lib tests GREEN
- Wave 1 can implement the route (server/src/routes/backlinks.ts) to make route tests GREEN
- Wave 1 can implement BacklinksPanel (client/src/components/BacklinksPanel.tsx) to make client tests GREEN
- Pre-existing watch.test.ts timing failure is unrelated to this plan (out of scope)

---
*Phase: 08-backlinks-panel*
*Completed: 2026-03-13*

## Self-Check: PASSED

- FOUND: server/tests/lib/backlinks.test.ts
- FOUND: server/tests/routes/backlinks.test.ts
- FOUND: client/src/__tests__/BacklinksPanel.test.tsx
- FOUND: .planning/phases/08-backlinks-panel/08-01-SUMMARY.md
- FOUND commit c0b1f22: test(08-01): add RED unit test stubs for BacklinkService
- FOUND commit a1de3be: test(08-01): add RED route integration test stubs for GET /api/backlinks/*
- FOUND commit 03df87a: test(08-01): add RED client test stubs for BacklinksPanel component
