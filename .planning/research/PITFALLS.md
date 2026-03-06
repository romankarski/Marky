# Domain Pitfalls

**Domain:** Web-based local markdown knowledge base / editor
**Project:** Marky
**Researched:** 2026-03-06
**Confidence:** HIGH (well-documented failure modes in open-source projects; confirmed by chokidar, CodeMirror, and similar project post-mortems)

---

## Critical Pitfalls

Mistakes that cause rewrites, data loss, or fundamentally broken UX.

---

### Pitfall 1: File Watcher Race Condition on External Writes

**What goes wrong:** Claude CLI agents write files while the user has the same file open in the editor. The app receives the `change` event and overwrites the editor buffer with the new content — silently discarding the user's unsaved edits. Or worse: the app and agent write simultaneously, producing interleaved garbage.

**Why it happens:** `fs.watch` / `chokidar` fire on every write, including partial writes. Apps naively reload the file content into the editor on any change event without checking if there are local unsaved edits.

**Consequences:** Silent data loss. User edits disappear. Trust in the app collapses.

**Prevention:**
- Track "dirty" state per file (user has unsaved changes = dirty).
- On external change event: if file is dirty, show a conflict banner ("File changed externally — reload or keep your edits?") instead of auto-reloading.
- If file is clean (no unsaved edits), auto-reload silently — this is the happy path for agent writes.
- Debounce file change events (50–100ms) to avoid firing on every partial write chunk.

**Detection (warning signs):**
- No dirty-state tracking in the editor model.
- `change` event handler calls `readFile` and sets editor content unconditionally.
- No debounce on watcher events.

**Phase:** Address in Phase 1 (core editor + file watcher). Getting this wrong in foundation means retrofitting state management later.

---

### Pitfall 2: Polling vs Event-Based File Watching (Wrong Tool for the Job)

**What goes wrong:** Using `setInterval` + `fs.stat` polling instead of `chokidar` (which uses native OS events: `inotify` on Linux, `kqueue` on macOS, `ReadDirectoryChangesW` on Windows). Polling is slow (1–2s latency), burns CPU, and misses rapid successive writes.

**Why it happens:** Developers unfamiliar with the ecosystem reach for polling as "simpler." Also: `fs.watch` directly is tempting but notoriously unreliable across platforms (fires duplicate events, misses renames, behaves differently on macOS vs Linux).

**Consequences:** 1–2 second delay before external agent writes appear. CPU waste from constant polling. On macOS, `fs.watch` may fire 2–3 events per write.

**Prevention:**
- Use `chokidar` (the standard for Node.js file watching). It uses native OS events with a polling fallback only for network filesystems.
- Configure `chokidar` with `awaitWriteFinish: { stabilityThreshold: 100, pollInterval: 50 }` to wait for the write to complete before firing.
- Set `ignoreInitial: true` to avoid flooding events on startup.

**Detection (warning signs):**
- File watcher implementation uses `setInterval`.
- Direct use of `fs.watch` without event deduplication.
- No `awaitWriteFinish` configuration.

**Phase:** Phase 1 (file watcher foundation).

---

### Pitfall 3: Full-Text Search Re-Indexing Everything on Every Change

**What goes wrong:** Every time a file changes, the app re-reads and re-indexes the entire vault. With 500+ markdown files this takes 2–10 seconds, blocks the UI, and makes search feel broken during agent write bursts.

**Why it happens:** Developers implement a simple "index all files on startup" function and call it again on any change event. Incremental indexing feels complex so they defer it — and never revisit.

**Consequences:** Search is unusable during agent activity. App freezes. User gives up on search.

**Prevention:**
- Build incremental indexing from day one: on a `change` or `add` event, index only the affected file and merge into the existing index.
- Use a worker thread or `setImmediate`/chunking to keep indexing off the main thread.
- For full-text search, use `flexsearch` or `minisearch` — both support incremental `add`/`update`/`remove` operations without full re-index.
- Index documents by file path as key so updates replace only the changed document.

**Detection (warning signs):**
- Search index is rebuilt by calling a `indexAllFiles()` function from watcher callbacks.
- No per-document update path exists in the indexer.
- Search noticeably lags after file changes.

