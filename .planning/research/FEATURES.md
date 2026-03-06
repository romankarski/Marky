# Feature Landscape

**Domain:** Web-based markdown knowledge base / local-first editor
**App:** Marky
**Researched:** 2026-03-06
**Confidence:** MEDIUM — based on training knowledge of Obsidian, Notion, Typora, Notable, Zettlr, iA Writer (cutoff August 2025); no live web verification available

---

## Reference Apps Surveyed

| App | Type | Core Strength | Relevant Lessons |
|-----|------|--------------|-----------------|
| Obsidian | Desktop, local-first | Graph + backlinks, plugin ecosystem | File-based, tag system, hotkeys, pane splitting |
| Notion | Cloud, collaborative | Database blocks, templates | Search UX, inline editing, table of contents |
| Typora | Desktop, single-file | Seamless WYSIWYG editing | No mode switching, live render in-place |
| Notable | Desktop, local | Tag-based file organization | Tag hierarchy, multi-note select, split preview |
| Zettlr | Desktop, local | Academic / Zettelkasten focus | Citekey support, footnotes, word count |
| iA Writer | Desktop | Distraction-free focus mode | Typography, focus sentence/paragraph highlighting |

---

## Table Stakes

Features users expect from any markdown knowledge base. Missing = product feels incomplete or unusable.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| File tree / folder browser | Users have folder-based knowledge bases; no tree = disoriented | Low | Tree collapse/expand, active file highlight |
| Markdown preview (rendered) | Raw markdown in browser is unusable; preview is the product's core promise | Low-Med | Needs full CommonMark + GFM (tables, checkboxes, fenced code) |
| Edit mode with live preview | Users need to edit, not just read; mode switch or simultaneous view | Med | Marky decision: split-panel (editor bottom, preview top) |
| Syntax highlighting in editor | Code blocks without highlighting are a regression vs VS Code | Med | Use CodeMirror or Monaco; highlight 20+ languages |
| Full-text search | Finding content is 50% of the value of a knowledge base | Med | Must be instant (<100ms perceived); highlight matches |
| File creation and deletion | Obvious CRUD; missing = not a real editor | Low | Confirm on delete, auto-name untitled |
| Auto-save | Users should never lose work; manual save = anxiety | Low | Debounced (500ms idle), show save indicator |
| Keyboard shortcuts | Power users refuse to use mouse for everything; no shortcuts = slow | Low-Med | New file, find, navigate, bold/italic/link minimum |
| Scrollbar / navigation within long files | Long documents are common in a knowledge base | Low | Smooth scroll, scroll sync between editor and preview |
| External link handling | Markdown files link to URLs; click should open in browser | Low | Open in new tab, not break app navigation |
| Relative internal link support | Files link to each other via `[text](../path/file.md)` | Med | Resolve relative paths, navigate on click |
| Basic frontmatter support | YAML frontmatter (`---`) is universal in knowledge bases (tags, title) | Low-Med | Parse and display; don't corrupt on save |
| File rename | Files are renamed regularly as notes mature | Low | Update displayed title, ideally update internal links |
| Readable typography | Preview must be pleasant to read; poor typography = users stay in VS Code | Low | Max-width prose, line-height, code font |
| Tab / multi-file open | Users work across multiple documents; single file = major friction | Med | Tab bar, click to switch, close tab |
| Responsive layout (desktop widths) | Single-user desktop app; must not break at 1280px-2560px | Low | Not mobile, but shouldn't break at large screens |

---

## Differentiators

Features that set products apart. Not universally expected, but create strong retention and "wow" moments.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Semantic search via AI | Find notes by meaning ("what did I write about deployment risks?") rather than exact keywords — genuinely novel for local apps | High | Marky's strongest differentiator; requires embeddings + Claude API; index must be built incrementally |
| External file watcher / auto-refresh | Seamlessly reflects writes from CLI agents (Claude, scripts) without manual reload | Med | Marky-specific need; `chokidar` or Node `fs.watch`; refresh without losing scroll/cursor |
| Split-screen two-document view | Compare or reference two notes simultaneously — rare in simple editors | Med | Obsidian has this; important for Marky's workflow |
| Tag-based cross-folder filtering | Browse notes by topic regardless of folder location | Med | Requires frontmatter tag parsing; tag sidebar with counts |
| Preview + editor simultaneously (no mode toggle) | Typora-style: always see rendered output alongside your cursor — removes cognitive friction of mode switching | Med-High | Marky's specific layout (editor bottom, preview top synced) |
| Scroll sync between editor and preview | Cursor in editor scrolls preview to matching position and vice versa | Med | Significant UX polish; hard to implement perfectly |
| Backlink / "what links here" panel | See all notes that link to the current note — Obsidian's killer feature for knowledge graphs | High | Very high value for power users; not needed for MVP |
| Command palette (Cmd+K / Cmd+P) | Fast fuzzy-search over all actions and files; replaces menus | Med | Obsidian, VS Code, Linear all do this; users expect it once they've had it |
| Recent files list | Fast return to last-opened documents; reduces friction of re-navigating tree | Low | Simple to build; high perceived quality |
| Folding / collapsible headings | Long documents become navigable by collapsing sections | Med | CodeMirror supports this natively |
| Word / reading time count | Writers want to know document length; knowledge workers track notes | Low | Trivial to add; polish signal |
| Focus / distraction-free mode | iA Writer style — hide sidebar, max-width content, no chrome | Low | Togglable; appeals to writing flow states |
| File outline / TOC panel | Navigate long documents by heading structure | Med | Parse headings from AST; click-to-scroll |
| Drag-and-drop file organization | Move files between folders in the tree | Med | Complex to implement reliably; VS Code does this |
| Dark / light theme toggle | Near-universal expectation in 2026; some users work nights | Low | CSS variables; system preference detection |
| Persistent layout memory | Remember which tabs were open, pane sizes, scroll positions — resume where you left off | Med | LocalStorage; important for daily-driver feel |

