# Roadmap: Marky

## Milestones

- ✅ **v1.0 MVP** - Phases 1-5 (shipped 2026-03-10)
- 🚧 **v1.1 Polish and Navigation** - Phases 6-9 (in progress)

## Phases

<details>
<summary>✅ v1.0 MVP (Phases 1-5) - SHIPPED 2026-03-10</summary>

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
- [x] 02-01-PLAN.md — Install Phase 2 libraries, define Tab types and useTabs reducer hook
- [x] 02-02-PLAN.md — MarkdownPreview component (react-markdown pipeline) and TableOfContents
- [x] 02-03-PLAN.md — TabBar component (dnd-kit sortable) and WelcomeScreen empty state
- [x] 02-04-PLAN.md — App.tsx refactor: wire all components into three-column layout with design system
- [x] 02-05-PLAN.md — Visual verification checkpoint (human approves all 8 requirements)

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
- [x] 03-01-PLAN.md — Wave 0 test scaffolds (tabReducer-editor + useAutoSave failing tests)
- [x] 03-02-PLAN.md — Extend Tab type + tabReducer actions + install CodeMirror libraries
- [x] 03-03-PLAN.md — MarkdownEditor component + useAutoSave hook
- [x] 03-04-PLAN.md — EditorPane (vertical split) + TabBar dirty indicator
- [x] 03-05-PLAN.md — SplitView + App.tsx wiring + visual verification checkpoint

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
**Plans**: 9 plans

Plans:
- [x] 05-01-PLAN.md — Wave 0 server test stubs (SearchService unit + route integration stubs, RED state)
- [x] 05-02-PLAN.md — Wave 0 client test stubs (useSearch, useTags, SearchPanel test stubs, RED state)
- [x] 05-03-PLAN.md — Server SearchService, search routes, app.ts wiring (turns server stubs GREEN)
- [x] 05-04-PLAN.md — Client useSearch and useTags hooks (turns client hook stubs GREEN)
- [x] 05-05-PLAN.md — SearchPanel, TagFilter, FileTree update, App.tsx wiring + visual checkpoint
- [x] 05-06-PLAN.md — Gap closure: tree auto-reveal on search clear + TOC split-view pane targeting fix
- [x] 05-07-PLAN.md — Gap closure: tag editor moved to right panel as FileInfo component above TOC
- [x] 05-08-PLAN.md — Gap closure: activeFocusedTab derived variable + currentFileTags fix
- [x] 05-09-PLAN.md — Gap closure: FileInfo filename header + TOC click optimistic update

</details>

### 🚧 v1.1 Polish and Navigation (In Progress)

**Milestone Goal:** Make the workspace feel permanent and connected — tabs survive reloads, files link to each other visibly, images render, templates speed up note creation, and a tag-based graph reveals knowledge structure.

- [x] **Phase 6: Tab Persistence and Image Rendering** - Tabs survive page reload; recent files on welcome screen; local images render in preview (completed 2026-03-10)
- [ ] **Phase 7: File Templates** - New files can be created from built-in and custom templates via a picker modal
- [ ] **Phase 8: Backlinks Panel** - Right panel shows all files that link to the current document, with click-to-open
- [ ] **Phase 9: Tag Graph View** - Tag-based graph visualizes knowledge structure; nodes are clickable; active file is highlighted

## Phase Details

### Phase 6: Tab Persistence and Image Rendering
**Goal**: The workspace remembers where the user left off — tabs reopen on reload with their previous files and scroll positions, recently opened files appear on the welcome screen, and local images render inline in preview
**Depends on**: Phase 5
**Requirements**: PRST-01, PRST-02, PRST-03, IMG-01, IMG-02
**Success Criteria** (what must be TRUE):
  1. After refreshing the page, all previously open tabs reopen automatically with their files
  2. After refreshing the page, each restored tab's preview scrolls to its last position
  3. The welcome screen (no open tabs) shows a list of recently opened files for quick access
  4. An image with a relative path (e.g., `./screenshot.png`) renders inline in preview using the file's directory as base
  5. An image with an absolute path (e.g., `/Users/romankarski/notes/img.png`) renders correctly in preview
