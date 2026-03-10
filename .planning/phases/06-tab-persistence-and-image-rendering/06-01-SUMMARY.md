---
phase: 06-tab-persistence-and-image-rendering
plan: 01
subsystem: testing
tags: [vitest, testing-library, react, fastify, tdd, localStorage, image-proxy]

requires: []
provides:
  - RED test stubs for useTabPersistence (PRST-01, PRST-02)
  - RED test stubs for useScrollPersist (PRST-03)
  - RED test stubs for MarkdownPreview filePath + image proxy URL (IMG-01)
  - RED test stubs for Fastify /api/image route (IMG-02)
affects:
  - 06-02 (Wave 1 implementation must make these tests GREEN)
  - 06-03 (MarkdownPreview integration depends on IMG-01 tests)
  - 06-04 (server image route depends on IMG-02 tests)

tech-stack:
  added: []
  patterns:
    - Map-backed vi.stubGlobal localStorage mock for deterministic localStorage tests
    - vi.useFakeTimers() + vi.advanceTimersByTimeAsync() for debounce assertion pattern
    - buildApp + app.inject() server test pattern (from files.test.ts)
    - tmpDir fixture with beforeEach/afterEach lifecycle for server route tests

key-files:
  created:
    - client/src/hooks/__tests__/useTabPersistence.test.ts
    - client/src/hooks/__tests__/useScrollPersist.test.ts
    - client/src/__tests__/MarkdownPreview.test.tsx
    - server/tests/routes/images.test.ts
  modified: []

key-decisions:
  - "Separate scroll map stored at marky:scroll key as JSON object keyed by file path"
  - "saveScrollPosition debounce at 200ms matches CONTEXT.md spec — tested with vi.useFakeTimers"
  - "MarkdownPreview smoke test passes (existing component) while img proxy tests are RED — this is correct Wave 0 state"
  - "Images test uses MINIMAL_PNG byte buffer for realistic fixture without external dependencies"

patterns-established:
  - "Wave 0 TDD: test files created before source files — RED failures from missing imports are valid"
  - "localStorage mock uses Map with vi.stubGlobal — matches existing useAutoSave.test.ts convention"

requirements-completed:
  - PRST-01
  - PRST-02
  - PRST-03
  - IMG-01
  - IMG-02

duration: 6min
completed: 2026-03-10
---

# Phase 6 Plan 01: Wave 0 RED Test Stubs for Tab Persistence and Image Rendering

**Four failing test files seeding Phase 6 coverage: localStorage tab/scroll persistence hooks and Fastify /api/image proxy route, all RED because source files don't exist yet.**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-10T16:24:14Z
- **Completed:** 2026-03-10T16:30:00Z
- **Tasks:** 3
- **Files modified:** 4 created

## Accomplishments

- Created 9-test stub for `useTabPersistence` covering loadPersistedTabs (empty/valid/corrupt), saveTabState, updateRecentFiles (prepend/dedupe/cap), getRecentFiles
- Created 6-test stub for `useScrollPersist` covering debounced save (fires at 200ms, not before, deduplicates), getScrollPosition (absent/present/wrong-key)
- Created 5-test stub for `MarkdownPreview` image proxy URL resolution covering relative, parent-relative, absolute, and remote URL paths
- Created 7-test stub for Fastify `/api/image` route covering PNG/SVG 200, path traversal 403, outside-rootDir 403, missing file 404, absent/empty param 400

## Task Commits

1. **Task 1: useTabPersistence and useScrollPersist RED stubs** - `92f4ce9` (test)
2. **Task 2: MarkdownPreview img proxy URL RED stubs** - `c80e501` (test)
3. **Task 3: Server /api/image route RED stubs** - `234c534` (test)

## Files Created/Modified

- `client/src/hooks/__tests__/useTabPersistence.test.ts` - 9 test cases for tab persistence hook (PRST-01, PRST-02)
- `client/src/hooks/__tests__/useScrollPersist.test.ts` - 6 test cases for scroll persistence hook (PRST-03)
- `client/src/__tests__/MarkdownPreview.test.tsx` - 5 test cases for image proxy URL resolution (IMG-01)
- `server/tests/routes/images.test.ts` - 7 test cases for /api/image Fastify route (IMG-02)

## Decisions Made

- localStorage key scheme: `marky:tabs` (tab state), `marky:scroll` (scroll map), `marky:recent` (recent files) — consistent with CONTEXT.md spec
- Scroll map structure: JSON object keyed by file path (`{ "docs/long.md": 450 }`) — natural O(1) lookup in Wave 1 implementation
- MINIMAL_PNG as a byte buffer literal in test file — avoids fixture files, keeps test self-contained
- MarkdownPreview smoke test passes in Wave 0 (component renders fine without `filePath` prop, TypeScript just ignores the unknown prop) — this is expected and correct

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All 4 test files exist and are failing (RED) — Wave 1 (06-02) can implement each source file and watch tests go GREEN
- Client: 9 existing test files (51 tests) remain GREEN — no regressions
- Server: 5 existing test files remain GREEN — no regressions
- The `MarkdownPreview` smoke test passes, confirming the test infrastructure renders the component correctly; only the `filePath`-dependent assertions are RED

---
*Phase: 06-tab-persistence-and-image-rendering*
*Completed: 2026-03-10*
