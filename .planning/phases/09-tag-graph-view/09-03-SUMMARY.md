---
phase: 09-tag-graph-view
plan: 03
subsystem: ui
tags: [react, typescript, react-force-graph-2d, localStorage, right-rail, graph]

# Dependency graph
requires:
  - phase: 09-tag-graph-view-02
    provides: "GET /api/graph/tags route with stable node/link payloads"
  - phase: 08-backlinks-panel-03
    provides: "Right-rail FileInfo + BacklinksPanel stack and open-file callback pattern"
  - phase: 06-tab-persistence-and-image-rendering-02
    provides: "Plain localStorage helper pattern for client persistence modules"
provides:
  - "Client graph DTOs and snapshot helpers keyed by file path"
  - "TagGraphPanel with fetch, active-node highlighting, and layout/viewport persistence"
  - "Persistent Outline | Graph right-rail tabset wired into App.tsx"
affects: [09-04, 10-wysiwyg-editor, right-panel-navigation]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Path-keyed graph layout snapshots stored in localStorage"
    - "Persistent right-rail panel switching via hidden mounted containers"
    - "ForceGraph viewport restore via centerAt(x, y) + zoom(k)"

key-files:
  created:
    - client/src/lib/tagGraph.ts
    - client/src/hooks/useTagGraphPersistence.ts
    - client/src/components/TagGraphPanel.tsx
  modified:
    - client/src/App.tsx
    - client/src/__tests__/TagGraphPanel.test.tsx

key-decisions:
  - "Graph layout snapshots persist positions by file path and viewport by graph center/zoom so refreshes and tab switches can restore the same scene"
  - "The graph stays mounted behind the right-rail tabset and is paused/resumed instead of remounted, preserving simulation state"
  - "Graph refresh is explicitly coupled to FileInfo tag edits through a graphRefreshVersion counter, not implicit rerenders"

patterns-established:
  - "Right-rail secondary tools can share a persistent tab body under FileInfo and BacklinksPanel without disturbing the upper panel stack"
  - "Client persistence modules remain React-free and fail soft on absent/corrupt localStorage data"

requirements-completed: [GRPH-02, GRPH-03, GRPH-04]

# Metrics
duration: 8min
completed: 2026-03-30
---

# Phase 09 Plan 03: Tag Graph Client Summary

**Persistent right-rail graph view with active-file highlighting, click-to-open navigation, and restored layout plus viewport state**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-30T05:48:43Z
- **Completed:** 2026-03-30T05:56:59Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- Added `client/src/lib/tagGraph.ts` and `client/src/hooks/useTagGraphPersistence.ts` for graph DTOs, layout snapshot helpers, and right-rail tab persistence
- Built `TagGraphPanel` around `react-force-graph-2d`, including `/api/graph/tags` fetches, active-node rendering, click-to-open behavior, simulation pause/resume, and layout plus viewport persistence
- Replaced the TOC-only right-rail body in `App.tsx` with a persistent `Outline | Graph` tabset wired to `activeFocusedTab?.path` and FileInfo-driven graph refreshes

## Task Commits

Each task was committed atomically:

1. **Task 1: Build graph DTO and persistence utilities** - `7dc1e44` (feat)
2. **Task 2: Implement TagGraphPanel and wire the right-rail tabset** - `ee51d66` (feat)

## Files Created/Modified

- `client/src/lib/tagGraph.ts` - client graph node/link/snapshot types plus layout merge and capture helpers
- `client/src/hooks/useTagGraphPersistence.ts` - graph layout and right-rail tab localStorage helpers with fail-soft reads
- `client/src/components/TagGraphPanel.tsx` - graph fetch/render lifecycle, viewport restore, persistence callbacks, and active-node drawing
- `client/src/App.tsx` - right-rail tab state, persistent Outline/Graph containers, and graph refresh wiring after tag edits
- `client/src/__tests__/TagGraphPanel.test.tsx` - corrected Testing Library `waitFor` import so the graph panel contract can run

## Decisions Made

- Persisted viewport using the graph library's center coordinates plus zoom factor, then restored it with `zoom()` followed by `centerAt()` for deterministic reload behavior
- Kept the graph panel mounted while hidden and used `pauseAnimation()` / `resumeAnimation()` instead of conditional mounting so switching tabs does not restart the simulation
- Used `activeFocusedTab?.path` as the single highlight source so graph state follows split-view focus correctly

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed the graph panel test harness import**
- **Found during:** Task 2 verification
- **Issue:** `client/src/__tests__/TagGraphPanel.test.tsx` imported `waitFor` from `vitest`, causing the targeted graph panel test run to fail before the UI implementation could be validated
- **Fix:** Switched `waitFor` to the Testing Library import used by the rest of the client test stack
- **Files modified:** `client/src/__tests__/TagGraphPanel.test.tsx`
- **Verification:** `npm test --workspace=client -- src/__tests__/TagGraphPanel.test.tsx src/hooks/__tests__/useTagGraphPersistence.test.ts src/lib/__tests__/tagGraph.test.ts`
- **Committed in:** `ee51d66` (part of Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** The fix was required to execute the planned verification path. No scope creep.

## Issues Encountered

- A temporary `.git/index.lock` collision occurred during parallel staging; staging was retried serially and did not affect repository state

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plan 09-04 can focus on regressions and human verification; the client graph view is now wired to the stable `/api/graph/tags` contract from Plan 09-02
- The remaining phase concern from `STATE.md` is performance/visual validation on larger datasets, which belongs in the next verification plan rather than this implementation plan

## Self-Check: PASSED

- client/src/lib/tagGraph.ts: FOUND
- client/src/hooks/useTagGraphPersistence.ts: FOUND
- client/src/components/TagGraphPanel.tsx: FOUND
- client/src/App.tsx: FOUND
- .planning/phases/09-tag-graph-view/09-03-SUMMARY.md: FOUND
- Commit 7dc1e44: FOUND
- Commit ee51d66: FOUND
