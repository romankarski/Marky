---
phase: 07-file-templates
plan: "01"
subsystem: testing
tags: [vitest, tdd, wave0, templates, red-tests]

# Dependency graph
requires: []
provides:
  - Wave 0 RED test stubs for all three template requirements (TMPL-01, TMPL-02, TMPL-03)
  - Behavioral contracts for applyTokens function (token substitution, .md strip, global replace)
  - Behavioral contracts for BUILT_IN_TEMPLATES constant (3 entries: daily-note, meeting-note, decision-record)
  - Behavioral contracts for FolderPickerModal template selection step (step 1 UI)
  - Behavioral contracts for server GET/POST /api/templates CRUD route
affects:
  - 07-02 (implements client lib templateTokens + builtInTemplates to make RED green)
  - 07-03 (implements server templates route to make RED green)
  - 07-04 (implements FolderPickerModal template step to make RED green)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Wave 0 RED-first: test stubs created before any implementation; tests fail with import errors or 404s"
    - "Server test pattern: buildApp({ rootDir: tmpDir }) with beforeEach/afterEach for isolated temp dirs"
    - "Client test pattern: vi.spyOn(globalThis, 'fetch') mock with vi.restoreAllMocks() in afterEach"

key-files:
  created:
    - client/src/lib/__tests__/templateTokens.test.ts
    - client/src/lib/__tests__/builtInTemplates.test.ts
    - client/src/__tests__/TemplatePickerModal.test.tsx
    - server/tests/routes/templates.test.ts
  modified: []

key-decisions:
  - "Wave 0 RED-first approach: all 4 test files created before any production code to lock down behavioral contracts"
  - "TemplatePickerModal tests use regex text matching (/blank/i, /daily note/i) for resilience to minor label wording changes"
  - "Server templates test uses app.inject() pattern consistent with existing images.test.ts and search.test.ts"
  - "FolderPickerModal template step tests check for placeholder 'my-note' as sentinel for step 2 (filename input) being visible"

patterns-established:
  - "Wave 0 comment header: // Wave 0 RED tests — [module] does not exist yet."
  - "Server test structure: tmpDir + buildApp in beforeEach, app.close + fs.rm in afterEach"

requirements-completed:
  - TMPL-01
  - TMPL-02
  - TMPL-03

# Metrics
duration: 2min
completed: 2026-03-11
---

# Phase 7 Plan 01: File Templates Wave 0 Summary

**4 Wave 0 RED test stubs establishing behavioral contracts for token substitution (TMPL-01), server CRUD (TMPL-02), and modal template step (TMPL-03) — all 15 new tests fail RED until Wave 1 implementation**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-11T13:27:44Z
- **Completed:** 2026-03-11T13:29:44Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments

- Created `templateTokens.test.ts` with 5 tests covering token substitution, global replace, and .md extension stripping
- Created `builtInTemplates.test.ts` with 5 tests locking down the 3-entry constant structure and required token presence per template
- Created `TemplatePickerModal.test.tsx` with 5 tests for the template selection step UI (Blank option, 3 built-in labels, click-to-advance)
- Created `server/tests/routes/templates.test.ts` with 5 tests for GET/POST /api/templates CRUD semantics

## Task Commits

Each task was committed atomically:

1. **Task 1: Client lib test stubs (templateTokens + builtInTemplates)** - `948deed` (test)
2. **Task 2: Client component test stub (TemplatePickerModal)** - `4deecf8` (test)
3. **Task 3: Server route test stub (templates CRUD)** - `fd47b38` (test)

## Files Created/Modified

- `client/src/lib/__tests__/templateTokens.test.ts` - Unit tests for applyTokens function (TMPL-01)
- `client/src/lib/__tests__/builtInTemplates.test.ts` - Unit tests for BUILT_IN_TEMPLATES constant (TMPL-01)
- `client/src/__tests__/TemplatePickerModal.test.tsx` - Component tests for template selection step in FolderPickerModal (TMPL-03)
- `server/tests/routes/templates.test.ts` - Integration tests for GET/POST /api/templates (TMPL-02)

## Decisions Made

- Wave 0 RED-first approach locks down behavioral contracts before any Wave 1 implementation begins
- TemplatePickerModal tests check for `placeholder="my-note"` as the sentinel indicator that step 2 (location/filename input) is active
- Text matchers use case-insensitive regex (`/blank/i`, `/daily note/i`) to be resilient to minor label wording changes in Wave 1
- Server templates tests use `app.inject()` pattern consistent with existing `images.test.ts`

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All 4 Wave 0 RED test files exist and fail as expected
- Client: 3 new files failing (15 tests), 14 existing files still passing (84 tests)
- Server: 1 new file failing (5 tests), 6 existing files still passing (33 tests)
- Wave 1 plans (07-02 through 07-04) can now implement against these behavioral contracts and turn tests GREEN

---
*Phase: 07-file-templates*
*Completed: 2026-03-11*
