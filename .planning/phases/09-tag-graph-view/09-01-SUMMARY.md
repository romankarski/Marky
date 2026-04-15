---
phase: 09-tag-graph-view
plan: 01
subsystem: testing
tags: [react-force-graph-2d, vitest, fastify, red-tests, localStorage]
requires:
  - phase: 08-backlinks-panel
    provides: "Established right-rail interaction and RED-first test patterns reused by the graph contracts"
provides:
  - "Client graph dependency installed in the client workspace"
  - "Wave 0 client RED contracts for TagGraphPanel, graph persistence, and layout helpers"
  - "Wave 0 server RED contract for GET /api/graph/tags payload coverage"
affects: [09-02, 09-03, 09-04, tag-graph-view]
tech-stack:
  added: [react-force-graph-2d]
  patterns: ["Mock react-force-graph-2d in jsdom tests instead of asserting canvas pixels", "Use fixture-backed Fastify route contracts for graph payload shape and weights"]
key-files:
  created: [client/src/__tests__/TagGraphPanel.test.tsx, client/src/hooks/__tests__/useTagGraphPersistence.test.ts, client/src/lib/__tests__/tagGraph.test.ts, server/tests/routes/graph.test.ts]
  modified: [client/package.json, package-lock.json]
key-decisions:
  - "Wave 0 persistence tests lock the Phase 9 implementation keys to marky:tag-graph-layout and marky:right-rail-tab so Plan 03 cannot drift from the contract"
  - "The server graph route test waits for SearchService indexing before inject calls to avoid false RED failures caused by buildFromDir running asynchronously in app.ts"
patterns-established:
  - "Graph UI tests render a mocked ForceGraph component that exposes node buttons and captured lifecycle props"
  - "Graph route fixtures include both tagged and untagged markdown notes, with pairwise shared-tag weights asserted explicitly"
requirements-completed: [GRPH-01, GRPH-02, GRPH-03, GRPH-04]
duration: 5 min
completed: 2026-03-29
---

# Phase 09 Plan 01: Tag Graph Wave 0 Summary

**Graph dependency install plus RED test contracts for clickable nodes, active-node highlighting, graph layout persistence, and weighted shared-tag route payloads**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-29T21:17:37Z
- **Completed:** 2026-03-29T21:22:55Z
- **Tasks:** 3
- **Files modified:** 6

## Accomplishments
- Installed `react-force-graph-2d@1.29.1` into the client workspace and recorded the resolved dependency tree in `package-lock.json`.
- Added three client Wave 0 RED suites covering TagGraphPanel behavior, graph snapshot persistence, and path-keyed layout merge helpers.
- Added a server Wave 0 RED route contract for `/api/graph/tags` with fixtures for multi-tag links, single-tag links, and an untagged isolated note.

## Task Commits

Each task was committed atomically:

1. **Task 1: Install the client graph dependency** - `be3a318` (feat)
2. **Task 2: Create client Wave 0 graph and persistence tests** - `e22257d` (test)
3. **Task 3: Create the server graph route test contract** - `96aad83` (test)

## Files Created/Modified
- `client/package.json` - adds `react-force-graph-2d` to the client workspace dependencies.
- `package-lock.json` - records the resolved graph dependency tree for the monorepo install.
- `client/src/__tests__/TagGraphPanel.test.tsx` - defines the mocked graph UI contract for fetch, node click, loading, empty state, and active-node drawing.
- `client/src/hooks/__tests__/useTagGraphPersistence.test.ts` - locks snapshot and right-rail tab persistence behavior to exact localStorage keys.
- `client/src/lib/__tests__/tagGraph.test.ts` - defines path-keyed snapshot merge and numeric-position serialization behavior.
- `server/tests/routes/graph.test.ts` - defines the `/api/graph/tags` node/link payload expectations with weighted shared-tag links.

## Decisions Made
- Locked the Wave 0 localStorage contract to `marky:tag-graph-layout` and `marky:right-rail-tab` from the Phase 09-03 implementation plan so Wave 1 and Wave 2 use the same persistence keys.
- Added a test-only wait for `SearchService` indexing in the server route contract because `buildApp()` starts indexing asynchronously and otherwise risks nondeterministic failures once the route exists.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plan 09-02 can implement `GET /api/graph/tags` directly against a committed route contract that already covers full node inclusion and weighted shared-tag links.
- Plan 09-03 can implement `TagGraphPanel`, `useTagGraphPersistence`, and `tagGraph` against committed client tests without inventing UI or persistence behavior.

## Self-Check

PASSED

---
*Phase: 09-tag-graph-view*
*Completed: 2026-03-29*
