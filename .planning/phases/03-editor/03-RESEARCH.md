# Phase 3: Editor - Research

**Researched:** 2026-03-09
**Domain:** CodeMirror 6 in React, auto-save debounce, split-pane editor layout, dirty-state tracking
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| VIEW-05 | User can split the view to see two documents side by side | react-resizable-panels v4 (already installed) provides Group/Panel/Separator API for horizontal two-pane split in the main content area |
| EDIT-01 | User can click Edit to open an editor panel below the preview (both visible simultaneously) | react-resizable-panels vertical Group with two Panels: preview on top, CodeMirror editor on bottom |
| EDIT-02 | Editor shows raw markdown; preview updates live as user types | @uiw/react-codemirror controlled value + onChange updates tab content string; existing MarkdownPreview re-renders from same string |
| EDIT-03 | Changes are auto-saved automatically after a brief pause | useAutoSave hook: useRef timeout + clearTimeout cleanup; fires PUT /api/files/:path with current content |
| EDIT-04 | Tab shows a dirty state indicator when there are unsaved changes | `dirty: boolean` field added to Tab type; tabReducer handles SET_DIRTY/CLEAR_DIRTY actions; TabBar renders dot indicator |
| EDIT-05 | User can edit two separate files at once in split-screen mode (each pane fully independent) | VIEW-05 split gives each pane its own active tab context; each pane independently shows preview+editor |
</phase_requirements>

---

## Summary

Phase 3 adds editing capability to the existing tab-based reading shell. The primary library is CodeMirror 6 via `@uiw/react-codemirror` (v4.25.8), which wraps the raw CodeMirror APIs into a controlled React component. The markdown language extension (`@codemirror/lang-markdown`) provides syntax highlighting in the editor pane. Auto-save is implemented as a debounced `PUT /api/files/:path` call (the server endpoint already exists from Phase 1). Dirty-state tracking requires extending the `Tab` type with a `dirty` boolean and adding two reducer actions (`SET_DIRTY` / `CLEAR_DIRTY`).

The split-screen requirement (VIEW-05 and EDIT-05) uses the already-installed `react-resizable-panels` v4. The main content area splits horizontally into two independent panes, each carrying its own active tab and editor state. Vertically within each pane, a second resizable Group stacks the preview above the editor when editing is active.

The server's `PUT /api/files/*` endpoint (routes/files.ts) already accepts `{ content: string }` and writes to disk. No server changes are needed for Phase 3.

**Primary recommendation:** Install `@uiw/react-codemirror` + `@codemirror/lang-markdown`; extend Tab type with `dirty` + `editMode` fields; add `MarkdownEditor` component; extend `useTabs` reducer; wire split-pane layout into App.tsx.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @uiw/react-codemirror | 4.25.8 | CodeMirror 6 as a controlled React component | Thin, well-maintained wrapper; avoids manual EditorView/EditorState lifecycle in useEffect; controlled `value`/`onChange` matches React patterns |
| @codemirror/lang-markdown | 6.5.0 | Markdown syntax highlighting + GFM support inside the editor | Official CodeMirror package; supports fenced code block sub-language highlighting |
| react-resizable-panels | 4.7.1 (already installed) | Resizable horizontal split for two-pane and vertical preview/editor split | Already used in Phase 2; v4 API confirmed (Group/Panel/Separator) |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @codemirror/theme-one-dark | 6.1.3 | Dark editor theme | Apply only if the app offers a dark mode toggle; default design is light so skip unless explicitly required |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @uiw/react-codemirror | Raw CodeMirror 6 (EditorView + EditorState) | Raw gives full control but requires manual React lifecycle management (mount/unmount EditorView in useEffect, manage controlled state manually) — @uiw/react-codemirror handles all of this |
| @uiw/react-codemirror | CodeMirror 5 / textarea | CM5 is legacy, no longer maintained for active development; textarea lacks syntax highlighting |
| @uiw/react-codemirror | Monaco Editor | Monaco is VS Code's engine — far larger bundle (~2 MB), overkill for a markdown editor |

**Installation:**
```bash
npm install @uiw/react-codemirror @codemirror/lang-markdown --workspace=client
```

---

## Architecture Patterns

