# Roadmap: Marky

## Overview

Marky is built in five dependency-driven phases. The server and filesystem layer must exist before the browser can render anything. The browser shell (navigation, preview, design) must exist before the editor integrates into it. The editor's dirty-state tracking must exist before the file watcher can detect conflicts safely. The file watcher's incremental index updates must be in place before search can stay fresh. Each phase delivers a coherent, verifiable capability and gates the next.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Server Foundation** - Node.js backend + project scaffold: file CRUD API, directory walker, React shell served from same origin (completed 2026-03-06)
- [x] **Phase 2: Browser Shell** - File tree, tab system, markdown preview, and full design system — users can read and navigate their knowledge base (completed 2026-03-09)
- [x] **Phase 3: Editor** - CodeMirror editor below preview, auto-save, dirty-state tracking, and split-screen editing (completed 2026-03-09)
- [x] **Phase 4: Live Reload** - File watcher detects external writes from Claude CLI and auto-refreshes open files (completed 2026-03-09)
- [ ] **Phase 5: Search and Tags** - Full-text search across all files and tag-based filtering from frontmatter *(all 5 plans complete; 3 UX/bug gaps require closure plan)*

## Phase Details

### Phase 1: Server Foundation
**Goal**: A working Node.js + React project that can read, write, and list files — the foundation every subsequent phase builds on
**Depends on**: Nothing (first phase)
**Requirements**: FILE-01, FILE-02, FILE-03, FILE-04, FILE-05
**Success Criteria** (what must be TRUE):
  1. User can open the app in a browser and see their root folder's files and subfolders in the sidebar
  2. User can click a file in the tree and its raw content is returned from the server
  3. User can create a new markdown file from the UI and it appears on disk
  4. User can rename a file from the UI and the change persists on disk
  5. User can delete a file from the UI (with confirmation) and it is removed from disk
**Plans**: 3 plans

Plans:
- [x] 01-01-PLAN.md — Monorepo scaffold, shared types, Vitest test stubs
- [x] 01-02-PLAN.md — Fastify server with all five file CRUD endpoints
- [x] 01-03-PLAN.md — React client shell with file tree and content view

### Phase 2: Browser Shell
**Goal**: Users can navigate their knowledge base, read documents beautifully, and experience the full visual design — Marky looks and feels like the purpose-built tool it is
**Depends on**: Phase 1
**Requirements**: VIEW-01, VIEW-02, VIEW-03, VIEW-04, DSNG-01, DSNG-02, DSNG-03, DSNG-04
**Success Criteria** (what must be TRUE):
  1. Markdown files open in rendered preview mode by default — tables, checkboxes, fenced code blocks, and headings all render correctly
  2. User can have multiple files open as tabs and switch between them by clicking, with each tab showing the file name
  3. User can close individual tabs without closing others
  4. The UI shows frosted glass panels, warm orange accents on a light background, and generous whitespace — consistent with the Big Hero 6 laboratory aesthetic
**Plans**: 5 plans

Plans:
- [ ] 02-01-PLAN.md — Install Phase 2 libraries, define Tab types and useTabs reducer hook
- [ ] 02-02-PLAN.md — MarkdownPreview component (react-markdown pipeline) and TableOfContents
- [ ] 02-03-PLAN.md — TabBar component (dnd-kit sortable) and WelcomeScreen empty state
- [ ] 02-04-PLAN.md — App.tsx refactor: wire all components into three-column layout with design system
- [ ] 02-05-PLAN.md — Visual verification checkpoint (human approves all 8 requirements)

### Phase 3: Editor
**Goal**: Users can edit any open file in a split view with the preview always visible, changes save automatically, and two files can be edited at once in split-screen mode
**Depends on**: Phase 2
**Requirements**: VIEW-05, EDIT-01, EDIT-02, EDIT-03, EDIT-04, EDIT-05
**Success Criteria** (what must be TRUE):
  1. Clicking Edit opens a CodeMirror editor panel below the preview — both are visible simultaneously and neither collapses the other
  2. The preview updates live as the user types in the editor, with syntax highlighting in the editor pane
  3. Changes are auto-saved after a brief pause — the user never has to press save
  4. A tab shows a visible dirty-state indicator when there are unsaved changes
  5. User can split the view to edit two separate files at the same time, each pane fully independent
**Plans**: 5 plans

Plans:
- [ ] 03-01-PLAN.md — Wave 0 test scaffolds (tabReducer-editor + useAutoSave failing tests)
- [ ] 03-02-PLAN.md — Extend Tab type + tabReducer actions + install CodeMirror libraries
- [ ] 03-03-PLAN.md — MarkdownEditor component + useAutoSave hook
- [ ] 03-04-PLAN.md — EditorPane (vertical split) + TabBar dirty indicator
- [ ] 03-05-PLAN.md — SplitView + App.tsx wiring + visual verification checkpoint

### Phase 4: Live Reload
**Goal**: When Claude CLI agents write to files on disk, open previews refresh automatically — users always see the current state of any file without manual reload
**Depends on**: Phase 3
**Requirements**: LIVE-01, LIVE-02
**Success Criteria** (what must be TRUE):
  1. When an external process writes to a file that is open in the app, the preview refreshes immediately without any user action
  2. The file watcher monitors the entire root folder — files created or modified anywhere in the tree are detected, not just files already open in tabs
**Plans**: 3 plans

Plans:
- [x] 04-01-PLAN.md — Wave 0 failing test stubs (watch.test.ts + useFileWatcher.test.ts)
- [x] 04-02-PLAN.md — Server: FileWatcherService (chokidar v5), SSE route, write-lock in PUT
- [x] 04-03-PLAN.md — Client: useFileWatcher hook, App.tsx wiring, visual verification checkpoint

### Phase 5: Search and Tags
**Goal**: Users can find any content instantly by keyword and filter their knowledge base by topic tags — nothing gets lost in the file tree
**Depends on**: Phase 4
**Requirements**: SRCH-01, SRCH-02, SRCH-03, TAG-01, TAG-02, TAG-03
**Success Criteria** (what must be TRUE):
  1. User can search for any word or phrase and see matching results appear instantly, showing file name, path, and a context snippet
  2. User can click a search result and the file opens at the matching location
  3. App automatically reads YAML frontmatter tags from every markdown file — no manual tagging required
  4. User can filter the file tree by tag to see only files with that tag, across all folders
  5. User can add or edit tags on a file from the UI and the change is written back to the file's frontmatter
**Plans**: 5 plans

Plans:
- [ ] 05-01-PLAN.md — Wave 0 server test stubs (SearchService unit + route integration stubs, RED state)
- [ ] 05-02-PLAN.md — Wave 0 client test stubs (useSearch, useTags, SearchPanel test stubs, RED state)
- [ ] 05-03-PLAN.md — Server SearchService, search routes, app.ts wiring (turns server stubs GREEN)
- [ ] 05-04-PLAN.md — Client useSearch and useTags hooks (turns client hook stubs GREEN)
- [x] 05-05-PLAN.md — SearchPanel, TagFilter, FileTree update, App.tsx wiring + visual checkpoint *(gaps found: tree auto-reveal, tag editor placement, TOC split-view)*

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Server Foundation | 3/3 | Complete   | 2026-03-06 |
| 2. Browser Shell | 5/5 | Complete   | 2026-03-09 |
| 3. Editor | 5/5 | Complete   | 2026-03-09 |
| 4. Live Reload | 3/3 | Complete   | 2026-03-10 |
| 5. Search and Tags | 5/5 | Gaps found — closure plan needed |  |
