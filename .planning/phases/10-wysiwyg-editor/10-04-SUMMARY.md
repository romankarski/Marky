---
phase: 10-wysiwyg-editor
plan: 04
subsystem: ui
tags: [tiptap, wysiwyg, image-upload, codemirror, raw-mode]

requires:
  - phase: 10-wysiwyg-editor-02
    provides: WysiwygEditor component with BubbleToolbar
  - phase: 10-wysiwyg-editor-03
    provides: SlashCommands extension and upload route
provides:
  - Rewritten EditorPane with WYSIWYG default and raw mode toggle
  - ImageUpload TipTap extension for drag/drop/paste images
  - uploadImageFromPicker helper for slash command integration
  - Simplified Tab type without editMode
affects: [10-wysiwyg-editor-05]

tech-stack:
  added: []
  patterns: [raw-mode-toggle-with-autosave-gate, image-upload-prosemirror-plugin]

key-files:
  created:
    - client/src/extensions/image-upload.ts
  modified:
    - client/src/components/EditorPane.tsx
    - client/src/types/tabs.ts
    - client/src/hooks/useTabs.ts
    - client/src/hooks/useFileWatcher.ts
    - client/src/__tests__/EditorPane.test.tsx
    - client/src/__tests__/tabReducer-editor.test.ts
    - client/src/__tests__/useTabs.test.ts
    - client/src/hooks/__tests__/useFileWatcher.test.ts

key-decisions:
  - "Raw/WYSIWYG toggle state is local to EditorPane (useState), not in Tab reducer -- avoids reducer complexity"
  - "editMode removed from Tab type entirely -- WYSIWYG is always active, no separate edit/preview modes"
  - "Auto-save disabled via setAutoSaveEnabled(false) during mode switch, re-enabled via requestAnimationFrame (Pitfall 3 protection)"

patterns-established:
  - "Raw mode toggle: serialize via getMarkdown() on WYSIWYG->raw, restore via setContent() on raw->WYSIWYG"
  - "Image upload: ProseMirror plugin with handleDrop/handlePaste, POST to /api/upload-image"

requirements-completed: [WYSIWYG-01, WYSIWYG-03, WYSIWYG-05]

duration: 4min
completed: 2026-03-18
---

# Phase 10 Plan 04: EditorPane Integration Summary

**Rewritten EditorPane with WYSIWYG default, raw mode toggle, image drag-drop upload, and simplified Tab type (editMode removed)**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-18T16:11:46Z
- **Completed:** 2026-03-18T16:16:08Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments
- EditorPane renders WysiwygEditor as the default editing surface (no split-pane layout)
- </> toggle button switches between WYSIWYG and raw CodeMirror with content preservation
- ImageUpload extension handles drag/drop and paste of images via /api/upload-image
- Tab type simplified: editMode and TOGGLE_EDIT removed entirely
- Auto-save works in both modes with Pitfall 3 protection during mode switch

## Task Commits

Each task was committed atomically:

1. **Task 1: Create image upload extension and update Tab type** - `c9ed475` (feat)
2. **Task 2 RED: Failing EditorPane tests** - `cab3a2b` (test)
3. **Task 2 GREEN: Rewrite EditorPane** - `bc60cb2` (feat)

## Files Created/Modified
- `client/src/extensions/image-upload.ts` - TipTap extension for drag/drop/paste image upload + file picker helper
- `client/src/components/EditorPane.tsx` - Complete rewrite: WYSIWYG default, raw toggle, no split-pane
- `client/src/types/tabs.ts` - Removed editMode field, removed TOGGLE_EDIT action
- `client/src/hooks/useTabs.ts` - Removed TOGGLE_EDIT case and editMode from tab creation
- `client/src/hooks/useFileWatcher.ts` - Removed editMode from change guard (dirty guard remains)
- `client/src/__tests__/EditorPane.test.tsx` - 7 tests for WYSIWYG mode, raw toggle, content preservation, auto-save
- `client/src/__tests__/tabReducer-editor.test.ts` - Updated: removed TOGGLE_EDIT tests, kept SET_DIRTY/CLEAR_DIRTY
- `client/src/__tests__/useTabs.test.ts` - Removed editMode from makeTab helper
- `client/src/hooks/__tests__/useFileWatcher.test.ts` - Removed editMode from makeTab helper

## Decisions Made
- Raw/WYSIWYG toggle state is local to EditorPane (useState), not in Tab reducer -- keeps reducer simple
- editMode removed from Tab type entirely -- WYSIWYG is always active, no separate edit/preview modes
- Auto-save disabled via setAutoSaveEnabled(false) during mode switch, re-enabled via requestAnimationFrame

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Test cleanup between renders required explicit `cleanup()` import from testing-library (jsdom doesn't auto-cleanup in vitest without global setup)
- Pre-existing TypeScript errors in BubbleToolbar.tsx (tippyOptions) and WysiwygEditor.tsx (setContent args) are out of scope for this plan

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- EditorPane fully wired with WysiwygEditor, ready for Plan 05 (markdown round-trip fidelity)
- Image upload extension available for slash command integration
- All 7 EditorPane tests passing, 125/136 total tests passing (11 failures are pre-existing RED stubs)

---
*Phase: 10-wysiwyg-editor*
*Completed: 2026-03-18*
