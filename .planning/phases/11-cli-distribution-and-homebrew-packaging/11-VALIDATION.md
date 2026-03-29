---
phase: 11
slug: cli-distribution-and-homebrew-packaging
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-29
---

# Phase 11 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 2.x (server) + Node smoke scripts |
| **Config file** | `server/vitest.config.ts` |
| **Quick run command** | `cd server && npx vitest run tests/cli/marky-cli.test.ts tests/cli/port-and-open.test.ts --reporter=verbose` |
| **Full suite command** | `cd server && npx vitest run && cd .. && npm run pack:dry` |
| **Estimated runtime** | ~40 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd server && npx vitest run tests/cli/marky-cli.test.ts tests/cli/port-and-open.test.ts --reporter=verbose`
- **After every plan wave:** Run `cd server && npx vitest run && cd .. && npm run pack:dry`
- **Before `$gsd-verify-work`:** Full suite plus packed-artifact smoke must be green
- **Max feedback latency:** 40 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 11-01-01 | 01 | 0 | CLI-01, CLI-02 | unit | `cd server && npx vitest run tests/cli/marky-cli.test.ts -x` | ❌ W0 | ⬜ pending |
| 11-01-02 | 01 | 0 | CLI-03, CLI-04, CLI-05, DIST-01 | integration | `cd server && npx vitest run tests/cli/standalone-assets.test.ts tests/cli/package-artifact.test.ts tests/cli/port-and-open.test.ts -x` | ❌ W0 | ⬜ pending |
| 11-02-01 | 02 | 1 | CLI-01, CLI-02, CLI-04 | unit | `cd server && npx vitest run tests/cli/marky-cli.test.ts tests/cli/port-and-open.test.ts -x` | ❌ W0 | ⬜ pending |
| 11-02-02 | 02 | 1 | CLI-05 | unit | `cd server && npx vitest run tests/cli/port-and-open.test.ts -x` | ❌ W0 | ⬜ pending |
| 11-03-01 | 03 | 2 | CLI-03, DIST-01 | integration | `npm run build && npm run pack:dry` | ❌ W0 | ⬜ pending |
| 11-03-02 | 03 | 2 | CLI-01, CLI-03 | smoke | `node scripts/verify-cli-package.mjs` | ❌ W0 | ⬜ pending |
| 11-04-01 | 04 | 3 | DIST-01 | static | `ruby -c packaging/homebrew/marky.rb` | ❌ W0 | ⬜ pending |
| 11-04-02 | 04 | 3 | CLI-01, CLI-04, CLI-05, DIST-01 | manual | `brew install marky` flow from release artifact | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `server/tests/cli/marky-cli.test.ts` — CLI arg parsing and content-root precedence
- [ ] `server/tests/cli/port-and-open.test.ts` — port collision behavior and `--no-open` gate
- [ ] `server/tests/cli/standalone-assets.test.ts` — static UI serving from resolved packaged `client/dist`
- [ ] `server/tests/cli/package-artifact.test.ts` — `npm pack --json --dry-run` includes CLI entry and built assets
- [ ] `scripts/verify-cli-package.mjs` — smoke harness for packed artifact execution

*If none: "Existing infrastructure covers all phase requirements."*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Browser opens automatically to the printed URL | CLI-05 | Automated tests should not launch real browsers | Run `marky` in a temp notes folder and verify the browser opens once to the CLI URL |
| Duplicate launch UX is understandable | CLI-04 | User-facing messaging matters more than process mechanics alone | Start one Marky instance, start another, confirm the second process either picks the next default port or exits with the documented explicit-port error |
| Homebrew install works from release artifact | DIST-01 | Depends on external tap repo and release asset | Tap the formula, install `marky`, run it in a temp notes folder, confirm UI loads |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 40s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
