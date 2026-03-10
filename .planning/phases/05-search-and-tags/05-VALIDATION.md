---
phase: 5
slug: search-and-tags
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-10
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.x (client) / Vitest 2.x (server) |
| **Config file** | `client/vite.config.ts` (test.environment: jsdom) / `server/vitest.config.ts` |
| **Quick run command** | `npm run test --workspace=client` or `npm run test --workspace=server` |
| **Full suite command** | `npm run test --workspace=client && npm run test --workspace=server` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run test --workspace=client` or `npm run test --workspace=server` (whichever workspace changed)
- **After every plan wave:** Run `npm run test --workspace=client && npm run test --workspace=server`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** ~15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 5-01-01 | 01 | 0 | SRCH-01 | unit | `npm run test --workspace=server` | ❌ W0 | ⬜ pending |
| 5-01-02 | 01 | 0 | SRCH-02 | unit | `npm run test --workspace=server` | ❌ W0 | ⬜ pending |
| 5-01-03 | 01 | 0 | TAG-01 | unit | `npm run test --workspace=server` | ❌ W0 | ⬜ pending |
| 5-01-04 | 01 | 0 | TAG-03 | unit/integration | `npm run test --workspace=server` | ❌ W0 | ⬜ pending |
| 5-02-01 | 02 | 0 | SRCH-01 | unit | `npm run test --workspace=client` | ❌ W0 | ⬜ pending |
| 5-02-02 | 02 | 0 | TAG-02 | unit | `npm run test --workspace=client` | ❌ W0 | ⬜ pending |
| 5-02-03 | 02 | 0 | SRCH-03 | unit | `npm run test --workspace=client` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `server/tests/lib/search.test.ts` — stubs for SRCH-01, SRCH-02, TAG-01 (SearchService unit tests with tmp dir fixture)
- [ ] `server/tests/routes/search.test.ts` — stubs for TAG-03 (PATCH tags round-trip via Fastify inject)
- [ ] `client/src/__tests__/useSearch.test.ts` — stubs for SRCH-01 (MiniSearch.loadJSON + search result shape)
- [ ] `client/src/__tests__/useTags.test.ts` — stubs for TAG-02 (filterPaths derivation from tagMap)
- [ ] `client/src/__tests__/SearchPanel.test.tsx` — stubs for SRCH-03 (click result fires openTab)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Search results appear instantly while typing | SRCH-01 | Visual/UX timing perception | Open app, type in search box, observe results update within ~200ms |
| Tag filter shows correct files in tree | TAG-02 | Tree rendering correctness | Select a tag, verify only files with that tag appear; clear filter, verify all files return |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
