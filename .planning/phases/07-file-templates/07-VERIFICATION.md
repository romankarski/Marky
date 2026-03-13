---
phase: 07-file-templates
verified: 2026-03-13T11:41:00Z
status: human_needed
score: 10/10 must-haves verified
re_verification: false
human_verification:
  - test: "Built-in template flow end-to-end: click '+ New', select 'Daily Note', type '2026-03-11' as filename, create. Confirm file opens with YAML frontmatter containing 'date: 2026-03-11', heading '# 2026-03-11', sections '## Today' and '## Notes', and no literal {{date}} or {{title}} tokens."
    expected: "File created with fully substituted content — no raw tokens visible"
    why_human: "Token substitution result depends on runtime Date and modal interaction flow — cannot verify via test output alone (tests mock static dates)"
  - test: "Title .md extension strip: click '+ New', select 'Meeting Note', type 'team-sync' as filename, create. Confirm heading reads '# Meeting: team-sync' not '# Meeting: team-sync.md'."
    expected: "Heading shows 'team-sync' without .md suffix"
    why_human: "Extension stripping is verified in unit test with static input, but human confirms the real creation flow strips it correctly end-to-end"
  - test: "Blank option: click '+ New', click 'Blank', type 'scratch', create. Confirm file is created with empty content."
    expected: "Empty file, no template content"
    why_human: "Blank path (empty string through applyTokens) needs visual confirmation in the running app"
  - test: "Save custom template: open any existing markdown file, click 'Save as template' in the right panel, enter 'my-custom' when prompted. Then click '+ New' and confirm 'my-custom' appears under 'Your Templates'."
    expected: "Custom template persisted and visible in next picker open"
    why_human: "Requires running app with a real server — file system write + fetch cycle cannot be replicated in automated tests"
---

# Phase 7: File Templates Verification Report

**Phase Goal:** Enable users to create files from built-in templates and save custom templates for reuse.
**Verified:** 2026-03-13T11:41:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | applyTokens substitutes {{date}} and {{title}} globally, strips .md from title | VERIFIED | `templateTokens.ts` lines 7-10: global regex replace; 5 unit tests pass including `.md` strip test |
| 2 | BUILT_IN_TEMPLATES has 3 entries with required tokens per template | VERIFIED | `builtInTemplates.ts` exports 3 TemplateEntry objects; daily-note has `{{date}}`, meeting-note has `{{title}}`, decision-record has both; 5 unit tests pass |
| 3 | FolderPickerModal shows step 1 (template picker: Blank + 3 built-ins) before step 2 (filename/folder) | VERIFIED | `FolderPickerModal.tsx` line 73: `useState<'template' \| 'location'>('template')`; lines 119-166: step=template renders Blank + BUILT_IN_TEMPLATES.map; 5 component tests pass |
| 4 | FolderPickerModal applies token substitution at file creation time | VERIFIED | `FolderPickerModal.tsx` lines 113-116: title derived from safeName with .md stripped, date from `new Date().toISOString().slice(0,10)`, `applyTokens` called before `onConfirm` |
| 5 | GET /api/templates returns list from .marky/templates/, auto-creates dir | VERIFIED | `templates.ts` lines 11-22: `fs.mkdir` recursive + `readdir` + filter `.md`; server test passes |
| 6 | POST /api/templates creates file on disk, returns 201 {name}; blank name returns 400 | VERIFIED | `templates.ts` lines 24-37: sanitizes name, 400 on empty, writes `.md` file, 201 response; 5 server tests pass |
| 7 | templatesRoutes registered in app.ts | VERIFIED | `app.ts` line 7: `import templatesRoutes from './routes/templates.js'`; line 43: `await fastify.register(templatesRoutes)` |
| 8 | FileTree.handleCreate passes content to POST body | VERIFIED | `FileTree.tsx` line 115: `handleCreate(filePath: string, content: string = '')`; line 119: `body: JSON.stringify({ content })`; line 139: `onConfirm={(filePath, _fileName, content) => handleCreate(filePath, content)}` |
| 9 | FileInfo shows "Save as template" button that POSTs to /api/templates | VERIFIED | `FileInfo.tsx` lines 55-72: `handleSaveAsTemplate` fetches file content then POSTs; lines 199-206: button rendered with `onClick={() => void handleSaveAsTemplate()}` |
| 10 | FolderPickerModal fetches and displays custom templates from GET /api/templates | VERIFIED | `FolderPickerModal.tsx` lines 89-93: `useEffect` fetches `/api/templates` on mount; lines 147-160: conditional "Your Templates" section rendered when `customTemplates.length > 0` |

