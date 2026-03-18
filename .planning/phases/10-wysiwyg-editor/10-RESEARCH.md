# Phase 10: WYSIWYG Editor - Research

**Researched:** 2026-03-18
**Domain:** Rich-text WYSIWYG editing with markdown serialization (TipTap/ProseMirror)
**Confidence:** HIGH

## Summary

Phase 10 replaces the current split-pane CodeMirror + react-markdown editing model with a single-surface WYSIWYG editor built on TipTap (ProseMirror). The user clicks anywhere on the rendered document to edit inline, uses slash commands to insert blocks, drags images into the document, and can toggle to raw CodeMirror when needed. Markdown remains the on-disk format — the editor serializes/deserializes transparently via `@tiptap/markdown`.

TipTap v3.20 is the clear choice: it is the only React-native ProseMirror wrapper with an official markdown extension (`@tiptap/markdown` using MarkedJS), built-in BubbleMenu and FloatingMenu components, a Suggestion plugin for slash commands, an Image extension with resize support, and table editing. The ecosystem is mature and all needed functionality ships as first-party extensions.

The primary integration point is `EditorPane.tsx`. The split-pane layout (react-resizable-panels Group/Panel/Separator), the Edit/Preview toggle, and `useScrollSync` are all retired. The existing `useAutoSave` hook is reused unchanged — TipTap's `onUpdate` callback feeds markdown content to `editContent` state, which flows through the existing auto-save pipeline. The `MarkdownEditor` component (CodeMirror wrapper) is preserved as the raw mode fallback behind a `</>` toggle.

