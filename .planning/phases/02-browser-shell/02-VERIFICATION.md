---
phase: 02-browser-shell
verified: 2026-03-09T14:05:00Z
status: passed
score: 4/4 success criteria verified
re_verification: false
human_verification:
  - test: "Open a fenced code block file in the browser"
    expected: "Code blocks render as styled monospace pre blocks (no Shiki syntax highlighting in current working tree — plain styling only)"
    why_human: "Shiki was removed from MarkdownPreview.tsx in working tree but the human visual checkpoint (Plan 05) ran with this state and typed 'approved'. Cannot re-run the human checkpoint programmatically."
  - test: "Verify frosted glass panel visually"
    expected: "backdrop-blur-md bg-white/60 on content card creates translucent frosted effect against warm cream background"
    why_human: "CSS backdrop-filter rendering depends on compositor; cannot verify visual effect programmatically"
  - test: "Verify orange accent palette throughout"
    expected: "Active tab has orange underline, selected file in tree has orange highlight, headings in prose-orange, TOC active item turns orange on scroll"
    why_human: "Color rendering and scroll-spy activation are visual; already approved by human in Plan 05"
---

# Phase 2: Browser Shell Verification Report

**Phase Goal:** Users can navigate their knowledge base, read documents beautifully, and experience the full visual design — Marky looks and feels like the purpose-built tool it is
**Verified:** 2026-03-09T14:05:00Z
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths (from ROADMAP Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Markdown files open in rendered preview mode — tables, checkboxes, fenced code blocks, headings all render correctly | VERIFIED | MarkdownPreview.tsx uses ReactMarkdown + remarkGfm + remarkFrontmatter; yaml:()=>null suppresses frontmatter; custom pre/code renderers handle fenced blocks |
| 2 | User can have multiple files open as tabs, each showing the filename | VERIFIED | useTabs hook with OPEN/CLOSE/FOCUS/REORDER/SET_CONTENT reducer; TabBar renders one SortableTab per tab showing tab.label; dedup guard in OPEN action prevents duplicates |
| 3 | User can close individual tabs without closing others | VERIFIED | CLOSE action in tabReducer removes tab by id, adjacent tab activates (next[idx] ?? next[idx-1] ?? null); close button dispatches CLOSE with stopPropagation |
| 4 | UI shows frosted glass panels, warm orange accents on a light background | VERIFIED | App.tsx: backgroundColor '#FAFAF8' root, backdrop-blur-md bg-white/60 content card, border-orange-500 active tab, prose-orange headings, orange-600 TOC active item; human approved in Plan 05 |

**Score:** 4/4 success criteria verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `client/src/types/tabs.ts` | Tab, TabState, TabAction type definitions | VERIFIED | Exports all three; 20 lines, complete interface definitions |
| `client/src/hooks/useTabs.ts` | useReducer tab state hook with openTab, closeTab, focusTab, reorderTabs, setTabContent, dispatch | VERIFIED | 67 lines; tabReducer exported for unit testing; all 6 functions present |
| `client/src/components/MarkdownPreview.tsx` | Markdown rendering pipeline: react-markdown + remark-gfm + remark-frontmatter | VERIFIED | 89 lines; ReactMarkdown + remarkGfm + remarkFrontmatter + remarkWikiLink; yaml suppression, link routing, img placeholder all wired |
| `client/src/components/TableOfContents.tsx` | Sticky TOC panel with IntersectionObserver scroll-spy | VERIFIED | 91 lines; extractHeadings regex (h1-h6), IntersectionObserver with cleanup on content change, orange active highlight |
| `client/src/components/TabBar.tsx` | Tab strip with dnd-kit sortable, orange active accent, close buttons | VERIFIED | 112 lines; DndContext + SortableContext + useSortable; PointerSensor with distance:8 activation; orange border-orange-500 on active tab |
| `client/src/components/WelcomeScreen.tsx` | Empty state when no tabs are open | VERIFIED | 23 lines; orange M logo mark, Marky branding, zero props |
| `client/src/App.tsx` | Wired application: useTabs + layout + all Phase 2 components | VERIFIED | 222 lines; useTabs driving all tab state; fetch on activeTab.id change; FileTree, TabBar, MarkdownPreview, TableOfContents, WelcomeScreen all imported and rendered |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `hooks/useTabs.ts` | `types/tabs.ts` | import | WIRED | Line 3: `import type { Tab, TabState, TabAction } from '../types/tabs'` |
| `App.tsx` | `hooks/useTabs.ts` | useTabs() hook call | WIRED | Line 8: `import { useTabs } from './hooks/useTabs'`; line 19: `const { tabs, activeTabId, openTab, dispatch } = useTabs()` |
| `App.tsx` | `/api/files/:path` | fetch in useEffect on activeTab.id | WIRED | Lines 62-70: `fetch('/api/files/${activeTab.path}')` dispatches SET_CONTENT on success |
| `App.tsx` | `MarkdownPreview.tsx` | renders active tab content | WIRED | Line 192: `<MarkdownPreview content={activeTab.content} onLinkClick={handleInternalLink} />` |
| `App.tsx` | `TableOfContents.tsx` | renders in right panel | WIRED | Line 213-214: `<TableOfContents content={activeTab.content} />` |
| `App.tsx` | `TabBar.tsx` | renders tabs with dispatch | WIRED | Line 177: `<TabBar tabs={tabs} activeTabId={activeTabId} dispatch={dispatch} />` |
| `App.tsx` | `WelcomeScreen.tsx` | renders when tabs.length === 0 | WIRED | Lines 179-181: `{tabs.length === 0 ? (<WelcomeScreen />) : ...}` |
| `TabBar.tsx` | `types/tabs.ts` | Tab type import | WIRED | Line 4: `import type { Tab, TabAction } from '../types/tabs'` |
| `TabBar.tsx` | `@dnd-kit/core and @dnd-kit/sortable` | DndContext, SortableContext, useSortable | WIRED | Lines 1-3: DndContext, SortableContext, useSortable all imported and used |
| `MarkdownPreview.tsx` | `react-markdown` | ReactMarkdown component | WIRED | Line 1: import; line 17: `<ReactMarkdown>` with remarkPlugins and components props |
| `TableOfContents.tsx` | `IntersectionObserver` | useEffect with content dep | WIRED | Lines 38-58: `new IntersectionObserver(...)` with rootMargin, observes all heading elements |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| VIEW-01 | 02-02, 02-04, 02-05 | Markdown files open in rendered preview mode by default | SATISFIED | ReactMarkdown pipeline with GFM, frontmatter suppression; human approved in Plan 05 |
| VIEW-02 | 02-01, 02-03, 02-04, 02-05 | User can have multiple files open simultaneously in tabs | SATISFIED | useTabs hook; TabBar renders all open tabs; OPEN dedup guard verified |
| VIEW-03 | 02-01, 02-03, 02-04, 02-05 | User can switch between open files by clicking tabs | SATISFIED | FOCUS action dispatched on tab click; activeTabId drives content display |
| VIEW-04 | 02-01, 02-03, 02-04, 02-05 | User can close tabs individually | SATISFIED | CLOSE action; adjacent tab activates; WelcomeScreen on last tab close |
| DSNG-01 | 02-04, 02-05 | Glass-inspired design — frosted panels, soft blur, transparency | SATISFIED | backdrop-blur-md bg-white/60 border border-white/20 on content card; human approved |
| DSNG-02 | 02-03, 02-04, 02-05 | Orange and white palette — warm orange accents | SATISFIED | border-orange-500 active tab; accent-orange-500 checkboxes; prose-orange headings; orange-600 TOC active |
| DSNG-03 | 02-03, 02-04, 02-05 | Big Hero 6 aesthetic — bright, clean, futuristic yet warm | SATISFIED | backgroundColor '#FAFAF8' warm cream; orange M logo on WelcomeScreen; human approved |
| DSNG-04 | 02-02, 02-04, 02-05 | Airy typography — generous whitespace, no visual noise | SATISFIED | prose prose-orange max-w-none p-8 pb-16 wrapping MarkdownPreview; @tailwindcss/typography installed; human approved |

No orphaned requirements found. All 8 Phase 2 requirements claimed by plans are present in REQUIREMENTS.md and accounted for.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `MarkdownPreview.tsx` | 73 | Comment "Defer proxy to Phase 4. Show a placeholder alt text..." | Info | Intentional deferral for local image handling; not a missing implementation — placeholder is the designed behavior for Phase 2 |

No stubs, no empty handlers, no TODO/FIXME blockers found.

### Notable Working Tree State

Five files have uncommitted modifications relative to the last commit (b9caa9d). These are post-commit refinements that were in place during the human visual verification (Plan 05) and represent the actual running state of the app:

**`client/src/App.tsx`** — react-resizable-panels `Group/Panel/Separator` replaced with custom mouse-drag pixel-width resizing. The installed library API (v4) differed from what the plan specified (v1/v2), so a native implementation was substituted. All Phase 2 layout requirements are met by the working tree version.

**`client/src/components/MarkdownPreview.tsx`** — ShikiHighlighter (react-shiki) replaced with plain styled `<pre>` blocks. Comment in code reads "Fenced code blocks — plain, no syntax highlighting." The SUMMARY-02-02 claims Shiki was implemented — this is stale relative to the current working tree. The human visual checkpoint in Plan 05 ran against this state and typed "approved." Since VIEW-01 requires fenced code blocks "render correctly" (not specifically with syntax highlighting), this satisfies the requirement. The react-shiki package remains installed in package.json though unused.

**`client/src/components/TabBar.tsx`** — Added `PointerSensor` with `activationConstraint: { distance: 8 }` to prevent clicks on tabs from accidentally triggering drag. An improvement, not a regression.

**`client/src/components/TableOfContents.tsx`** — Extended heading extraction regex from h1-h4 to h1-h6, and DOM querySelectorAll to match. An improvement.

**`client/src/components/FileTree.tsx` / `client/src/hooks/useFileTree.ts`** — Enhanced with folder expansion state management, FolderPickerModal integration, and improved file tree props. These are Phase 1 components improved in the working tree.

**`client/src/components/FolderPickerModal.tsx`** — New untracked file used by FileTree. Exists on disk and compiles cleanly (TypeScript exit 0 confirmed).

All working tree changes compile cleanly (`npx tsc --noEmit` exits 0), all 13 client unit tests pass, all 9 server tests pass.

### Human Verification Required

#### 1. Syntax Highlighting in Code Blocks

**Test:** Open a markdown file containing a fenced code block (e.g., ` ```typescript ... ``` `) in the running app
**Expected:** Code renders in a styled monospace block (bg-gray-100, gray-800 text). Note: syntax highlighting via Shiki is NOT present in the current working tree — code blocks are plain styled `<pre>` elements
**Why human:** The human checkpoint in Plan 05 already ran against this state and approved. This item documents the delta from plan specification (Shiki) vs. current implementation (plain). If syntax highlighting is required before Phase 3, the working tree change should be reverted or the feature re-implemented.

#### 2. Frosted Glass Visual Effect

**Test:** Open any file in the app and observe the main content card
**Expected:** The content card has a frosted/translucent appearance against the warm cream (#FAFAF8) background — `backdrop-blur-md bg-white/60` creates a soft translucent white over the cream
**Why human:** CSS backdrop-filter rendering is GPU-compositor-dependent; cannot be verified via grep

#### 3. Orange Accent Completeness

**Test:** With a file open, scroll through content; switch tabs; observe tree selection
**Expected:** Active tab has orange bottom border; selected file in tree has orange highlight; h1/h2/h3 headings in prose appear orange (via prose-orange); TOC active heading turns orange on scroll
**Why human:** Conditional CSS class application and scroll-spy activation require browser rendering to verify

### Gaps Summary

No gaps blocking goal achievement. All four Success Criteria from ROADMAP.md are verified in the codebase. All eight requirement IDs (VIEW-01 through VIEW-04, DSNG-01 through DSNG-04) have implementation evidence.

One notable delta exists between the SUMMARY-02-02 documentation and the current working tree: Shiki syntax highlighting was committed, then removed in an uncommitted working tree change. The human visual verification in Plan 05 ran against the current (non-Shiki) state and produced "approved." This does not constitute a gap against the ROADMAP Success Criteria, which require only that fenced code blocks "render correctly" — they do render as styled monospace blocks.

The uncommitted working tree changes should be committed before Phase 3 begins to avoid confusion.

---

_Verified: 2026-03-09T14:05:00Z_
_Verifier: Claude (gsd-verifier)_
