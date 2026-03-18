# Phase 10: WYSIWYG Editor - Context

**Gathered:** 2026-03-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Replace the current CodeMirror + react-markdown split-pane editing model with a WYSIWYG rich text editor where the user edits directly on the rendered document — like Notion or Confluence. Markdown remains the on-disk file format; the editor serializes/deserializes transparently. This phase covers: click-to-edit on the document surface, slash commands for inserting blocks, drag-and-drop image insertion, inline image resizing, a floating formatting toolbar, and a raw markdown toggle. The current split-pane (CodeMirror below / preview above) is retired.

</domain>

<decisions>
## Implementation Decisions

### Edit mode entry
- Click anywhere on the document to place a cursor and begin editing — no mode switch, no button press required
- The document surface shows a subtle edit affordance on hover (faint border or highlight per block) to signal editability — identical to the read view otherwise
- No persistent toolbar at the top of the document

### Formatting toolbar
- A floating bubble toolbar appears when the user selects text
- Bubble contains: Bold, Italic, Link, Inline Code (at minimum)
- Nothing visible when no text is selected — keeps the surface clean

### Slash commands
- Triggered by typing `/` at the start of a line
- An inline dropdown menu appears below the cursor, filtering as the user types
- Dismissed with Escape or by clicking away
- Commands at launch: `/h1`, `/h2`, `/h3`, `/table`, `/image`, `/code`
- `/h1`–`/h3` convert the current paragraph to the chosen heading level
- `/table` inserts an editable table (default column count: Claude's discretion)
- `/image` opens a file picker to insert an image
- `/code` inserts a fenced code block with a language selector

### Image handling
- Drag-and-drop onto the document inserts an image
- `/image` slash command also inserts an image via file picker
- Images are stored in a global `/images` folder at the vault root (not per-document)
- Markdown reference written as a root-relative path, e.g. `![alt](/images/filename.png)`
- After insertion, clicking the image reveals drag handles for inline resizing
- Resize is written into markdown as an HTML width attribute (e.g. `<img src="..." width="400">`)

### Raw markdown escape hatch
- A small toggle button (e.g. `</>` icon) in the toolbar area lets the user switch to raw CodeMirror view
- Raw view is a full replacement of the WYSIWYG surface — same pane, different renderer
- Toggling back converts raw markdown back into the WYSIWYG editor
- Auto-save continues to work in both modes

### What is retired
- The current split-pane layout (CodeMirror below, preview above) is removed
- The "Edit / Preview" toggle button is removed
- `MarkdownEditor` (CodeMirror wrapper) is repurposed as the raw markdown fallback only
- `useScrollSync` hook is no longer needed (no split pane to sync)

### Claude's Discretion
- Choice of WYSIWYG library (TipTap on ProseMirror is the strong candidate given React + markdown serialization requirements — researcher should validate)
- Default table dimensions for `/table`
- Exact bubble toolbar button set beyond Bold/Italic/Link/Code
- Keyboard shortcuts (Cmd+B, Cmd+I etc.) — standard conventions apply
- Transition animation between WYSIWYG and raw MD view
- How to handle markdown constructs the WYSIWYG editor cannot represent (e.g. complex frontmatter, raw HTML blocks) — researcher should investigate

</decisions>

<canonical_refs>
## Canonical References

No external specs — requirements are fully captured in decisions above.

### Existing code to read before planning
- `client/src/components/EditorPane.tsx` — current split-pane orchestrator; this component is the primary target for replacement
- `client/src/components/MarkdownEditor.tsx` — CodeMirror wrapper; repurposed as raw MD fallback
- `client/src/components/MarkdownPreview.tsx` — react-markdown pipeline; replaced by WYSIWYG but serialization plugins (remarkGfm, remarkFrontmatter, remarkWikiLink) should be reused where possible
- `client/src/hooks/useAutoSave.ts` — must continue to work unchanged
- `client/src/hooks/useScrollSync.ts` — retired by this phase (no split pane)
- `client/src/hooks/useTabs.ts` — Tab type and reducer; editMode field may be repurposed or removed

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `useAutoSave` hook: fires on content change with debounce — plug the WYSIWYG onChange into this unchanged
- `useTabPersistence` hook: persists open tabs — no changes needed
- `MarkdownEditor` (CodeMirror): reused as the raw markdown fallback view behind the `</>` toggle
- `rehype-source-lines` / remark plugins (GFM, frontmatter, wiki-link): these are parsing/rendering plugins — the WYSIWYG library will need equivalent extensions or custom nodes

### Established Patterns
- Auto-save: content flows through `editContent` local state → `useAutoSave(path, content, onSaved)` — preserve this
- Tab state: `tab.content` is the server-loaded markdown string; `editContent` is the live local copy during editing — this pattern continues
- Styling: Tailwind + `prose prose-orange` typography class — WYSIWYG rendered output should match this

### Integration Points
- `EditorPane.tsx` is the main integration point — this is where the WYSIWYG editor mounts
- `App.tsx` passes `dispatch` and `onLinkClick` to `EditorPane` — wiki-link click handling must be preserved
- Server API is unchanged — still reads/writes raw markdown files; the editor handles serialization client-side

</code_context>

<specifics>
## Specific Ideas

- "Working with word or confluence document or notion document" — the mental model is: you open a file and it's already editable. No mode to enter.
- "Behind it works as markdown file" — the user never needs to think about markdown syntax, but the file on disk is always valid markdown
- Simple and productive — don't over-engineer the command palette or toolbar

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 10-wysiwyg-editor*
*Context gathered: 2026-03-18*
