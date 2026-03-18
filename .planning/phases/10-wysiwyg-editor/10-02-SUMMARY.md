---
phase: 10-wysiwyg-editor
plan: 02
subsystem: ui
tags: [tiptap, prosemirror, wysiwyg, bubble-menu, markdown]

requires:
  - phase: 10-wysiwyg-editor-01
    provides: TipTap dependencies installed, Wave 0 RED test stubs
provides:
  - WysiwygEditor component with TipTap markdown round-trip
  - BubbleToolbar floating toolbar with Bold, Italic, Link, Code buttons
  - WysiwygEditorHandle ref API (getMarkdown, setContent) for mode switching
affects: [10-wysiwyg-editor-04, 10-wysiwyg-editor-05]

tech-stack:
  added: []
  patterns:
    - "TipTap useEditor with named imports from @tiptap/* v3.20"
    - "BubbleMenu imported from @tiptap/react/menus (not @tiptap/react)"
    - "StarterKit.configure({ link: false }) to avoid duplicate extension when adding Link separately"
    - "forwardRef + useImperativeHandle for editor handle exposure"

key-files:
  created:
    - client/src/components/WysiwygEditor.tsx
    - client/src/components/BubbleToolbar.tsx
  modified:
    - client/src/__tests__/WysiwygEditor.test.tsx
    - client/src/__tests__/BubbleToolbar.test.tsx

key-decisions:
  - "Named imports for all @tiptap/* packages (v3.20 uses named exports, not default)"
  - "BubbleMenu from @tiptap/react/menus subpath (v3 restructured exports)"
  - "StarterKit link disabled to avoid duplicate extension warning with standalone Link extension"
  - "Mock BubbleMenu in tests to avoid ProseMirror view dependency in jsdom"

patterns-established:
  - "TipTap extension configuration: named imports, configure() chaining"
  - "Editor mock pattern: chainable mock methods for testing toolbar commands"

requirements-completed: [WYSIWYG-01, WYSIWYG-04]

duration: 8min
completed: 2026-03-18
---

# Phase 10 Plan 02: Core Editor and Bubble Toolbar Summary

**TipTap WYSIWYG editor with markdown round-trip, prose-orange styling, placeholder, and floating bubble toolbar with 4 formatting buttons**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-18T16:00:59Z
- **Completed:** 2026-03-18T16:09:05Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- WysiwygEditor renders editable ProseMirror surface with full markdown serialization via @tiptap/markdown
- BubbleToolbar with 4 buttons (Bold, Italic, Link, Code) using frosted glass styling and orange-600 active states
- WysiwygEditorHandle ref API exposes getMarkdown() and setContent() for future mode switching
- All 8 tests GREEN (4 WysiwygEditor + 4 BubbleToolbar)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create WysiwygEditor component** - `f9e86b1` (feat)
2. **Task 2: Create BubbleToolbar component** - `cbe8a8a` (feat)

_Note: Task 1 commit includes both WysiwygEditor and BubbleToolbar component files (TDD RED->GREEN cycle). Task 2 commit completes BubbleToolbar tests to GREEN._

## Files Created/Modified
- `client/src/components/WysiwygEditor.tsx` - TipTap editor wrapper with markdown round-trip, forwardRef handle, placeholder, hover affordance CSS
- `client/src/components/BubbleToolbar.tsx` - Floating toolbar with Bold, Italic, Link, Code buttons inside BubbleMenu
- `client/src/__tests__/WysiwygEditor.test.tsx` - 4 tests: ProseMirror rendering, prose styling, placeholder, markdown parsing
- `client/src/__tests__/BubbleToolbar.test.tsx` - 4 tests: button rendering, active state, toggleBold, toggleItalic commands

## Decisions Made
- Used named imports for all @tiptap/* packages (v3.20 restructured exports from default to named)
- BubbleMenu imported from `@tiptap/react/menus` subpath (not `@tiptap/react` top-level)
- Disabled link in StarterKit to avoid duplicate extension warning when using standalone Link extension
- Mocked BubbleMenu in tests (renders children directly) since ProseMirror view not available in jsdom

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed TipTap import style from default to named exports**
- **Found during:** Task 1 (WysiwygEditor implementation)
- **Issue:** Plan examples used `import Markdown from '@tiptap/markdown'` (default import) but v3.20 packages export as named exports only, causing `Cannot read properties of undefined (reading 'configure')`
- **Fix:** Changed all imports to named: `import { Markdown } from '@tiptap/markdown'`, `import { StarterKit } from '@tiptap/starter-kit'`, etc.
- **Files modified:** client/src/components/WysiwygEditor.tsx
- **Verification:** All tests pass, no import errors

**2. [Rule 3 - Blocking] Fixed BubbleMenu import path**
- **Found during:** Task 1 (BubbleToolbar rendering)
- **Issue:** BubbleMenu not exported from `@tiptap/react` top-level in v3.20; it was moved to `@tiptap/react/menus` subpath
- **Fix:** Changed import to `import { BubbleMenu } from '@tiptap/react/menus'`
- **Files modified:** client/src/components/BubbleToolbar.tsx
- **Verification:** Component renders without errors

**3. [Rule 1 - Bug] Disabled link in StarterKit to prevent duplicate extension**
- **Found during:** Task 1 (test verification)
- **Issue:** StarterKit v3.20 bundles a Link extension, conflicting with standalone `@tiptap/extension-link`, causing "[tiptap warn]: Duplicate extension names found: ['link']"
- **Fix:** Added `StarterKit.configure({ link: false })` to disable the bundled link
- **Files modified:** client/src/components/WysiwygEditor.tsx
- **Verification:** Warning eliminated, all tests pass

---

**Total deviations:** 3 auto-fixed (2 blocking, 1 bug)
**Impact on plan:** All fixes were necessary to resolve TipTap v3.20 API changes from documented examples. No scope creep.

## Issues Encountered
None beyond the auto-fixed deviations above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- WysiwygEditor and BubbleToolbar are standalone, testable components ready for integration
- Plan 04 (EditorPane integration) can mount WysiwygEditor and wire up mode switching via the WysiwygEditorHandle ref
- Plan 03 (slash commands) can extend the editor's extension array

---
*Phase: 10-wysiwyg-editor*
*Completed: 2026-03-18*
