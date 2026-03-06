---
phase: 01-server-foundation
plan: 02
subsystem: api
tags: [fastify, vitest, typescript, path-security, file-crud, tdd]

# Dependency graph
requires:
  - phase: 01-01
    provides: npm workspace monorepo with shared TypeScript types and Vitest placeholder test stubs
provides:
  - resolveSafePath() helper with URL-decode, realpath normalization, and macOS symlink-aware traversal prevention
  - buildTree() helper returning FileNode[] with hidden-file filtering
  - buildApp() injectable Fastify factory for testing without network
  - Five /api/files/* route handlers covering all FILE-0x CRUD requirements
  - Production server entrypoint (index.ts) reading ROOT_DIR from env
  - Full test suite: 4 unit tests + 5 integration tests, all GREEN
affects: [02-api-routes, 03-client-ui, 04-editor, 05-search]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Injectable Fastify app factory (buildApp) — testable without real HTTP server via inject()
    - fastify.decorate('rootDir') pattern for passing config into route plugins
    - Route registration order: exact GET /api/files before wildcard GET /api/files/* (prevents shadowing)
    - wx flag for POST (EEXIST → 409 conflict)
    - macOS realpath symlink fix: reconstruct non-existent file paths via realRoot + path.relative()

key-files:
  created:
    - server/src/lib/pathSecurity.ts (resolveSafePath — safe path resolution with traversal prevention)
    - server/src/lib/fsTree.ts (buildTree — recursive directory listing, hides dot-prefixed entries)
    - server/src/app.ts (buildApp factory — injectable Fastify instance)
    - server/src/routes/files.ts (all five CRUD route handlers)
    - server/src/index.ts (production entrypoint)
  modified:
    - server/tests/lib/pathSecurity.test.ts (placeholders replaced with real assertions)
    - server/tests/api/files.test.ts (placeholders replaced with inject-based integration tests)

key-decisions:
  - "macOS realpath fix: for non-existent files reconstruct real path via realRoot + path.relative() instead of falling back to symlinked path"
  - "buildApp() factory with fastify.decorate('rootDir') chosen over env-based config for test isolation"
  - "Exact GET /api/files registered before wildcard GET /api/files/* to prevent route shadowing (Fastify first-match wins)"

patterns-established:
  - "Fastify inject() pattern: tests call app.inject() directly, no HTTP server started"
  - "Per-test tmpDir: each integration test gets fresh tmpDir via fs.mkdtemp, cleaned up in afterEach"
  - "resolveSafePath called at every route entry point before any fs operation"

requirements-completed: [FILE-01, FILE-02, FILE-03, FILE-04, FILE-05]

# Metrics
duration: 3min
completed: 2026-03-06
---

# Phase 1 Plan 2: File CRUD API Summary

**Fastify 5 server with five /api/files/* CRUD endpoints backed by real filesystem operations, path traversal prevention via realpath normalization (macOS symlink-aware), and 9 passing tests (4 unit + 5 integration)**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-06T16:22:12Z
- **Completed:** 2026-03-06T16:25:00Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments

- resolveSafePath() correctly rejects path traversal (`../../etc/passwd`, URL-encoded variants) and handles macOS /var symlink to /private/var for both existing and non-existent files
- buildTree() recursively walks directory, filters hidden (dot-prefixed) files, returns FileNode[] with correct name/type/path/children fields
- buildApp() factory wires up Fastify + CORS + filesRoutes with rootDir injectable — zero real HTTP in tests
- All five file operations (list, read, create, rename/write, delete) with correct status codes (200, 201, 204, 400, 404, 409)
- Full test suite: 9/9 tests GREEN, vitest exits 0

## Task Commits

Each task was committed atomically:

1. **Task 1: pathSecurity.ts and fsTree.ts helpers, unit tests** - `332bd67` (feat)
2. **Task 2: Fastify server and file routes, integration tests** - `75c0cdb` (feat)

## Files Created/Modified

- `server/src/lib/pathSecurity.ts` - resolveSafePath() with URL-decode, realpath both sides, macOS symlink fix for new files
- `server/src/lib/fsTree.ts` - buildTree() recursive readdir, skips dot-prefixed entries, returns FileNode[]
- `server/src/app.ts` - buildApp({ rootDir, logger? }) injectable Fastify factory
- `server/src/routes/files.ts` - Five route handlers: GET list, GET read/list-subdir, POST create (wx), PUT rename/write, DELETE
- `server/src/index.ts` - Production entrypoint with ROOT_DIR env check, optional static file serving in production
- `server/tests/lib/pathSecurity.test.ts` - 4 real assertions replacing placeholders (valid path, traversal, URL-encoded traversal, empty string)
- `server/tests/api/files.test.ts` - 5 real inject-based integration tests replacing placeholders

## Decisions Made

- Used `fastify.decorate('rootDir', opts.rootDir)` to pass config into route plugins — keeps routes stateless and testable
- For macOS symlink handling on non-existent files: `path.join(realRoot, path.relative(root, resolved))` rather than `fs.realpath` fallback to unresolved path — prevents false traversal rejections in /var → /private/var environments
- Exact route `GET /api/files` registered before wildcard `GET /api/files/*` — Fastify uses first-match routing

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed macOS realpath symlink mismatch for non-existent files**
- **Found during:** Task 2 (POST and PUT integration tests returning 400 instead of 201/200)
- **Issue:** Plan's fallback `catch(() => resolved)` used the unresolved `/var/...` path, but `realRoot` was `/private/var/...`. The startsWith check always failed for non-existent files on macOS.
- **Fix:** Replace fallback with `path.join(realRoot, path.relative(root, resolved))` to reconstruct real path from known-good realRoot + relative portion
- **Files modified:** server/src/lib/pathSecurity.ts
- **Verification:** All 9 tests pass including POST create and PUT rename
- **Committed in:** `75c0cdb` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - Bug)
**Impact on plan:** Fix required for correctness on macOS — plan's implementation had a latent symlink bug that only surfaces with non-existent file paths.

## Issues Encountered

None beyond the macOS realpath deviation documented above.

## User Setup Required

None - no external service configuration required at this stage.

## Next Phase Readiness

- Fastify server foundation complete — Phase 2 (client UI) can call /api/files/* endpoints
- All FILE-0x requirements implemented and tested
- buildApp() factory pattern available for any future server-side integration tests
- Concern: ROOT_DIR env var must be set in .env before running `npm run dev` — documented in .env.example

---
*Phase: 01-server-foundation*
*Completed: 2026-03-06*
