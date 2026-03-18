---
gsd_state_version: 1.0
milestone: v1.1
milestone_name: Polish and Navigation
status: executing
stopped_at: Completed 10-02-PLAN.md
last_updated: "2026-03-18T16:10:48.568Z"
last_activity: "2026-03-18 — Completed 10-02: Core Editor and Bubble Toolbar"
progress:
  total_phases: 5
  completed_phases: 3
  total_plans: 16
  completed_plans: 14
  percent: 75
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-10)

**Core value:** Instant, beautiful markdown reading and editing with full-text search across all files — so nothing gets lost and switching between documents is effortless.
**Current focus:** Phase 10: WYSIWYG Editor

## Current Position

Phase: 10 of 10 (Phase 10: WYSIWYG Editor)
Plan: 2 of 5 (complete)
Status: Executing
Last activity: 2026-03-18 — Completed 10-02: Core Editor and Bubble Toolbar

Progress: [████████░░] 75% (v1.1 milestone)

## Performance Metrics

**Velocity (v1.0 reference):**
- Total plans completed: 25 (v1.0)
- Average duration: ~5 min/plan
- Total execution time: ~2 hours (v1.0)

**v1.1 By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| - | - | - | - |

**Recent Trend:**
- Last 5 plans (v1.0): 2, 2, 2, 2, 2 min
- Trend: Stable

