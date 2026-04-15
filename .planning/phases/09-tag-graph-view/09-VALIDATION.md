---
phase: 9
slug: tag-graph-view
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-29
---

# Phase 9 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest |
| **Config file** | `client/vite.config.ts`; `server/vitest.config.ts` |
| **Quick run command** | `npm test --workspace=client -- src/__tests__/TagGraphPanel.test.tsx` and `npm test --workspace=server -- tests/routes/graph.test.ts` |
| **Full suite command** | `npm test --workspace=client` and `npm test --workspace=server` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run the targeted graph test command for the touched seam
- **After every plan wave:** Run `npm test --workspace=client` and the impacted server graph tests
- **Before `$gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 09-01-01 | 01 | 0 | GRPH-01 | server route | `npm test --workspace=server -- tests/routes/graph.test.ts` | ❌ W0 | ⬜ pending |
| 09-01-02 | 01 | 0 | GRPH-02 | client component | `npm test --workspace=client -- src/__tests__/TagGraphPanel.test.tsx` | ❌ W0 | ⬜ pending |
| 09-01-03 | 01 | 0 | GRPH-03 | client component | `npm test --workspace=client -- src/__tests__/TagGraphPanel.test.tsx` | ❌ W0 | ⬜ pending |
| 09-01-04 | 01 | 0 | GRPH-04 | persistence hook | `npm test --workspace=client -- src/hooks/__tests__/useTagGraphPersistence.test.ts` | ❌ W0 | ⬜ pending |
| 09-02-01 | 02 | 1 | GRPH-01 | server unit/route | `npm test --workspace=server -- tests/routes/graph.test.ts` | ✅ after 09-01 | ⬜ pending |
| 09-02-02 | 02 | 1 | GRPH-01 | server integration | `npm test --workspace=server -- tests/routes/graph.test.ts` | ✅ after 09-01 | ⬜ pending |
| 09-03-01 | 03 | 2 | GRPH-04 | client utility | `npm test --workspace=client -- src/hooks/__tests__/useTagGraphPersistence.test.ts src/lib/__tests__/tagGraph.test.ts` | ✅ after 09-01 | ⬜ pending |
| 09-03-02 | 03 | 2 | GRPH-02, GRPH-03, GRPH-04 | client component/integration | `npm test --workspace=client -- src/__tests__/TagGraphPanel.test.tsx src/hooks/__tests__/useTagGraphPersistence.test.ts src/lib/__tests__/tagGraph.test.ts && npx tsc --noEmit -p client/tsconfig.json` | ✅ after 09-01 | ⬜ pending |
| 09-04-01 | 04 | 3 | GRPH-01, GRPH-02, GRPH-03, GRPH-04 | phase regression | `npm test --workspace=server -- tests/routes/graph.test.ts && npm test --workspace=client && npx tsc --noEmit -p client/tsconfig.json` | ✅ after 09-02/09-03 | ⬜ pending |
| 09-04-02 | 04 | 3 | GRPH-02, GRPH-03, GRPH-04 | human checkpoint | `manual approval checkpoint (exempt from automated command)` | ✅ after 09-02/09-03 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `client/src/__tests__/TagGraphPanel.test.tsx` — graph interaction/render contract stubs for GRPH-02 and GRPH-03
- [ ] `client/src/hooks/__tests__/useTagGraphPersistence.test.ts` — snapshot serialization and restore coverage for GRPH-04
- [ ] `client/src/lib/__tests__/tagGraph.test.ts` — client layout snapshot merge/restore helper coverage used by the graph panel
- [ ] `server/tests/routes/graph.test.ts` — route payload coverage for GRPH-01, including weighted shared-tag links and untagged-node inclusion

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Graph remains accessible in a dedicated right-rail tab and does not restart layout when switching away and back | GRPH-04 | Canvas lifecycle and perceived layout continuity are not trustworthy in jsdom | Open the graph tab, pan/zoom, switch back to `Outline`, return to `Graph`, and verify positions/viewport persist |
| Active file highlight is visually obvious while exploring real notes and split view | GRPH-03 | Final color/contrast and focus behavior are user-facing visual checks | Open two files, move focus between panes, and verify the highlighted node tracks `activeFocusedTab` |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
