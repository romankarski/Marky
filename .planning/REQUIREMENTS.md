# Requirements: Marky

**Defined:** 2026-03-06
**Core Value:** Instant, beautiful markdown reading and editing with full-text search across all files — so nothing gets lost and switching between documents is effortless.

## v1 Requirements

### File System

- [x] **FILE-01**: User can open a root folder and all files/subfolders appear in the sidebar tree
- [x] **FILE-02**: User can navigate the folder tree to browse and open markdown files
- [x] **FILE-03**: User can create a new markdown file from the UI
- [x] **FILE-04**: User can rename a file from the UI
- [x] **FILE-05**: User can delete a file from the UI (with confirmation)

### Viewing

- [ ] **VIEW-01**: Markdown files open in rendered preview mode by default
- [x] **VIEW-02**: User can have multiple files open simultaneously in tabs
- [x] **VIEW-03**: User can switch between open files by clicking tabs
- [x] **VIEW-04**: User can close tabs individually
- [ ] **VIEW-05**: User can split the view to see two documents side by side

### Editing

- [ ] **EDIT-01**: User can click Edit to open an editor panel below the preview (both visible simultaneously)
- [ ] **EDIT-02**: Editor shows raw markdown; preview updates live as user types
- [ ] **EDIT-03**: Changes are auto-saved automatically after a brief pause
- [ ] **EDIT-04**: Tab shows a dirty state indicator when there are unsaved changes
- [ ] **EDIT-05**: User can edit two separate files at once in split-screen mode (each pane independent)

### Live Reload

- [ ] **LIVE-01**: When an external process (Claude CLI) writes to an open file, the preview auto-refreshes immediately
- [ ] **LIVE-02**: File watcher monitors the entire root folder for external changes

### Search

- [ ] **SRCH-01**: User can search for any word or phrase across all files with instant results
- [ ] **SRCH-02**: Search results show file name, path, and a snippet of matching context
- [ ] **SRCH-03**: User can click a search result to open the file at the matching location

### Tags

- [ ] **TAG-01**: App reads YAML frontmatter tags from markdown files automatically
- [ ] **TAG-02**: User can filter the file tree / list by tag to see all files with that tag
- [ ] **TAG-03**: User can add or edit tags on a file from the UI (written back to frontmatter)

### Design

- [ ] **DSNG-01**: UI uses a glass-inspired design — frosted panels, soft blur, transparency layers
- [ ] **DSNG-02**: Color palette is orange and white — warm orange accents on a clean white/light background
- [ ] **DSNG-03**: Aesthetic is inspired by the Hiro Hamada laboratory in Big Hero 6 — bright, clean, futuristic yet warm
- [ ] **DSNG-04**: Typography and spacing feel airy and uncluttered — generous whitespace, no visual noise

## v2 Requirements

### Semantic Search

- **SEM-01**: Semantic search via Claude API — find files by meaning, not just exact words
- **SEM-02**: Embeddings pre-computed and cached (not generated at query time)
- **SEM-03**: Claude used as LLM-reranker over full-text search candidates

### Agent Collaboration

- **LIVE-03**: When Claude CLI writes a file with unsaved user edits open, show a keep/reload conflict prompt

### Polish

- **EDIT-06**: Scroll sync between editor and preview (cursor position mirrored)
- **SRCH-04**: Command palette (Cmd+K) for quick file open and command access
- **NAV-01**: Backlink navigation — see which files link to the current file

## Out of Scope

| Feature | Reason |
|---------|--------|
| Cloud sync | Local filesystem is source of truth; adding sync adds infrastructure complexity without benefit for single-user use |
| Mobile | Desktop browser only for v1 |
| Real-time collaboration | Single-user app |
| Plugin system | Scope creep; build the core well first |
| Block editor (Notion-style) | Raw markdown files must remain portable; WYSIWYG block editing breaks that |
| OAuth / user accounts | Single-user local app; no auth needed |
| Git integration | Claude CLI handles git; app should not duplicate this |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| FILE-01 | Phase 1: Server Foundation | Complete |
| FILE-02 | Phase 1: Server Foundation | Complete |
| FILE-03 | Phase 1: Server Foundation | Complete |
| FILE-04 | Phase 1: Server Foundation | Complete |
| FILE-05 | Phase 1: Server Foundation | Complete |
| VIEW-01 | Phase 2: Browser Shell | Pending |
| VIEW-02 | Phase 2: Browser Shell | Complete |
| VIEW-03 | Phase 2: Browser Shell | Complete |
| VIEW-04 | Phase 2: Browser Shell | Complete |
| DSNG-01 | Phase 2: Browser Shell | Pending |
| DSNG-02 | Phase 2: Browser Shell | Pending |
| DSNG-03 | Phase 2: Browser Shell | Pending |
| DSNG-04 | Phase 2: Browser Shell | Pending |
| VIEW-05 | Phase 3: Editor | Pending |
| EDIT-01 | Phase 3: Editor | Pending |
| EDIT-02 | Phase 3: Editor | Pending |
| EDIT-03 | Phase 3: Editor | Pending |
| EDIT-04 | Phase 3: Editor | Pending |
| EDIT-05 | Phase 3: Editor | Pending |
| LIVE-01 | Phase 4: Live Reload | Pending |
| LIVE-02 | Phase 4: Live Reload | Pending |
| SRCH-01 | Phase 5: Search and Tags | Pending |
| SRCH-02 | Phase 5: Search and Tags | Pending |
| SRCH-03 | Phase 5: Search and Tags | Pending |
| TAG-01 | Phase 5: Search and Tags | Pending |
| TAG-02 | Phase 5: Search and Tags | Pending |
| TAG-03 | Phase 5: Search and Tags | Pending |

**Coverage:**
- v1 requirements: 27 total
- Mapped to phases: 27
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-06*
*Last updated: 2026-03-06 after roadmap creation*
