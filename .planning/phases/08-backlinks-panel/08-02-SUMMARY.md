---
phase: 08-backlinks-panel
plan: 02
subsystem: api
tags: [backlinks, fastify, wikilinks, gray-matter, typescript, vitest, tdd]

# Dependency graph
requires:
  - phase: 08-01
    provides: RED test stubs for BacklinkService unit, route, and BacklinksPanel tests
provides:
  - BacklinkService class (buildFromDir, updateDoc, removeDoc, getBacklinks) in server/src/lib/backlinks.ts
  - GET /api/backlinks/* Fastify route returning { backlinks: string[] }
  - BacklinkService wired into app.ts as Fastify decorator with watcher subscriber integration
affects: [08-03-backlinks-panel, 08-backlinks-panel]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "BacklinkService mirrors SearchService lifecycle: buildFromDir at startup (non-blocking), updateDoc/removeDoc in watcher.subscribe"
    - "Wikilink normalisation: trim+lowercase, append .md only if missing (spaces preserved, no dash transform)"
    - "Standard md link normalisation: path.resolve(join(rootDir, fileDir), href) then path.relative(rootDir, abs).toLowerCase()"
    - "gray-matter strips YAML frontmatter before regex scan to prevent false positives"
    - "Reverse index keyed by lowercase target path; getBacklinks lowercases query key for case-insensitive lookup"
    - "GET /api/backlinks/* uses Fastify wildcard param { '*': string } to handle paths with slashes"

key-files:
  created:
    - server/src/lib/backlinks.ts
    - server/src/routes/backlinks.ts
  modified:
    - server/src/app.ts
    - server/tests/lib/backlinks.test.ts

key-decisions:
  - "BacklinkService has its own collectMdFiles helper (not imported from search.ts) for service isolation"
  - "updateDoc calls _removeFileLinks first to prevent stale reverse-index entries on re-parse"
  - "backlinkService.buildFromDir called non-blocking at startup (same .catch pattern as SearchService)"
  - "Fix: missing afterEach import in backlinks.test.ts stub (Rule 1 - test file bug)"

patterns-established:
  - "Pattern 1: Both Map keys (forward/reverse) are lowercase strings — enforced at insertion time"
  - "Pattern 2: Watcher subscriber updated to call both searchService and backlinkService symmetrically"

requirements-completed: [BKLN-01, BKLN-02, BKLN-03]

# Metrics
duration: 5min
completed: 2026-03-13
---

# Phase 8 Plan 02: BacklinkService Implementation Summary

**BacklinkService with wikilink+markdown-link reverse index, GET /api/backlinks/* Fastify route, and app.ts wiring — 13 server tests GREEN (9 lib + 4 routes)**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-13T15:51:43Z
- **Completed:** 2026-03-13T15:56:30Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- BacklinkService reverse index supporting wikilinks (with spaces, aliases, .md extension handling) and standard markdown links, frontmatter-stripped, case-insensitive
- Stale-entry removal guaranteed: `_removeFileLinks` called first in `updateDoc` before re-parsing
- GET /api/backlinks/* wildcard route always returns 200 `{ backlinks: string[] }` — nonexistent paths return `[]`, not 404
- BacklinkService wired into app.ts as Fastify decorator alongside SearchService with identical watcher lifecycle

## Task Commits

Each task was committed atomically:

1. **Task 1: BacklinkService implementation (GREEN server lib tests)** - `dcfd255` (feat)
2. **Task 2: Route + app.ts wiring (GREEN server route tests)** - `9a9974b` (feat)

## Files Created/Modified

- `server/src/lib/backlinks.ts` - BacklinkService class: reverse+forward Maps, collectMdFiles, _extractTargets with WIKI_LINK/MD_LINK regexes
- `server/src/routes/backlinks.ts` - GET /api/backlinks/* FastifyPluginAsync with BacklinkService type augmentation
- `server/src/app.ts` - Added BacklinkService import/decorator/buildFromDir call and watcher.subscribe updates
- `server/tests/lib/backlinks.test.ts` - Fixed missing afterEach import (Rule 1 auto-fix)

## Decisions Made

- BacklinkService has its own `collectMdFiles` helper rather than importing from search.ts — services remain decoupled and independently testable
- `updateDoc` calls `_removeFileLinks` as its FIRST operation before re-parsing, per pitfall warning in RESEARCH.md
- `backlinkService.buildFromDir` called non-blocking with `.catch` logging, matching SearchService startup pattern
- Wildcard route `GET /api/backlinks/*` with `req.params['*']` handles paths containing slashes (e.g., `knowledge/decisions.md`)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed missing afterEach import in backlinks.test.ts stub**
- **Found during:** Task 1 (BacklinkService implementation — running tests)
- **Issue:** Test stub imported `{ describe, it, expect, beforeEach }` but used `afterEach` without importing it — caused `ReferenceError: afterEach is not defined` preventing all lib tests from running
- **Fix:** Added `afterEach` to the vitest import in server/tests/lib/backlinks.test.ts
- **Files modified:** server/tests/lib/backlinks.test.ts
- **Verification:** All 9 lib tests ran and passed GREEN
- **Committed in:** dcfd255 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Fix was necessary to run lib tests at all. No scope creep.

## Issues Encountered

None beyond the auto-fixed test stub bug.

## Next Phase Readiness

- BacklinkService server implementation complete and fully tested (13 server tests GREEN)
- Wave 2 (Plan 08-03) can now implement BacklinksPanel React component to make client tests GREEN
- Pre-existing LIVE-01 watch.test.ts timing failure remains out of scope (race condition documented in 08-01 SUMMARY)

---
*Phase: 08-backlinks-panel*
*Completed: 2026-03-13*
