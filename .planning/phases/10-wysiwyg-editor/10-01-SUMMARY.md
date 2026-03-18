---
phase: 10-wysiwyg-editor
plan: 01
subsystem: ui, testing
tags: [tiptap, prosemirror, vitest, fastify-multipart, wysiwyg]

# Dependency graph
requires:
  - phase: 08-backlinks-panel
    provides: existing test patterns and project structure
provides:
  - TipTap dependency foundation for WYSIWYG editor
  - 7 RED test stubs covering WYSIWYG-01 through WYSIWYG-05
  - @fastify/multipart for server-side image upload
  - client/src/extensions/ directory structure
affects: [10-wysiwyg-editor]

# Tech tracking
tech-stack:
  added: ["@tiptap/react", "@tiptap/starter-kit", "@tiptap/markdown", "@tiptap/pm", "@tiptap/extension-link", "@tiptap/extension-image", "@tiptap/extension-table", "@tiptap/extension-table-row", "@tiptap/extension-table-cell", "@tiptap/extension-table-header", "@tiptap/extension-placeholder", "@tiptap/suggestion", "@fastify/multipart"]
  patterns: [wave-0-red-first-testing, tiptap-extension-architecture]

key-files:
  created:
    - client/src/__tests__/WysiwygEditor.test.tsx
    - client/src/__tests__/BubbleToolbar.test.tsx
    - client/src/__tests__/SlashCommandMenu.test.tsx
    - client/src/__tests__/EditorPane.test.tsx
    - client/src/__tests__/markdown-roundtrip.test.ts
    - client/src/extensions/__tests__/slash-commands.test.ts
    - server/tests/routes/upload-image.test.ts
  modified:
    - client/package.json
    - server/package.json
    - package-lock.json

key-decisions:
  - "Wave 0 RED-first: all 7 test stubs created before any WYSIWYG implementation to lock behavioral contracts for WYSIWYG-01 through WYSIWYG-05"
  - "TipTap v3.20.4 installed with 12 packages including @tiptap/markdown for round-trip fidelity"

patterns-established:
  - "Wave 0 RED-first: test stubs with expect(true).toBe(false) pattern for behavioral contracts"
  - "Extensions directory: client/src/extensions/__tests__/ for TipTap extension unit tests"

requirements-completed: [WYSIWYG-01, WYSIWYG-02, WYSIWYG-03, WYSIWYG-04, WYSIWYG-05]

# Metrics
duration: 3min
completed: 2026-03-18
---

# Phase 10 Plan 01: Dependencies and Wave 0 Test Stubs Summary

**TipTap v3.20.4 with 12 packages installed, @fastify/multipart added, and 7 RED test files (34 failing tests) locking WYSIWYG-01 through WYSIWYG-05 contracts**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-18T16:00:58Z
- **Completed:** 2026-03-18T16:04:11Z
- **Tasks:** 2
- **Files modified:** 10

## Accomplishments
- Installed 12 TipTap packages and @fastify/multipart without breaking existing dependencies
- Created 7 test stub files with 34 failing tests covering all 5 WYSIWYG requirements
- Verified all 105 existing tests remain passing (zero regression)
- Established client/src/extensions/__tests__/ directory for TipTap extension tests

## Task Commits

Each task was committed atomically:

1. **Task 1: Install TipTap and multipart dependencies** - `31f2233` (chore)
2. **Task 2: Create Wave 0 test stubs (RED state)** - `c455f7f` (test)

## Files Created/Modified
- `client/package.json` - Added 12 TipTap dependencies
- `server/package.json` - Added @fastify/multipart dependency
- `package-lock.json` - Updated lockfile for all new dependencies
- `client/src/__tests__/WysiwygEditor.test.tsx` - WYSIWYG-01 + WYSIWYG-03 test stubs (5 tests)
- `client/src/__tests__/BubbleToolbar.test.tsx` - WYSIWYG-04 test stubs (4 tests)
- `client/src/__tests__/SlashCommandMenu.test.tsx` - WYSIWYG-02 test stubs (5 tests)
- `client/src/__tests__/EditorPane.test.tsx` - WYSIWYG-05 test stubs (7 tests)
- `client/src/__tests__/markdown-roundtrip.test.ts` - Round-trip fidelity stubs (11 tests)
- `client/src/extensions/__tests__/slash-commands.test.ts` - WYSIWYG-02 extension stubs (3 tests)
- `server/tests/routes/upload-image.test.ts` - WYSIWYG-03 server stubs (5 tests)

## Decisions Made
- Wave 0 RED-first: all 7 test stubs created before any WYSIWYG implementation to lock behavioral contracts
- TipTap v3.20.4 selected (latest stable) with @tiptap/markdown for parse/serialize round-trip
- Pre-existing test stubs (WysiwygEditor, SlashCommandMenu, slash-commands) retained as they had more sophisticated assertions while still being in RED state

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added @tiptap/markdown as separate install**
- **Found during:** Task 1
- **Issue:** @tiptap/markdown is a separate package not included in starter-kit; initial install omitted it
- **Fix:** Ran additional `npm install @tiptap/markdown`
- **Files modified:** client/package.json, package-lock.json
- **Verification:** `npm ls @tiptap/markdown` resolves to v3.20.4
- **Committed in:** 31f2233 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Minor correction during dependency installation. No scope creep.

## Issues Encountered
- Three test files (WysiwygEditor, SlashCommandMenu, slash-commands) already existed as untracked files from a previous session with more detailed assertions; kept them since they are still in RED state (import from non-existent modules)

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All TipTap dependencies ready for Wave 1 implementation (10-02: WysiwygEditor component + markdown round-trip)
- Test contracts locked -- implementation must make these 34 tests pass
- Extensions directory created for slash-commands and future TipTap extensions

## Self-Check: PASSED

All 7 test files found. Both task commits (31f2233, c455f7f) verified.

---
*Phase: 10-wysiwyg-editor*
*Completed: 2026-03-18*
