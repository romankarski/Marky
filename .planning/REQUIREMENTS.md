# Requirements: Marky

**Defined:** 2026-03-06
**Core Value:** Instant, beautiful markdown reading and editing with full-text search across all files — so nothing gets lost and switching between documents is effortless.

## v1 Requirements (Complete)

### File System
- [x] **FILE-01**: User can open a root folder and all files/subfolders appear in the sidebar tree
- [x] **FILE-02**: User can navigate the folder tree to browse and open markdown files
- [x] **FILE-03**: User can create a new markdown file from the UI
- [x] **FILE-04**: User can rename a file from the UI
- [x] **FILE-05**: User can delete a file from the UI (with confirmation)

### Viewing
- [x] **VIEW-01**: Markdown files open in rendered preview mode by default
- [x] **VIEW-02**: User can have multiple files open simultaneously in tabs
- [x] **VIEW-03**: User can switch between open files by clicking tabs
- [x] **VIEW-04**: User can close tabs individually
- [x] **VIEW-05**: User can split the view to see two documents side by side

### Editing
- [x] **EDIT-01**: User can click Edit to open an editor panel below the preview (both visible simultaneously)
- [x] **EDIT-02**: Editor shows raw markdown; preview updates live as user types
- [x] **EDIT-03**: Changes are auto-saved automatically after a brief pause
- [x] **EDIT-04**: Tab shows a dirty state indicator when there are unsaved changes
- [x] **EDIT-05**: User can edit two separate files at once in split-screen mode (each pane independent)

### Live Reload
- [x] **LIVE-01**: When an external process (Claude CLI) writes to an open file, the preview auto-refreshes immediately
- [x] **LIVE-02**: File watcher monitors the entire root folder for external changes

### Search
- [x] **SRCH-01**: User can search for any word or phrase across all files with instant results
- [x] **SRCH-02**: Search results show file name, path, and a snippet of matching context
- [x] **SRCH-03**: User can click a search result to open the file at the matching location

### Tags
- [x] **TAG-01**: App reads YAML frontmatter tags from markdown files automatically
- [x] **TAG-02**: User can filter the file tree by tag to see all files with that tag
- [x] **TAG-03**: User can add or edit tags on a file from the UI (written back to frontmatter)

### Design
- [x] **DSNG-01**: UI uses a glass-inspired design — frosted panels, soft blur, transparency layers
- [x] **DSNG-02**: Color palette is orange and white — warm orange accents on a clean white/light background
- [x] **DSNG-03**: Aesthetic is inspired by the Hiro Hamada laboratory in Big Hero 6 — bright, clean, futuristic yet warm
- [x] **DSNG-04**: Typography and spacing feel airy and uncluttered — generous whitespace, no visual noise

## v1.1 Requirements

### Persistence
- [x] **PRST-01**: Tabs reopen automatically on page reload with their previous files
- [x] **PRST-02**: Recently opened files shown on welcome screen for quick access
- [x] **PRST-03**: Reloaded tabs restore their last scroll position in preview

### Backlinks
- [ ] **BKLN-01**: Right panel shows all files that link to the current document
- [ ] **BKLN-02**: Clicking a backlink opens that file in a tab
- [ ] **BKLN-03**: Backlinks panel header shows count of incoming links

### Images
- [x] **IMG-01**: Images with relative paths (./img.png, ../img.png) render in markdown preview using the file's directory as base
- [x] **IMG-02**: Images with absolute paths (/Users/... or /notes/img.png) render correctly in markdown preview

### Templates
- [ ] **TMPL-01**: User can create a new file from a built-in template (daily note, meeting note, decision record)
- [ ] **TMPL-02**: User can save any file as a custom template
- [ ] **TMPL-03**: Template picker shown when creating a new file (alongside blank option)

### Graph View
- [ ] **GRPH-01**: Graph view shows files as nodes clustered and connected by shared tags
- [ ] **GRPH-02**: Clicking a node in the graph opens that file in a tab
- [ ] **GRPH-03**: Active file is highlighted in the graph
- [ ] **GRPH-04**: Graph lives in a dedicated panel or tab (not a modal)

## v2 Requirements

