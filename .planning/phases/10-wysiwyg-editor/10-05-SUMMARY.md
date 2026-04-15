---
phase: 10-wysiwyg-editor
plan: 05
subsystem: ui, api, verification
tags: [tiptap, markdown, round-trip, watcher, vitest, verification]

requires:
  - phase: 10-wysiwyg-editor-04
    provides: EditorPane wired to WysiwygEditor, raw mode toggle, and image upload flow
provides:
  - Real markdown round-trip fidelity test coverage for core markdown constructs and YAML frontmatter
  - Stable watcher test behavior for SSE change/add detection and write-lock suppression
  - Human-approved WYSIWYG verification covering inline editing, slash commands, image handling, bubble toolbar, and raw mode
affects: [11-cli-distribution-and-homebrew-packaging]

tech-stack:
  added: []
  patterns: [round-trip-regression-suite, watcher-ready-gate, polling-test-watchers, human-verification-gate]

key-files:
  created: []
  modified:
    - client/src/components/EditorPane.tsx
    - server/src/app.ts
    - server/src/lib/watcher.ts
    - server/tests/api/files.test.ts
    - server/tests/cli/standalone-assets.test.ts
    - server/tests/routes/backlinks.test.ts
    - server/tests/routes/images.test.ts
    - server/tests/routes/search.test.ts
    - server/tests/routes/templates.test.ts
    - server/tests/routes/upload-image.test.ts
    - server/tests/routes/watch.test.ts

key-decisions:
  - "Round-trip fidelity is enforced with automated parse/serialize coverage rather than relying on manual spot checks"
  - "Route and API tests that do not exercise live file watching disable chokidar entirely to avoid EMFILE pressure and incidental watcher races"
  - "Live watcher tests use a polling watcher and an explicit settle window so write-lock behavior is verified deterministically"

patterns-established:
  - "buildApp supports enableWatcher:false for non-watch test suites and watcherOptions for watch-specific integration tests"
  - "Upload image responses are asserted against the API proxy path shape rather than raw disk paths"

requirements-completed: [WYSIWYG-01, WYSIWYG-02, WYSIWYG-03, WYSIWYG-04, WYSIWYG-05]

duration: 1 session
completed: 2026-03-29
---

# Phase 10 Plan 05: Markdown Round-Trip and Final Verification Summary

**WYSIWYG editing is now fully closed with green round-trip regression coverage, stable watcher tests, and user-approved visual verification**

## Performance

- **Duration:** 1 extended session
- **Completed:** 2026-03-29
- **Tasks:** 2
- **Files modified:** 11

## Accomplishments

- Confirmed and kept the full markdown round-trip suite green, covering headings, emphasis, links, inline code, fenced code, tables, images, lists, blockquotes, horizontal rules, and YAML frontmatter
- Updated the raw-mode toggle label in `EditorPane` to match the shipped `</>` UX and the existing test contract
- Refactored server test setup so non-watch suites run with `enableWatcher: false`, eliminating chokidar `EMFILE` noise and isolating live-watch behavior to the dedicated watch route tests
- Added watcher readiness and polling-based test configuration so SSE add/change events and the write-lock guarantee are verified reliably
- User approved the end-to-end WYSIWYG checklist in the running app

## Verification

- `cd client && npx vitest run --reporter=verbose` -> 24 files, 136 tests passed
- `cd server && npx vitest run --reporter=verbose` -> full suite passed after watcher stabilization
- Human verification approved for:
  - click-to-edit inline
  - slash commands
  - image handling
  - bubble toolbar
  - `</>` raw mode toggle with content preservation

## Files Created/Modified

- `client/src/components/EditorPane.tsx` - aligned raw-mode toggle label with the `</>` requirement and test contract
- `server/src/lib/watcher.ts` - added watcher abstraction, readiness promise, noop watcher, and test-configurable polling options
- `server/src/app.ts` - made watcher initialization configurable per test/app context
- `server/tests/routes/watch.test.ts` - stabilized SSE integration tests around watcher readiness and write-lock behavior
- `server/tests/routes/upload-image.test.ts` - aligned assertions to the proxied image response path
- `server/tests/api/files.test.ts`, `server/tests/routes/backlinks.test.ts`, `server/tests/routes/images.test.ts`, `server/tests/routes/search.test.ts`, `server/tests/routes/templates.test.ts`, `server/tests/cli/standalone-assets.test.ts` - disabled real watchers where they are irrelevant

## Decisions Made

- Treated the final WYSIWYG plan as both a regression-hardening pass and a true product checkpoint, not a documentation-only closure
- Fixed the remaining watcher instability in test infrastructure rather than weakening the write-lock assertion
- Kept the human approval gate explicit before marking the phase complete

## Deviations from Plan

- Full-suite verification exposed server watcher races and outdated upload-image expectations that were not visible in the isolated round-trip tests; those were corrected before closure.

## Issues Encountered

- Chokidar-based tests were producing `EMFILE` pressure and delayed add events in unrelated suites until watcher usage was narrowed and stabilized.

## User Setup Required

None.

## Next Phase Readiness

- Phase 10 is complete and verified
- The next unfinished roadmap work is Phase 9 (Tag Graph View)

---
*Phase: 10-wysiwyg-editor*
*Completed: 2026-03-29*
