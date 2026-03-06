# Phase 2: Browser Shell - Research

**Researched:** 2026-03-06
**Domain:** React markdown rendering, tab management, drag-and-drop, design system (Tailwind v4)
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Markdown Rendering Library**
- Use `react-markdown` (React-native, sanitized by default, remark/rehype plugin ecosystem for future extensibility)
- Syntax highlighting in fenced code blocks via Shiki (VS Code grammar quality)
- GFM task list checkboxes render as read-only visual checkboxes (not interactive — editing is Phase 3)
- Images render as `<img>` elements (local file paths need server proxy; remote URLs work immediately)
- YAML frontmatter is stripped before rendering — does not appear in the preview
- No math/LaTeX rendering in Phase 2

**Markdown Features**
- Internal links open the target file in a new tab: relative links like `[text](./other.md)` and `[[wiki-links]]`
- Floating TOC sidebar generated from headings — auto-scrolls/highlights active section
- No document outline deferral — TOC is included in Phase 2

**Tab System**
- Opening a file already in a tab switches focus to the existing tab (no duplicates)
- Tab overflow: horizontal scroll (mouse wheel + arrow buttons)
- Tabs are drag-to-reorder (use dnd-kit or similar)
- Empty state (no tabs open): welcome screen with centered message and Marky branding

