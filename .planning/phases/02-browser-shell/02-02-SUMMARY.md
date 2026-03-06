---
phase: 02-browser-shell
plan: "02"
subsystem: ui
tags: [react, typescript, react-markdown, remark-gfm, remark-frontmatter, remark-wiki-link, react-shiki, shiki, intersection-observer, tailwind]

# Dependency graph
requires:
  - phase: 02-browser-shell
    plan: "01"
    provides: all nine Phase 2 libs installed, Tab/TabState/TabAction types, useTabs hook

provides:
  - MarkdownPreview component: react-markdown + GFM + frontmatter suppression + wiki-link routing + Shiki code highlighting
  - TableOfContents component: heading extraction from raw markdown + IntersectionObserver scroll-spy with active highlight

affects:
  - 02-04 (ResizableLayout places MarkdownPreview and TableOfContents in panels)
  - 02-05 (App.tsx wires content prop and onLinkClick callback to MarkdownPreview and TOC)

# Tech tracking
tech-stack:
  added: []  # All libraries already installed in 02-01
  patterns:
    - "Frontmatter suppression: remark-frontmatter parses yaml node, yaml:()=>null component override prevents render"
    - "Internal link routing: href.endsWith('.md') check in custom <a> component calls onLinkClick instead of navigating"
    - "Shiki async code highlighting: ShikiHighlighter from react-shiki wraps fenced code blocks; language extracted from className"
    - "TOC regex extraction: synchronous heading parse from raw string avoids second remark AST pass"
    - "IntersectionObserver cleanup: observerRef.current.disconnect() before re-subscribing prevents duplicate observers on content change"

key-files:
  created:
    - client/src/components/MarkdownPreview.tsx
    - client/src/components/TableOfContents.tsx
  modified: []

key-decisions:
  - "yaml:()=>null component override is required for frontmatter suppression — remark-frontmatter parses but does not suppress YAML from rendering"
  - "TOC uses regex on raw markdown string (not remark AST) to produce headings synchronously without a second parse"
  - "IntersectionObserver rootMargin '-20% 0px -70% 0px' chosen for comfortable scroll-spy that activates headings before they leave view"
  - "Local images show text placeholder instead of broken icon — file:// proxy deferred to Phase 4"

patterns-established:
  - "component override pattern: ReactMarkdown components prop for custom node renderers (yaml, a, code, img)"
  - "observerRef pattern: useRef<IntersectionObserver> to allow disconnect/reconnect across content changes without stale closure"

requirements-completed: [VIEW-01, DSNG-04]

# Metrics
duration: 2min
completed: 2026-03-06
---

# Phase 2 Plan 02: Markdown Rendering Pipeline Summary

**MarkdownPreview with GFM + frontmatter suppression + Shiki code highlighting + wiki-link routing, plus TableOfContents with regex heading extraction and IntersectionObserver scroll-spy**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-06T21:20:10Z
- **Completed:** 2026-03-06T21:21:30Z
- **Tasks:** 2
- **Files modified:** 2 (2 created, 0 modified)

## Accomplishments

- Created `MarkdownPreview.tsx` rendering GFM tables, strikethrough, task list checkboxes, and fenced code blocks with Shiki github-light theme
- YAML frontmatter stripped via `yaml: () => null` component override — raw `---...---` never appears in rendered output
- Internal `.md` links and `[[wiki-links]]` intercepted by custom `<a>` component and routed to `onLinkClick` callback; external links open in new tab
- Local file images show a text placeholder `[alt]` instead of a broken image icon — file:// proxy deferred to Phase 4
- Created `TableOfContents.tsx` with synchronous heading extraction via regex (h1–h4) and IntersectionObserver scroll-spy highlighting the active heading in orange

## Task Commits

1. **Task 1: MarkdownPreview component** - `37022bb` (feat)
2. **Task 2: TableOfContents component** - `b3f1c77` (feat)

## Files Created/Modified

- `client/src/components/MarkdownPreview.tsx` — Full markdown rendering pipeline: ReactMarkdown + remarkGfm + remarkFrontmatter + remarkWikiLink + ShikiHighlighter; exports `MarkdownPreview`
- `client/src/components/TableOfContents.tsx` — Sticky TOC panel with scroll-spy active highlight; exports `TableOfContents`

## Decisions Made

- `yaml: () => null` component override is the correct way to suppress remark-frontmatter output — the plugin parses the YAML as a node type but does not suppress rendering; the `components` prop override handles it
- TOC uses regex on the raw markdown string rather than a remark AST pass — avoids async setup and second parse; produces the same heading IDs react-markdown generates (lowercase, spaces to dashes, special chars stripped)
- `IntersectionObserver` rootMargin `-20% 0px -70% 0px` activates a heading when it is in the middle third of the viewport, giving comfortable scroll-spy behaviour
- `observerRef.current.disconnect()` before reconnecting in `useEffect` prevents duplicate observers when content changes (new file opened in active tab)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `MarkdownPreview` ready for integration in ResizableLayout (02-04) and App.tsx wiring (02-05)
- `TableOfContents` ready for right-panel placement in ResizableLayout (02-04)
- Both components accept only `content: string` and callbacks — no external state dependencies
- TypeScript strict mode passes cleanly; server regression tests all pass (9/9)

## Self-Check: PASSED

- `client/src/components/MarkdownPreview.tsx` verified present on disk
- `client/src/components/TableOfContents.tsx` verified present on disk
- Commit `37022bb` verified in git history
- Commit `b3f1c77` verified in git history

---
*Phase: 02-browser-shell*
*Completed: 2026-03-06*
