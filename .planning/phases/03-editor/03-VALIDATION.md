---
phase: 3
slug: editor
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-09
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.0.18 |
| **Config file** | vite.config.ts (vitest picks up from Vite config) |
| **Quick run command** | `npm run test --workspace=client` |
| **Full suite command** | `npm run test --workspace=client` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run test --workspace=client`
- **After every plan wave:** Run `npm run test --workspace=client`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** ~10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 3-01-01 | 01 | 0 | EDIT-03 | unit | `npm run test --workspace=client` | ❌ W0 | ⬜ pending |
| 3-01-02 | 01 | 0 | EDIT-01/EDIT-04 | unit | `npm run test --workspace=client` | ❌ W0 | ⬜ pending |
| 3-02-01 | 02 | 1 | EDIT-04 | unit | `npm run test --workspace=client` | ✅ after W0 | ⬜ pending |
| 3-02-02 | 02 | 1 | EDIT-01 | unit | `npm run test --workspace=client` | ✅ after W0 | ⬜ pending |
| 3-03-01 | 03 | 1 | EDIT-02 | unit | `npm run test --workspace=client` | ✅ after W0 | ⬜ pending |
| 3-03-02 | 03 | 1 | EDIT-03 | unit | `npm run test --workspace=client` | ✅ after W0 | ⬜ pending |
| 3-04-01 | 04 | 2 | VIEW-05/EDIT-05 | manual | — | — | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `client/src/hooks/__tests__/useAutoSave.test.ts` — stubs for EDIT-03 (debounce, PUT call, onSaved callback)
- [ ] `client/src/__tests__/tabReducer-editor.test.ts` — stubs for EDIT-01/EDIT-04 (TOGGLE_EDIT, SET_DIRTY, CLEAR_DIRTY reducer cases)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Split view renders two independent panes | VIEW-05 | Visual layout — requires browser rendering | Open app, click split button, verify two panes side by side |
| Each pane tracks its own active tab independently | EDIT-05 | Requires two simultaneous tab focuses in different panes | Open app, split view, click different files in each pane, verify each pane shows its own file |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