**Primary recommendation:** Use TipTap v3.20 with `@tiptap/markdown` for serialization, `@tiptap/starter-kit` for core editing, and first-party extensions for link, image, table, placeholder, and bubble menu. Build slash commands on `@tiptap/suggestion`. Add a new `POST /api/upload-image` server route for image drag-and-drop.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Click anywhere on the document to place a cursor and begin editing — no mode switch, no button press required
- The document surface shows a subtle edit affordance on hover (faint border or highlight per block) to signal editability — identical to the read view otherwise
- No persistent toolbar at the top of the document
- A floating bubble toolbar appears when the user selects text (Bold, Italic, Link, Inline Code at minimum)
- Nothing visible when no text is selected — keeps the surface clean
- Slash commands triggered by typing `/` at the start of a line; inline dropdown menu; commands: `/h1`, `/h2`, `/h3`, `/table`, `/image`, `/code`
- `/table` inserts an editable table (default column count: Claude's discretion)
- `/image` opens a file picker to insert an image
- `/code` inserts a fenced code block with a language selector
- Drag-and-drop onto the document inserts an image
- Images stored in a global `/images` folder at vault root
- Markdown reference as root-relative path, e.g. `![alt](/images/filename.png)`
- Clicking an image reveals drag handles for inline resizing; resize written as `<img src="..." width="N">`
- A `</>` toggle button switches between WYSIWYG (TipTap) and raw CodeMirror view
- Raw view is full replacement of WYSIWYG surface — same pane, different renderer
- Auto-save continues to work in both modes
- The current split-pane layout is removed; `MarkdownEditor` repurposed as raw fallback only; `useScrollSync` retired

### Claude's Discretion
- Choice of WYSIWYG library (TipTap validated — see research below)
- Default table dimensions for `/table` — **recommendation: 3 columns x 3 rows with header row**
- Exact bubble toolbar button set beyond Bold/Italic/Link/Code — **recommendation: add Strikethrough (~~) as fifth button**
- Keyboard shortcuts (Cmd+B, Cmd+I etc.) — standard conventions apply
- Transition animation between WYSIWYG and raw MD view — **recommendation: 150ms crossfade opacity per UI-SPEC**
- How to handle markdown constructs the WYSIWYG editor cannot represent — **see Un-representable Markdown section below**

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| WYSIWYG-01 | Clicking anywhere on a document places a cursor and begins editing inline — no mode switch required | TipTap renders as editable ProseMirror surface by default; `editable: true` is the default. Hover affordance via CSS on `.ProseMirror` block nodes. |
| WYSIWYG-02 | Typing `/` opens an inline slash command menu; `/h1`-`/h3`, `/table`, `/image`, `/code` are available at launch | Built on `@tiptap/suggestion` extension with custom slash command extension. Official example at tiptap.dev/docs/examples/experiments/slash-commands. |
| WYSIWYG-03 | Dragging an image file onto the document inserts it; image is saved to `/images/` at vault root; inline resize handles are available | Image extension with `resize: true` for handles. New `POST /api/upload-image` server route for file upload. Drop handling via custom ProseMirror plugin or TipTap FileHandler pattern. |
| WYSIWYG-04 | Selecting text shows a floating bubble toolbar with Bold, Italic, Link, and Inline Code | `BubbleMenu` component from `@tiptap/react` — renders React children as floating toolbar anchored to text selection. |
| WYSIWYG-05 | A `</>` toggle switches between WYSIWYG and raw CodeMirror view; auto-save works in both modes | `editor.getMarkdown()` serializes to string for CodeMirror; `editor.commands.setContent(md, { contentType: 'markdown' })` parses back. Same `useAutoSave` hook consumes content from either mode. |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@tiptap/react` | 3.20.4 | React bindings for TipTap editor | Official React integration for ProseMirror; provides `useEditor`, `EditorContent`, `BubbleMenu`, `FloatingMenu` |
| `@tiptap/starter-kit` | 3.20.4 | Bundle of common extensions | Includes bold, italic, strike, code, headings, lists, blockquote, code block, horizontal rule, history |
| `@tiptap/markdown` | 3.20.4 | Bidirectional markdown serialization | Official extension using MarkedJS; `editor.getMarkdown()` and `setContent(md, {contentType:'markdown'})` |
| `@tiptap/extension-link` | 3.20.4 | Link editing | Cmd+K shortcut, paste-as-link, link bubble menu support |
| `@tiptap/extension-image` | 3.20.4 | Image node | Renders images, supports resize via `resize: true` configuration |
| `@tiptap/extension-table` | 3.20.4 | Table editing | Insert tables, add/remove rows and columns |
| `@tiptap/extension-table-row` | 3.20.4 | Table row node | Required companion to table extension |
| `@tiptap/extension-table-cell` | 3.20.4 | Table cell node | Required companion to table extension |
| `@tiptap/extension-table-header` | 3.20.4 | Table header cell node | Required companion to table extension |
| `@tiptap/extension-placeholder` | 3.20.4 | Placeholder text | Shows "Start writing" in empty editor, "Type a command..." hint |
| `@tiptap/suggestion` | 3.20.4 | Suggestion/autocomplete plugin | Foundation for slash command dropdown; handles trigger character, filtering, keyboard navigation |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@tiptap/extension-code-block-lowlight` | 3.20.4 | Syntax-highlighted code blocks | If language selector + highlighting is desired in fenced code blocks (optional — starter-kit includes basic code block) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| TipTap | Milkdown | Milkdown is markdown-first but smaller community, fewer extensions, less React tooling |
| TipTap | BlockNote | BlockNote is higher-level (opinionated UI) — less control over custom components like bubble toolbar |
| TipTap | ProseMirror direct | Much more code to write; TipTap abstracts the boilerplate while preserving full ProseMirror access |
| `@tiptap/markdown` | `tiptap-markdown` (community) | Community package is deprecated; maintainer recommends official `@tiptap/markdown` |

**Installation:**
```bash
cd client && npm install @tiptap/react @tiptap/starter-kit @tiptap/markdown @tiptap/extension-link @tiptap/extension-image @tiptap/extension-table @tiptap/extension-table-row @tiptap/extension-table-cell @tiptap/extension-table-header @tiptap/extension-placeholder @tiptap/suggestion
```

**Version verification:** All packages verified at 3.20.4 on npm registry (2026-03-18).

## Architecture Patterns

### Recommended Project Structure
```
client/src/
├── components/
│   ├── EditorPane.tsx          # MODIFIED: mounts WysiwygEditor or MarkdownEditor based on rawMode state
│   ├── WysiwygEditor.tsx       # NEW: TipTap editor wrapper with useEditor hook
│   ├── BubbleToolbar.tsx       # NEW: floating toolbar rendered via <BubbleMenu>
│   ├── SlashCommandMenu.tsx    # NEW: dropdown menu component rendered by suggestion plugin
│   ├── SlashCommandItem.tsx    # NEW: individual menu item
│   ├── ImageResizeHandle.tsx   # NEW: custom node view for resizable images (if TipTap built-in resize is insufficient)
│   ├── RawModeToggle.tsx       # NEW: </> toggle button
│   ├── MarkdownEditor.tsx      # UNCHANGED: CodeMirror wrapper, reused as raw fallback
│   └── MarkdownPreview.tsx     # UNCHANGED: kept for potential non-edit contexts but no longer used in EditorPane
├── extensions/
│   ├── slash-commands.ts       # NEW: TipTap extension using @tiptap/suggestion
│   ├── image-upload.ts         # NEW: custom extension handling drop/paste → upload → insert
│   └── wiki-link.ts            # NEW: custom TipTap node/mark for [[wiki-link]] support
├── hooks/
│   ├── useAutoSave.ts          # UNCHANGED
│   ├── useScrollSync.ts        # RETIRED (can be deleted or left unused)
│   └── useScrollPersist.ts     # May still be used for WYSIWYG scroll position
└── types/
    └── tabs.ts                 # MODIFIED: editMode field repurposed or replaced with editorMode: 'wysiwyg' | 'raw'
```

### Pattern 1: TipTap Editor with Markdown Round-Trip
**What:** Initialize TipTap with markdown content, serialize back to markdown on every change for auto-save.
**When to use:** Every document open in WYSIWYG mode.
**Example:**
```typescript
// Source: https://tiptap.dev/docs/editor/markdown/getting-started/basic-usage
import { useEditor, EditorContent } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Markdown from '@tiptap/markdown';

function WysiwygEditor({ initialContent, onChange }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Markdown.configure({ markedOptions: { gfm: true } }),
      // ... other extensions
    ],
    content: initialContent,
    contentType: 'markdown',
    onUpdate: ({ editor }) => {
      const md = editor.getMarkdown();
      onChange(md); // feeds into useAutoSave via editContent state
    },
  });

  return <EditorContent editor={editor} />;
}
```

### Pattern 2: Slash Commands via Suggestion Plugin
**What:** Custom TipTap extension that triggers on `/` character, renders a React dropdown, and executes editor commands on selection.
**When to use:** The slash command menu.
**Example:**
```typescript
// Source: https://tiptap.dev/docs/examples/experiments/slash-commands
import { Extension } from '@tiptap/core';
import Suggestion from '@tiptap/suggestion';

const SlashCommands = Extension.create({
  name: 'slashCommands',
  addOptions() {
    return {
      suggestion: {
        char: '/',
        startOfLine: true,
        command: ({ editor, range, props }) => {
          props.command({ editor, range });
        },
      },
    };
  },
  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ];
  },
});
```

### Pattern 3: Raw Mode Toggle with Content Sync
**What:** Switch between TipTap and CodeMirror without losing content.
**When to use:** The `</>` toggle button.
**Example:**
```typescript
// In EditorPane.tsx
const [rawMode, setRawMode] = useState(false);
const [editContent, setEditContent] = useState('');

function handleToggle() {
  if (rawMode) {
    // raw -> WYSIWYG: editContent already has latest markdown
    // TipTap will parse it via setContent with contentType: 'markdown'
  } else {
    // WYSIWYG -> raw: serialize TipTap to markdown
    const md = editorRef.current?.getMarkdown() ?? editContent;
    setEditContent(md);
  }
  setRawMode(!rawMode);
}
// Both modes write to editContent -> useAutoSave picks it up
```

### Pattern 4: Image Upload Flow
**What:** Intercept file drop/paste, upload to server, insert image node.
**When to use:** Image drag-and-drop and `/image` slash command.
**Example:**
```typescript
// Custom drop handler in TipTap extension
async function handleImageDrop(files: File[], pos: number, editor: Editor) {
  for (const file of files) {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/upload-image', { method: 'POST', body: formData });
    const { path } = await res.json(); // e.g. "/images/screenshot.png"
    editor.chain().focus().insertContentAt(pos, {
      type: 'image',
      attrs: { src: path, alt: file.name },
    }).run();
  }
}
```

### Anti-Patterns to Avoid
- **Storing ProseMirror JSON on disk:** Always serialize to markdown for storage. ProseMirror JSON is an internal representation, not portable.
- **Calling `setContent()` on every keystroke:** TipTap manages its own document state. Only call `setContent()` when switching modes or loading a new file.
- **Using `tiptap-markdown` community package:** Deprecated. Use official `@tiptap/markdown` (v3.7+).
- **Building custom floating UI from scratch:** Use TipTap's built-in `<BubbleMenu>` component which handles positioning, flip behavior, and dismissal.
- **Re-implementing suggestion/autocomplete:** Use `@tiptap/suggestion` which handles trigger character detection, keyboard navigation, and ProseMirror decorations.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Markdown parsing/serialization | Custom unified/remark pipeline for editor | `@tiptap/markdown` | Round-trip fidelity, CommonMark compliance, maintained by TipTap team |
| Floating toolbar positioning | Manual DOM positioning with scroll calculations | `<BubbleMenu>` from `@tiptap/react` | Uses Floating UI internally, handles viewport flipping, scroll tracking |
| Slash command trigger + filtering | Custom keydown handlers + regex matching | `@tiptap/suggestion` plugin | Handles ProseMirror decorations, cursor tracking, keyboard nav |
| Table editing | Custom contentEditable table with tab/arrow key handlers | `@tiptap/extension-table` + companions | Cell merging, row/column insertion, keyboard navigation across cells |
| Image resize handles | Custom drag handler on image elements | `@tiptap/extension-image` with `resize: true` | Handles aspect ratio, min/max dimensions, ProseMirror node update |
| Rich text keyboard shortcuts | Custom keydown event listeners | `@tiptap/starter-kit` | Cmd+B, Cmd+I, Cmd+E, Cmd+Z/Y all built in |

**Key insight:** TipTap's extension architecture means nearly every feature ships as a composable, well-tested extension. The cost of hand-rolling any of these is not just the initial build but ongoing maintenance of ProseMirror plugin interactions, keyboard event handling edge cases, and mobile browser quirks.

## Common Pitfalls

### Pitfall 1: Markdown Round-Trip Lossy Conversion
**What goes wrong:** Content mutates on save/reload cycle — extra blank lines, changed list formatting, frontmatter stripped.
**Why it happens:** TipTap's internal document model (ProseMirror schema) doesn't map 1:1 to all markdown constructs. The parse step normalizes formatting.
**How to avoid:**
1. Enable GFM in markdown config: `Markdown.configure({ markedOptions: { gfm: true } })`
2. Register all extensions that correspond to markdown features you want to preserve (tables, task lists, strikethrough)
3. Handle frontmatter as a non-editable custom node that preserves raw YAML text
4. Handle raw HTML blocks as non-editable custom nodes
5. Write round-trip unit tests: `parse(serialize(doc)) === doc`
**Warning signs:** Users report files "changing" on open/close without editing.

### Pitfall 2: Missing Extension Registration
**What goes wrong:** Content types silently disappear — tables vanish, images become text, code blocks lose language.
**Why it happens:** TipTap drops nodes it doesn't recognize during parsing. If you parse markdown with tables but `@tiptap/extension-table` isn't registered, table content is silently lost.
**How to avoid:** Register every extension before parsing any content. Test with a markdown file that exercises all constructs.
**Warning signs:** Content appears in raw mode but not in WYSIWYG.

### Pitfall 3: Auto-Save Firing During Mode Switch
**What goes wrong:** Partial or corrupted content saved to disk during the WYSIWYG <-> raw transition.
**Why it happens:** Changing `editContent` during toggle triggers `useAutoSave` with intermediate state.
**How to avoid:** Disable auto-save during mode transition (set `enabled: false` momentarily), then re-enable after new content is stable.
**Warning signs:** File content on disk doesn't match what's shown in either mode.

### Pitfall 4: TipTap `contentType` Omission
**What goes wrong:** Markdown is rendered as literal text (seeing `# heading` instead of a heading).
**Why it happens:** `setContent()` defaults to HTML parsing. Without `{ contentType: 'markdown' }`, markdown strings are treated as HTML text.
**How to avoid:** Always pass `contentType: 'markdown'` when calling `setContent()` with markdown strings. Also set `contentType: 'markdown'` in the initial `useEditor` options.
**Warning signs:** Raw markdown syntax visible in the WYSIWYG surface.

### Pitfall 5: Image Path Resolution After Upload
**What goes wrong:** Images show broken after upload, or paths don't resolve on reload.
**Why it happens:** The upload returns a server-relative path but the image node stores it differently than what the existing `/api/image` proxy expects.
**How to avoid:** Standardize: upload returns root-relative path (e.g. `/images/photo.png`), image node stores this exact string as `src`, and the existing image proxy handles root-relative paths (it already strips leading `/` for non-OS paths).
**Warning signs:** Images visible after insert but broken after save/reload.

### Pitfall 6: Wiki-Link Support Gap
**What goes wrong:** `[[wiki-link]]` syntax in existing files not rendered or lost on edit.
**Why it happens:** TipTap has no built-in wiki-link extension. The existing `remark-wiki-link` plugin is react-markdown specific.
**How to avoid:** Create a custom TipTap mark or node for wiki-links. On parse, `@tiptap/markdown` uses MarkedJS which can be extended with custom tokens. Alternatively, treat wiki-links as a passthrough text pattern that survives round-trip.
**Warning signs:** Existing files with `[[links]]` lose their link functionality.

## Code Examples

### WysiwygEditor Component Setup
```typescript
// Source: https://tiptap.dev/docs/editor/markdown/getting-started/basic-usage
import { useEditor, EditorContent } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Markdown from '@tiptap/markdown';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import Placeholder from '@tiptap/extension-placeholder';

interface WysiwygEditorProps {
  content: string; // markdown string
  onChange: (markdown: string) => void;
  onLinkClick: (path: string) => void;
}

export function WysiwygEditor({ content, onChange, onLinkClick }: WysiwygEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Markdown.configure({ markedOptions: { gfm: true } }),
      Link.configure({ openOnClick: false }),
      Image.configure({ inline: false, resize: true }),
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      Placeholder.configure({
        placeholder: 'Click anywhere to begin, or type / for commands',
      }),
      // SlashCommands extension (custom)
    ],
    content,
    contentType: 'markdown',
    onUpdate: ({ editor }) => {
      onChange(editor.getMarkdown());
    },
  });

  if (!editor) return null;

  return (
    <div className="h-full overflow-y-auto">
      <BubbleMenu editor={editor}>
        {/* Bold, Italic, Link, Code buttons */}
      </BubbleMenu>
      <EditorContent
        editor={editor}
        className="prose prose-orange max-w-none px-6 py-4"
      />
    </div>
  );
}
```

### BubbleMenu Toolbar Buttons
```typescript
// Source: https://tiptap.dev/docs/editor/extensions/functionality/bubble-menu
<BubbleMenu editor={editor} tippyOptions={{ duration: 100 }}>
  <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-white/80 backdrop-blur-md shadow-lg border border-white/20">
    <button
      onClick={() => editor.chain().focus().toggleBold().run()}
      className={editor.isActive('bold') ? 'text-orange-600' : 'text-gray-600'}
      title="Bold (Cmd+B)"
    >
      B
    </button>
    <button
      onClick={() => editor.chain().focus().toggleItalic().run()}
      className={editor.isActive('italic') ? 'text-orange-600' : 'text-gray-600'}
      title="Italic (Cmd+I)"
    >
      I
    </button>
    {/* Link and Code buttons similar */}
  </div>
</BubbleMenu>
```

### Server Image Upload Route
```typescript
// New route: POST /api/upload-image
// Accepts multipart form data, saves to rootDir/images/, returns path
fastify.post('/api/upload-image', async (req, reply) => {
  const data = await req.file(); // requires @fastify/multipart
  const imagesDir = path.join(fastify.rootDir, 'images');
  await fs.mkdir(imagesDir, { recursive: true });
  const filename = `${Date.now()}-${data.filename}`;
  const dest = path.join(imagesDir, filename);
  await fs.writeFile(dest, await data.toBuffer());
  return { path: `/images/${filename}` };
});
```

### Slash Command Items Definition
```typescript
const SLASH_ITEMS = [
  { title: 'Heading 1', description: 'Large heading', command: ({ editor, range }) => {
    editor.chain().focus().deleteRange(range).setNode('heading', { level: 1 }).run();
  }},
  { title: 'Heading 2', description: 'Medium heading', command: ({ editor, range }) => {
    editor.chain().focus().deleteRange(range).setNode('heading', { level: 2 }).run();
  }},
  { title: 'Heading 3', description: 'Small heading', command: ({ editor, range }) => {
    editor.chain().focus().deleteRange(range).setNode('heading', { level: 3 }).run();
  }},
  { title: 'Table', description: 'Insert a table', command: ({ editor, range }) => {
    editor.chain().focus().deleteRange(range).insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  }},
  { title: 'Image', description: 'Insert an image', command: ({ editor, range }) => {
    editor.chain().focus().deleteRange(range).run();
    // Open file picker
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async () => { /* upload and insert */ };
    input.click();
  }},
  { title: 'Code Block', description: 'Insert code', command: ({ editor, range }) => {
    editor.chain().focus().deleteRange(range).setCodeBlock().run();
  }},
];
```

## Un-representable Markdown Handling

Per UI-SPEC decisions:

| Construct | Handling | Implementation |
|-----------|----------|----------------|
| YAML frontmatter | Non-editable gray block at document top | Custom TipTap node (`FrontmatterBlock`) that stores raw YAML string, renders as `<div class="bg-gray-100 rounded font-mono text-xs p-3">`, does not parse into ProseMirror schema |
| Raw HTML blocks | Non-editable code block with "Raw HTML" label | Custom TipTap node (`HtmlBlock`) that preserves raw HTML string, renders as read-only pre block |
| Footnotes, definition lists | Passed through as raw text | These survive markdown round-trip as plain text since MarkedJS preserves unknown constructs |
| Wiki-links `[[page]]` | Custom mark or inline node | Must implement custom MarkedJS tokenizer extension + TipTap node to preserve `[[...]]` syntax through round-trip |

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `tiptap-markdown` (community) | `@tiptap/markdown` (official) | TipTap v3.7 (2025) | Official extension uses MarkedJS, actively maintained, community package deprecated |
| Manual BubbleMenu positioning | `<BubbleMenu>` React component with Floating UI | TipTap v2.4+ | No need for tippy.js or manual positioning code |
| Custom file drop handlers | `@tiptap/extension-image` with `resize: true` | TipTap v3.x | Built-in resize handles, though upload still requires custom handler |
| Split CodeMirror + react-markdown | Single TipTap WYSIWYG surface | This phase | Eliminates scroll sync complexity, preview rendering pipeline, split-pane layout |

**Deprecated/outdated:**
- `tiptap-markdown` (npm package by aguingand): Maintainer has stopped development; use `@tiptap/markdown` instead
- TipTap v2 API: v3 has breaking changes in extension configuration; ensure all imports are from `@tiptap/*` v3.20+

## Open Questions

1. **Wiki-link round-trip fidelity**
   - What we know: `@tiptap/markdown` uses MarkedJS which can be extended with custom tokenizers
   - What's unclear: Whether `[[wiki-link]]` syntax survives a parse->serialize cycle without a custom extension, or if it's stripped/mangled
   - Recommendation: Write a round-trip test early (Wave 0); if it fails, implement a custom MarkedJS tokenizer + TipTap node

2. **Image resize serialization to `<img>` HTML**
   - What we know: TipTap Image extension supports resize; UI-SPEC says resized images should serialize as `<img src="..." width="N">`
   - What's unclear: Whether `@tiptap/markdown` serializes resized images as HTML `<img>` tags or as markdown `![]()`
   - Recommendation: Test the serialization output after resize; may need custom serializer for the image node

3. **Code block language selector UI**
   - What we know: `/code` should insert a fenced code block with a language selector
   - What's unclear: Whether to use starter-kit's basic `CodeBlock` or `CodeBlockLowlight` for syntax highlighting
   - Recommendation: Start with basic `CodeBlock` from starter-kit; add a simple text input for language that writes to the `language` attribute. Syntax highlighting can be added later.

4. **`@fastify/multipart` for image upload**
   - What we know: Server needs to accept file uploads for drag-and-drop images
   - What's unclear: Whether `@fastify/multipart` is already installed or needs adding
   - Recommendation: Add `@fastify/multipart` to server dependencies; create `POST /api/upload-image` route

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.x (client) / Vitest 2.x (server) |
| Config file | `client/vite.config.ts` (test block) / `server/vitest.config.ts` |
| Quick run command | `cd client && npx vitest run --reporter=verbose` |
| Full suite command | `cd client && npx vitest run && cd ../server && npx vitest run` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| WYSIWYG-01 | Click-to-edit: editor is editable, cursor placed on click | unit | `cd client && npx vitest run src/__tests__/WysiwygEditor.test.tsx -x` | No — Wave 0 |
| WYSIWYG-02 | Slash commands: `/` triggers menu, commands execute | unit | `cd client && npx vitest run src/__tests__/SlashCommandMenu.test.tsx -x` | No — Wave 0 |
| WYSIWYG-02 | Slash command extension: trigger char, filtering, item execution | unit | `cd client && npx vitest run src/extensions/__tests__/slash-commands.test.ts -x` | No — Wave 0 |
| WYSIWYG-03 | Image upload route: POST /api/upload-image saves file, returns path | integration | `cd server && npx vitest run tests/routes/upload-image.test.ts -x` | No — Wave 0 |
| WYSIWYG-03 | Image drop handler: file dropped -> upload -> node inserted | unit | `cd client && npx vitest run src/__tests__/WysiwygEditor.test.tsx -t "image" -x` | No — Wave 0 |
| WYSIWYG-04 | Bubble toolbar: appears on text selection, buttons toggle marks | unit | `cd client && npx vitest run src/__tests__/BubbleToolbar.test.tsx -x` | No — Wave 0 |
| WYSIWYG-05 | Raw mode toggle: WYSIWYG -> raw preserves content, raw -> WYSIWYG parses back | unit | `cd client && npx vitest run src/__tests__/EditorPane.test.tsx -x` | No — Wave 0 |
| WYSIWYG-05 | Auto-save in both modes: content change triggers save in WYSIWYG and raw | integration | `cd client && npx vitest run src/hooks/__tests__/useAutoSave.test.ts -x` | Yes (existing) |
| ALL | Markdown round-trip fidelity: parse then serialize preserves content | unit | `cd client && npx vitest run src/__tests__/markdown-roundtrip.test.ts -x` | No — Wave 0 |

### Sampling Rate
- **Per task commit:** `cd client && npx vitest run --reporter=verbose`
- **Per wave merge:** `cd client && npx vitest run && cd ../server && npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `client/src/__tests__/WysiwygEditor.test.tsx` — covers WYSIWYG-01 (editable surface), WYSIWYG-03 (image insert)
- [ ] `client/src/__tests__/BubbleToolbar.test.tsx` — covers WYSIWYG-04
- [ ] `client/src/__tests__/SlashCommandMenu.test.tsx` — covers WYSIWYG-02
- [ ] `client/src/__tests__/EditorPane.test.tsx` — covers WYSIWYG-05 (raw mode toggle, auto-save both modes)
- [ ] `client/src/__tests__/markdown-roundtrip.test.ts` — covers round-trip fidelity for all markdown constructs
- [ ] `server/tests/routes/upload-image.test.ts` — covers WYSIWYG-03 (server-side image upload)
- [ ] `@fastify/multipart` — server dependency for file upload

## Sources

### Primary (HIGH confidence)
- [npm registry] — All TipTap packages verified at v3.20.4 (2026-03-18)
- [tiptap.dev/docs/editor/markdown/getting-started/basic-usage](https://tiptap.dev/docs/editor/markdown/getting-started/basic-usage) — Markdown API: `getMarkdown()`, `setContent()` with `contentType: 'markdown'`, GFM config
- [tiptap.dev/docs/editor/extensions/functionality/bubble-menu](https://tiptap.dev/docs/editor/extensions/functionality/bubble-menu) — BubbleMenu component, Floating UI positioning
- [tiptap.dev/docs/editor/extensions/nodes/image](https://tiptap.dev/docs/editor/extensions/nodes/image) — Image extension, resize configuration
- [tiptap.dev/docs/editor/extensions/functionality/filehandler](https://tiptap.dev/docs/editor/extensions/functionality/filehandler) — FileHandler for drop/paste events
- [tiptap.dev/docs/examples/experiments/slash-commands](https://tiptap.dev/docs/examples/experiments/slash-commands) — Official slash command example using @tiptap/suggestion

### Secondary (MEDIUM confidence)
- [tiptap.dev/blog/release-notes/introducing-bidirectional-markdown-support-in-tiptap](https://tiptap.dev/blog/release-notes/introducing-bidirectional-markdown-support-in-tiptap) — Official announcement of `@tiptap/markdown`, deprecation of community `tiptap-markdown`
- [npmjs.com/package/tiptap-markdown](https://www.npmjs.com/package/tiptap-markdown) — Confirmed deprecated status of community package

### Tertiary (LOW confidence)
- Wiki-link round-trip behavior — not verified with actual code; flagged as Open Question #1
- Image resize -> `<img>` HTML serialization behavior — not verified; flagged as Open Question #2

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages verified on npm, official docs consulted, versions confirmed
- Architecture: HIGH — patterns directly from TipTap official docs, existing codebase thoroughly analyzed
- Pitfalls: HIGH — based on official docs warnings and known ProseMirror schema constraints
- Round-trip fidelity for wiki-links: LOW — needs empirical testing
- Image resize serialization: LOW — needs empirical testing

**Research date:** 2026-03-18
**Valid until:** 2026-04-18 (TipTap is actively versioned; minor bumps unlikely to break patterns)
