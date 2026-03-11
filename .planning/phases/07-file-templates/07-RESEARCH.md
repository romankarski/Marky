# Phase 7: File Templates - Research

**Researched:** 2026-03-11
**Domain:** React modal UI, template token substitution, server-side template storage, Fastify routes
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| TMPL-01 | User can create a new file from a built-in template (daily note, meeting note, decision record) | Built-in templates defined as client-side constants; `{{date}}` / `{{title}}` substituted at creation time before POST to existing `/api/files/*` |
| TMPL-02 | User can save any file as a custom template | New server route `POST /api/templates` stores template content under a dedicated directory (e.g. `ROOT_DIR/.marky/templates/`); custom templates loaded at picker open time |
| TMPL-03 | Template picker shown when creating a new file (alongside blank option) | `FolderPickerModal` extended (or replaced) with a template-selection step before the filename/folder step; "Blank" is always available as a zero-content option |
</phase_requirements>

---

## Summary

Phase 7 adds template-based file creation to Marky. The existing "New file" flow lives in `FileTree.tsx` — the "+ New" button opens `FolderPickerModal`, which calls `handleCreate` with a path and posts `{ content: '' }` to `/api/files/*`. Phase 7 intercepts that moment to offer a template picker.

The implementation has two distinct surfaces: a **UI modal** (the picker) and a **template storage system** (custom templates). Built-in templates require no server storage — they are static strings defined on the client. Custom templates (TMPL-02) require server-side persistence: a dedicated Fastify route pair (list + save) that reads/writes `.md` files in a hidden `.marky/templates/` directory inside ROOT_DIR.

Token substitution (`{{date}}`, `{{title}}`) is purely a client-side string replace at the moment the file is created — no server logic needed.

**Primary recommendation:** Extend `FolderPickerModal` into a two-step modal: step 1 is template selection (built-ins + custom list + blank), step 2 is the existing filename/folder picker. Custom template storage goes in a new server routes file `server/src/routes/templates.ts` registered in `app.ts`.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React (already installed) | 19.x | Modal component state machine | Project already uses React 19 |
| Fastify (already installed) | 5.x | New template CRUD routes | Consistent with all other server routes |
| Node.js `fs/promises` (stdlib) | - | Read/write template files on disk | Already used throughout server |
| `gray-matter` (already installed) | 4.x | Parse/strip YAML frontmatter when saving a file as template | Already in server deps |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `path` (stdlib) | - | Construct `.marky/templates/` storage path | Server side |
| Vitest + @testing-library/react (already installed) | 2.x / 16.x | Unit + component tests | All tests in this project use these |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `.marky/templates/` inside ROOT_DIR | Separate config dir (`~/.config/marky/`) | ROOT_DIR storage travels with the vault; user-level config would be global. For a single-vault local app, ROOT_DIR is preferable |
| Extending `FolderPickerModal` | New `TemplatePickerModal` component | Extension keeps the creation flow in one place; a separate component would require `FileTree.handleCreate` to chain two modals. Extension is lower churn |
| Client-side constants for built-ins | Server-side built-in template files | Client constants remove a round-trip and cannot be accidentally deleted by users |

**Installation:** No new dependencies required.

---

## Architecture Patterns

### Recommended Project Structure

New/modified files:

```
client/src/
├── components/
│   └── FolderPickerModal.tsx    # Add template-selection step (Step 1 before existing Step 2)
server/src/
├── routes/
│   └── templates.ts             # GET /api/templates, POST /api/templates, DELETE /api/templates/:name
├── app.ts                       # Register templatesRoutes
```

New test files:

```
client/src/__tests__/
│   └── TemplateStep.test.tsx    # Template selection step renders built-ins + custom list
server/src/routes/
│   └── templates.test.ts        # CRUD routes integration tests
```

### Pattern 1: Two-Step Modal

**What:** `FolderPickerModal` gains a `step` state: `'template' | 'location'`. Step 1 shows the template picker; clicking a template (or blank) advances to step 2 (the existing filename/folder UI). The selected template content is stored in component state and passed to `onConfirm` alongside the path.