**Score:** 10/10 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `client/src/lib/templateTokens.ts` | applyTokens pure function | VERIFIED | 11 lines, exports `applyTokens`, global regex, .md strip |
| `client/src/lib/builtInTemplates.ts` | TemplateEntry interface + BUILT_IN_TEMPLATES[3] | VERIFIED | 25 lines, 3 complete template objects with all required tokens |
| `client/src/components/FolderPickerModal.tsx` | Two-step modal with template picker + custom templates | VERIFIED | 259 lines; step state, handleTemplateSelect, useEffect fetch, custom templates section, applyTokens in handleConfirm |
| `client/src/components/FileTree.tsx` | Updated handleCreate with content param | VERIFIED | handleCreate(filePath, content=''), POST body uses content param, onConfirm wiring updated |
| `client/src/components/FileInfo.tsx` | "Save as template" button + handler | VERIFIED | handleSaveAsTemplate fetches content + POSTs; button at lines 199-206 |
| `server/src/routes/templates.ts` | GET + POST /api/templates Fastify plugin | VERIFIED | 40 lines; GET reads dir, POST writes file, 400 on blank name, default export |
| `server/src/app.ts` | templatesRoutes import + register | VERIFIED | Line 7: import; line 43: register |
| `client/src/lib/__tests__/templateTokens.test.ts` | 5 unit tests for applyTokens | VERIFIED | All 5 tests pass GREEN |
| `client/src/lib/__tests__/builtInTemplates.test.ts` | 5 unit tests for BUILT_IN_TEMPLATES | VERIFIED | All 5 tests pass GREEN |
| `client/src/__tests__/TemplatePickerModal.test.tsx` | 5 component tests for template step UI | VERIFIED | All 5 tests pass GREEN |
| `server/tests/routes/templates.test.ts` | 5 integration tests for GET/POST /api/templates | VERIFIED | All 5 tests pass GREEN |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `FileTree.tsx` | `FolderPickerModal.tsx` | onConfirm(filePath, _fileName, content) signature | WIRED | Line 139: `onConfirm={(filePath, _fileName, content) => handleCreate(filePath, content)}` |
| `FolderPickerModal.tsx` | `builtInTemplates.ts` | import BUILT_IN_TEMPLATES | WIRED | Line 3: `import { BUILT_IN_TEMPLATES } from '../lib/builtInTemplates'`; used at line 138 |
| `FolderPickerModal.tsx` | `templateTokens.ts` | applyTokens called in handleConfirm | WIRED | Line 4: import; line 115: `applyTokens(selectedContent, { title, date })` called before onConfirm |
| `FolderPickerModal.tsx` | `/api/templates` | GET fetch in useEffect on mount | WIRED | Lines 89-93: useEffect with fetch('/api/templates') sets customTemplates state |
| `FileInfo.tsx` | `/api/templates` | POST fetch on Save as template click | WIRED | Lines 64-68: fetch POST /api/templates inside handleSaveAsTemplate |
| `server/src/app.ts` | `server/src/routes/templates.ts` | fastify.register(templatesRoutes) | WIRED | Line 7 import + line 43 register |
| `server/src/routes/templates.ts` | `.marky/templates/` on disk | fs.mkdir recursive + readdir/writeFile | WIRED | Lines 11, 32: `fs.mkdir(tmplDir(), { recursive: true })` in both GET and POST handlers |