---

## Anti-Features

Features to explicitly NOT build — they add complexity without serving Marky's core use case.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Real-time collaboration / multiplayer | Single-user app; adds enormous complexity (CRDT, sync, presence) with no user benefit | Leave it out entirely; single-user is a feature |
| Cloud sync / remote hosting | Filesystem is source of truth; cloud adds auth, storage costs, GDPR complexity | Local-first; backend serves files from local disk only |
| Plugin / extension system | Obsidian has 1000+ plugins; building infrastructure for extensibility before the core is solid = wasted effort | Hard-code the right defaults; revisit in v2 |
| Mobile / responsive layout | Desktop browser workflow; mobile adds touch targets, layout breakpoints, different interaction model | Declare minimum viewport 1280px; don't optimize below |
| Block-based editing (Notion-style) | Notion's block model requires a custom renderer; incompatible with plain markdown files | Stay with plain `.md` files; no proprietary format |
| Database / table views | Notion-style relational tables require schema management; out of scope for a markdown file manager | Markdown tables in preview only |
| Version history / git integration | Valuable long-term, but adds significant backend complexity | Files live in a git repo; user handles versioning externally |
| Note templates | Useful but premature; templates imply a workflow system | User creates templates manually as regular files |
| Publish / export to web | Not a publishing tool; adds rendering pipeline complexity | Export as raw `.md` remains valid |
| PDF export | Requires headless Chrome or print CSS tuning; maintenance burden | Browser print-to-PDF is adequate |
| WYSIWYG-only mode (no markdown visible) | Hides markdown from power users; corrupts files if not implemented perfectly | Always show markdown source in editor panel |
| Per-file custom CSS / theming | Each file having its own style creates inconsistency and maintenance complexity | One global theme; standardize on it |

---

## Feature Dependencies

```
Frontmatter parsing → Tag system → Tag-based filtering
Full-text search index → Semantic search overlay (semantic refines full-text candidates)
File watcher → Auto-refresh → Tab state preservation (don't reset scroll on refresh)
Markdown AST parser → File outline/TOC panel
Markdown AST parser → Internal link resolution → Backlinks panel
Tab system → Split-screen two-document view
Editor (CodeMirror/Monaco) → Syntax highlighting → Code folding
Editor → Scroll sync → Simultaneous preview+editor layout
```

---

## MVP Recommendation

Marky's specific context (single user, AI agent collaboration, local filesystem, semantic search as differentiator) suggests this MVP priority:

**Must ship in v1 (table stakes):**
1. File tree browser — without this, no navigation
2. Markdown preview with GFM (tables, checkboxes, code blocks)
3. Simultaneous preview + editor split layout — core product promise
4. Syntax highlighting in editor
5. Auto-save
6. Full-text search — second most important feature after reading
7. Tab-based multi-file open
8. External file watcher + auto-refresh — required for Claude agent workflow
9. Internal link navigation (click `[text](file.md)` to open)
10. Frontmatter parsing (tags)

**Ship in v1 as differentiator:**
11. Semantic search via Claude API — Marky's unique value; justify the existence of this app over VS Code
12. Tag-based filtering — needed given the knowledge base structure

**Defer to v2:**
- Backlinks / graph view
- Command palette
- Drag-and-drop file organization
- File outline / TOC panel
- Scroll sync (nice to have; hard to do well)
- Focus mode
- Persistent layout memory
- Dark/light theme toggle

**Never build:**
- Collaboration, cloud sync, plugins, mobile, block editor

---

## Complexity Reference

| Level | Meaning |
|-------|---------|
| Low | 1-3 days; well-understood patterns, library support |
| Med | 3-10 days; some unknowns, integration work, UX iteration needed |
| High | 10+ days; novel problem, external dependencies, index/infra work |

---

## Sources

- Training knowledge of Obsidian (v1.x), Notion, Typora (v1.x), Notable, Zettlr, iA Writer as of August 2025
- Marky PROJECT.md (read directly): project requirements, constraints, out-of-scope items
- Confidence: MEDIUM — reflects real app behaviors but not verified against live docs; no WebSearch available during this session
- Flag: Verify Obsidian's current split-pane API and CodeMirror 6 scroll-sync capabilities before implementation
