---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: completed
stopped_at: Completed 03-editor-03-05-PLAN.md
last_updated: "2026-03-09T15:52:06.252Z"
last_activity: "2026-03-09 — Phase 3 complete: Human approved all Phase 3 requirements (EDIT-01–EDIT-05, VIEW-05)"
progress:
  total_phases: 5
  completed_phases: 3
  total_plans: 13
  completed_plans: 13
  percent: 75
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-06)

**Core value:** Instant, beautiful markdown reading and editing with full-text search across all files — so nothing gets lost and switching between documents is effortless.
**Current focus:** Phase 2 — Browser Shell (next)

## Current Position

Phase: 3 of 5 (Editor — COMPLETE)
Plan: 5 of 5 complete
Status: Phase 3 complete — proceeding to Phase 4 (Full-Text Search)
Last activity: 2026-03-09 — Phase 3 complete: Human approved all Phase 3 requirements (EDIT-01–EDIT-05, VIEW-05)

Progress: [███████░░░] 75%

## Performance Metrics

**Velocity:**
- Total plans completed: 0
- Average duration: -
- Total execution time: 0 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| - | - | - | - |

**Recent Trend:**
- Last 5 plans: -
- Trend: -

*Updated after each plan completion*
| Phase 01 P01 | 3 | 2 tasks | 19 files |
| Phase 01 P02 | 2 | 2 tasks | 7 files |
| Phase 01 P03 | 8 | 1 tasks | 5 files |
| Phase 02-browser-shell P01 | 3 | 2 tasks | 7 files |
| Phase 02-browser-shell P03 | 5 | 2 tasks | 3 files |
| Phase 02-browser-shell P02 | 2 | 2 tasks | 2 files |
| Phase 02-browser-shell P04 | 8 | 1 tasks | 1 files |
| Phase 02-browser-shell P05 | 5 | 1 tasks | 0 files |
| Phase 03-editor P01 | 8 | 2 tasks | 2 files |
| Phase 03-editor P02 | 8 | 2 tasks | 4 files |
| Phase 03-editor P03 | 3 | 2 tasks | 4 files |
| Phase 03-editor P04 | 1 | 2 tasks | 2 files |
| Phase 03-editor P05 | ~45min | 2 tasks | 2 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Web-based over desktop app: local-first now, hostable later
- Claude API for semantic search: user already uses Claude ecosystem (v2 scope)
- Editor opens below preview (not side): keeps preview readable while editing
- [Phase 01-01]: npm workspaces chosen over pnpm/turborepo: simpler for two-package monorepo, no extra tooling
- [Phase 01-01]: tsconfig paths used for @marky/shared resolution to avoid NodeNext dual-import issues
- [Phase 01-01]: Tailwind v4 CSS-first config: @import tailwindcss in index.css via @tailwindcss/vite plugin, no config file
- [Phase 01]: macOS realpath fix: for non-existent files reconstruct real path via realRoot + path.relative() instead of falling back to symlinked path
- [Phase 01]: buildApp() factory with fastify.decorate('rootDir') chosen over env-based config for test isolation
- [Phase 01]: Exact GET /api/files registered before wildcard GET /api/files/* to prevent route shadowing (Fastify first-match wins)
- [Phase 01]: window.prompt/confirm used for Phase 1 CRUD inputs — explicit deferral of modal UI to Phase 2
- [Phase 01]: Hook pattern established: custom hook owns fetch + state + refetch; component receives via props
- [Phase 02-browser-shell]: tabReducer exported from useTabs.ts for unit testing without React environment
- [Phase 02-browser-shell]: skipLibCheck: true in client tsconfig — @dnd-kit/core 6.x JSX namespace incompatible with react-jsx strict mode
- [Phase 02-browser-shell]: Vitest installed for client workspace TDD; pure reducer tests require no DOM environment
- [Phase 02-browser-shell]: @dnd-kit/utilities installed separately for CSS.Transform.toString — not bundled with @dnd-kit/sortable
- [Phase 02-browser-shell]: TabBar returns null when empty; WelcomeScreen is a zero-prop sibling rendered by App.tsx
- [Phase 02-browser-shell]: yaml:()=>null component override required to suppress remark-frontmatter output in react-markdown
- [Phase 02-browser-shell]: TOC uses regex on raw markdown string for synchronous heading extraction — avoids second remark AST parse
- [Phase 02-browser-shell]: react-resizable-panels v4 uses Group/Panel/Separator exports — PanelGroup and PanelResizeHandle are v1-v2 API only
- [Phase 02-browser-shell]: useEffect for content fetch depends on activeTab.id + activeTab.path primitives (not full object) to prevent infinite re-fetch loops
- [Phase 02-browser-shell]: Visual verification gated at phase end — one checkpoint after all implementation confirms aesthetic requirements (frosted glass, orange accents) no automated test can check
- [Phase 03-editor]: CLOSE + dirty guard lives in TabBar event handler (not reducer) — no reducer test needed
- [Phase 03-editor]: useAutoSave tests use vi.useFakeTimers for deterministic debounce control
- [Phase 03-editor]: Tab type extended non-breakingly: new fields dirty/editMode added at end, existing fields unchanged
- [Phase 03-editor]: Global jsdom vitest environment chosen over environmentMatchGlobs — pure reducer tests pass in jsdom, simpler config
- [Phase 03-editor]: onSaved excluded from useAutoSave useEffect deps — stable callback responsibility is caller's; avoids infinite loops if not memoized
- [Phase 03-editor]: Local editContent state in EditorPane (not reducer) prevents cursor-jumping on every keystroke
- [Phase 03-editor]: window.confirm for dirty-tab close guard matches Phase 1 pattern established in STATE.md
- [Phase 03-editor]: Per-pane focus isolation: rightActiveTabId local to App.tsx, rightDispatch intercepts FOCUS to set it; all other actions pass to shared reducer
- [Phase 03-editor]: useAutoSave guarded to only fire when editMode active and user has made changes — prevents spurious saves on tab switch

### Pending Todos

None yet.

### Blockers/Concerns

- Phase 2: For resizable panels, prefer react-resizable-panels over allotment (better maintained)
- Phase 2: Tailwind v4 CSS-first config is now confirmed working (used in Phase 1 with no issues)
- Phase 5+: FlexSearch 0.7.x version needs npm verification before install — MiniSearch is a fallback

## Session Continuity

Last session: 2026-03-09T15:52:06.250Z
Stopped at: Completed 03-editor-03-05-PLAN.md
Resume file: None