**When to use:** Any time the creation flow needs a preceding selection gate.

**Example:**

```tsx
// FolderPickerModal.tsx — sketch of two-step state
const [step, setStep] = useState<'template' | 'location'>('template');
const [selectedContent, setSelectedContent] = useState('');

// Step 1: template chosen
const handleTemplateSelect = (content: string) => {
  setSelectedContent(content);
  setStep('location');
};

// Step 2: user confirms filename+folder — pass content to caller
const handleConfirm = () => {
  const content = applyTokens(selectedContent, { title: fileName.trim(), date: todayISO() });
  onConfirm(fullPath, fileName, content);
};
```

The `onConfirm` signature in `FileTree.handleCreate` changes from `(filePath)` to `(filePath, content)`, and the POST body sends `{ content }` instead of `{ content: '' }`.

### Pattern 2: Built-In Templates as Client Constants

**What:** Define 3 built-in template objects as a typed constant array in a new file `client/src/lib/builtInTemplates.ts`. No server round-trip needed.

**When to use:** Static content that never changes at runtime.

**Example:**

```ts
// client/src/lib/builtInTemplates.ts
export interface TemplateEntry {
  id: string;
  label: string;
  content: string;
}

const today = () => new Date().toISOString().slice(0, 10);

export const BUILT_IN_TEMPLATES: TemplateEntry[] = [
  {
    id: 'daily-note',
    label: 'Daily Note',
    content: `---\ndate: {{date}}\ntags: [daily]\n---\n\n# {{date}}\n\n## Today\n\n- \n\n## Notes\n\n`,
  },
  {
    id: 'meeting-note',
    label: 'Meeting Note',
    content: `---\ndate: {{date}}\ntags: [meeting]\n---\n\n# Meeting: {{title}}\n\n**Date:** {{date}}\n\n## Attendees\n\n- \n\n## Agenda\n\n1. \n\n## Notes\n\n## Action Items\n\n- [ ] \n`,
  },
  {
    id: 'decision-record',
    label: 'Decision Record',
    content: `---\ndate: {{date}}\ntags: [decision]\n---\n\n# Decision: {{title}}\n\n**Date:** {{date}}\n**Status:** Proposed\n\n## Context\n\n## Decision\n\n## Consequences\n\n`,
  },
];
```

### Pattern 3: Token Substitution (Pure Function)

**What:** A small pure function replaces `{{date}}` and `{{title}}` in template content strings at creation time.

**Example:**

```ts
// client/src/lib/templateTokens.ts
export function applyTokens(content: string, vars: { title: string; date: string }): string {
  return content
    .replace(/\{\{date\}\}/g, vars.date)
    .replace(/\{\{title\}\}/g, vars.title.replace(/\.md$/, ''));
}
```

### Pattern 4: Custom Template Server Routes

**What:** `GET /api/templates` returns a list of saved custom templates (name + content). `POST /api/templates` saves a new template file. `DELETE /api/templates/:name` removes one.

Templates are stored as `.md` files under `ROOT_DIR/.marky/templates/`. The `.marky/` prefix hides the directory from the file tree (the tree builder already filters by `includeDirs` in the client, and the directory name starts with `.` so `buildTree` likely skips it — verify during implementation).

**Example (server route sketch):**

```ts
// server/src/routes/templates.ts
import { FastifyPluginAsync } from 'fastify';
import fs from 'fs/promises';
import path from 'path';

const TMPL_SUBDIR = '.marky/templates';