*Updated after each plan completion*
| Phase 06-tab-persistence-and-image-rendering P01 | 6 | 3 tasks | 4 files |
| Phase 06-tab-persistence-and-image-rendering P02 | 3 | 2 tasks | 5 files |
| Phase 06-tab-persistence-and-image-rendering P03 | 12 | 2 tasks | 4 files |
| Phase 06-tab-persistence-and-image-rendering P04 | 5 | 1 tasks | 1 files |
| Phase 06-tab-persistence-and-image-rendering P04 | 5 | 2 tasks | 1 files |
| Phase 07-file-templates P01 | 2 | 3 tasks | 4 files |
| Phase 07-file-templates P02 | 5 | 2 tasks | 7 files |
| Phase 07-file-templates P03 | 8 | 2 tasks | 2 files |
| Phase 07-file-templates P04 | 5 | 2 tasks | 2 files |
| Phase 08-backlinks-panel P01 | 4 | 3 tasks | 3 files |
| Phase 08-backlinks-panel P02 | 5 | 2 tasks | 4 files |
| Phase 08-backlinks-panel P03 | continuation | 3 tasks | 2 files |
| Phase 10-wysiwyg-editor P01 | 3 | 2 tasks | 10 files |
| Phase 10 P03 | 6 | 2 tasks | 7 files |
| Phase 10-wysiwyg-editor P02 | 8 | 2 tasks | 4 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [Phase 05-07]: FileInfo placed in right TOC panel above TableOfContents — tag editing with file metadata context
- [Phase 05-08]: activeFocusedTab derived variable as single source of truth for focused pane's active tab
- [Phase 05-09]: setActiveId called immediately on TOC click (optimistic update) before delegating scroll
- [Phase 06-01]: localStorage key scheme: marky:tabs, marky:scroll, marky:recent — maps directly to CONTEXT.md spec
- [Phase 06-01]: Scroll map: JSON object keyed by file path for O(1) lookup in Wave 1 implementation
- [Phase 06-02]: useScrollPersist attached to EditorPane preview container (scroll is pane-level concern)
- [Phase 06-02]: saveTabState accepts activeTabPath not UUID — caller resolves UUID-to-path (Pitfall 3 from plan)
- [Phase 06-tab-persistence-and-image-rendering]: Phase 06-03: OS_ROOT_PREFIXES expanded to include /tmp/ and other system dirs to correctly return 403 for paths outside rootDir
- [Phase 06-tab-persistence-and-image-rendering]: Phase 06-03: MarkdownPreview filePath prop is required (not optional) — EditorPane always has tab.path, URL() constructor used for client-side relative path normalization
- [Phase 06-tab-persistence-and-image-rendering]: Phase 06-04: Write-lock TTL increased from 200ms to 500ms to eliminate LIVE-01 test race condition (chokidar settle window overlap)
- [Phase 06-tab-persistence-and-image-rendering]: Phase 06-04: Write-lock TTL confirmed at 500ms (up from 200ms) — deterministic fix for LIVE-01 race condition; all Phase 6 requirements verified by user
- [Phase 07-file-templates]: Wave 0 RED-first: all 4 test stubs created before any implementation to lock down behavioral contracts for TMPL-01, TMPL-02, TMPL-03
- [Phase 07-file-templates]: FolderPickerModal step 1 renders template buttons inline; applyTokens called once in handleConfirm; vitest setup uses direct expect.extend to fix monorepo v2/v4 version conflict
- [Phase 07-file-templates]: Phase 07-03: Default export for templatesRoutes (consistent with files.ts/watch.ts/search.ts); rootDir: string added to FastifyInstance augmentation in app.ts
- [Phase 07-file-templates]: Phase 07-04: FileInfo fetches file content on-demand via /api/files/{path} at save-template time rather than receiving content as a prop — avoids prop-drilling
- [Phase 07-file-templates]: Phase 07-04: No success toast after Save as template — button itself serves as sufficient feedback; next picker open shows the saved template
- [Phase 08-backlinks-panel]: Phase 08-01: Wave 0 RED-first — three test stubs committed before any implementation to lock BKLN-01/02/03 behavioral contracts
- [Phase 08-backlinks-panel]: Phase 08-02: BacklinkService has own collectMdFiles for service isolation; updateDoc calls _removeFileLinks first to prevent stale reverse-index entries; wildcard GET /api/backlinks/* handles slash-containing paths
- [Phase 08-backlinks-panel]: Phase 08-03: BacklinksPanel returns null when activeFilePath is null; header always visible at zero count; onOpen uses openTab+updateRecentFiles+expandFolder pattern
- [Phase 10-wysiwyg-editor]: Wave 0 RED-first: all 7 test stubs created before any WYSIWYG implementation to lock behavioral contracts for WYSIWYG-01 through WYSIWYG-05
- [Phase 10-wysiwyg-editor]: TipTap v3.20.4 installed with 12 packages including @tiptap/markdown for round-trip fidelity
- [Phase 10]: SlashItem icon uses text strings (H1, H2, etc.) not SVG; Image command deferred to Plan 04 wiring
- [Phase 10]: Upload route scopes @fastify/multipart to itself; filename sanitization replaces non-alphanumeric with underscore
- [Phase 10-02]: Named imports for all @tiptap/* v3.20 packages (not default exports); BubbleMenu from @tiptap/react/menus subpath
- [Phase 10-02]: StarterKit.configure({ link: false }) to avoid duplicate extension when using standalone Link extension
- [Phase 10-02]: Mock BubbleMenu in tests to avoid ProseMirror view dependency in jsdom

### Pending Todos

None yet.

### Blockers/Concerns

- Phase 6 (PRST-03): Scroll restore timing — useLayoutEffect plus async content load interaction; timing edge case must be verified against real long documents, not just reasoned about
- Phase 8 (BKLN): Wikilink parsing edge cases — `[[Wiki Link With Spaces]]` normalization needs unit tests before panel ships; normalize to lowercase for macOS case-insensitive FS
- Phase 9 (GRPH): Right panel height budget — three-section right panel (FileInfo + BacklinksPanel + TOC) needs visual design review after Phase 8 before Phase 9 adds graph toggle
- Phase 9 (GRPH): Graph performance — verify react-force-graph-2d with synthetic large dataset (500+ nodes) before declaring Phase 9 done

## Session Continuity

Last session: 2026-03-18T16:09:05Z
Stopped at: Completed 10-02-PLAN.md
Resume file: .planning/phases/10-wysiwyg-editor/10-03-PLAN.md