### Recommended Project Structure
```
client/src/
├── components/
│   ├── MarkdownEditor.tsx     # CodeMirror editor pane (new)
│   ├── EditorPane.tsx         # Vertical split: preview + editor (new)
│   ├── SplitView.tsx          # Horizontal split: two independent EditorPanes (new)
│   ├── TabBar.tsx             # Extended: dirty-state dot indicator (modified)
│   ├── MarkdownPreview.tsx    # Unchanged
│   └── ...
├── hooks/
│   ├── useTabs.ts             # Extended: dirty/editMode in Tab type + reducer actions (modified)
│   ├── useAutoSave.ts         # New: debounced PUT /api/files/:path hook
│   └── ...
├── types/
│   └── tabs.ts                # Extended: Tab gains dirty + editMode fields (modified)
└── App.tsx                    # Extended: single-pane vs split-pane rendering (modified)
```

### Pattern 1: Controlled CodeMirror Editor
**What:** `@uiw/react-codemirror` renders as a fully controlled component. `value` is the current markdown string. `onChange` receives the new string on every keystroke.
**When to use:** Whenever the editor content must be kept in sync with React state (required for live preview and auto-save).
**Example:**
```typescript
// Source: https://github.com/uiwjs/react-codemirror
import CodeMirror from '@uiw/react-codemirror';
import { markdown } from '@codemirror/lang-markdown';

function MarkdownEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <CodeMirror
      value={value}
      extensions={[markdown()]}
      onChange={onChange}
      height="100%"
      basicSetup={{ lineNumbers: false, foldGutter: false }}
    />
  );
}
```

### Pattern 2: Debounced Auto-Save Hook
**What:** A custom `useAutoSave` hook takes content and a path. On every content change it clears any pending timer and starts a new 800ms countdown. On expiry, it calls `PUT /api/files/:path` and dispatches `CLEAR_DIRTY`.
**When to use:** Used inside `EditorPane` — receives content from local edit state, dispatches dirty/clean status to tabReducer.
**Example:**
```typescript
// Source: standard React useEffect + setTimeout + cleanup pattern
import { useEffect, useRef, useCallback } from 'react';

export function useAutoSave(path: string, content: string, onSaved: () => void, delayMs = 800) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      await fetch(`/api/files/${path}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      onSaved();
    }, delayMs);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [content, path]); // eslint-disable-line react-hooks/exhaustive-deps
}
```

### Pattern 3: Tab Dirty-State Extension
**What:** `Tab` type gains two new fields: `dirty: boolean` (unsaved changes exist) and `editMode: boolean` (editor pane visible). The reducer handles `SET_DIRTY`, `CLEAR_DIRTY`, `TOGGLE_EDIT` actions.
**When to use:** TabBar reads `tab.dirty` to render the indicator dot. `EditorPane` dispatches `SET_DIRTY` on first keystroke after save, `CLEAR_DIRTY` when auto-save completes.
**Example:**
```typescript
// Extend tabs.ts
export interface Tab {
  id: string;
  path: string;
  label: string;
  content: string | null;
  loading: boolean;
  dirty: boolean;      // NEW: unsaved changes exist
  editMode: boolean;   // NEW: editor pane is open
}

// New actions in TabAction union:
| { type: 'SET_DIRTY';    id: string }
| { type: 'CLEAR_DIRTY';  id: string }
| { type: 'TOGGLE_EDIT';  id: string }
```

### Pattern 4: Split-Pane Layout (VIEW-05 / EDIT-05)
**What:** The main content area (currently a single column) becomes a horizontal `Group` containing two `Panel` components separated by a `Separator`. Each Panel is an independent `EditorPane` with its own active tab state.
**When to use:** When the user activates split-screen mode. App.tsx tracks `splitMode: boolean` state.
**Example:**
```typescript
// Source: react-resizable-panels v4 type definitions (node_modules)
import { Group, Panel, Separator } from 'react-resizable-panels';

// Single pane (default):
<EditorPane tabId={activeTabId} />

// Split pane (when splitMode):
<Group orientation="horizontal" className="h-full">
  <Panel id="left" minSize="200px">
    <EditorPane tabId={leftActiveTabId} />
  </Panel>
  <Separator />
  <Panel id="right" minSize="200px">
    <EditorPane tabId={rightActiveTabId} />
  </Panel>