**Plans**: 4 plans

Plans:
- [ ] 06-01-PLAN.md — Wave 0 test stubs: useTabPersistence, useScrollPersist, MarkdownPreview img, images route (RED)
- [ ] 06-02-PLAN.md — Persistence hooks (useTabPersistence + useScrollPersist) + WelcomeScreen recent files + App.tsx wiring
- [ ] 06-03-PLAN.md — Fastify image proxy route (/api/image) + MarkdownPreview img override with proxy URLs
- [ ] 06-04-PLAN.md — Full test suite run + visual verification checkpoint

### Phase 7: File Templates
**Goal**: Users can create structured notes instantly from built-in templates (daily note, meeting note, decision record) or their own saved templates, with a picker shown at new-file creation time
**Depends on**: Phase 5
**Requirements**: TMPL-01, TMPL-02, TMPL-03
**Success Criteria** (what must be TRUE):
  1. When creating a new file, a template picker appears offering built-in templates (daily note, meeting note, decision record) alongside a blank option
  2. Selecting a built-in template creates the file pre-filled with the template's structure, with `{{date}}` and `{{title}}` tokens substituted at creation time
  3. User can save any open file as a custom template, which then appears in the template picker for future use
**Plans**: 4 plans

Plans:
- [ ] 07-01-PLAN.md — Wave 0 test stubs: templateTokens, builtInTemplates, TemplatePickerModal, server templates (RED state)
- [ ] 07-02-PLAN.md — Client lib (builtInTemplates + templateTokens) + FolderPickerModal two-step flow + FileTree wiring
- [ ] 07-03-PLAN.md — Server templates CRUD route (GET/POST /api/templates) + app.ts registration
- [ ] 07-04-PLAN.md — FileInfo "Save as template" button + custom template picker + visual verification checkpoint

### Phase 8: Backlinks Panel
**Goal**: The right panel shows every file that links to the current document — users can see their knowledge connections and navigate to linking files with a single click
**Depends on**: Phase 6
**Requirements**: BKLN-01, BKLN-02, BKLN-03
**Success Criteria** (what must be TRUE):
  1. The right panel shows a "Backlinks" section listing all files that contain a link to the currently active file
  2. The backlinks section header displays the count of incoming links (e.g., "Backlinks (3)")
  3. Clicking a backlink entry opens that file in a new tab
  4. When the active file has no incoming links, the backlinks section shows an empty state (zero count, not hidden)
**Plans**: TBD

Plans:
- [ ] 08-01-PLAN.md — TBD

### Phase 9: Tag Graph View
**Goal**: A persistent tag-based graph view lets users explore their knowledge structure visually — files cluster by shared tags, the active file is highlighted, and clicking any node opens that file
**Depends on**: Phase 8
**Requirements**: GRPH-01, GRPH-02, GRPH-03, GRPH-04
**Success Criteria** (what must be TRUE):
  1. A graph view is accessible from a persistent panel or tab (not a modal) showing all files as nodes connected by shared tags
  2. The currently active file is visually highlighted in the graph
  3. Clicking any node in the graph opens that file in a tab
  4. Navigating away from the graph and back restores the graph layout without restarting the simulation from scratch
**Plans**: TBD

Plans:
- [ ] 09-01-PLAN.md — TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 6 → 7 → 8 → 9

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Server Foundation | v1.0 | 3/3 | Complete | 2026-03-06 |
| 2. Browser Shell | v1.0 | 5/5 | Complete | 2026-03-09 |
| 3. Editor | v1.0 | 5/5 | Complete | 2026-03-09 |
| 4. Live Reload | v1.0 | 3/3 | Complete | 2026-03-10 |
| 5. Search and Tags | v1.0 | 9/9 | Complete | 2026-03-10 |
| 6. Tab Persistence and Image Rendering | 4/4 | Complete   | 2026-03-11 | - |
| 7. File Templates | 2/4 | In Progress|  | - |
| 8. Backlinks Panel | v1.1 | 0/TBD | Not started | - |
| 9. Tag Graph View | v1.1 | 0/TBD | Not started | - |