**Design System**
- Background: Warm white / cream (#FAFAF8 or similar) — airy, clean, lets orange accents pop
- Sidebar: Light treatment (near-white, soft warm gray) — no frosted glass, keeps tree readable
- Main content panel: Frosted glass card (CSS backdrop-filter, white/10 fill, subtle border) floats over the warm background
- Orange accents: Moderate usage — active tab underline, selected file in tree, primary buttons, hover effects, heading color in preview, icons
- Typography in preview: Tailwind Typography `prose` class (`@tailwindcss/typography` plugin) — article-quality typesetting out of the box
- Aesthetic reference: Big Hero 6 Hiro Hamada laboratory — bright, clean, futuristic yet warm

### Claude's Discretion
- Exact Shiki theme choice (should complement warm white background — a light theme like `github-light` or `min-light`)
- Frosted glass CSS values (blur amount, opacity, border opacity)
- TOC panel width and placement (right sidebar or floating overlay)
- dnd-kit vs other drag library for tab reordering
- Image serving strategy for local file:// paths (proxy endpoint or deferred)
- Exact cream hex value and sidebar gray
- Welcome screen copy and layout

### Deferred Ideas (OUT OF SCOPE)
- None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| VIEW-01 | Markdown files open in rendered preview mode by default | react-markdown + remark-gfm + react-shiki integration pattern documented |
| VIEW-02 | User can have multiple files open simultaneously in tabs | useReducer tab state pattern; Tab type shape defined |
| VIEW-03 | User can switch between open files by clicking tabs | Tab onClick handler; active tab styling with orange underline |
| VIEW-04 | User can close tabs individually | Tab close button; keyboard accessibility; dedup guard |
| DSNG-01 | UI uses a glass-inspired design — frosted panels, soft blur, transparency layers | `backdrop-filter: blur()` with Tailwind `backdrop-blur-md bg-white/60` documented |
| DSNG-02 | Color palette is orange and white — warm orange accents on a clean white/light background | Tailwind orange-500/600/700 palette; cream bg `#FAFAF8` |
| DSNG-03 | Aesthetic is inspired by the Hiro Hamada laboratory — bright, clean, futuristic yet warm | Design token pattern: cream bg, orange accent, frosted content card |
| DSNG-04 | Typography and spacing feel airy and uncluttered — generous whitespace, no visual noise | `@tailwindcss/typography` `prose prose-orange` provides article-quality typesetting |
</phase_requirements>

---

## Summary

Phase 2 assembles the full reading experience on top of the Phase 1 API: a tab system that manages multiple open files, a markdown renderer that produces article-quality output, and a design system with frosted glass panels and orange accents. All three areas have well-maintained, purpose-built libraries — nothing needs to be hand-rolled.

The state model is the most architecturally significant change: `App.tsx` currently holds a single `selectedPath: string | null`. This must become `openTabs: Tab[]` + `activeTabId: string | null`, managed with `useReducer` to keep all tab mutations (open, close, focus, reorder) in a single reducer. The `useFileContent` hook must become multi-file aware — likely a `Map<path, content>` cache — so previously-opened tab content is not re-fetched on every tab switch.

The markdown pipeline is: `react-markdown` (v10) + `remark-gfm` (v4) + `remark-frontmatter` (v5) + `react-shiki` (v0.9) for code highlighting, all wired through the `components` prop to intercept `<a>` tags for internal-link routing and `<code>` blocks for Shiki. The TOC is a separate component that parses headings from the raw markdown string and uses IntersectionObserver to track the active section.

**Primary recommendation:** Migrate App.tsx to tab-based state with useReducer, replace FileContent with a MarkdownPreview component using the react-markdown pipeline, add dnd-kit/sortable for tab reordering, and apply the Tailwind-based design tokens consistently. All decisions are locked; Claude's discretion items are aesthetics only.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-markdown | 10.1.0 | Render markdown string to React elements | ESM, sanitized by default, plugin ecosystem, no dangerouslySetInnerHTML |
| remark-gfm | 4.0.1 | GitHub Flavored Markdown: tables, strikethrough, task lists, autolinks | De-facto standard GFM layer for remark |
| remark-frontmatter | 5.0.0 | Parse/strip YAML frontmatter so it doesn't appear in preview | Official remarkjs plugin |
| react-shiki | 0.9.2 | Shiki-powered syntax highlighting as React component/hook | Client-side Shiki for React without dangerouslySetInnerHTML |
| @dnd-kit/core | 6.3.1 | Drag-and-drop core context | Lightweight (10kB), accessible, no layout thrash |
| @dnd-kit/sortable | 10.0.0 | Sortable preset for tab reordering | arrayMove() + useSortable = minimal boilerplate |
| react-resizable-panels | 4.7.1 | Resizable sidebar / content panel split | Preferred in STATE.md; bvaughn (React core); autoSave layout |
| @tailwindcss/typography | 0.5.19 | `prose` class for article-quality markdown typography | v4-compatible via `@plugin` CSS directive |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| remark-wiki-link | 2.0.1 | Parse `[[WikiLink]]` syntax into standard links | When wiki-link support needed alongside relative links |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| react-shiki | rehype-highlight + highlight.js | rehype-highlight is simpler but lower-quality themes; Shiki uses TextMate grammars (VS Code quality) — locked decision |
| @dnd-kit | react-beautiful-dnd | react-beautiful-dnd is unmaintained; dnd-kit is the current standard |
| remark-wiki-link | Custom regex pre-processor | Hand-rolling wiki link parsing is brittle; plugin handles edge cases |

**Installation:**
```bash
npm install react-markdown remark-gfm remark-frontmatter react-shiki @dnd-kit/core @dnd-kit/sortable react-resizable-panels @tailwindcss/typography --workspace=@marky/client
```

---

## Architecture Patterns

### Recommended Project Structure
```
client/src/
├── components/
│   ├── FileTree.tsx         # Existing — wire onSelect to openTab()
│   ├── FileContent.tsx      # Remove — replaced by MarkdownPreview
│   ├── MarkdownPreview.tsx  # New — react-markdown pipeline
│   ├── TabBar.tsx           # New — tab strip with dnd-kit sortable
│   ├── TableOfContents.tsx  # New — TOC with IntersectionObserver scroll spy
│   ├── WelcomeScreen.tsx    # New — empty state when no tabs open
│   └── FolderPickerModal.tsx  # Existing — keep as-is
├── hooks/
│   ├── useFileTree.ts       # Existing — keep as-is
│   ├── useFileContent.ts    # Existing — extend or replace with useTabContent
│   └── useTabs.ts           # New — useReducer tab state + content cache
├── index.css                # Add @plugin "@tailwindcss/typography"
└── App.tsx                  # Refactor to use useTabs(); remove selectedPath
```

### Pattern 1: Tab State with useReducer

**What:** All tab mutations (open, close, focus, reorder) go through a single reducer. Content is cached in a `Map<path, string>` so switching tabs is instant.

**When to use:** Whenever state has multiple related sub-values and several named actions — useReducer prevents the "many useState calls" antipattern.

**Type shape:**
```typescript
// Source: derived from CONTEXT.md decisions
interface Tab {
  id: string;       // unique ID (e.g. nanoid)
  path: string;     // file path used for API fetch and dedup check
  label: string;    // filename extracted from path
  content: string | null;  // raw markdown string (null while loading)
  loading: boolean;
}

interface TabState {
  tabs: Tab[];
  activeTabId: string | null;
}

type TabAction =
  | { type: 'OPEN';    path: string; label: string }
  | { type: 'CLOSE';   id: string }
  | { type: 'FOCUS';   id: string }
  | { type: 'REORDER'; from: number; to: number }
  | { type: 'SET_CONTENT'; path: string; content: string };
```

**Dedup logic in reducer:**
```typescript
case 'OPEN': {
  const existing = state.tabs.find(t => t.path === action.path);
  if (existing) return { ...state, activeTabId: existing.id };
  const newTab: Tab = { id: nanoid(), path: action.path, label: action.label, content: null, loading: true };
  return { tabs: [...state.tabs, newTab], activeTabId: newTab.id };
}
```

### Pattern 2: MarkdownPreview Component

**What:** Wraps `react-markdown` with all plugins wired, a custom `a` component for internal-link routing, and a custom `code` component for Shiki highlighting.

**When to use:** Any time raw markdown string needs to be rendered for reading.

```typescript
// Source: react-markdown official docs + react-shiki docs
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkFrontmatter from 'remark-frontmatter';
import { ShikiHighlighter } from 'react-shiki';

interface Props {
  content: string;
  onLinkClick: (path: string) => void;
}

export function MarkdownPreview({ content, onLinkClick }: Props) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkFrontmatter]}
      components={{
        a: ({ href, children }) => {
          // intercept .md relative and [[wikilink]] hrefs
          if (href && (href.endsWith('.md') || href.startsWith('./'))) {
            return <a href="#" onClick={(e) => { e.preventDefault(); onLinkClick(href); }}>{children}</a>;
          }
          return <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>;
        },
        code: ({ className, children }) => {
          const lang = /language-(\w+)/.exec(className || '')?.[1];
          if (lang) {
            return <ShikiHighlighter language={lang} theme="github-light">{String(children)}</ShikiHighlighter>;
          }
          return <code className={className}>{children}</code>;
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
```

### Pattern 3: TabBar with dnd-kit Sortable

**What:** Horizontal tab strip using `SortableContext` with `horizontalListSortingStrategy`. Each tab is a `useSortable` item.

```typescript
// Source: dnd-kit official docs
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';

function TabBar({ tabs, activeTabId, dispatch }) {
  function handleDragEnd(event) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const from = tabs.findIndex(t => t.id === active.id);
      const to   = tabs.findIndex(t => t.id === over.id);
      dispatch({ type: 'REORDER', from, to });
    }
  }

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={tabs.map(t => t.id)} strategy={horizontalListSortingStrategy}>
        {tabs.map(tab => <SortableTab key={tab.id} tab={tab} isActive={tab.id === activeTabId} dispatch={dispatch} />)}
      </SortableContext>
    </DndContext>
  );
}
```

### Pattern 4: Frosted Glass Content Card

**What:** CSS `backdrop-filter: blur()` with a semi-transparent white fill produces the frosted glass effect on the main content panel. Requires a non-white background behind it for the blur to be visible.

```css
/* Applied to the main content card wrapper */
.content-card {
  /* Tailwind utilities: */
  /* backdrop-blur-md bg-white/60 border border-white/20 rounded-xl shadow-sm */
}
```

The warm cream background (`#FAFAF8`) behind the card makes the blur visible. The sidebar has no frosted glass — plain `bg-gray-50/80` keeps the file tree readable.

### Pattern 5: TOC with IntersectionObserver

**What:** Parse headings from the raw markdown string (regex or remark AST) to build anchor IDs; render as a sticky list; use IntersectionObserver with `rootMargin: "-20% 0px -70% 0px"` to highlight the active section as the user scrolls.

**When to use:** Any long-form document view with multiple headings.

```typescript
// Source: https://tj.ie/building-a-table-of-contents-with-the-intersection-observer-api/
useEffect(() => {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) setActiveId(entry.target.id);
      });
    },
    { rootMargin: '-20% 0px -70% 0px' }
  );
  document.querySelectorAll('h1, h2, h3, h4').forEach(el => observer.observe(el));
  return () => observer.disconnect();
}, [content]);
```

### Pattern 6: Tailwind Typography for Markdown

**What:** Add `@plugin "@tailwindcss/typography"` to `index.css`. Apply `prose prose-orange max-w-none` to the markdown wrapper. The `prose-orange` variant colors headings and links in the orange palette.

```css
/* index.css */
@import "tailwindcss";
@plugin "@tailwindcss/typography";
```

```tsx
<div className="prose prose-orange max-w-none">
  <MarkdownPreview content={content} onLinkClick={handleInternalLink} />
</div>
```

### Anti-Patterns to Avoid

- **Single selectedPath state:** Do not keep `string | null` as state. Replace with `Tab[]` + `activeTabId` from day one — migrating mid-phase is disruptive.
- **Re-fetching on every tab switch:** Fetch file content once on open, store in Tab object. Do not call the API again when switching between already-open tabs.
- **dangerouslySetInnerHTML for markdown:** react-markdown outputs React elements natively. Never use `dangerouslySetInnerHTML` with markdown output.
- **Applying prose class to the entire page:** `prose` should wrap only the rendered markdown content area, not the sidebar or tab bar — it resets too many styles.
- **backdrop-filter without semi-transparent background:** The blur effect is invisible unless the element has a semi-transparent fill (e.g. `bg-white/60`). A fully opaque or fully transparent background defeats the effect.
- **Shiki bundle size trap:** `react-shiki` full bundle is ~1.2 MB gzipped. Use the web bundle (~695 KB) or import only needed languages when bundle size matters. For a local desktop app this is acceptable.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Markdown rendering | Custom HTML string builder | react-markdown | XSS surface, sanitization complexity, plugin ecosystem |
| Syntax highlighting | CSS class injection | react-shiki + Shiki | TextMate grammar quality; theme consistency; 300+ languages |
| Drag-to-reorder tabs | mousedown + mousemove listeners | @dnd-kit/sortable | Accessibility (keyboard, screen reader); pointer/touch unification; animation |
| Resizable sidebar | CSS resize + JS pointer events | react-resizable-panels | autoSave, collapsed states, keyboard, RTL — all handled |
| YAML frontmatter strip | Regex `^---[\s\S]+?---\n` | remark-frontmatter | Edge cases: no trailing newline, TOML frontmatter, nested content |
| Wiki link parsing | Regex `\[\[(.+?)\]\]` replace | remark-wiki-link | Handles piped text `[[Page|Label]]`, nested brackets, escaping |
| Article typography | Custom CSS resets | @tailwindcss/typography prose | 40+ elements styled; dark mode variants; responsive sizing included |

**Key insight:** Every item in this list looks simple but has a long tail of edge cases. The libraries exist because the problems are non-trivial at the edges.

---

## Common Pitfalls

### Pitfall 1: Tab dedup on path rather than ID
**What goes wrong:** Two tabs open for the same file if dedup checks tab ID instead of tab path.
**Why it happens:** ID is generated at open time; comparing IDs always produces a new tab.
**How to avoid:** In the `OPEN` reducer case, find by `tab.path === action.path` before generating a new ID.
**Warning signs:** Duplicate file names visible in the tab bar.

### Pitfall 2: Stale content after external rename/delete
**What goes wrong:** A tab still shows old content or title after the file is renamed in the tree.
**Why it happens:** Tab content is cached at open time and never invalidated.
**How to avoid:** Phase 2 does not need to handle this — Phase 4 adds live reload. Document the tab state shape to support `SET_CONTENT` for Phase 4 integration.

### Pitfall 3: remark-frontmatter removes YAML node but doesn't hide it by default
**What goes wrong:** YAML frontmatter appears as raw text `---\ntitle: foo\n---` in the rendered output.
**Why it happens:** `remark-frontmatter` parses frontmatter as a node type, but react-markdown still renders unknown nodes as text unless the `yaml` node type is ignored.
**How to avoid:** Add `remarkFrontmatter` to `remarkPlugins` AND configure a custom component or use `skip` to suppress the `yaml` node type in the output.

### Pitfall 4: @tailwindcss/typography v4 requires @plugin directive, not config file
**What goes wrong:** `prose` class produces no styles; developer spends time debugging.
**Why it happens:** Tailwind v4 dropped the `plugins:` key from tailwind.config.js in favor of `@plugin` in CSS.
**How to avoid:** Add `@plugin "@tailwindcss/typography"` to `index.css` (after `@import "tailwindcss"`). No config file change needed.

### Pitfall 5: backdrop-filter performance on large scrollable content
**What goes wrong:** Scroll jank on lower-end machines when the frosted glass panel contains long markdown documents.
**Why it happens:** Every scroll repaints the backdrop blur compositing layer.
**How to avoid:** Apply `will-change: transform` or `transform: translateZ(0)` to promote the blurred element to its own compositing layer. Limit blur radius (blur-md = 12px is sufficient; blur-xl is overkill).

### Pitfall 6: dnd-kit SortableContext requires stable item IDs
**What goes wrong:** Tabs randomly jump position during drag.
**Why it happens:** If `items` array passed to `SortableContext` uses path strings that contain slashes or special chars, the `id` comparison may fail.
**How to avoid:** Use short opaque IDs (nanoid/crypto.randomUUID) for tab IDs, not file paths. File paths live on the `Tab.path` property separately.

### Pitfall 7: IntersectionObserver TOC fires on wrong element after content change
**What goes wrong:** TOC highlights wrong heading when a new file is opened in the active tab.
**Why it happens:** Observer is set up in a `useEffect` that doesn't re-run when `content` changes if headings are re-rendered with the same IDs.
**How to avoid:** Include `content` in the `useEffect` dependency array; disconnect and reconnect the observer on every content change.

---

## Code Examples

### Tab Reducer (complete)
```typescript
// Source: derived from useReducer pattern — React docs
import { arrayMove } from '@dnd-kit/sortable';

function tabReducer(state: TabState, action: TabAction): TabState {
  switch (action.type) {
    case 'OPEN': {
      const existing = state.tabs.find(t => t.path === action.path);
      if (existing) return { ...state, activeTabId: existing.id };
      const id = crypto.randomUUID();
      return {
        tabs: [...state.tabs, { id, path: action.path, label: action.label, content: null, loading: true }],
        activeTabId: id,
      };
    }
    case 'CLOSE': {
      const idx = state.tabs.findIndex(t => t.id === action.id);
      const next = state.tabs.filter(t => t.id !== action.id);
      const nextActive = state.activeTabId === action.id
        ? (next[idx] ?? next[idx - 1] ?? null)?.id ?? null
        : state.activeTabId;
      return { tabs: next, activeTabId: nextActive };
    }
    case 'FOCUS':
      return { ...state, activeTabId: action.id };
    case 'REORDER':
      return { ...state, tabs: arrayMove(state.tabs, action.from, action.to) };
    case 'SET_CONTENT':
      return {
        ...state,
        tabs: state.tabs.map(t =>
          t.path === action.path ? { ...t, content: action.content, loading: false } : t
        ),
      };
    default:
      return state;
  }
}
```

### index.css additions
```css
@import "tailwindcss";
@plugin "@tailwindcss/typography";
```

### Frosted glass panel (Tailwind utility classes)
```tsx
// Main content card
<div className="
  backdrop-blur-md
  bg-white/60
  border border-white/20
  rounded-xl
  shadow-sm
  overflow-hidden
">
  {/* markdown preview lives here */}
</div>
```

### react-resizable-panels layout
```tsx
// Source: react-resizable-panels official docs
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';

<PanelGroup autoSaveId="marky-layout" direction="horizontal">
  <Panel defaultSize={22} minSize={15} maxSize={40}>
    <Sidebar />
  </Panel>
  <PanelResizeHandle className="w-1 bg-gray-200 hover:bg-orange-300 transition-colors" />
  <Panel>
    <MainContent />
  </Panel>
  <PanelResizeHandle className="w-1 bg-gray-200 hover:bg-orange-300 transition-colors" />
  <Panel defaultSize={22} minSize={15} maxSize={35} collapsible>
    <TableOfContents />
  </Panel>
</PanelGroup>
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| highlight.js via rehype-highlight | Shiki via react-shiki | 2023-2024 | VS Code grammar quality; no separate CSS theme file needed |
| tailwind.config.js plugins array | `@plugin` CSS directive | Tailwind v4 (2024-2025) | No JS config file for plugin registration |
| react-beautiful-dnd | @dnd-kit | 2022-2023 | rbd is unmaintained; dnd-kit has better accessibility and touch support |

**Deprecated/outdated:**
- `rehype-prism`: Superseded by Shiki-based solutions for quality; still works but lower-fidelity themes
- `tailwind.config.js plugins:` key: Still works in v4 but CSS `@plugin` is the new standard
- `react-beautiful-dnd`: Officially unmaintained since 2022; do not use for new work

---

## Open Questions

1. **remark-wiki-link `hrefTemplate` configuration**
   - What we know: `remark-wiki-link` v2 maps `[[PageName]]` to a permalink via `pageResolver` and `hrefTemplate` options
   - What's unclear: The resolver needs access to the full file tree to know which paths are valid; this requires passing the tree at render time or pre-computing a path map
   - Recommendation: Pass `allPaths` from `useFileTree` into `MarkdownPreview`; configure `remark-wiki-link` with a `pageResolver` that maps page name to a relative `.md` path

2. **TOC placement: right panel vs floating overlay**
   - What we know: Claude's discretion; right panel is simpler (react-resizable-panels third column, collapsible)
   - What's unclear: Whether a collapsible right panel feels too busy for a "clean" reading experience
   - Recommendation: Default to a collapsible right panel (22% width, collapses to hidden); simpler than an overlay, consistent with established tools (Obsidian, Notion)

3. **Image proxy for local file:// paths**
   - What we know: Remote `https://` images work immediately; `file://` paths in markdown are blocked by the browser when served from localhost
   - What's unclear: Whether the server should add a `/api/images/:path` proxy endpoint in Phase 2 or defer
   - Recommendation: Defer to Phase 4 unless test documents contain local images; add a placeholder `[image]` fallback in the `img` component renderer for now

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (server) — no client test framework configured |
| Config file | `server/vitest.config.ts` |
| Quick run command | `npm run test --workspace=server` |
| Full suite command | `npm run test --workspace=server` |

### Phase Requirements → Test Map

Phase 2 requirements are all client-side UI behaviors. Vitest runs in Node environment in the server workspace; the client has no test framework. These requirements are best validated by visual/manual verification during `/gsd:verify-work`. Server-side requirements are not in scope for Phase 2.

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| VIEW-01 | Markdown renders as HTML, not raw text | manual | — | N/A |
| VIEW-02 | Multiple tabs open without overwriting each other | manual | — | N/A |
| VIEW-03 | Clicking a tab switches active content | manual | — | N/A |
| VIEW-04 | Closing a tab removes it; adjacent tab becomes active | manual | — | N/A |
| DSNG-01 | Frosted glass effect visible on content card | manual/visual | — | N/A |
| DSNG-02 | Orange accents appear on active tab, headings, tree selection | manual/visual | — | N/A |
| DSNG-03 | Overall aesthetic matches Big Hero 6 lab vibe | manual/visual | — | N/A |
| DSNG-04 | Typography is airy; no visual clutter | manual/visual | — | N/A |

### Sampling Rate
- **Per task commit:** `npm run test --workspace=server` (verifies no server regressions)
- **Per wave merge:** Same
- **Phase gate:** Full server suite green + manual visual review of all 8 requirements before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] Client has no test framework — `vitest` + `@testing-library/react` + `jsdom` would enable component unit tests, but this is not blocking for Phase 2 given all requirements are visual. Add in a future phase if unit tests for tab reducer logic are desired.