**Phase:** Phase 2 (search implementation). Must design incremental path before writing indexer.

---

### Pitfall 4: Semantic Search That Calls the Embedding API Per Keystroke

**What goes wrong:** Semantic search fires a Claude/embedding API call on every keystroke in the search box, or on every file change re-embeds the entire vault. API calls are slow (100–500ms each), expensive, and rate-limited. The app feels laggy and costs spiral.

**Why it happens:** Developers treat semantic search like full-text search — immediate, stateless queries. They don't realize embeddings must be pre-computed and cached; query time should only embed the query string, not the documents.

**Consequences:** $50+/month in API costs for moderate use. Search has 500ms+ latency. Rate limit errors break search entirely.

**Prevention:**
- Pre-compute and persist embeddings for each document (store in a local SQLite or JSON cache keyed by file path + content hash).
- Only re-embed a document when its content hash changes.
- At query time: embed only the search query string (one API call), then do cosine similarity locally against cached embeddings.
- Debounce the search input (300–500ms) so embedding is triggered only when the user pauses typing.
- Cache query embeddings for identical repeat queries (session-level).

**Detection (warning signs):**
- Embedding API call happens inside the search input handler without debounce.
- No embedding persistence/cache exists.
- No content-hash comparison before re-embedding.

**Phase:** Phase 2 (search). Embedding cache architecture must be designed before implementing semantic search — retrofitting is painful.

---

### Pitfall 5: Split-Pane Editor That Fights Itself on Resize

**What goes wrong:** Split-pane layout (preview + editor, or two documents side by side) implemented with CSS `flex` or `grid` without a proper resize handle. Either: panels have fixed sizes and don't adapt to content, or the resize handle is implemented naively (mouse drag in JS without pointer capture), causing the divider to "lose" the cursor when moving fast.

**Why it happens:** Split-pane UI looks simple but has a dozen edge cases: minimum panel size, collapse/expand, persistent user preference, scroll position preservation on resize.

**Consequences:** Editor panel too small to use. Drag handle "sticks" or "jumps." User's split ratio resets on every navigation. Preview scroll position lost when resizing.

**Prevention:**
- Use an established split-pane library (`react-resizable-panels`, `allotment`, or `split.js`) — do not implement drag-resize from scratch.
- Store split ratio in `localStorage` and restore on load.
- Set minimum panel sizes (e.g., 20% each) to prevent panels from collapsing to zero.
- Preserve scroll position in both panels across navigation events.

**Detection (warning signs):**
- No split library in dependencies — resize handled with raw `mousedown`/`mousemove`.
- Split ratio not persisted.
- No minimum size constraint.

**Phase:** Phase 1 (layout foundation). Wrong approach here cascades into every subsequent feature.

---

### Pitfall 6: Markdown Preview That Re-Renders Entire Document on Every Keystroke

**What goes wrong:** The editor sends the full markdown string to the renderer on every keystroke. The renderer tears down and rebuilds the entire preview DOM, causing scroll position to reset to the top, images to flicker/reload, and noticeable render lag on documents > 500 lines.

**Why it happens:** Naive implementation: `onChange -> setMarkdown(value) -> <ReactMarkdown>{markdown}</ReactMarkdown>`. React/virtual DOM diffing helps partially, but parser (marked, remark) still runs on every character.

**Consequences:** Scroll jumps on every keystroke. Images flicker. Large documents feel laggy. Users stop using the editor.

