---
phase: 10
slug: wysiwyg-editor
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-18
---

# Phase 10 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.x (client) / Vitest 2.x (server) |
| **Config file** | `client/vite.config.ts` (test block) / `server/vitest.config.ts` |
| **Quick run command** | `cd client && npx vitest run --reporter=verbose` |
| **Full suite command** | `cd client && npx vitest run && cd ../server && npx vitest run` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd client && npx vitest run --reporter=verbose`
- **After every plan wave:** Run `cd client && npx vitest run && cd ../server && npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** ~30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 10-01-01 | 01 | 0 | WYSIWYG-01 | unit | `cd client && npx vitest run src/__tests__/WysiwygEditor.test.tsx -x` | ❌ W0 | ⬜ pending |
| 10-01-02 | 01 | 0 | WYSIWYG-02 | unit | `cd client && npx vitest run src/__tests__/SlashCommandMenu.test.tsx -x` | ❌ W0 | ⬜ pending |
| 10-01-03 | 01 | 0 | WYSIWYG-03 | integration | `cd server && npx vitest run tests/routes/upload-image.test.ts -x` | ❌ W0 | ⬜ pending |
| 10-01-04 | 01 | 0 | WYSIWYG-04 | unit | `cd client && npx vitest run src/__tests__/BubbleToolbar.test.tsx -x` | ❌ W0 | ⬜ pending |
| 10-01-05 | 01 | 0 | WYSIWYG-05 | unit | `cd client && npx vitest run src/__tests__/EditorPane.test.tsx -x` | ❌ W0 | ⬜ pending |
| 10-xx-xx | TBD | 1 | WYSIWYG-01 | unit | `cd client && npx vitest run src/__tests__/WysiwygEditor.test.tsx -x` | ❌ W0 | ⬜ pending |
| 10-xx-xx | TBD | 1 | WYSIWYG-02 | unit | `cd client && npx vitest run src/extensions/__tests__/slash-commands.test.ts -x` | ❌ W0 | ⬜ pending |
| 10-xx-xx | TBD | 2 | WYSIWYG-03 | unit | `cd client && npx vitest run src/__tests__/WysiwygEditor.test.tsx -t "image" -x` | ❌ W0 | ⬜ pending |
| 10-xx-xx | TBD | 2 | WYSIWYG-04 | unit | `cd client && npx vitest run src/__tests__/BubbleToolbar.test.tsx -x` | ❌ W0 | ⬜ pending |
| 10-xx-xx | TBD | 3 | WYSIWYG-05 | unit | `cd client && npx vitest run src/__tests__/EditorPane.test.tsx -x` | ❌ W0 | ⬜ pending |
| 10-xx-xx | TBD | 3 | WYSIWYG-05 | integration | `cd client && npx vitest run src/hooks/__tests__/useAutoSave.test.ts -x` | ✅ | ⬜ pending |
| 10-xx-xx | TBD | 3 | ALL | unit | `cd client && npx vitest run src/__tests__/markdown-roundtrip.test.ts -x` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `client/src/__tests__/WysiwygEditor.test.tsx` — stubs for WYSIWYG-01 (editable surface), WYSIWYG-03 (image insert)
- [ ] `client/src/__tests__/SlashCommandMenu.test.tsx` — stubs for WYSIWYG-02 (slash menu trigger, filtering, execution)
- [ ] `client/src/extensions/__tests__/slash-commands.test.ts` — stubs for WYSIWYG-02 (extension-level)
- [ ] `client/src/__tests__/BubbleToolbar.test.tsx` — stubs for WYSIWYG-04 (selection-triggered toolbar, mark toggles)
- [ ] `client/src/__tests__/EditorPane.test.tsx` — stubs for WYSIWYG-05 (raw mode toggle, auto-save in both modes)
- [ ] `client/src/__tests__/markdown-roundtrip.test.ts` — stubs for round-trip fidelity across all markdown constructs
- [ ] `server/tests/routes/upload-image.test.ts` — stubs for WYSIWYG-03 (POST /api/upload-image)
- [ ] `@fastify/multipart` installed as server dependency (required for image upload route)

*If none: "Existing infrastructure covers all phase requirements."*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Click anywhere places cursor inline | WYSIWYG-01 | jsdom cannot simulate real browser click-to-cursor placement in ProseMirror | Open a document, click in the middle of a paragraph, verify cursor appears at click position |
| Drag image file from desktop | WYSIWYG-03 | jsdom cannot simulate OS-level file drag from Finder/Explorer | Drag a PNG from Finder onto the editor, verify image appears inline and `/images/` file is created |
| Inline resize handles on image | WYSIWYG-03 | jsdom cannot test drag-to-resize UI | Click an inserted image, verify resize handles appear; drag a handle, verify image dimensions change |
| Slash command keyboard navigation | WYSIWYG-02 | jsdom keyboard events in ProseMirror have incomplete coverage | Type `/`, press down arrow through items, press Enter, verify block inserted |
| Bubble toolbar positioning | WYSIWYG-04 | jsdom cannot test Floating UI positioning above selection | Select text in document, verify bubble toolbar appears above the selection without overflow |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
