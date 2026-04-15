---
phase: 09-tag-graph-view
plan: 02
subsystem: api
tags: [fastify, minisearch, graph, tags, payload]
requires:
  - phase: 09-tag-graph-view-01
    provides: "Wave 0 RED contracts for graph payload shape and route behavior"
provides:
  - "SearchService tag-graph payload serializer derived from indexed docs"
  - "GET /api/graph/tags Fastify route backed by SearchService"
  - "Route registration in app.ts for graph payload delivery"
affects: [09-03, 09-04]
tech-stack:
  added: []
  patterns: ["derive graph payload from existing SearchService docs map", "use dedicated graph route instead of exposing MiniSearch internals"]
key-files:
  created: [server/src/routes/graph.ts]
  modified: [server/src/lib/search.ts, server/src/app.ts]
key-decisions:
  - "All markdown files, including untagged ones, remain graph nodes because the payload is built from docs rather than tagMap alone"
  - "Shared-tag links collapse by source-target pair and carry ordered sharedTags metadata plus weight"
patterns-established:
  - "SearchService now has an explicit serializer for graph consumers instead of requiring clients to reverse-engineer search index internals"
requirements-completed: [GRPH-01]
duration: 1 session
completed: 2026-03-30
---

# Phase 09 Plan 02: Graph Payload Route Summary

**SearchService now exposes a tag-graph payload and Fastify serves it through `GET /api/graph/tags`**

## Performance

- **Completed:** 2026-03-30
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Added `getTagGraphPayload()` to `server/src/lib/search.ts`, producing sorted nodes and weighted shared-tag links from the existing indexed docs map
- Added `server/src/routes/graph.ts` with `GET /api/graph/tags`
- Registered the graph route in `server/src/app.ts`
- Verified the route contract with `npm test --workspace=server -- tests/routes/graph.test.ts`

## Task Commits

1. **Task 1: Extend SearchService with graph payload generation** - `fc82fc9` (feat)
2. **Task 2: Add and register the graph payload route** - completed in the current worktree after validation; no isolated commit was created because `server/src/app.ts` already contained unrelated in-progress changes from earlier phase work

## Files Created/Modified

- `server/src/lib/search.ts` - adds graph payload node/link types and `getTagGraphPayload()`
- `server/src/routes/graph.ts` - adds `GET /api/graph/tags`
- `server/src/app.ts` - registers `graphRoutes`

## Decisions Made

- Kept the graph payload on `SearchService` instead of introducing a second crawler or graph-specific indexing service
- Sorted nodes and links deterministically so tests can assert payload shape reliably

## Deviations from Plan

- The route-registration task was validated and completed inline without a standalone commit because `server/src/app.ts` was already dirty from prior unrelated work and could not be cleanly isolated without disturbing that worktree state

## Issues Encountered

- Existing uncommitted changes in `server/src/app.ts` made atomic commit isolation for the registration step impractical

## User Setup Required

None.

## Verification

- `npm test --workspace=server -- tests/routes/graph.test.ts`

## Next Phase Readiness

- Plan 09-03 can now build the client graph panel against a stable `/api/graph/tags` contract

---
*Phase: 09-tag-graph-view*
*Completed: 2026-03-30*
