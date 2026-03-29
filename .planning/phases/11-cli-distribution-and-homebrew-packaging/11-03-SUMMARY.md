---
phase: 11-cli-distribution-and-homebrew-packaging
plan: 03
subsystem: infra
tags: [npm-pack, build, homebrew, package-artifact]

requires:
  - phase: 11-cli-distribution-and-homebrew-packaging-01
    provides: package-artifact tests
  - phase: 11-cli-distribution-and-homebrew-packaging-02
    provides: CLI runtime and startup helpers
provides:
  - Publishable root package metadata and bin contract
  - Working shared/server/client build chain
  - Packaged CLI smoke verifier with production dependency install
affects: [11-04]

tech-stack:
  added: []
  patterns: [root-package-as-cli-artifact, temp-cache-pack-verification]

key-files:
  created:
    - scripts/verify-cli-package.mjs
  modified:
    - package.json
    - package-lock.json
    - shared/package.json
    - server/package.json
    - server/tsconfig.json
    - client/tsconfig.json
    - server/src/routes/files.ts
    - server/src/lib/fsTree.ts
    - server/src/lib/search.ts
    - server/tests/cli/package-artifact.test.ts

key-decisions:
  - "Root package is the publishable CLI artifact and now owns the runtime dependency set needed after installation"
  - "Shared type resolution now targets built declarations rather than source files outside server rootDir"
  - "Pack verification uses a temporary npm cache because the global cache is not reliable in this environment"

patterns-established:
  - "Prepack build drives npm-pack artifact validation"
  - "Packed artifact smoke installs production dependencies before executing the extracted CLI"

requirements-completed: [CLI-01, CLI-03, DIST-01]

duration: 32min
completed: 2026-03-29
---

# Phase 11 Plan 03: Packaging and Artifact Summary

**Marky now builds as a publishable CLI package with a real `bin` entry, production artifact contract, and smoke-verifiable packed distribution**

## Performance

- **Duration:** 32 min
- **Started:** 2026-03-29T16:11:00Z
- **Completed:** 2026-03-29T16:43:00Z
- **Tasks:** 2
- **Files modified:** 10

## Accomplishments
- Converted the root package into a publishable CLI artifact with `version`, `bin`, `files`, `prepack`, and `pack:dry`
- Fixed the monorepo build chain by adding shared/server build scripts and making server type resolution build-safe
- Added a packed-artifact smoke verifier that builds, packs, installs production deps in the extracted tarball, and launches the CLI

## Task Commits

Executed locally in this run; per-task git commits were not split out before the summaries were written.

## Files Created/Modified
- `package.json` - publishable root package metadata and runtime dependencies
- `package-lock.json` - dependency graph updates for root CLI distribution
- `shared/package.json` - declaration build for shared types
- `server/package.json` - server build script
- `server/tsconfig.json` - build-safe server compilation scope
- `client/tsconfig.json` - shared type resolution aligned to built declarations
- `server/src/routes/files.ts` - type-only shared imports
- `server/src/lib/fsTree.ts` - type-only shared imports
- `server/src/lib/search.ts` - MiniSearch config typing fix
- `scripts/verify-cli-package.mjs` - packed CLI smoke verification

## Decisions Made
- Kept the root package as the canonical CLI artifact instead of introducing a second publishable package
- Installed production dependencies inside the extracted tarball during smoke verification to mirror real installation behavior
- Used a temp npm cache for pack verification to avoid host-machine cache permission issues

## Deviations from Plan

None - the build and packaging work stayed within the planned scope, with environment-specific fixes limited to cache isolation and type-resolution cleanup.

## Issues Encountered
- `npm pack --json` output is prefixed by prepack build logs, so JSON extraction had to parse the trailing JSON array rather than the full stdout buffer.
- The initial packed smoke showed missing runtime dependencies from the extracted tarball, which was fixed by making the root package own the runtime dependency set and installing production deps before launch.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Release automation, Homebrew formula, and install documentation can now target a stable tarball contract
- Manual verification is still required before Phase 11 can be marked complete

---
*Phase: 11-cli-distribution-and-homebrew-packaging*
*Completed: 2026-03-29*
