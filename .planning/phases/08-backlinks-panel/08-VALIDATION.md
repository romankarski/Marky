---
phase: 8
slug: backlinks-panel
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-13
---

# Phase 8 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (server: Node env, client: jsdom env) |
| **Config file** | `server/vitest.config.ts` / `client/vite.config.ts` |
| **Quick run command (server)** | `npm run test --workspace=server` |
| **Quick run command (client)** | `npm run test --workspace=client` |
| **Full suite command** | `npm run test --workspace=server && npm run test --workspace=client` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run test --workspace=server` or `npm run test --workspace=client` (whichever workspace was changed)
- **After every plan wave:** Run `npm run test --workspace=server && npm run test --workspace=client`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 08-01-01 | 01 | 0 | BKLN-01 | unit | `npm run test --workspace=server` | ❌ W0 | ⬜ pending |
| 08-01-02 | 01 | 0 | BKLN-01/02/03 | unit | `npm run test --workspace=client` | ❌ W0 | ⬜ pending |
| 08-01-03 | 01 | 0 | BKLN-01 | unit | `npm run test --workspace=server` | ❌ W0 | ⬜ pending |
| 08-01-04 | 01 | 1 | BKLN-01 | integration | `npm run test --workspace=server` | ❌ W0 | ⬜ pending |
| 08-01-05 | 01 | 1 | BKLN-01 | integration | `npm run test --workspace=server` | ❌ W0 | ⬜ pending |
| 08-01-06 | 01 | 2 | BKLN-01/02/03 | unit | `npm run test --workspace=client` | ❌ W0 | ⬜ pending |
| 08-01-07 | 01 | 2 | BKLN-01 | unit | `npm run test --workspace=client` | ❌ W0 | ⬜ pending |
| 08-01-08 | 01 | 3 | BKLN-01/02/03 | e2e-manual | manual | — | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `server/tests/routes/backlinks.test.ts` — stubs for BKLN-01 (server route)
- [ ] `server/tests/lib/backlinks.test.ts` — unit tests for `BacklinkService._extractTargets` covering wikilink spaces, case normalisation, standard markdown links, stale-entry removal
- [ ] `client/src/__tests__/BacklinksPanel.test.tsx` — covers BKLN-01 (render list), BKLN-02 (click opens file), BKLN-03 (count header + empty state)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Right panel visual layout with 3 stacked sections | BKLN-01 | Visual layout can't be fully validated in jsdom | Open a file with backlinks, verify FileInfo + BacklinksPanel + TOC render without overflow; confirm `max-h-40 overflow-y-auto` caps long lists |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
