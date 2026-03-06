---
phase: 2
slug: browser-shell
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-06
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest (server workspace only — no client test framework in Phase 2) |
| **Config file** | `server/vitest.config.ts` |
| **Quick run command** | `npm run test --workspace=server` |
| **Full suite command** | `npm run test --workspace=server` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run test --workspace=server`
- **After every plan wave:** Run `npm run test --workspace=server`
- **Before `/gsd:verify-work`:** Full server suite must be green + manual visual review of all 8 requirements
- **Max feedback latency:** ~5 seconds (server suite only)

---

## Per-Task Verification Map

All Phase 2 requirements are client-side UI behaviors verified manually/visually. Server regression tests run after every task commit to guard against regressions in the API layer.

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 1 | VIEW-01, VIEW-02, VIEW-03, VIEW-04 | manual | `npm run test --workspace=server` | ✅ existing | ⬜ pending |
| 02-02-01 | 02 | 1 | DSNG-01, DSNG-02, DSNG-03, DSNG-04 | manual/visual | `npm run test --workspace=server` | ✅ existing | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] No new test files needed — all Phase 2 requirements are visual/manual
- [ ] Existing `server/vitest.config.ts` infrastructure covers server regression checks

*Client test framework (vitest + @testing-library/react + jsdom) is NOT required for Phase 2. All requirements are visual behaviors. Can be added in a future phase for tab reducer unit tests.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Markdown renders as HTML with tables, checkboxes, fenced code | VIEW-01 | Rendering fidelity is visual | Open a .md file with tables, GFM checkboxes, fenced code blocks; verify each renders correctly |
| Multiple tabs open simultaneously | VIEW-02 | DOM state + UI behavior | Open 3 different files; verify 3 tabs appear in the tab bar |
| Tab switching shows correct content | VIEW-03 | Content synchronization | Click between tabs; verify displayed content matches the file name shown in the active tab |
| Tab close removes tab; adjacent tab activates | VIEW-04 | State transition | Close the active tab; verify it disappears and the adjacent tab becomes active |
| Frosted glass effect on content card | DSNG-01 | Visual aesthetic | With a non-white background visible, verify the content card shows blur/translucency |
| Orange accents on active tab, headings, tree selection | DSNG-02 | Visual aesthetic | Verify active tab underline, h1/h2 color, selected file in tree all show orange |
| Big Hero 6 laboratory aesthetic | DSNG-03 | Subjective aesthetic | Overall feel — bright, clean, futuristic, warm; no dark grays or clinical whites |
| Airy typography, generous whitespace | DSNG-04 | Visual aesthetic | Prose rendering has comfortable line-height and padding; no cramped text |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
