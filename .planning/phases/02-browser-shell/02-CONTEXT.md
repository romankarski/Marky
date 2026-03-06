# Phase 2: Browser Shell - Context

**Gathered:** 2026-03-06
**Status:** Ready for planning

<domain>
## Phase Boundary

Tab system, rendered markdown preview, and full visual design — everything needed to read and navigate a knowledge base beautifully. No editing (Phase 3). No live reload (Phase 4).

Requirements: VIEW-01, VIEW-02, VIEW-03, VIEW-04, DSNG-01, DSNG-02, DSNG-03, DSNG-04

</domain>

<decisions>
## Implementation Decisions

### Markdown Rendering Library
- Use `react-markdown` (React-native, sanitized by default, remark/rehype plugin ecosystem for future extensibility)
- Syntax highlighting in fenced code blocks via Shiki (VS Code grammar quality)
- GFM task list checkboxes render as read-only visual checkboxes (not interactive — editing is Phase 3)
- Images render as `<img>` elements (local file paths need server proxy; remote URLs work immediately)
- YAML frontmatter is stripped before rendering — does not appear in the preview
- No math/LaTeX rendering in Phase 2

### Markdown Features
- Internal links open the target file in a new tab: relative links like `[text](./other.md)` and `[[wiki-links]]`
- Floating TOC sidebar generated from headings — auto-scrolls/highlights active section
- No document outline deferral — TOC is included in Phase 2

### Tab System
- Opening a file already in a tab switches focus to the existing tab (no duplicates)
- Tab overflow: horizontal scroll (mouse wheel + arrow buttons)
- Tabs are drag-to-reorder (use dnd-kit or similar)
- Empty state (no tabs open): welcome screen with centered message and Marky branding

### Design System
- **Background:** Warm white / cream (#FAFAF8 or similar) — airy, clean, lets orange accents pop
- **Sidebar:** Light treatment (near-white, soft warm gray) — no frosted glass, keeps tree readable
- **Main content panel:** Frosted glass card (CSS backdrop-filter, white/10 fill, subtle border) floats over the warm background
- **Orange accents:** Moderate usage — active tab underline, selected file in tree, primary buttons, hover effects, heading color in preview, icons
- **Typography in preview:** Tailwind Typography `prose` class (`@tailwindcss/typography` plugin) — article-quality typesetting out of the box
- **Aesthetic reference:** Big Hero 6 Hiro Hamada laboratory — bright, clean, futuristic yet warm

### Claude's Discretion
- Exact Shiki theme choice (should complement warm white background — a light theme like `github-light` or `min-light`)
- Frosted glass CSS values (blur amount, opacity, border opacity)
- TOC panel width and placement (right sidebar or floating overlay)
- dnd-kit vs other drag library for tab reordering
- Image serving strategy for local file:// paths (proxy endpoint or deferred)
- Exact cream hex value and sidebar gray
- Welcome screen copy and layout

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `useFileTree` hook: fetches recursive tree, exposes `tree`, `loading`, `error`, `refetch` — used as-is
- `useFileContent` hook: fetches file content by path, returns `content`, `loading` — extend to support multiple open files (tab state)
- `FileTree` component: fully functional tree with expand/collapse, selection, rename/delete, + New button — keep as-is, wire to new tab-open handler
- `FolderPickerModal`: modal for file creation — reusable in Phase 2

### Established Patterns
- Hook pattern: custom hook owns fetch + state; component receives via props — continue this pattern
- Tailwind v4 CSS-first config (`@import "tailwindcss"` in index.css) — confirmed working
- Orange palette already seeded: `bg-orange-50 text-orange-700` in FileTree selected state — extend consistently
- `react-resizable-panels` preferred for resizable panels (noted in STATE.md)

### Integration Points
- `App.tsx` currently holds `selectedPath` state — replace with `openTabs: Tab[]` + `activeTabId` state
- `FileContent` component currently renders raw `<pre>` — replace with `MarkdownPreview` component using react-markdown
- `FileTree.onSelect` currently sets selectedPath — wire to open-in-tab handler instead
- Phase 4 (Live Reload) will add WebSocket to Fastify and refresh open file content — tab state must expose a way to update content for a path

</code_context>

<specifics>
## Specific Ideas

- "Frosted glass panel" for the main content card — CSS `backdrop-filter: blur(...)` with semi-transparent white fill and subtle border
- Big Hero 6 laboratory aesthetic: the app should feel like a purpose-built reading tool, not a generic file browser
- Orange appears on headings in the preview, active tab underline, hover effects on tree items, and icons — moderate but present throughout

</specifics>

<deferred>
## Deferred Ideas

- None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-browser-shell*
*Context gathered: 2026-03-06*