</Group>
```

### Pattern 5: Vertical Preview + Editor Split (EDIT-01)
**What:** Inside each `EditorPane`, when `editMode` is true, a vertical `Group` splits preview (top) and CodeMirror editor (bottom). When `editMode` is false, only the preview renders.
**When to use:** Toggled by the "Edit" button rendered in the EditorPane header/toolbar.
**Example:**
```typescript
// Vertical split within a single pane
{editMode ? (
  <Group orientation="vertical" className="h-full">
    <Panel id="preview" defaultSize="50%">
      <MarkdownPreview content={editContent} onLinkClick={handleLinkClick} />
    </Panel>
    <Separator />
    <Panel id="editor" defaultSize="50%">
      <MarkdownEditor value={editContent} onChange={handleChange} />
    </Panel>
  </Group>
) : (
  <MarkdownPreview content={tab.content ?? ''} onLinkClick={handleLinkClick} />
)}
```

### Anti-Patterns to Avoid
- **Storing editor content separately from tab content:** Keep a single source of truth. When the user types, update a local `editContent` state; sync back to the tab's `content` via dispatch on auto-save to avoid racing the reducer on every keystroke.
- **Passing the whole Tab object as a dep in useEffect:** The existing codebase (App.tsx) already guards against this — use primitive `tab.id` and `tab.path` as useEffect dependencies, not the full object reference.
- **Clearing dirty immediately on onChange:** The dirty flag should be set on first change after a save and cleared only when the PUT request completes, not when the timer fires.
- **Multiple nested CodeMirror instances without key props:** Each editor instance needs a stable React `key` tied to the tab ID to prevent CM state leaking between files.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Markdown syntax highlighting in editor | Custom tokenizer / regex coloring | `@codemirror/lang-markdown` extension | CodeMirror's incremental parser is correct for nested syntax (fenced code, inline HTML, bold/italic inside headings) |
| Resizable pane drag logic | MouseEvent + onMouseMove in useEffect (the approach used for sidebar in Phase 2) | react-resizable-panels (already installed) | The Phase 2 sidebar uses manual drag — that works for fixed panels but does not scale to two independent content panes each with their own resize logic |
| Debounce utility | Writing a generic debounce function | Native setTimeout + clearTimeout in useEffect | No external library needed; the cleanup pattern with useRef is idiomatic React and has zero dependencies |

**Key insight:** The server PUT endpoint is already complete and tested. Phase 3 is entirely a client-side concern.

---

## Common Pitfalls

### Pitfall 1: CodeMirror `value` prop and cursor position
**What goes wrong:** Updating the `value` prop on `@uiw/react-codemirror` from outside the editor (e.g., reloading file content) resets the cursor position and undo history.
**Why it happens:** CodeMirror 6 treats `value` changes as a full document replacement when the new string differs from the current document.
**How to avoid:** Only update `value` from outside when the content was changed externally (e.g., initial load, file reload). Do not feed the auto-saved content back in as a new `value` prop — the editor already contains that content.
**Warning signs:** Cursor jumping to position 0 after auto-save.

### Pitfall 2: useEffect infinite loop with tab content
**What goes wrong:** If the `useEffect` that reads file content dispatches `SET_CONTENT` and the component also dispatches content changes on keystroke, the content fetch can re-trigger.
**Why it happens:** Phase 2 already solved this for the fetch loop (using `activeTab.id + activeTab.path` as primitives). In Phase 3, the editor additionally writes to content; the fetch guard (`activeTab.content !== null`) must remain intact so editing-mode tabs do not re-fetch.
**How to avoid:** The `content !== null` guard in App.tsx's existing fetch useEffect already prevents re-fetch once content is loaded. Do not remove this guard when adding edit support.
**Warning signs:** Infinite network requests to `/api/files/:path` GET while editing.

### Pitfall 3: react-resizable-panels v4 API — wrong imports
**What goes wrong:** Using `PanelGroup` and `PanelResizeHandle` (v1-v2 API) causes runtime errors.
**Why it happens:** The project already has v4 installed (4.7.1). v4 changed the exports to `Group`, `Panel`, `Separator`.
**How to avoid:** Import exclusively from the v4 API: `import { Group, Panel, Separator } from 'react-resizable-panels'`. This is already noted in STATE.md.
**Warning signs:** TypeScript "Module has no exported member 'PanelGroup'" error.

### Pitfall 4: Split-pane state management — two active tabs
**What goes wrong:** Reusing the single `activeTabId` from `useTabs` for a split view causes both panes to show the same file.
**Why it happens:** The current `TabState` has one `activeTabId`. VIEW-05/EDIT-05 require each pane to independently track which tab is active.
**How to avoid:** Add `leftActiveTabId` and `rightActiveTabId` to App.tsx local state (not to TabState). The shared tab list remains in `useTabs`; only the per-pane focus is local. Alternatively, each pane can accept a `activeTabId` prop and its own `onFocus` callback.
**Warning signs:** Both panes switching to the same file when clicking tabs.

### Pitfall 5: Dirty indicator on tab close
**What goes wrong:** Closing a dirty tab discards unsaved changes silently.
**Why it happens:** The `CLOSE` reducer action does not check the dirty flag.
**How to avoid:** In the TabBar close button handler, check `tab.dirty` before dispatching `CLOSE`. If dirty, show a native `confirm()` dialog (consistent with Phase 1 patterns that used `window.confirm`). This is a single-user app so a confirm dialog is acceptable.
**Warning signs:** Users lose edits on accidental tab close.

---

## Code Examples

Verified patterns from official sources and installed packages:

### MarkdownEditor component skeleton
```typescript
// Source: @uiw/react-codemirror controlled component API (npm v4.25.8)
import CodeMirror from '@uiw/react-codemirror';
import { markdown } from '@codemirror/lang-markdown';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export function MarkdownEditor({ value, onChange }: MarkdownEditorProps) {
  return (
    <CodeMirror
      value={value}
      height="100%"
      extensions={[markdown()]}
      onChange={onChange}
      className="h-full text-sm font-mono"
      basicSetup={{
        lineNumbers: true,
        foldGutter: false,
        dropCursor: false,
        allowMultipleSelections: false,
        indentOnInput: true,
      }}
    />
  );
}
```

### Extending Tab type (tabs.ts)
```typescript
export interface Tab {
  id: string;
  path: string;
  label: string;
  content: string | null;
  loading: boolean;
  dirty: boolean;      // true when there are unsaved changes
  editMode: boolean;   // true when the editor pane is visible
}

