---
phase: 05-search-and-tags
plan: "02"
subsystem: testing
tags: [vitest, minisearch, react-testing-library, tdd, hooks, search, tags]

# Dependency graph
requires:
  - phase: 05-search-and-tags-01
    provides: server-side SearchIndexPayload from GET /api/search/index

provides:
  - Wave 0 RED test stubs for useSearch hook (SRCH-01, SRCH-02, refetchIndex)
  - Wave 0 RED test stubs for useTags hook (TAG-02 filterPaths with ancestor derivation)
  - Wave 0 RED test stubs for SearchPanel component (SRCH-03 click-to-open)

affects:
  - 05-search-and-tags-04 (must make useSearch.test.ts and useTags.test.ts GREEN)
  - 05-search-and-tags-05 (must make SearchPanel.test.tsx GREEN, update to prop-based API)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "vi.stubGlobal('fetch', fetchSpy) for hook tests that call fetch — same pattern as useFileWatcher tests"
    - "vi.mock('../hooks/useSearch') for component tests that use hooks internally"
    - "renderHook + act pattern for testing async hook state transitions"
    - "Ancestor directory derivation: for each file path in tagMap[tag], include all dirname segments as separate Set entries"

key-files:
  created:
    - client/src/__tests__/useSearch.test.ts
    - client/src/__tests__/useTags.test.ts
    - client/src/__tests__/SearchPanel.test.tsx
  modified: []

key-decisions:
  - "Wave 0 TDD stubs use vi.stubGlobal('fetch', fetchSpy) for hook tests — allows call-count tracking for refetchIndex re-fetch assertion"
  - "SearchPanel test uses vi.mock for useSearch module (not fetch) — more deterministic control over displayed results"
  - "useTags filterPaths must include ancestor directories (e.g. 'src' for 'src/react.md') so tree-view filtering works at directory level"
  - "SearchPanel test note: Plan 05 must update SearchPanel.test.tsx when component switches from internal useSearch to prop-based results"

patterns-established:
  - "Wave 0 TDD: test contracts documented before any implementation — stubs drive Plan 04 (hooks) and Plan 05 (component)"
  - "MiniSearch fixture: real MiniSearch instance serialized via JSON.parse(JSON.stringify(ms)) for realistic search behavior in hook tests"

requirements-completed:
  - SRCH-01
  - SRCH-02
  - SRCH-03
  - TAG-02

# Metrics
duration: 5min
completed: 2026-03-10
---

# Phase 5 Plan 02: Search and Tags Wave 0 Test Stubs Summary

**Three failing TDD stubs defining useSearch hook (SRCH-01/02), useTags hook (TAG-02 ancestor dirs), and SearchPanel component (SRCH-03) contracts before any implementation exists.**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-10T09:17:36Z
- **Completed:** 2026-03-10T09:22:00Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- useSearch.test.ts: 6 tests covering fetch lifecycle, search result shape, empty query, and refetchIndex re-fetch behavior
- useTags.test.ts: 5 tests covering initial state, allTags from payload, setActiveTag, filterPaths Set with ancestor directories, and null reset
- SearchPanel.test.tsx: 3 tests covering result name/snippet rendering, click-to-open calling onOpen with correct path, and empty state contract
- Existing 4 test files (30 tests) remain GREEN — no regressions

## Task Commits

Each task was committed atomically:

1. **Task 1: Write failing useSearch and useTags hook test stubs** - `43bb113` (test)
2. **Task 2: Write failing SearchPanel component test stub** - `0105ee0` (test)

## Files Created/Modified
- `client/src/__tests__/useSearch.test.ts` - Wave 0 RED stubs for SRCH-01, SRCH-02, refetchIndex; uses vi.stubGlobal('fetch') with call-count spy
- `client/src/__tests__/useTags.test.ts` - Wave 0 RED stubs for TAG-02; verifies filterPaths Set contains file paths and ancestor dirs
- `client/src/__tests__/SearchPanel.test.tsx` - Wave 0 RED stubs for SRCH-03; uses vi.mock for useSearch module isolation

## Decisions Made
- Used `vi.stubGlobal('fetch', fetchSpy)` with a `vi.fn()` spy for useSearch tests — allows asserting fetchSpy.mock.calls.length for refetchIndex re-fetch verification
- Used `vi.mock('../hooks/useSearch')` for SearchPanel component tests — more deterministic than mocking fetch, gives full control over displayed results
- SearchPanel test documents that Plan 05 must update this stub when the component API changes from internal hook ownership to prop-based results
- MiniSearch fixture uses a real MiniSearch instance serialized to plain object — ensures the index deserialization path is exercised in useSearch

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Plan 04 can now implement `useSearch` and `useTags` hooks to turn RED stubs GREEN
- Plan 05 can implement `SearchPanel` component; must also update `SearchPanel.test.tsx` to prop-based API per the note in the stub
- Ancestor directory derivation contract is locked in useTags.test.ts — Plan 04 must implement this behavior

---
*Phase: 05-search-and-tags*
*Completed: 2026-03-10*

## Self-Check: PASSED

- FOUND: client/src/__tests__/useSearch.test.ts
- FOUND: client/src/__tests__/useTags.test.ts
- FOUND: client/src/__tests__/SearchPanel.test.tsx
- FOUND: .planning/phases/05-search-and-tags/05-02-SUMMARY.md
- FOUND commit: 43bb113 (useSearch + useTags stubs)
- FOUND commit: 0105ee0 (SearchPanel stub)
