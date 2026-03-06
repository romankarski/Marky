---
phase: 02-browser-shell
plan: "01"
subsystem: ui
tags: [react, typescript, tabs, dnd-kit, react-markdown, react-resizable-panels, remark, tailwind, vitest]

# Dependency graph
requires:
  - phase: 01-server-foundation
    provides: monorepo workspace setup, Vite + Tailwind v4 CSS-first config, tsconfig paths

provides:
  - Tab, TabState, TabAction type contracts (client/src/types/tabs.ts)
  - useTabs hook with tabReducer — openTab, closeTab, focusTab, reorderTabs, setTabContent, dispatch
  - All nine Phase 2 npm libraries installed and resolvable in @marky/client
  - Vitest test infrastructure for client workspace with 13 passing reducer tests

affects:
  - 02-02 (TabBar component uses Tab, TabState, TabAction, useTabs)
  - 02-03 (MarkdownPreview uses Tab type for current tab prop)
  - 02-04 (ResizableLayout uses react-resizable-panels)
  - 02-05 (App.tsx wires useTabs to all components)

# Tech tracking
tech-stack:
  added:
    - react-markdown@10.1.0
    - remark-gfm@4.0.1
    - remark-frontmatter@5.0.0
    - remark-wiki-link@2.0.1
    - react-shiki@0.9.2
    - "@dnd-kit/core@6.3.1"
    - "@dnd-kit/sortable@10.0.0"
    - react-resizable-panels@4.7.1
    - "@tailwindcss/typography@0.5.19"
    - vitest@4.0.18 (devDependency, client workspace)
  patterns:
    - "useReducer pattern: tabReducer exported for unit testing, useTabs wraps it for React components"
    - "Dedup by path: OPEN action checks existing tabs by path before creating new id"
    - "Adjacent activation: CLOSE picks next[idx] ?? next[idx-1] ?? null for smooth UX"

key-files:
  created:
    - client/src/types/tabs.ts
    - client/src/hooks/useTabs.ts
    - client/src/__tests__/useTabs.test.ts
  modified:
    - client/package.json
    - client/tsconfig.json
    - client/src/index.css
    - package-lock.json

key-decisions:
  - "tabReducer exported (not private) so unit tests can test state transitions without React test environment"
  - "skipLibCheck: true added to client tsconfig — @dnd-kit/core 6.x has JSX namespace incompatibility with react-jsx module in TS strict mode"
  - "Vitest installed in client workspace for TDD; reducer tests run without DOM environment since reducer is pure"
  - "All nine deps go in dependencies (not devDependencies) — they ship in the browser bundle"

patterns-established:
  - "Reducer-first TDD: write pure reducer tests before implementing, then wrap in React hook"
  - "Tab identity is id (UUID), path is for dedup and content lookup, label is display-only"

requirements-completed: [VIEW-02, VIEW-03, VIEW-04]

# Metrics
duration: 3min
completed: 2026-03-06
---

# Phase 2 Plan 01: Browser Shell Foundation Summary

**Nine Phase 2 libraries installed plus Tab/TabState/TabAction type contracts and useReducer-based useTabs hook with path dedup and adjacent-tab activation**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-06T21:14:08Z
- **Completed:** 2026-03-06T21:17:57Z
- **Tasks:** 2
- **Files modified:** 7 (3 created, 4 modified)

## Accomplishments

- Installed all nine Phase 2 npm libraries (react-markdown, remark-gfm, remark-frontmatter, remark-wiki-link, react-shiki, @dnd-kit/core, @dnd-kit/sortable, react-resizable-panels, @tailwindcss/typography) in `@marky/client` workspace
- Created `client/src/types/tabs.ts` with `Tab`, `TabState`, `TabAction` — the central contracts all downstream plans depend on
- Created `client/src/hooks/useTabs.ts` with `useReducer`-based hook featuring OPEN dedup by path, CLOSE with adjacent-tab activation, FOCUS, REORDER via arrayMove, and SET_CONTENT
- Established Vitest test infrastructure in the client workspace with 13 passing reducer unit tests
- Added `@plugin "@tailwindcss/typography"` to `index.css` for prose rendering in Phase 2 markdown preview

## Task Commits

1. **Task 1: Install Phase 2 dependencies** - `ffafd49` (chore)
2. **Task 2 RED: Failing tests for tab reducer** - `cf8ab65` (test)
3. **Task 2 GREEN: Tab types and useTabs implementation** - `73c5cc5` (feat)

## Files Created/Modified

- `client/src/types/tabs.ts` — Tab, TabState, TabAction type contracts; downstream plans import these
- `client/src/hooks/useTabs.ts` — useReducer hook + exported tabReducer for unit testing
- `client/src/__tests__/useTabs.test.ts` — 13 unit tests covering all reducer actions
- `client/package.json` — nine new dependencies added; `test` script added
- `client/tsconfig.json` — `skipLibCheck: true` added for @dnd-kit compatibility
- `client/src/index.css` — `@plugin "@tailwindcss/typography"` added
- `package-lock.json` — updated with 163 new packages

## Decisions Made

- `tabReducer` is exported from `useTabs.ts` so pure unit tests can test state transitions without React test environment overhead
- `skipLibCheck: true` added because `@dnd-kit/core` 6.x `.d.ts` files reference `JSX` namespace which is incompatible with `"jsx": "react-jsx"` in strict mode — all project-owned files compile cleanly
- Vitest installed as devDependency in client workspace; no DOM environment needed since reducer is pure
- All nine libraries placed in `dependencies` (not devDependencies) because they ship in the browser bundle

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Added `skipLibCheck: true` to resolve @dnd-kit JSX namespace TS errors**
- **Found during:** Task 2 (TypeScript verification after GREEN phase)
- **Issue:** `@dnd-kit/core` and `@dnd-kit/sortable` type definitions reference the legacy `JSX` global namespace which is incompatible with `"jsx": "react-jsx"` in TypeScript strict mode — 7 errors from node_modules
- **Fix:** Added `"skipLibCheck": true` to `client/tsconfig.json`; confirmed zero errors in project-owned files
- **Files modified:** `client/tsconfig.json`
- **Verification:** `npx tsc --noEmit --project client/tsconfig.json` exits 0; all 13 tests still pass
- **Committed in:** `73c5cc5` (Task 2 GREEN commit)

**2. [Rule 2 - Missing Critical] Installed Vitest test framework**
- **Found during:** Task 2 setup (first TDD task — no test runner in client workspace)
- **Issue:** No test runner installed; TDD RED phase requires a failing test to run
- **Fix:** `npm install --save-dev vitest --workspace=@marky/client`; added `"test": "vitest run"` to client scripts
- **Files modified:** `client/package.json`, `package-lock.json`
- **Verification:** `npx vitest run client/src/__tests__/useTabs.test.ts` runs and reports results
- **Committed in:** `cf8ab65` (Task 2 RED commit)

---

**Total deviations:** 2 auto-fixed (1 bug, 1 missing critical infrastructure)
**Impact on plan:** Both fixes necessary for correctness and TDD execution. No scope creep.

## Issues Encountered

None beyond the auto-fixed deviations above.

## Next Phase Readiness

- All nine Phase 2 library imports resolve without errors
- `Tab`, `TabState`, `TabAction` types ready for TabBar (02-02) and MarkdownPreview (02-03)
- `useTabs` hook ready for App.tsx wiring (02-05)
- Client test infrastructure in place for future TDD tasks
- TypeScript compiles cleanly across the workspace

## Self-Check: PASSED

All files verified present on disk. All task commits verified in git history.

---
*Phase: 02-browser-shell*
*Completed: 2026-03-06*
