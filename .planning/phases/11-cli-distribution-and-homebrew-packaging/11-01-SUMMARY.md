---
phase: 11-cli-distribution-and-homebrew-packaging
plan: 01
subsystem: testing
tags: [vitest, cli, packaging, static-assets]

requires: []
provides:
  - Wave 0 CLI contract tests for arg parsing and root resolution
  - Port-selection and browser-open behavior tests
  - Static asset serving and npm-pack artifact contract tests
affects: [11-02, 11-03, 11-04]

tech-stack:
  added: []
  patterns: [wave-0-red-tests, package-artifact-contract]

key-files:
  created:
    - server/tests/cli/marky-cli.test.ts
    - server/tests/cli/port-and-open.test.ts
    - server/tests/cli/standalone-assets.test.ts
    - server/tests/cli/package-artifact.test.ts
  modified: []

key-decisions:
  - "Port and static-serving tests avoid real socket binding and verify behavior in-process so they remain stable in sandboxed environments"
  - "npm pack contract test parses the trailing JSON payload because prepack build logs appear before the JSON array"

patterns-established:
  - "CLI helper behavior is locked at the function level before runtime integration"
  - "Packaged-mode tests verify built asset shape rather than source-layout assumptions"

requirements-completed: [CLI-01, CLI-02, CLI-03, CLI-04, CLI-05, DIST-01]

duration: 12min
completed: 2026-03-29
---

# Phase 11 Plan 01: CLI Contract Test Summary

**Wave 0 test coverage for the Marky CLI contract, packaged static serving, and npm-pack artifact shape**

## Performance

- **Duration:** 12 min
- **Started:** 2026-03-29T15:41:00Z
- **Completed:** 2026-03-29T15:53:00Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Added contract tests for CLI arg parsing and root resolution precedence
- Added deterministic tests for explicit-port failure, default-port probing, and `--no-open`
- Added packaged-mode static asset tests and npm-pack artifact tests that drive the rest of Phase 11

## Task Commits

Executed locally in this run; per-task git commits were not split out before the summaries were written.

## Files Created/Modified
- `server/tests/cli/marky-cli.test.ts` - CLI parsing and root precedence tests
- `server/tests/cli/port-and-open.test.ts` - port conflict and browser-open tests
- `server/tests/cli/standalone-assets.test.ts` - static asset and API coexistence tests
- `server/tests/cli/package-artifact.test.ts` - root package and npm-pack artifact tests

## Decisions Made
- Kept tests independent of OS socket permissions by using injected availability checks and `app.inject`
- Treated the pack artifact as the real distribution contract, not just a docs-level promise

## Deviations from Plan

None - plan executed with the intended RED-first contract, then evolved into stable verification tests during implementation.

## Issues Encountered
- Real socket binding is restricted in this environment, so port/static tests were rewritten to verify the same behavior without opening listeners.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- The CLI runtime implementation had a precise test target for `11-02`
- The packaging phase had a precise artifact contract for `11-03`

---
*Phase: 11-cli-distribution-and-homebrew-packaging*
*Completed: 2026-03-29*