**Prevention:**
- Debounce preview updates (100–200ms) so the renderer fires only when the user pauses.
- Use a renderer that supports incremental/virtual rendering (CodeMirror's built-in preview, or a virtual-list approach for large documents).
- Preserve scroll position explicitly: save scroll offset before re-render, restore after.
- For very large documents (> 1000 lines), only render the visible viewport region.

**Detection (warning signs):**
- Preview update is synchronous in the editor's `onChange` handler with no debounce.
- No scroll position preservation logic.
- `ReactMarkdown` or equivalent re-renders on every character.

**Phase:** Phase 1 (editor core). This is a fundamental UX requirement, not a nice-to-have.

---

### Pitfall 7: Tag System Built as File Metadata Instead of Frontmatter Convention

**What goes wrong:** Tags are stored in a separate database or sidecar file (`.marky-tags.json`) rather than in the markdown file's YAML frontmatter. When the user edits files outside the app (or Claude agents write files), tags drift out of sync. The sidecar becomes the source of truth, conflicting with the file content.

**Why it happens:** Parsing YAML frontmatter feels like complexity to defer. A JSON sidecar seems "easier." But it breaks the local-first, filesystem-as-source-of-truth contract.

**Consequences:** Tags disappear when files are edited externally. Two sources of truth diverge. Moving files breaks the tag mapping. Export/backup is incomplete.

**Prevention:**
- Store tags exclusively in YAML frontmatter (`tags: [tag1, tag2]`) inside each markdown file. This is the universal convention (Obsidian, Jekyll, Hugo all use this).
- Parse frontmatter on file load using `gray-matter` (the standard Node.js library for this).
- When the user adds/removes a tag in the UI, write the updated frontmatter back to the file immediately.
- Index tags from frontmatter at startup and on file change events.

**Detection (warning signs):**
- Tag data lives in a separate JSON file or database table.
- No frontmatter parsing library in dependencies.
- Tags not visible when file is opened in any other editor.

**Phase:** Phase 1 (file model) or whichever phase introduces tagging. Design this before implementing the file tree.

---

### Pitfall 8: Ignoring CORS and Same-Origin Policy for Local File Access

**What goes wrong:** The backend serves files from the local filesystem, but the frontend makes `fetch()` calls that hit CORS restrictions. Or: developers try to use `file://` URLs to serve the frontend and discover that the browser blocks all `fetch()` to `localhost` from a `file://` origin.

**Why it happens:** Local development often masks this: developer runs frontend and backend on the same origin during dev. But when the app is packaged or served differently, CORS headers are missing and everything breaks.

**Consequences:** File reads fail silently. Semantic search API calls fail. App appears broken with no useful error message.

**Prevention:**
- Always serve both frontend and backend from the same origin (e.g., Express serves the React build at `localhost:3000` and also exposes `/api` routes).
- Set explicit CORS headers on the backend for any cross-origin scenario (even localhost-to-localhost with different ports).
- Never rely on `file://` protocol for the frontend — always use a proper local server.

**Detection (warning signs):**
- Frontend and API on different ports with no CORS middleware.
- `file://` URLs anywhere in the serving strategy.
- Network tab shows CORS errors during development.

**Phase:** Phase 1 (project scaffold). Architecture decision — correct from the start.

---

## Moderate Pitfalls

---

### Pitfall 9: No Scroll Sync Between Editor and Preview Panels

**What goes wrong:** In split-pane edit mode (editor bottom, preview top), the preview does not scroll to match the editor cursor position. Users lose context — editing line 200 but the preview shows line 1.

**Prevention:**
- Map editor cursor line to a corresponding element in the preview DOM (by line number anchor or heuristic).
- On cursor change, scroll the preview to show the corresponding section.
- This requires the markdown renderer to emit line-number attributes on rendered elements.
- Libraries like `@codemirror/view` + a renderer aware of source maps handle this; otherwise implement a basic heuristic (scroll percentage).

**Phase:** Phase 1 or 2, whichever introduces split-pane editing.

---

### Pitfall 10: Search Index Not Warmed on Startup

**What goes wrong:** Full-text index is built lazily — first search takes 5–30 seconds on a large vault while the index builds in the foreground.

**Prevention:**
- Start indexing in the background immediately on app startup.
- Show a subtle "indexing..." indicator in the search UI.
- Allow searches before indexing is complete (return partial results from already-indexed files).

**Phase:** Phase 2 (search). Startup sequence design.

---

### Pitfall 11: CodeMirror / Editor Library Version Mismatch

**What goes wrong:** CodeMirror 6 (the current version) is modular and has a completely different API from CodeMirror 5. Most Stack Overflow answers, tutorials, and old blog posts cover CM5. Developers mix CM5 examples into a CM6 setup, producing confusing errors and subtle bugs.

**Prevention:**
- Confirm which version any code example targets before using it.
- CodeMirror 6 packages are all under `@codemirror/` namespace. CM5 is `codemirror` (no scope).
- Use the official CM6 documentation exclusively: `codemirror.net/docs/ref/`.
- For React integration, use `@uiw/react-codemirror` (actively maintained CM6 wrapper).

**Phase:** Phase 1 (editor setup).

---

### Pitfall 12: Semantic Search Embedding Dimension Mismatch

**What goes wrong:** Embeddings are generated with one model (e.g., Claude's `voyage-3` at 1024 dimensions), cached to disk, then the model is changed (e.g., to `voyage-3-lite` at 512 dimensions). Cached embeddings are now incompatible and cosine similarity returns garbage — but no error is thrown.

**Prevention:**
- Store the model name and embedding dimension in the embedding cache metadata.
- On startup, verify cached embeddings match the configured model. If mismatch detected, invalidate and re-embed.
- Version the cache file format.

**Phase:** Phase 2 (semantic search). Cache design.

---

## Minor Pitfalls

---

### Pitfall 13: Virtual File Tree That Doesn't Handle Symlinks

**What goes wrong:** Knowledge base contains symlinked directories (e.g., the portal-hub repo has multiple sub-projects). The file tree either ignores symlinks, follows them infinitely (recursive loop), or crashes.

**Prevention:**
- Use `chokidar` with `followSymlinks: false` for the watcher.
- In the file tree renderer, detect symlinks via `fs.lstat` and display them distinctly (or skip them if out of scope).

**Phase:** Phase 1.

---

### Pitfall 14: Tab State Lost on Browser Refresh

**What goes wrong:** User has 5 tabs open, refreshes the page (or the dev server hot-reloads), and all tabs are gone.

**Prevention:**
- Persist open tab list (file paths + active tab) to `localStorage` on every change.
- Restore tabs on startup before rendering.

**Phase:** Phase 1 (tab system).

---

### Pitfall 15: Large File Performance Collapse

**What goes wrong:** A single large markdown file (e.g., a meeting notes summary at 3000+ lines) causes the editor and preview to freeze. CodeMirror handles large files well by default; naive `<textarea>` or `contenteditable` approaches do not.

**Prevention:**
- Use CodeMirror 6 (virtualized rendering by design) rather than a textarea-based editor.
- Set a soft warning for files > 2000 lines (display line count; offer to open in external editor).

**Phase:** Phase 1.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| File watcher setup | Race condition on external write (P1) + wrong watcher API (P2) | Use chokidar with `awaitWriteFinish`; implement dirty-state check before reload |
| Editor + split pane | Full re-render on keystroke (P6) + split resize bugs (P5) | Debounce preview updates; use established split-pane library |
| Full-text search | Re-indexing everything on change (P3) | Choose `minisearch` or `flexsearch` for incremental index; index only changed file |
| Semantic search | API calls per keystroke + no embedding cache (P4) | Pre-compute embeddings; persist by content hash; embed only query at runtime |
| Tag system | Sidecar file divergence (P7) | Frontmatter-only tags; `gray-matter` for parsing; write back on tag change |
| App scaffold | CORS issues (P8) | Single origin: Express serves both frontend and API |
| Embedding cache | Dimension mismatch on model change (P12) | Cache metadata includes model name; validate on startup |

---

## Sources

- Chokidar documentation and known issues: https://github.com/paulmillr/chokidar (MEDIUM confidence — primary source)
- CodeMirror 6 architecture docs: https://codemirror.net/docs/ (HIGH confidence — official)
- Minisearch incremental index docs: https://lucaong.github.io/minisearch/ (MEDIUM confidence — official)
- Gray-matter frontmatter library: https://github.com/jonschlinkert/gray-matter (HIGH confidence — de facto standard)
- Obsidian frontmatter conventions: https://help.obsidian.md/Editing+and+formatting/Properties (MEDIUM confidence — establishes convention this project should follow)
- React-resizable-panels: https://github.com/bvaughn/react-resizable-panels (MEDIUM confidence — active project)
- Voyager embedding API dimensions: https://docs.anthropic.com/en/docs/build-with-claude/embeddings (MEDIUM confidence — official, verify current model names)
- General pitfalls derived from analysis of Obsidian, Foam, Dendron, Notable open-source issue trackers (LOW confidence for specific claims — patterns observed across multiple projects)
