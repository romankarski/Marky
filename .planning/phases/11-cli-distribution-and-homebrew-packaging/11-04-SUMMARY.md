---
phase: 11-cli-distribution-and-homebrew-packaging
plan: 04
subsystem: release
tags: [github-actions, homebrew, release, distribution, verification]

requires:
  - phase: 11-cli-distribution-and-homebrew-packaging-03
    provides: publishable package artifact and smoke verification
provides:
  - GitHub release workflow that publishes CLI tarball assets for tags and manual reruns
  - Homebrew formula and tap automation that can update version, URL, and SHA automatically
  - Human-verified install flow for `marky`, `marky --no-open`, and `marky --port 4310`
affects: []

tech-stack:
  added: []
  patterns: [release-rerun-support, automated-tap-sync, human-verification-gate]

key-files:
  created:
    - scripts/update-homebrew-formula.mjs
  modified:
    - .github/workflows/release-cli.yml
    - packaging/homebrew/marky.rb
    - README.md
    - scripts/verify-homebrew-install.mjs
    - client/src/App.tsx

key-decisions:
  - "Release workflow supports both tag-push and manual rerun modes so an existing tag can republish assets after workflow fixes"
  - "Homebrew tap updates are automated from the release workflow with a repository-scoped token rather than maintained manually after each release"
  - "Root-level markdown files must always render in the sidebar even when no default top-level folders exist"

patterns-established:
  - "Release workflow emits package version and SHA outputs that downstream distribution jobs can reuse"
  - "Homebrew formula updates are scripted from stable inputs instead of relying on manual search-and-replace"

requirements-completed: [CLI-01, CLI-04, CLI-05, DIST-01]

duration: 1 session
completed: 2026-03-29
---

# Phase 11 Plan 04: Release and Homebrew Distribution Summary

**Marky now ships as a real tagged release with Homebrew tap automation and a verified end-to-end install flow**

## Performance

- **Duration:** 1 extended session
- **Completed:** 2026-03-29
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Fixed the GitHub release workflow so tagged and manually rerun releases publish the actual `marky-<version>.tgz` artifact and SHA file
- Added automatic tap updates for `romankarski/homebrew-marky` using a repository secret and a dedicated formula rewrite script
- Corrected the Homebrew formula install layout and verified real installs through `brew install`, browser-open behavior, `--no-open`, and explicit-port launch
- Fixed the packaged app sidebar so notes stored directly at the content-root remain visible after Homebrew installation

## Task Commits

Executed across multiple incremental fixes during Phase 11 execution and release validation.

## Files Created/Modified
- `.github/workflows/release-cli.yml` - release publishing, rerun support, and automated tap synchronization
- `packaging/homebrew/marky.rb` - release-backed Homebrew formula with install-path fixes
- `scripts/update-homebrew-formula.mjs` - deterministic version/URL/SHA rewrite for the tap repo
- `scripts/verify-homebrew-install.mjs` - release-aware verification checklist
- `README.md` - install and CLI usage docs
- `client/src/App.tsx` - sidebar now shows root-level files in packaged installs

## Decisions Made
- Kept the release artifact as the source of truth for Homebrew rather than generating formula data from local builds
- Automated the tap update in the release workflow to remove repeated manual SHA edits on future releases
- Treated the human install run as a hard gate and did not mark the phase complete until the real Homebrew flow succeeded

## Deviations from Plan

- The initial release workflow and Homebrew formula both required follow-up fixes discovered during the first real release attempt.
- A packaged UI bug surfaced only during the Homebrew verification run; the patch release path was used to close that gap before approval.

## Issues Encountered
- GitHub rejected early tag pushes when the HTTPS token lacked workflow permissions.
- The original release workflow relied on `npm pack` stdout shape and did not safely support reruns for an existing tag.
- Homebrew extracted the npm tarball into a staging layout that invalidated the initial `cd "package"` assumption.
- The packaged sidebar hid root-level files because it filtered to default top-level directories only.

## User Setup Required

- Add `HOMEBREW_TAP_TOKEN` to the `Marky` repository secrets with write access limited to `romankarski/homebrew-marky`.

## Verification

- `ruby -c packaging/homebrew/marky.rb`
- `npm run build`
- `node scripts/verify-cli-package.mjs`
- Real release asset published for `v0.1.2`
- Homebrew tap updated and `brew reinstall romankarski/marky/marky`
- Manual run approved for `marky`, `marky --no-open`, and `marky --port 4310`

## Next Phase Readiness
- Future CLI releases can update the Homebrew tap automatically from the release workflow
- Distribution work is complete; the next unfinished execution target remains Phase 10 plan `10-05`

---
*Phase: 11-cli-distribution-and-homebrew-packaging*
*Completed: 2026-03-29*