export type TabAction =
  | { type: 'OPEN';        path: string; label: string }
  | { type: 'CLOSE';       id: string }
  | { type: 'FOCUS';       id: string }
  | { type: 'REORDER';     from: number; to: number }
  | { type: 'SET_CONTENT'; path: string; content: string }
  | { type: 'SET_DIRTY';   id: string }
  | { type: 'CLEAR_DIRTY'; id: string }
  | { type: 'TOGGLE_EDIT'; id: string };
```

### Dirty-state dot in TabBar
```typescript
// Inside SortableTab render, after the label span:
{tab.dirty && (
  <span
    className="w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0"
    title="Unsaved changes"
  />
)}
```

### react-resizable-panels v4 horizontal split
```typescript
// Source: installed package type definitions (node_modules/react-resizable-panels)
import { Group, Panel, Separator } from 'react-resizable-panels';

<Group orientation="horizontal" className="h-full">
  <Panel id="pane-left" minSize="200px" defaultSize="50%">
    {/* left EditorPane */}
  </Panel>
  <Separator className="w-1 bg-gray-200 hover:bg-orange-400 transition-colors cursor-col-resize" />
  <Panel id="pane-right" minSize="200px" defaultSize="50%">
    {/* right EditorPane */}
  </Panel>
</Group>
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| CodeMirror 5 (textarea-based) | CodeMirror 6 (contenteditable, modular) | 2022 | Modular extensions, better perf, TypeScript-first |
| PanelGroup / PanelResizeHandle | Group / Panel / Separator | react-resizable-panels v4 | Breaking API rename; already noted in project STATE.md |
| Separate preview debounce state | Direct `onChange` → same content string | @uiw/react-codemirror v4 | onChange fires with full string, no extra debounce needed for preview update |

**Deprecated/outdated:**
- `PanelGroup`, `PanelResizeHandle` from react-resizable-panels: replaced by `Group`, `Separator` in v4 — already noted in STATE.md as a known pitfall.