*(No server test gaps — existing infrastructure covers all server-side work from Phase 1.)*

---

## Sources

### Primary (HIGH confidence)
- npm registry — version numbers for all packages verified via `npm info`
- [react-markdown GitHub](https://github.com/remarkjs/react-markdown) — usage, plugin props
- [remark-gfm GitHub](https://github.com/remarkjs/remark-gfm) — GFM feature list
- [remark-frontmatter GitHub](https://github.com/remarkjs/remark-frontmatter) — frontmatter stripping
- [dnd-kit docs](https://docs.dndkit.com/) — SortableContext, useSortable, arrayMove
- [react-resizable-panels GitHub](https://github.com/bvaughn/react-resizable-panels) — PanelGroup API
- STATE.md — confirmed react-resizable-panels preference, Tailwind v4 CSS-first config

### Secondary (MEDIUM confidence)
- [react-shiki GitHub](https://github.com/avgvstvs96/react-shiki) — ShikiHighlighter component integration with react-markdown
- [tailwindcss/typography GitHub](https://github.com/tailwindlabs/tailwindcss-typography) — v4 @plugin directive confirmed
- [IntersectionObserver TOC guide](https://tj.ie/building-a-table-of-contents-with-the-intersection-observer-api/) — rootMargin scroll spy pattern

### Tertiary (LOW confidence)
- remark-wiki-link v2 `hrefTemplate` configuration details — needs hands-on verification during implementation

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all versions verified via npm registry; libraries are established ecosystem choices
- Architecture: HIGH — tab reducer pattern is idiomatic React; react-markdown component API is stable
- Pitfalls: HIGH — all pitfalls are based on known library behaviors verified against docs
- Design system: HIGH — Tailwind backdrop-blur utilities are well-documented; `@plugin` directive confirmed for v4

**Research date:** 2026-03-06
**Valid until:** 2026-04-06 (stable libraries; Tailwind v4 and react-markdown are not fast-moving)