### Requirements Coverage

| Requirement | Source Plans | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| TMPL-01 | 07-01, 07-02 | User can create a new file from a built-in template (daily note, meeting note, decision record) | SATISFIED | builtInTemplates.ts has 3 entries; FolderPickerModal step 1 lists them; applyTokens substitutes tokens at creation; unit tests GREEN |
| TMPL-02 | 07-01, 07-03, 07-04 | User can save any file as a custom template | SATISFIED | FileInfo "Save as template" button POSTs to /api/templates; server route creates .md file in .marky/templates/; server integration tests GREEN |
| TMPL-03 | 07-01, 07-02, 07-04 | Template picker shown when creating a new file (alongside blank option) | SATISFIED | FolderPickerModal opens with step='template'; renders Blank + BUILT_IN_TEMPLATES + customTemplates; component tests GREEN |

All 3 TMPL requirements declared across the 4 plans are accounted for. REQUIREMENTS.md marks all three as complete (checked). No orphaned requirements found.

### Anti-Patterns Found

No blockers or warnings found.

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `FileInfo.tsx` | 172 | `placeholder="Search or create tag…"` | Info | Legitimate input placeholder attribute, not a code stub |

### Human Verification Required

Phase 7 includes a built-in `checkpoint:human-verify` gate in plan 07-04 (Task 2). The 07-04-SUMMARY.md records that this checkpoint was approved by the user on 2026-03-13. However, because this is the first automated verification pass, the following items are flagged for completeness — they were part of the approved checkpoint and are noted here as already conducted.

#### 1. Built-in template token substitution (TMPL-01)

**Test:** Click "+ New", select "Daily Note", type "2026-03-11" as filename, click Create.
**Expected:** File opens with `date: 2026-03-11` in YAML frontmatter, heading `# 2026-03-11`, sections "## Today" and "## Notes" — no literal `{{date}}` or `{{title}}` tokens visible.
**Why human:** Runtime date and full modal interaction flow; unit tests use static inputs and do not exercise the date derived from `new Date()` at actual creation time.

#### 2. Title .md extension strip in modal context (TMPL-01)

**Test:** Click "+ New", select "Meeting Note", type "team-sync", click Create.
**Expected:** Heading reads `# Meeting: team-sync` (not `# Meeting: team-sync.md`).
**Why human:** Unit test for applyTokens verifies stripping with static input; human confirms the full modal flow (where safeName has .md before stripping) works correctly in production.

#### 3. Blank selection creates empty file (TMPL-03)

**Test:** Click "+ New", click "Blank", type "scratch", click Create.
**Expected:** File created with empty content.
**Why human:** Empty string through applyTokens leaves content empty — needs visual confirmation in running app.

#### 4. Save custom template persists and appears in picker (TMPL-02)

**Test:** Open any file, click "Save as template" in right panel, enter "my-custom", then click "+ New" and verify "my-custom" appears under "Your Templates".
**Expected:** Custom template listed in picker on next open.
**Why human:** Requires running app with real server — file system write + GET fetch cycle cannot be confirmed via static analysis.

**Note:** Per 07-04-SUMMARY.md, a human checkpoint was already conducted on 2026-03-13 and returned "approved". If that approval is treated as sufficient, this verification can be upgraded to `passed`.

### Gaps Summary

No gaps found. All 10 observable truths are verified by substantive, wired artifacts. All 99 client tests and 38 server tests pass. TypeScript compiles cleanly on the client (server tsc errors are pre-existing structural issues affecting all test files, not introduced by Phase 7).

The only outstanding items are human verification steps that mirror the approved checkpoint from plan 07-04 Task 2. These are retained for auditability but do not represent blocking gaps.

---

_Verified: 2026-03-13T11:41:00Z_
_Verifier: Claude (gsd-verifier)_
