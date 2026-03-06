---
phase: 1
slug: server-foundation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-06
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest ^2.x |
| **Config file** | `server/vitest.config.ts` — Wave 0 installs |
| **Quick run command** | `npx vitest run tests/lib/pathSecurity.test.ts` |
| **Full suite command** | `npx vitest run` (from `server/`) |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run tests/lib/pathSecurity.test.ts`
- **After every plan wave:** Run `npx vitest run` (full suite from `server/`)
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** ~5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 1-01-01 | 01 | 0 | FILE-01..05 | setup | `npx vitest run` | ❌ W0 | ⬜ pending |
| 1-02-01 | 02 | 1 | FILE-01 | integration | `npx vitest run tests/api/files.test.ts -t "GET /api/files"` | ❌ W0 | ⬜ pending |
| 1-02-02 | 02 | 1 | FILE-02 | integration | `npx vitest run tests/api/files.test.ts -t "GET /api/files/*"` | ❌ W0 | ⬜ pending |
| 1-02-03 | 02 | 1 | FILE-03 | integration | `npx vitest run tests/api/files.test.ts -t "POST"` | ❌ W0 | ⬜ pending |
| 1-02-04 | 02 | 1 | FILE-04 | integration | `npx vitest run tests/api/files.test.ts -t "rename"` | ❌ W0 | ⬜ pending |
| 1-02-05 | 02 | 1 | FILE-05 | integration | `npx vitest run tests/api/files.test.ts -t "DELETE"` | ❌ W0 | ⬜ pending |
| 1-sec-01 | 02 | 1 | (Security) | unit | `npx vitest run tests/lib/pathSecurity.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `server/tests/api/files.test.ts` — integration stubs for FILE-01 through FILE-05
- [ ] `server/tests/lib/pathSecurity.test.ts` — unit tests for path traversal prevention
- [ ] `server/vitest.config.ts` — Vitest config pointing at `tests/` directory
- [ ] Install: `npm install --save-dev vitest @vitest/coverage-v8 --workspace=server`

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Sidebar renders file tree visually | FILE-01 | Browser UI verification | Open `http://localhost:5173`, confirm file tree renders in sidebar |
| File content displays on click | FILE-02 | Browser UI verification | Click a file in sidebar, confirm content appears |
| New file appears after create | FILE-03 | Browser UI verification | Create file via UI, confirm it appears in sidebar and on disk |
| Rename persists in sidebar | FILE-04 | Browser UI verification | Rename file via UI, confirm new name appears in sidebar and on disk |
| Delete with confirmation removes file | FILE-05 | Browser UI verification | Delete file via UI (confirm dialog), confirm removed from sidebar and disk |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