### Semantic Search
- **SEM-01**: Semantic search via Claude API — find files by meaning, not just exact words
- **SEM-02**: Embeddings pre-computed and cached (not generated at query time)
- **SEM-03**: Claude used as LLM-reranker over full-text search candidates

### Agent Collaboration
- **LIVE-03**: When Claude CLI writes a file with unsaved user edits open, show a keep/reload conflict prompt

### Polish
- **EDIT-06**: Scroll sync between editor and preview (cursor position mirrored)
- **SRCH-04**: Command palette for quick file open and command access

## Out of Scope

| Feature | Reason |
|---------|--------|
| Cloud sync | Local filesystem is source of truth; adding sync adds infrastructure complexity without benefit for single-user use |
| Mobile | Desktop browser only |
| Real-time collaboration | Single-user app |
| Plugin system | Scope creep; build the core well first |
| Block editor (Notion-style) | Raw markdown files must remain portable; WYSIWYG block editing breaks that |
| OAuth / user accounts | Single-user local app; no auth needed |
| Git integration | Claude CLI handles git; app should not duplicate this |
| Keyboard shortcuts | User prefers visible buttons over memorized shortcuts |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| FILE-01 | Phase 1: Server Foundation | Complete |
| FILE-02 | Phase 1: Server Foundation | Complete |
| FILE-03 | Phase 1: Server Foundation | Complete |
| FILE-04 | Phase 1: Server Foundation | Complete |
| FILE-05 | Phase 1: Server Foundation | Complete |
| VIEW-01 | Phase 2: Browser Shell | Complete |
| VIEW-02 | Phase 2: Browser Shell | Complete |
| VIEW-03 | Phase 2: Browser Shell | Complete |
| VIEW-04 | Phase 2: Browser Shell | Complete |
| DSNG-01 | Phase 2: Browser Shell | Complete |
| DSNG-02 | Phase 2: Browser Shell | Complete |
| DSNG-03 | Phase 2: Browser Shell | Complete |
| DSNG-04 | Phase 2: Browser Shell | Complete |
| VIEW-05 | Phase 3: Editor | Complete |
| EDIT-01 | Phase 3: Editor | Complete |
| EDIT-02 | Phase 3: Editor | Complete |
| EDIT-03 | Phase 3: Editor | Complete |
| EDIT-04 | Phase 3: Editor | Complete |
| EDIT-05 | Phase 3: Editor | Complete |
| LIVE-01 | Phase 4: Live Reload | Complete |
| LIVE-02 | Phase 4: Live Reload | Complete |
| SRCH-01 | Phase 5: Search and Tags | Complete |
| SRCH-02 | Phase 5: Search and Tags | Complete |
| SRCH-03 | Phase 5: Search and Tags | Complete |
| TAG-01 | Phase 5: Search and Tags | Complete |
| TAG-02 | Phase 5: Search and Tags | Complete |
| TAG-03 | Phase 5: Search and Tags | Complete |
| PRST-01 | Phase 6: Tab Persistence and Image Rendering | Complete |
| PRST-02 | Phase 6: Tab Persistence and Image Rendering | Complete |
| PRST-03 | Phase 6: Tab Persistence and Image Rendering | Complete |
| IMG-01 | Phase 6: Tab Persistence and Image Rendering | Complete |
| IMG-02 | Phase 6: Tab Persistence and Image Rendering | Complete |
| TMPL-01 | Phase 7: File Templates | Pending |
| TMPL-02 | Phase 7: File Templates | Pending |
| TMPL-03 | Phase 7: File Templates | Pending |
| BKLN-01 | Phase 8: Backlinks Panel | Pending |
| BKLN-02 | Phase 8: Backlinks Panel | Pending |
| BKLN-03 | Phase 8: Backlinks Panel | Pending |
| GRPH-01 | Phase 9: Tag Graph View | Pending |
| GRPH-02 | Phase 9: Tag Graph View | Pending |
| GRPH-03 | Phase 9: Tag Graph View | Pending |
| GRPH-04 | Phase 9: Tag Graph View | Pending |

**Coverage:**
- v1 requirements: 27 total — all Complete
- v1.1 requirements: 15 total — all mapped to Phases 6-9
- Unmapped v1.1: 0 (coverage 15/15)

---
*Requirements defined: 2026-03-06*
*Last updated: 2026-03-10 after v1.1 roadmap created*
