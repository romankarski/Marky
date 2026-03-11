---
phase: 07-file-templates
plan: 03
subsystem: api
tags: [fastify, typescript, templates, file-storage]

# Dependency graph
requires:
  - phase: 07-01
    provides: Wave 0 RED test stubs for server template routes
provides:
  - GET /api/templates returning { templates: Array<{ name, content }> } from .marky/templates/
  - POST /api/templates creating .md files in .marky/templates/ with name validation
  - templatesRoutes Fastify plugin registered in app.ts
affects:
  - 07-04 (Wave 3 "Save as Template" button in FileInfo will call POST /api/templates)
  - 07-05 (template picker UI will call GET /api/templates)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Fastify plugin with default export (FastifyPluginAsync) — consistent with files.ts, watch.ts, search.ts pattern"
    - "tmplDir() closure returning path.join(fastify.rootDir, TMPL_SUBDIR) for route-scoped directory resolution"
    - "Auto-create dir on first access: fs.mkdir(tmplDir(), { recursive: true }) in both GET and POST handlers"

key-files:
  created:
    - server/src/routes/templates.ts
  modified:
    - server/src/app.ts

key-decisions:
  - "Default export (not named) for templatesRoutes — consistent with files.ts, watch.ts, search.ts (imagesRoutes was the outlier)"
  - "rootDir: string added to FastifyInstance augmentation in app.ts — required for TypeScript to recognize fastify.rootDir in templates.ts"

patterns-established:
  - "Sanitize template names with /[^a-zA-Z0-9\\-_ ]/g before writing to disk — prevents path traversal"
  - "Auto-create .marky/templates/ on first GET or POST rather than requiring explicit setup"

requirements-completed: [TMPL-02]

# Metrics
duration: 8min
completed: 2026-03-11
---

# Phase 07 Plan 03: File Templates Server Routes Summary

**Fastify GET + POST /api/templates plugin with .marky/templates/ disk storage, turning all 5 Wave 0 RED server tests GREEN**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-11T14:38:00Z
- **Completed:** 2026-03-11T14:46:00Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Created `server/src/routes/templates.ts` — GET lists templates, POST saves with name sanitization, both auto-create directory
- Added `rootDir: string` to FastifyInstance augmentation so templates.ts can access `fastify.rootDir` with proper TypeScript types
- Registered `templatesRoutes` in `app.ts` after `imagesRoutes` — all 5 Wave 0 server template tests turned GREEN (38/38 tests pass)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create server/src/routes/templates.ts** - `a7aed4a` (feat)
2. **Task 2: Register templatesRoutes in app.ts** - `ad66573` (feat)

## Files Created/Modified

- `server/src/routes/templates.ts` — Fastify plugin with GET /api/templates (list) and POST /api/templates (create) handlers
- `server/src/app.ts` — Added `rootDir: string` to FastifyInstance interface + import and register of templatesRoutes

## Decisions Made

- Used default export for `templatesRoutes` consistent with `files.ts`, `watch.ts`, `search.ts` (not named export like `imagesRoutes`)
- Added `rootDir: string` to the existing `FastifyInstance` declaration in `app.ts` rather than re-declaring in `templates.ts` — avoids module augmentation conflicts

## Deviations from Plan

None — plan executed exactly as written. The `rootDir: string` augmentation addition was specified in the plan's action notes.

## Issues Encountered

None — TypeScript errors visible in `tsc --noEmit` output were pre-existing (test files not under tsconfig `rootDir`), not introduced by this plan.

## User Setup Required

None — no external service configuration required. Templates directory `.marky/templates/` is auto-created on first API call.

## Next Phase Readiness

- Server template API is complete and tested — Wave 3 ("Save as Template" button in FileInfo) can call POST /api/templates
- GET /api/templates ready for template picker UI (Wave 3 client-side work)
- All 38 server tests pass GREEN, no regressions

---
*Phase: 07-file-templates*
*Completed: 2026-03-11*
