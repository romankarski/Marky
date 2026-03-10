# Marky

## What This Is

Marky is a lightweight, web-based markdown workspace for managing a local knowledge base of markdown files. It gives a single user (working alongside Claude CLI agents) a productive environment to browse, search, edit, and preview markdown documents — replacing VS Code's poor markdown experience with something purpose-built for this workflow.

## Core Value

Instant, beautiful markdown reading and editing with full-text + semantic search across all files — so nothing gets lost and switching between documents is effortless.

## Current Milestone: v1.1 Polish and Navigation

**Goal:** Make the workspace feel permanent and connected — tabs survive reloads, files link to each other visibly, images render, templates speed up note creation, and a tag-based graph reveals knowledge structure.

**Target features:**
- Tab persistence across reloads + recent files on welcome screen
- Backlinks panel (collapsible, in right panel)
- Inline image rendering in preview
- File templates (daily note, meeting note, decision record, custom)
- Tag-based graph view

## Requirements

### Validated

- ✓ User can browse files via folder tree + tag-based views — Phase 1–5
- ✓ Markdown files open in preview mode by default — Phase 2
- ✓ User can open multiple files in tabs and switch between them — Phase 2
- ✓ User can split the view to see two documents side by side — Phase 3
- ✓ Full-text search across all files with instant results — Phase 5
- ✓ Files auto-refresh when changed externally (Claude CLI writes to them) — Phase 4
- ✓ User can tag files and filter by tag across folders — Phase 5

### Active

- [ ] Tabs reopen automatically on page reload
- [ ] Recently opened files shown on welcome screen
- [ ] Backlinks panel shows files that link to current document (collapsible)
- [ ] Clicking a backlink opens that file
- [ ] Images with relative/absolute paths render in markdown preview
- [ ] User can create a new file from a built-in template
- [ ] User can save any file as a custom template
- [ ] Template picker shown when creating a new file
- [ ] Graph view shows files as nodes clustered by shared tags
- [ ] Clicking a graph node opens that file
- [ ] Active file highlighted in graph

### Out of Scope

- Multi-user collaboration — single user for now
- Real-time multiplayer editing — not needed
- Cloud sync — local filesystem is source of truth
- Mobile — desktop browser only for v1

## Context

- Knowledge base lives in `/Users/romankarski/projects/portal-hub/` with `knowledge/` and `notes/` folders
- Files are created and edited by both the user and Claude CLI agents (no file locking required — app must detect external changes and auto-refresh)
- Current pain point: VS Code markdown preview is painful, no good cross-file search, hard to work with multiple files at once
- Semantic search uses Claude API (user has API key) — needs embeddings or search-quality model call
- File watcher needed to detect external writes from Claude agents

## Constraints

- **Platform**: Web app (local-first, served at localhost — no Electron/native required)
- **Search AI**: Claude API for semantic search — user provides API key
- **File access**: Direct filesystem access (not cloud) — Node.js backend or similar
- **Future**: Architecture should not prevent hosting the app later

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Web-based over desktop app | Local-first now, hostable later — best of both | — Pending |
| Claude API for semantic search | User already uses Claude ecosystem | — Pending |
| Editor opens below preview (not side) | Keeps preview readable while editing | — Pending |

---
*Last updated: 2026-03-06 after initialization*
