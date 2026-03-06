---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: executing
stopped_at: Completed 02-browser-shell-02-02-PLAN.md
last_updated: "2026-03-06T21:22:34.645Z"
last_activity: "2026-03-06 — Phase 2 Plan 03 complete: TabBar (dnd-kit sortable) and WelcomeScreen components built"
progress:
  total_phases: 5
  completed_phases: 1
  total_plans: 8
  completed_plans: 6
  percent: 63
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-06)

**Core value:** Instant, beautiful markdown reading and editing with full-text search across all files — so nothing gets lost and switching between documents is effortless.
**Current focus:** Phase 2 — Browser Shell (next)

## Current Position

Phase: 2 of 5 (Browser Shell — in progress)
Plan: 3 of 5 complete
Status: Phase 2 in progress — Plan 02-03 complete
Last activity: 2026-03-06 — Phase 2 Plan 03 complete: TabBar (dnd-kit sortable) and WelcomeScreen components built

Progress: [██████░░░░] 63%

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

### Pending Todos

None yet.

### Blockers/Concerns

- Phase 2: For resizable panels, prefer react-resizable-panels over allotment (better maintained)
- Phase 2: Tailwind v4 CSS-first config is now confirmed working (used in Phase 1 with no issues)
- Phase 5+: FlexSearch 0.7.x version needs npm verification before install — MiniSearch is a fallback

## Session Continuity

Last session: 2026-03-06T21:22:34.643Z
Stopped at: Completed 02-browser-shell-02-02-PLAN.md
Resume file: None
