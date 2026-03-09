---
phase: 4
slug: live-reload
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-09
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest (server: 2.x, client: 4.x) |
| **Config file** | `server/vitest.config.ts`, `client/vite.config.ts` (test block) |
| **Quick run command** | `npm test --workspace=server` |
| **Full suite command** | `npm test --workspace=server && npm test --workspace=client` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test --workspace=server`
- **After every plan wave:** Run `npm test --workspace=server && npm test --workspace=client`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** ~15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 4-01-01 | 01 | 0 | LIVE-01, LIVE-02 | integration | `npm test --workspace=server` | ❌ W0 | ⬜ pending |
| 4-01-02 | 01 | 0 | LIVE-01 | unit | `npm test --workspace=client` | ❌ W0 | ⬜ pending |
| 4-01-03 | 01 | 1 | LIVE-01, LIVE-02 | integration | `npm test --workspace=server` | ❌ W0 | ⬜ pending |
| 4-02-01 | 02 | 1 | LIVE-01 | integration | `npm test --workspace=server` | ❌ W0 | ⬜ pending |
| 4-02-02 | 02 | 1 | LIVE-01 | unit | `npm test --workspace=client` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `server/tests/routes/watch.test.ts` — stubs for LIVE-01, LIVE-02; tests SSE endpoint using Fastify inject + tmp dir with real file writes
- [ ] `client/src/hooks/__tests__/useFileWatcher.test.ts` — stubs for client LIVE-01 unit cases; mocks EventSource and fetch, asserts dispatch calls

*Note: Existing infrastructure (`server/vitest.config.ts`, `client/vite.config.ts`) covers all phase requirements — no framework install needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Preview visually refreshes when Claude CLI writes to open file | LIVE-01 | Visual confirmation of live update | Open a file in app, run `echo "new content" > <file>` from terminal, verify preview updates |
| New file appears in sidebar after creation | LIVE-02 | Visual sidebar refresh check | Create a new file in watched dir from terminal, verify it appears in file tree without reload |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
