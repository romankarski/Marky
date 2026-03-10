---
phase: 6
slug: tab-persistence-and-image-rendering
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-10
---

# Phase 6 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest ^4.0.18 (client), Vitest ^2.0.0 (server) |
| **Config file** | `client/vite.config.ts` (test.environment: jsdom), `server/vitest.config.ts` |
| **Quick run command** | `npm run test --workspace=client` |
| **Full suite command** | `npm run test --workspace=client && npm run test --workspace=server` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run test --workspace=client`
- **After every plan wave:** Run `npm run test --workspace=client && npm run test --workspace=server`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 6-01-01 | 01 | 0 | PRST-01 | unit | `npm run test --workspace=client` | ❌ W0 | ⬜ pending |
| 6-01-02 | 01 | 0 | PRST-02 | unit | `npm run test --workspace=client` | ❌ W0 | ⬜ pending |
| 6-01-03 | 01 | 0 | PRST-03 | unit | `npm run test --workspace=client` | ❌ W0 | ⬜ pending |
| 6-01-04 | 01 | 0 | IMG-01 | unit | `npm run test --workspace=client` | ❌ W0 | ⬜ pending |
| 6-01-05 | 01 | 0 | IMG-02 | integration | `npm run test --workspace=server` | ❌ W0 | ⬜ pending |
| 6-02-01 | 02 | 1 | PRST-01 | unit | `npm run test --workspace=client` | ❌ W0 | ⬜ pending |
| 6-02-02 | 02 | 1 | PRST-02 | unit | `npm run test --workspace=client` | ❌ W0 | ⬜ pending |
| 6-02-03 | 02 | 1 | PRST-03 | unit | `npm run test --workspace=client` | ❌ W0 | ⬜ pending |
| 6-03-01 | 03 | 1 | IMG-01 | unit | `npm run test --workspace=client` | ❌ W0 | ⬜ pending |
| 6-03-02 | 03 | 1 | IMG-02 | integration | `npm run test --workspace=server` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `client/src/hooks/__tests__/useTabPersistence.test.ts` — stubs for PRST-01, PRST-02 (renderHook, mock localStorage with vi.stubGlobal)
- [ ] `client/src/hooks/__tests__/useScrollPersist.test.ts` — stubs for PRST-03 (mock localStorage, mock containerRef.current.scrollTop)
- [ ] `client/src/__tests__/MarkdownPreview.test.tsx` — stubs for IMG-01 (render with filePath prop, check generated src on img element)
- [ ] `server/tests/routes/images.test.ts` — stubs for IMG-02 (follows pattern of server/tests/api/files.test.ts)

*No framework install needed — all test infrastructure exists. @testing-library/react already in client/package.json devDependencies at ^16.3.2.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Scroll restore on very large documents (500+ lines) | PRST-03 | Browser DOM timing edge case — scrollTop may be silently ignored if container not yet at full height; cannot reliably test in jsdom | Open a large markdown file (500+ lines), scroll to a specific position, refresh page, verify scroll is restored to same position |
| Welcome screen shows recent files after reload | PRST-02 | Visual layout verification | Open 3-5 different files, close all tabs, verify welcome screen shows recent files list with filename + folder path |
| Image renders in preview from relative path | IMG-01 | Requires real filesystem + browser render | Open a markdown file with `./screenshot.png`, verify image renders inline (not placeholder) |
| Image renders from absolute path | IMG-02 | Requires real filesystem + browser render | Open a markdown file with `/Users/romankarski/notes/img.png`, verify image renders inline |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