const templatesRoutes: FastifyPluginAsync = async (fastify) => {
  const tmplDir = () => path.join(fastify.rootDir, TMPL_SUBDIR);

  fastify.get('/api/templates', async () => {
    await fs.mkdir(tmplDir(), { recursive: true });
    const files = await fs.readdir(tmplDir());
    const entries = await Promise.all(
      files.filter(f => f.endsWith('.md')).map(async (f) => ({
        name: f.replace(/\.md$/, ''),
        content: await fs.readFile(path.join(tmplDir(), f), 'utf-8'),
      }))
    );
    return { templates: entries };
  });

  fastify.post<{ Body: { name: string; content: string } }>(
    '/api/templates', async (req, reply) => {
      await fs.mkdir(tmplDir(), { recursive: true });
      const safeName = req.body.name.replace(/[^a-zA-Z0-9\-_ ]/g, '').trim();
      if (!safeName) { reply.code(400); return { error: 'Invalid name' }; }
      await fs.writeFile(path.join(tmplDir(), `${safeName}.md`), req.body.content, { flag: 'w' });
      reply.code(201);
      return { name: safeName };
    }
  );

  fastify.delete<{ Params: { name: string } }>(
    '/api/templates/:name', async (req, reply) => {
      const safeName = req.params.name.replace(/[^a-zA-Z0-9\-_ ]/g, '').trim();
      await fs.rm(path.join(tmplDir(), `${safeName}.md`)).catch(() => {});
      reply.code(204);
    }
  );
};

export default templatesRoutes;
```

### Anti-Patterns to Avoid

- **Storing built-in templates on the server:** Static content that can't change doesn't belong in a fetch round-trip. Increases latency and creates an unnecessary delete vector.
- **Blocking modal open on custom template fetch:** Fetch custom templates in the background when `showCreate` becomes true, not before. Show built-ins immediately.
- **Mutating `FolderPickerModal`'s `onConfirm` signature without updating `FileTree`:** The caller in `FileTree.handleCreate` must be updated in the same plan that changes the modal signature.
- **Leaving `.marky/templates/` visible in the file tree:** Confirm that `buildTree` skips dotfiles/dot-directories (common convention). If not, add an exclusion.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Template file storage format | Custom binary/JSON serializer | Plain `.md` files under `.marky/templates/` | Markdown files are human-readable, editable by hand, consistent with the rest of the app |
| Token regex | Manual string `.split` / `.indexOf` | `content.replace(/\{\{token\}\}/g, value)` | Global regex replace is one line and handles multiple occurrences |
| Date formatting | Custom date formatter | `new Date().toISOString().slice(0, 10)` | Produces `YYYY-MM-DD` in one line; app is single-user/local so no timezone complexity |

**Key insight:** The entire feature is glue code — the hardest part is modal UX sequencing, not data modeling.

---

## Common Pitfalls

### Pitfall 1: `onConfirm` Signature Mismatch After Modal Change

**What goes wrong:** `FolderPickerModal.onConfirm` currently takes `(filePath: string, fileName: string)`. After adding template content, it becomes `(filePath: string, fileName: string, content: string)`. The `FileTree.handleCreate` caller is not updated simultaneously, so TypeScript complains but the runtime silently passes `undefined` as content.

**Why it happens:** The caller is in a different file (`FileTree.tsx`) from the modal.

**How to avoid:** Update both the modal and `FileTree.handleCreate` in the same plan wave. Add the `content` parameter as optional with `= ''` default during the transition.

**Warning signs:** TypeScript error `Expected 3 arguments, but got 2` in `FileTree.tsx`.

### Pitfall 2: `{{title}}` Includes `.md` Extension

**What goes wrong:** The `title` token is derived from the filename the user typed. If the user types `my-note`, the modal appends `.md` to get `my-note.md`. If `applyTokens` uses the full filename including `.md`, the heading in the template reads `# my-note.md`.

**Why it happens:** `.md` is appended for file creation but should be stripped before token substitution.

**How to avoid:** In `applyTokens`, derive title from `fileName.replace(/\.md$/, '')` before substitution.

**Warning signs:** Template renders headings with `.md` suffix.

### Pitfall 3: `.marky/` Directory Appearing in File Tree

**What goes wrong:** The server's `buildTree` function walks ROOT_DIR and includes `.marky/` as a directory node. The client renders it in the file tree, confusing users.

**Why it happens:** `buildTree` may not filter dot-directories by default.

**How to avoid:** Before implementing, verify `buildTree` behavior (read `server/src/lib/fsTree.ts`). If it does not skip dot-directories, add a filter: `if (entry.name.startsWith('.')) continue;`. Alternatively, exclude `.marky` explicitly.

