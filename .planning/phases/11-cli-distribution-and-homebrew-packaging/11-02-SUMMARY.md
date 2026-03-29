---
phase: 11-cli-distribution-and-homebrew-packaging
plan: 02
subsystem: api
tags: [cli, fastify, open, port-selection]

requires:
  - phase: 11-cli-distribution-and-homebrew-packaging-01
    provides: CLI contract tests
provides:
  - Standalone CLI entrypoint with root resolution and port selection
  - Reusable Fastify startup helper with attachable static UI support
  - Browser auto-open helper gated by `--no-open`
affects: [11-03, 11-04]

tech-stack:
  added: [open]
  patterns: [reusable-server-bootstrap, cli-helper-exports]

key-files:
  created:
    - server/src/cli.ts
    - server/src/start-server.ts
  modified:
    - server/package.json
    - server/src/index.ts
    - server/tests/cli/marky-cli.test.ts
    - server/tests/cli/port-and-open.test.ts

key-decisions:
  - "Default CLI port is 4310 with fallback probing through 4320"
  - "ROOT_DIR overrides positional path, which overrides process.cwd()"
  - "Static UI attachment is exported separately so tests can validate serving behavior without binding a TCP listener"

patterns-established:
  - "CLI runtime behavior is exported as testable helpers rather than hidden inside process entrypoint code"
  - "Fastify startup can be reused by both repo-local startup and packaged CLI execution"

requirements-completed: [CLI-01, CLI-02, CLI-04, CLI-05]

duration: 18min
completed: 2026-03-29
---

# Phase 11 Plan 02: Standalone CLI Runtime Summary

**Marky now has a real standalone CLI entrypoint with deterministic root resolution, port handling, and browser-open behavior**

## Performance

- **Duration:** 18 min
- **Started:** 2026-03-29T15:53:00Z
- **Completed:** 2026-03-29T16:11:00Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Added `server/src/cli.ts` with exported helpers and `main()`
- Added `server/src/start-server.ts` for reusable Fastify startup and static UI registration
- Turned the CLI helper tests green and preserved repo-local `server/src/index.ts` startup through the shared bootstrap

## Task Commits

Executed locally in this run; per-task git commits were not split out before the summaries were written.

## Files Created/Modified
- `server/src/cli.ts` - CLI argument parsing, root resolution, port probing, browser-open helper, and main entrypoint
- `server/src/start-server.ts` - reusable startup and static UI attachment
- `server/package.json` - runtime dependency on `open`
- `server/src/index.ts` - repo-local startup now delegates to shared startup helper
- `server/tests/cli/marky-cli.test.ts` - green CLI contract coverage
- `server/tests/cli/port-and-open.test.ts` - green port and browser-open coverage

## Decisions Made
- Exported helper functions directly from the CLI module to keep tests small and deterministic
- Separated `attachStaticUi()` from `startMarkyServer()` so runtime behavior can be verified without real socket listeners

## Deviations from Plan

None - the runtime was implemented as planned, with one testing-oriented refinement to avoid sandbox socket restrictions.

## Issues Encountered
- Initial tests that tried to bind real ports were blocked by the environment and were converted to injected/in-process checks.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Packaged asset resolution and root package publication could build directly on the reusable CLI/startup helpers

---
*Phase: 11-cli-distribution-and-homebrew-packaging*
*Completed: 2026-03-29*
