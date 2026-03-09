---
phase: 03-editor
plan: "01"
subsystem: testing
tags: [vitest, tdd, tabReducer, useAutoSave, react-testing-library]

# Dependency graph
requires:
  - phase: 02-browser-shell
    provides: tabReducer exported from useTabs.ts, Vitest installed for client workspace
provides:
  - Failing test scaffold for tabReducer TOGGLE_EDIT/SET_DIRTY/CLEAR_DIRTY actions
  - Failing test scaffold for useAutoSave debounce, PUT call, onSaved callback
affects: [03-editor-02, 03-editor-03, 03-editor-04]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Wave 0 TDD: create failing tests before implementation exists (Nyquist compliance)"
    - "renderHook pattern from @testing-library/react for hook unit tests"
    - "vi.useFakeTimers() + vi.advanceTimersByTimeAsync() for debounce testing"

key-files:
  created:
    - client/src/__tests__/tabReducer-editor.test.ts
    - client/src/hooks/__tests__/useAutoSave.test.ts
  modified: []

key-decisions:
  - "CLOSE + dirty guard lives in TabBar event handler (not reducer) — no reducer test needed for it"
  - "useAutoSave tests use vi.useFakeTimers for deterministic debounce control"
  - "@testing-library/react import intentionally fails in RED phase — installed in Plan 02"

patterns-established:
  - "hooks/__tests__/ directory created for hook-specific test files"
  - "makeTab helper defaults include dirty:false and editMode:false for Phase 3 extended Tab type"

requirements-completed: [EDIT-01, EDIT-03, EDIT-04]

# Metrics
duration: 8min
completed: 2026-03-09
---

# Phase 3 Plan 01: TDD Wave 0 — Failing Test Scaffolds Summary

**Vitest RED-phase scaffolds for tabReducer editor actions (TOGGLE_EDIT/SET_DIRTY/CLEAR_DIRTY) and useAutoSave debounce hook — 11 failing tests that Plans 02-04 will make pass**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-09T13:33:00Z
- **Completed:** 2026-03-09T13:41:50Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Created `tabReducer-editor.test.ts` with 7 tests (6 failing RED, 1 passing) for TOGGLE_EDIT, SET_DIRTY, CLEAR_DIRTY
- Created `useAutoSave.test.ts` with 5 failing tests covering debounce delay, debounce reset, onSaved callback, and cleanup on unmount
- Confirmed existing 14 `useTabs.test.ts` tests still pass — no regression introduced

## Task Commits

Each task was committed atomically:

1. **Task 1: Create tabReducer-editor test scaffold** - `cecc941` (test)
2. **Task 2: Create useAutoSave test scaffold** - `ff51279` (test)

_Note: Both commits are TDD RED phase — tests intentionally fail._

## Files Created/Modified
- `client/src/__tests__/tabReducer-editor.test.ts` - Failing tests for TOGGLE_EDIT, SET_DIRTY, CLEAR_DIRTY reducer cases with makeTab helper including dirty/editMode defaults
- `client/src/hooks/__tests__/useAutoSave.test.ts` - Failing tests for debounce (800ms), PUT /api/files/:path, onSaved callback, and unmount cleanup

## Decisions Made
- CLOSE + dirty guard is NOT tested at the reducer level — it belongs in TabBar's event handler. Documented with a comment in the test file.
- `@testing-library/react` import in `useAutoSave.test.ts` intentionally fails RED — the dependency will be installed in Plan 02 alongside the Tab type extension.
- `hooks/__tests__/` directory created as the standard location for hook-unit tests going forward.

## Deviations from Plan
None — plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None — no external service configuration required.

## Next Phase Readiness
- Plan 02 can immediately install `@testing-library/react`, extend `Tab` type with `dirty`/`editMode`, add `TOGGLE_EDIT`/`SET_DIRTY`/`CLEAR_DIRTY` to `TabAction`, and implement them in `tabReducer` — all test targets are locked in
- Plan 03 can create `useAutoSave.ts` against the test contract already defined here
- All 11 new failing tests provide unambiguous RED → GREEN targets for Plans 02-04

---
*Phase: 03-editor*
*Completed: 2026-03-09*