**Warning signs:** A `.marky` folder appears in the sidebar after saving a custom template.

### Pitfall 4: Custom Template List Stale After Save

**What goes wrong:** User saves a template, then immediately opens the "New file" picker. The picker still shows the old custom template list because the component unmounted/remounted but the fetch hasn't completed.

**Why it happens:** The fetch for custom templates is async.

**How to avoid:** After a successful `POST /api/templates`, re-fetch the custom template list before closing the save dialog. Keep the picker's custom template state fresh by always fetching on picker open.

### Pitfall 5: "Save as Template" Entry Point is Unclear

**What goes wrong:** TMPL-02 says users can save "any open file" as a template. There is no obvious place in the current UI for a "Save as Template" button. Adding it to the EditorPane toolbar or the FileInfo panel without a design decision creates inconsistency.

**Why it happens:** TMPL-02 requires a new action surface that doesn't exist yet.

**How to avoid:** During planning, decide the entry point. Best candidates: (a) a "Save as Template" button in `FileInfo` component (right panel), or (b) a context menu on file nodes. Option (a) is consistent with how tag editing works and requires no new interaction pattern.

---

## Code Examples

### Verified Pattern: Existing `handleCreate` in FileTree

```tsx
// Source: client/src/components/FileTree.tsx (current)
const handleCreate = async (filePath: string) => {
  const res = await fetch(`/api/files/${filePath}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: '' }),
  });
  setShowCreate(false);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    window.alert(`Create failed: ${err.error ?? res.status}`);
    return;
  }
  const folder = filePath.includes('/') ? filePath.substring(0, filePath.lastIndexOf('/')) : '';
  if (folder) onExpandFolder(folder);
  refetch();
  onSelect(filePath);
};
```

After Phase 7, `handleCreate` changes signature to `(filePath: string, content: string)` and passes `content` in the POST body.

### Verified Pattern: POST /api/files/* (existing server route)

```ts
// Source: server/src/routes/files.ts
// CREATE FILE — 'wx' flag fails if file already exists (409)
fastify.post<{ Params: { '*': string }; Body: { content?: string } }>(
  '/api/files/*', async (req, reply) => {
    // ...
    await fs.writeFile(safe, req.body?.content ?? '', { flag: 'wx' });
    reply.code(201);
    return { path: req.params['*'] };
  }
);
```

The server already accepts `content` in the POST body — no server change needed to support template content at file creation. Only `content: ''` hardcoded in the client needs to change.

### Verified Pattern: Existing Modal Style (FolderPickerModal)

```tsx
// Source: client/src/components/FolderPickerModal.tsx
return (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg shadow-xl w-96 flex flex-col max-h-[80vh]">
      {/* header */}
      {/* step content */}
      {/* footer buttons */}
    </div>
  </div>
);
```

The template picker step must match this modal shell exactly.

---

## Current New-File Flow (Critical Context for Planner)

The full creation path is:

1. User clicks "+ New" in `FileTree` header
2. `FileTree` sets `showCreate = true`
3. `FolderPickerModal` renders: user types filename, picks folder, clicks "Create"
4. `FolderPickerModal.onConfirm(fullPath, fileName)` fires
5. `FileTree.handleCreate(filePath)` calls `POST /api/files/{path}` with `{ content: '' }`
6. On success: folder expanded, tree refetched, file opened in tab

**Phase 7 inserts a template step between steps 2 and 3.** The modal shows templates first; after selection it advances to the existing filename/folder step. No changes to the server's POST file route are needed.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Single-step modal (just filename+folder) | Two-step modal (template → filename+folder) | Phase 7 | Minimal refactor; step state added to existing modal |
| Always creates blank file | Creates file with template content | Phase 7 | `handleCreate` passes content through |
| No custom templates | Custom templates stored in `.marky/templates/` | Phase 7 | New server route pair + FileInfo "Save as Template" button |

---

## Open Questions

1. **Entry point for "Save as Template" (TMPL-02)**
   - What we know: No existing button surface for this action.
   - What's unclear: Whether this lives in `FileInfo` (right panel), a context menu on file nodes, or in the EditorPane toolbar.
   - Recommendation: `FileInfo` component — it already shows the active file's metadata (filename, tags) and has the most natural framing. Add a "Save as template" button below the filename. This is consistent with existing right-panel affordances.

2. **Does `buildTree` skip dot-directories?**
   - What we know: `buildTree` is in `server/src/lib/fsTree.ts` (not read during this research pass).
   - What's unclear: Whether `.marky/` will silently appear in the file tree after implementation.
   - Recommendation: Read `fsTree.ts` during Wave 0 of planning and add explicit dot-directory filtering if needed.

3. **Template picker step width**
   - What we know: `FolderPickerModal` is `w-96` (384px). A template list of 3 built-ins + N custom templates must fit.
   - What's unclear: Whether the modal needs to widen for the template step.
   - Recommendation: Keep `w-96` for the template step — a scrollable list of 6-8 items fits fine. If the list grows beyond that, the `max-h-[80vh]` + `overflow-auto` pattern already used in the folder picker handles it.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 2.x |
| Config file | `client/vite.config.ts` (inline `test` key), `server/vitest.config.ts` (if exists) |
| Quick run command | `cd client && npm test` |
| Full suite command | `cd client && npm test && cd ../server && npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| TMPL-01 | `applyTokens` replaces `{{date}}` and `{{title}}` correctly | unit | `cd client && npm test -- templateTokens` | Wave 0 |
| TMPL-01 | Built-in template content matches expected structure | unit | `cd client && npm test -- builtInTemplates` | Wave 0 |
| TMPL-02 | `POST /api/templates` writes file to `.marky/templates/` | integration | `cd server && npm test -- templates` | Wave 0 |
| TMPL-02 | `GET /api/templates` returns list of saved templates | integration | `cd server && npm test -- templates` | Wave 0 |
| TMPL-03 | Template picker step renders built-ins + Blank option | component | `cd client && npm test -- TemplateStep` | Wave 0 |
| TMPL-03 | Selecting blank advances to filename step with empty content | component | `cd client && npm test -- FolderPickerModal` | Wave 0 |

