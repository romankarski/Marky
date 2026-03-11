---
phase: 07-file-templates
plan: "02"
subsystem: client-templates
tags: [templates, tdd, wave1, token-substitution, modal-flow]

# Dependency graph
requires:
  - 07-01 (Wave 0 RED test stubs)
provides:
  - builtInTemplates.ts — TemplateEntry interface and BUILT_IN_TEMPLATES (3 entries)
  - templateTokens.ts — applyTokens function with global {{date}} and {{title}} substitution
  - FolderPickerModal two-step flow: step=template then step=location
  - FileTree.handleCreate passing content to POST body
affects:
  - 07-03 (server templates route — independent)
  - 07-04 (was planned for modal, now already done here)

# Tech tracking
tech-stack:
  added:
    - "@testing-library/jest-dom matchers extended into vitest v4 via custom test-setup.ts"
  patterns:
    - "Wave 1 GREEN: implement production code to turn Wave 0 RED tests green"
    - "vitest setupFiles: import { expect } from 'vitest'; expect.extend(matchers) pattern for cross-version jest-dom integration"
    - "Two-step modal pattern: step state as union type ('template' | 'location') drives conditional render"

key-files:
  created:
    - client/src/lib/builtInTemplates.ts
    - client/src/lib/templateTokens.ts
    - client/src/test-setup.ts
    - client/src/vitest.d.ts
  modified:
    - client/src/components/FolderPickerModal.tsx
    - client/src/components/FileTree.tsx
    - client/vite.config.ts

key-decisions:
  - "FolderPickerModal step 1 renders template buttons inline (no sub-component) — simple enough to keep in-component"
  - "applyTokens called exactly once in handleConfirm; title derived as safeName.replace(/\\.md$/, '') to avoid double-strip"
  - "vitest setupFiles uses direct expect.extend(matchers) to avoid vitest v2/v4 version conflict in monorepo"
  - "vitest.d.ts with /// <reference types=@testing-library/jest-dom /> provides TypeScript types for toBeInTheDocument"

# Metrics
duration: 5min
completed: 2026-03-11
---

# Phase 7 Plan 02: Client Template Foundation Summary

**builtInTemplates.ts + templateTokens.ts lib files and FolderPickerModal two-step flow turning all Wave 0 TMPL-01/TMPL-03 RED tests GREEN — 99 client tests passing with jest-dom matchers wired into vitest v4**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-11T13:31:46Z
- **Completed:** 2026-03-11T13:36:57Z
- **Tasks:** 2
- **Files modified/created:** 7

## Accomplishments

- Created `client/src/lib/builtInTemplates.ts` — exports `TemplateEntry` interface and `BUILT_IN_TEMPLATES` with 3 entries: daily-note ({{date}} tokens), meeting-note ({{title}} tokens), decision-record (both tokens). Turns 5 builtInTemplates.test.ts tests GREEN.
- Created `client/src/lib/templateTokens.ts` — exports `applyTokens(content, { title, date })` with global regex substitution and `.md` extension stripping from title. Turns 5 templateTokens.test.ts tests GREEN.
- Updated `client/src/components/FolderPickerModal.tsx` — two-step flow (step 1 = template picker, step 2 = filename/folder). Shows Blank + 3 built-in template buttons. Calls `applyTokens` in `handleConfirm`. Updated `onConfirm` signature to `(filePath, fileName, content)`. Turns 5 TemplatePickerModal.test.tsx tests GREEN.
- Updated `client/src/components/FileTree.tsx` — `handleCreate(filePath, content = '')` accepts content, passes to POST body. `onConfirm` wiring passes content through.
- Auto-fixed vitest jest-dom integration (Rule 3): added `test-setup.ts` with direct `expect.extend` and `vitest.d.ts` for TypeScript types.

## Task Commits

Each task committed atomically:

1. **Task 1: builtInTemplates.ts + templateTokens.ts** - `faf0ea8` (feat)
2. **Task 2: FolderPickerModal two-step + FileTree wiring** - `f9c0007` (feat)

## Files Created/Modified

- `client/src/lib/builtInTemplates.ts` — TemplateEntry interface + BUILT_IN_TEMPLATES constant (3 entries)
- `client/src/lib/templateTokens.ts` — applyTokens with global substitution + .md strip
- `client/src/components/FolderPickerModal.tsx` — Two-step modal flow with template selection
- `client/src/components/FileTree.tsx` — handleCreate with content param, POST body updated
- `client/src/test-setup.ts` — vitest setupFiles: jest-dom matchers via direct expect.extend
- `client/src/vitest.d.ts` — TypeScript reference types for toBeInTheDocument
- `client/vite.config.ts` — setupFiles added to test config

## Decisions Made

- FolderPickerModal renders template step inline rather than as a sub-component — complexity doesn't warrant extraction at this scale
- `applyTokens` called once in `handleConfirm`, title derived from `safeName.replace(/\.md$/, '')` to avoid double-strip
- vitest setup uses `import { expect } from 'vitest'; expect.extend(matchers)` pattern because monorepo has vitest v2 at root and v4 at client — the `@testing-library/jest-dom/vitest` entry imports from root vitest (v2), causing `expect` mismatch; direct import bypasses this
- `/// <reference types="@testing-library/jest-dom" />` in `src/vitest.d.ts` extends TypeScript's Assertion type globally across all test files

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] vitest jest-dom setup — `toBeInTheDocument` not registered**
- **Found during:** Task 2 verification (first test run after FolderPickerModal changes)
- **Issue:** Wave 0 test stubs use `toBeInTheDocument()` but vitest had no setup file importing `@testing-library/jest-dom`. The root `node_modules` contains vitest v2 while client has vitest v4 — standard `@testing-library/jest-dom/vitest` entry resolves to root vitest, causing `expect.extend` to target the wrong instance.
- **Fix:** Created `src/test-setup.ts` that imports `expect` directly from `'vitest'` (local v4) and calls `expect.extend(matchers)`. Added `src/vitest.d.ts` for TypeScript type augmentation. Added `setupFiles: ['./src/test-setup.ts']` to vite.config.ts test block.
- **Files modified:** `client/src/test-setup.ts` (created), `client/src/vitest.d.ts` (created), `client/vite.config.ts` (modified)
- **Commit:** `f9c0007`

## Issues Encountered

None beyond the auto-fixed vitest/jest-dom integration issue above.

## User Setup Required

None — all changes are code-only. No new dependencies added (jest-dom was already in package.json).

## Next Phase Readiness

- Wave 1 client implementation complete for TMPL-01 and TMPL-03
- All 99 client tests passing (17 test files)
- TypeScript compiles without errors
- 07-03 (server templates route) is independent and can proceed
- 07-04 (if still needed) would overlap with FolderPickerModal changes already done here

---
*Phase: 07-file-templates*
*Completed: 2026-03-11*