---

## Open Questions

1. **Edit button placement**
   - What we know: EDIT-01 says "click Edit" — no UI placement specified in requirements.
   - What's unclear: Should Edit be a button in the tab itself, in a toolbar above the content, or in the file tree context menu?
   - Recommendation: Add an "Edit" button to the right of the active tab label (consistent with VS Code / Typora patterns). This avoids adding a separate toolbar row.

2. **Split-screen trigger mechanism**
   - What we know: VIEW-05 says "user can split the view" but does not specify how.
   - What's unclear: Button in header? Keyboard shortcut? Drag a tab to split?
   - Recommendation: A split-screen button in the app header bar (simple toggle). Drag-to-split is a v2 feature.

3. **Auto-save delay**
   - What we know: EDIT-03 says "brief pause" — no specific time stated.
   - What's unclear: 500ms? 800ms? 1000ms?
   - Recommendation: Use 800ms. This is the common editor convention (VS Code default is 1000ms, but 800ms feels more responsive for short documents).

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.0.18 |
| Config file | vite.config.ts (vitest picks up from Vite config) |
| Quick run command | `npm run test --workspace=client` |
| Full suite command | `npm run test --workspace=client` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| EDIT-01 | Edit button toggles editMode on active tab | unit (reducer) | `npm run test --workspace=client` | ❌ Wave 0 |
| EDIT-02 | onChange updates editContent; preview re-renders from same string | unit (reducer + component) | `npm run test --workspace=client` | ❌ Wave 0 |
| EDIT-03 | Auto-save fires PUT after debounce delay | unit (hook, mock fetch) | `npm run test --workspace=client` | ❌ Wave 0 |
| EDIT-04 | SET_DIRTY/CLEAR_DIRTY reducer actions set dirty flag correctly | unit (reducer) | `npm run test --workspace=client` | ❌ Wave 0 |
| EDIT-05 | Each split pane tracks its own active tab independently | unit (App state) | manual | manual-only — requires two simultaneous tab focuses |
| VIEW-05 | Split view renders two independent panes | smoke | manual | manual-only — visual layout |

### Sampling Rate
- **Per task commit:** `npm run test --workspace=client`
- **Per wave merge:** `npm run test --workspace=client`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `client/src/hooks/__tests__/useAutoSave.test.ts` — covers EDIT-03 (debounce, PUT call, onSaved callback)
- [ ] `client/src/__tests__/tabReducer-editor.test.ts` — covers EDIT-01/EDIT-04 (TOGGLE_EDIT, SET_DIRTY, CLEAR_DIRTY reducer cases)

---

## Sources

### Primary (HIGH confidence)
- Installed package: `react-resizable-panels@4.7.1` — type definitions read directly from `node_modules/react-resizable-panels/dist/react-resizable-panels.d.ts`; Group/Panel/Separator API confirmed
- npm registry: `@uiw/react-codemirror@4.25.8` — version and peer deps confirmed via `npm view`
- npm registry: `@codemirror/lang-markdown@6.5.0` — version confirmed via `npm view`
- Project source: `client/src/types/tabs.ts`, `client/src/hooks/useTabs.ts`, `client/src/App.tsx` — existing architecture read directly
- Project source: `server/src/routes/files.ts` — PUT endpoint confirmed; accepts `{ content: string }`, writes to disk

### Secondary (MEDIUM confidence)
- [uiwjs/react-codemirror GitHub](https://github.com/uiwjs/react-codemirror) — controlled component API (`value`, `onChange`, `extensions`), markdown extension usage
- [codemirror/lang-markdown GitHub](https://github.com/codemirror/lang-markdown) — markdown language support features

### Tertiary (LOW confidence)
- None — all critical claims verified against installed packages or official npm.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — versions confirmed via npm registry and installed node_modules
- Architecture: HIGH — based on existing codebase patterns (useTabs reducer, hook-owns-state convention) and installed package type definitions
- Pitfalls: HIGH — items 3/4/5 grounded in existing STATE.md decisions; items 1/2 verified against CodeMirror and Phase 2 patterns

**Research date:** 2026-03-09
**Valid until:** 2026-09-09 (stable ecosystem; @uiw/react-codemirror follows CodeMirror 6 which is stable)