### Sampling Rate
- **Per task commit:** `cd client && npm test`
- **Per wave merge:** `cd client && npm test && cd ../server && npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `client/src/lib/__tests__/templateTokens.test.ts` — covers TMPL-01 token substitution
- [ ] `client/src/lib/__tests__/builtInTemplates.test.ts` — covers TMPL-01 built-in content structure
- [ ] `server/src/routes/__tests__/templates.test.ts` — covers TMPL-02 CRUD routes
- [ ] `client/src/__tests__/TemplateStep.test.tsx` — covers TMPL-03 picker rendering

---

## Sources

### Primary (HIGH confidence)
- Direct source read: `client/src/components/FileTree.tsx` — new-file creation flow, `handleCreate`, `FolderPickerModal` wiring
- Direct source read: `client/src/components/FolderPickerModal.tsx` — existing modal structure, `onConfirm` signature, UI patterns
- Direct source read: `server/src/routes/files.ts` — POST `/api/files/*` accepts `content` in body already
- Direct source read: `server/src/app.ts` — route registration pattern for adding `templatesRoutes`
- Direct source read: `client/src/hooks/useTabs.ts` — tab reducer, no changes needed for this phase
- Direct source read: `client/package.json` + `server/package.json` — no new dependencies required

### Secondary (MEDIUM confidence)
- Inferred: `.marky/templates/` as storage location is consistent with the convention of hidden dot-directories for app metadata; no competing location in the codebase
- Inferred: `buildTree` likely skips dot-directories (common Node.js fs convention) but not verified — flagged as Open Question

### Tertiary (LOW confidence)
- None

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries already installed, no new deps
- Architecture: HIGH — derived from direct source code reads of every touch point
- Pitfalls: HIGH — derived from code analysis; token/extension pitfall is a concrete code path
- Test plan: HIGH — mirrors established Wave 0 pattern used in Phases 3-6

**Research date:** 2026-03-11
**Valid until:** 2026-04-11 (stable codebase, no external dependencies changing)
