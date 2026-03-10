---
phase: 06-tab-persistence-and-image-rendering
plan: 03
subsystem: api
tags: [fastify, image-proxy, react-markdown, path-security]

# Dependency graph
requires:
  - phase: 06-01
    provides: Tab persistence infrastructure and localStorage key scheme
  - phase: 06-01
    provides: Wave 0 RED tests for /api/image and MarkdownPreview.filePath

provides:
  - "GET /api/image?path= Fastify route with resolveSafePath guard"
  - "MarkdownPreview filePath prop with relative/absolute/root-relative path resolution"
  - "Local images render inline in markdown preview via /api/image proxy"

affects:
  - "06-04"
  - "future phases using MarkdownPreview"

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Image proxy route following filesRoutes FastifyPluginAsync plugin pattern"
    - "Client-side URL normalization using URL() constructor with dummy base for relative path resolution"
    - "OS prefix heuristic to distinguish root-relative markdown paths from absolute OS paths"

key-files:
  created:
    - server/src/routes/images.ts
  modified:
    - server/src/app.ts
    - client/src/components/MarkdownPreview.tsx
    - client/src/components/EditorPane.tsx

key-decisions:
  - "OS_ROOT_PREFIXES list expanded to include /tmp/, /etc/, /opt/, /usr/ etc. beyond plan spec to handle test case where /tmp path expected 403 but plan heuristic only listed /Users/, /home/, /root/, /var/, /private/"
  - "filePath added as required prop (not optional) to MarkdownPreview — EditorPane always has tab.path available"
  - "URL() constructor with file:///dummy/ base used for client-side relative path normalization (avoids Node path module in browser context)"

patterns-established:
  - "Image proxy: server strips leading '/' for root-relative paths; OS paths passed as-is to resolveSafePath"
  - "MarkdownPreview img override: remote → direct, absolute OS → proxy as-is, root-relative → proxy as-is, relative → resolve via URL() then proxy"

requirements-completed: [IMG-01, IMG-02]

# Metrics
duration: 12min
completed: 2026-03-10
---

# Phase 6 Plan 3: Image Proxy Route and MarkdownPreview Local Image Rendering Summary

**Fastify /api/image proxy route with path-security guard, plus MarkdownPreview filePath prop resolving relative/absolute image paths via client-side URL normalization**

## Performance

- **Duration:** ~12 min
- **Started:** 2026-03-10T17:36:00Z
- **Completed:** 2026-03-10T17:38:50Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Created `server/src/routes/images.ts` with GET /api/image?path= handler: MIME map, resolveSafePath guard (403), 404 for missing, 415 for unsupported type, 400 for empty path
- Added `filePath: string` prop to MarkdownPreview and replaced placeholder span with proxy URL construction: remote → direct, relative → URL() normalization, absolute/root-relative → proxy as-is
- Updated both EditorPane MarkdownPreview usages to pass `filePath={tab.path}`
- All 7 server images tests GREEN, all 72 client tests GREEN, TypeScript compiles clean

## Task Commits

Each task was committed atomically:

1. **Task 1: Fastify image proxy route** - `ebd9dc7` (feat)
2. **Task 2: MarkdownPreview filePath prop and img proxy override** - `2029a1c` (feat)

## Files Created/Modified
- `server/src/routes/images.ts` - GET /api/image Fastify plugin with MIME map and security guard
- `server/src/app.ts` - Registered imagesRoutes after existing routes
- `client/src/components/MarkdownPreview.tsx` - Added filePath prop, replaced img placeholder with proxy URL logic
- `client/src/components/EditorPane.tsx` - Both MarkdownPreview usages updated with filePath={tab.path}

## Decisions Made
- Extended OS_ROOT_PREFIXES list beyond plan spec (/tmp/, /etc/, /opt/, /usr/ etc.) — needed to pass the test case where `/tmp/some-other-file.png` (outside rootDir) expected 403. Plan's heuristic only listed 5 prefixes, test exposed a gap.
- `filePath` made required (not optional) — EditorPane always has `tab.path` and tests always provide it.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Expanded OS_ROOT_PREFIXES to include /tmp/ and other system directories**
- **Found during:** Task 1 (Fastify image proxy route)
- **Issue:** Test `returns 403 for an absolute path outside rootDir` sent `/tmp/some-other-file.png`. Plan's heuristic only listed `/Users/, /home/, /root/, /var/, /private/` — `/tmp/` was missing. Without it, `/tmp/...` had its leading `/` stripped, became `tmp/...`, resolved inside rootDir as a relative path, then returned 404 instead of 403.
- **Fix:** Added `/tmp/, /etc/, /opt/, /usr/, /sys/, /proc/, /dev/, /mnt/, /media/, /run/, /srv/` to the OS_ROOT_PREFIXES list.
- **Files modified:** `server/src/routes/images.ts`
- **Verification:** Server images test suite: 7/7 GREEN including the 403 path-security test.
- **Committed in:** `ebd9dc7` (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - Bug)
**Impact on plan:** Fix essential for correct security behavior. No scope creep.

## Issues Encountered
- Pre-existing flaky test `LIVE-01 — app PUT write does NOT trigger SSE event` in watch.test.ts fails intermittently. Unrelated to this plan. Out of scope per deviation rules — logged here but not fixed.

## Next Phase Readiness
- Local image rendering complete for single-pane and split-pane modes
- /api/image proxy ready for Phase 6 Plan 4 (final verification / polish)
- No blockers for remaining Phase 6 work

---
*Phase: 06-tab-persistence-and-image-rendering*
*Completed: 2026-03-10*
