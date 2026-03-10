---
phase: 04-live-reload
verified: 2026-03-10T09:09:30Z
status: human_needed
score: 7/7 must-haves verified
re_verification: false
human_verification:
  - test: "External write auto-refreshes open preview"
    expected: "Write to an open file via terminal (e.g. echo '## added' >> file.md); within 1-2 seconds the preview panel updates without any user action"
    why_human: "Requires a live running app, real filesystem writes, and visual confirmation — automated tests cover the logic but not the end-to-end timing and UI update"
  - test: "New file appears in sidebar without reload"
    expected: "Create a new .md file in the root directory via terminal; within 1-2 seconds it appears in the sidebar file tree without a page reload"
    why_human: "Sidebar update from SSE 'add' event is visual and timing-dependent; requires live app observation"
  - test: "Dirty tab guard prevents silent overwrite"
    expected: "Open a file, click Edit, type some characters to set dirty state, then write to that file externally; the preview must NOT update while the tab is dirty"
    why_human: "Dirty-tab guard correctness requires user interaction to set dirty state and visual confirmation that the preview stays unchanged"
  - test: "No flash on auto-save"
    expected: "Open a file in edit mode, type text, wait for auto-save (2-3 seconds); there should be no visible flicker or flash in the preview when auto-save writes the file back"
    why_human: "Visual flicker/flash detection requires running the app and watching the preview during an auto-save cycle — not detectable in unit tests"
---

# Phase 4: Live Reload Verification Report

**Phase Goal:** When Claude CLI agents write to files on disk, open previews refresh automatically — users always see the current state of any file without manual reload
**Verified:** 2026-03-10T09:09:30Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | External write to open file triggers immediate preview refresh (LIVE-01) | VERIFIED | `useFileWatcher.ts` listens for SSE 'change' events, fetches `/api/files/{path}`, dispatches `SET_CONTENT`; 5 unit tests cover all dispatch paths and guards |
| 2 | File watcher monitors entire root folder recursively (LIVE-02) | VERIFIED | `FileWatcherService` in `watcher.ts` watches `rootDir` directory with chokidar, `.md` filter, `ignoreInitial: true`; server integration test confirms subdirectory change detection |
| 3 | Dirty tabs are NOT overwritten by live reload events | VERIFIED | `useFileWatcher.ts` line 22: `if (match.dirty \|\| match.editMode) return;`; unit test "LIVE-01 — skips SET_CONTENT for dirty tabs" passes |
| 4 | App's own PUT writes do NOT trigger SSE events (write-lock) | VERIFIED | `files.ts` line 73: `fastify.fileWatcher.lock(req.params['*'])` called before `fs.writeFile`; server test "LIVE-01 — app PUT write does NOT trigger SSE event" passes |
| 5 | New files created externally trigger 'add' SSE event and sidebar refresh | VERIFIED | `watcher.ts` emits `add` events; `useFileWatcher.ts` calls `refetchRef.current()` on 'add'; server test confirms add event detection |
| 6 | EventSource connection is established once at mount and cleaned up on unmount | VERIFIED | `useFileWatcher.ts` uses mount-only `useEffect([])` with `return () => es.close()`; unit test "LIVE-01 — closes EventSource on unmount" passes |
| 7 | Full test suite (server + client) passes with no regressions | VERIFIED | 12 server tests pass (3 new watch.test.ts + 9 existing); 30 client tests pass (5 new useFileWatcher.test.ts + 25 existing) |

**Score:** 7/7 truths verified (automated); 4 items require human verification for end-to-end visual confirmation

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `server/src/lib/watcher.ts` | FileWatcherService class with subscribe(), lock(), close() | VERIFIED | 43 lines; exports `FileWatcherService` and `WatchEvent` type; chokidar named import; locked Set + subscriber Set |
| `server/src/routes/watch.ts` | GET /api/watch SSE route plugin | VERIFIED | 22 lines; sets SSE headers, calls `flushHeaders()`, subscribes via `fastify.fileWatcher.subscribe()`, awaits close |
| `server/src/app.ts` | buildApp wired with FileWatcherService decoration + watchRoutes | VERIFIED | `fastify.decorate('fileWatcher', watcher)` on line 25; `onClose` hook; `watchRoutes` registered after `filesRoutes` |
| `server/src/routes/files.ts` | Write-lock: PUT calls `fastify.fileWatcher.lock()` before write | VERIFIED | `fastify.fileWatcher.lock(req.params['*'])` on line 73; no `inFlightWrites` Set — lock logic lives in `FileWatcherService` |
| `client/src/hooks/useFileWatcher.ts` | EventSource hook with dispatch + refetch wiring | VERIFIED | 41 lines; addEventListener for 'change', 'add', 'unlink'; tabsRef pattern; dirty + editMode guard; silent fetch catch |
| `client/src/App.tsx` | App.tsx wired with useFileWatcher(tabs, dispatch, refetch) | VERIFIED | Line 11 imports hook; line 30 calls `useFileWatcher(tabs, dispatch, refetch)` after `useTabs` and `useFileTree` |
| `server/tests/routes/watch.test.ts` | Integration tests for SSE endpoint (3 tests) | VERIFIED | 3 tests: subdirectory change, new file add, write-lock suppression — all pass |
| `client/src/hooks/__tests__/useFileWatcher.test.ts` | Unit tests for hook (5 tests) | VERIFIED | 5 tests: SET_CONTENT dispatch, path mismatch skip, dirty guard, add refetch, unmount cleanup — all pass |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `server/src/routes/watch.ts` | `server/src/lib/watcher.ts` | `fastify.fileWatcher.subscribe()` | WIRED | Line 11: `const unsubscribe = fastify.fileWatcher.subscribe(...)` |
| `server/src/app.ts` | `server/src/lib/watcher.ts` | `fastify.decorate('fileWatcher', watcher)` | WIRED | Line 25: `fastify.decorate('fileWatcher', watcher)` |
| `server/src/lib/watcher.ts` | chokidar | `import { watch, FSWatcher } from 'chokidar'` | WIRED | Line 1: named ESM import — correct for chokidar v5 |
| `client/src/hooks/useFileWatcher.ts` | `/api/watch` SSE | `new EventSource('/api/watch')` | WIRED | Line 16: `const es = new EventSource('/api/watch')` |
| `client/src/hooks/useFileWatcher.ts` | TabAction SET_CONTENT | `dispatch({ type: 'SET_CONTENT', path, content })` | WIRED | Line 25: dispatches after fetch resolves |
| `client/src/App.tsx` | `client/src/hooks/useFileWatcher.ts` | `useFileWatcher(tabs, dispatch, refetch)` | WIRED | Line 11 import; line 30 call with all three arguments |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| LIVE-01 | 04-01, 04-02, 04-03 | External process writes to open file — preview auto-refreshes | SATISFIED | `useFileWatcher` dispatches `SET_CONTENT` on SSE 'change' events; write-lock suppresses self-triggered reloads; dirty/editMode guard protects unsaved edits; unit tests GREEN |
| LIVE-02 | 04-01, 04-02, 04-03 | File watcher monitors entire root folder for external changes | SATISFIED | `FileWatcherService` watches rootDir recursively with chokidar; add + change + unlink events emitted; subdirectory detection confirmed in integration test |

**Requirements from REQUIREMENTS.md traceability table for Phase 4:** LIVE-01 and LIVE-02 — both accounted for by plans. No orphaned requirements.

**REQUIREMENTS.md status:** Both LIVE-01 and LIVE-02 are marked `[x]` (complete) in the requirements file.

### Anti-Patterns Found

No blockers or warnings found. Scan of all phase-modified files:

- `server/src/lib/watcher.ts` — no TODOs, no stub patterns, no empty returns
- `server/src/routes/watch.ts` — no TODOs, real SSE implementation using `reply.raw`
- `server/src/app.ts` — no TODOs, full decoration and route registration
- `server/src/routes/files.ts` — no TODOs, `fileWatcher.lock()` wired before `fs.writeFile`
- `client/src/hooks/useFileWatcher.ts` — no TODOs; the `catch(() => {})` on line 26 is intentional silent error handling documented inline ("preview stays stale rather than crashing")
- `client/src/App.tsx` — no TODOs, hook called with all three arguments

### Human Verification Required

The automated test suite (42 tests, all passing) verifies all dispatch logic, guard conditions, and SSE wiring. The following four scenarios require visual confirmation in a running app:

#### 1. External write auto-refreshes open preview (LIVE-01 primary path)

**Test:** Start the app (`npm run dev` from Marky root). Open any `.md` file in a tab. In a terminal run: `echo "\n## Added by watcher test" >> <path-to-file>`. Observe the preview panel.
**Expected:** Within 1-2 seconds the preview refreshes and shows the new heading — no page reload, no manual action required.
**Why human:** End-to-end timing of chokidar → SSE → React update requires live observation.

#### 2. New file appears in sidebar (LIVE-02 primary path)

**Test:** With the app running, open a terminal and run: `echo "# New File" > <your-root-dir>/watcher-test.md`. Observe the sidebar file tree.
**Expected:** Within 1-2 seconds `watcher-test.md` appears in the sidebar — no page reload.
**Why human:** Sidebar update triggered by SSE 'add' event and `refetch()` is a visual React state change that unit tests cannot observe at the rendering level.

#### 3. Dirty tab guard prevents silent overwrite

**Test:** Open a file, click Edit, type some text (dirty indicator appears on the tab). In a terminal, write to that same file. Observe the preview.
**Expected:** The preview does NOT update while the tab is dirty — your typed content remains intact.
**Why human:** Requires interactive setup of dirty state through the UI, then external write, then visual check.

#### 4. No flash on auto-save (write-lock correctness)

**Test:** Open a file in edit mode, type some content, wait 2-3 seconds for auto-save (dirty indicator disappears). Observe the preview during auto-save.
**Expected:** No visible flicker or flash in the preview when auto-save writes the file. The write-lock in `FileWatcherService.lock()` should suppress the SSE echo.
**Why human:** Flicker detection is a visual, timing-sensitive observation that tests cannot reliably capture. The write-lock logic is tested (LIVE-01 write-lock test passes) but the visual absence of flicker must be confirmed.

### Gaps Summary

No gaps found. All automated verifications pass.

Phase 4 delivers a complete live reload loop:
- Server: chokidar v5 singleton watcher broadcasting filesystem events via raw SSE
- Server: write-lock preventing self-triggered reloads on PUT writes
- Client: `useFileWatcher` hook connecting SSE stream to React tab state
- Client: dirty + editMode guard protecting unsaved user edits
- Client: file deletion UX (SET_DELETED action, EditorPane fallback) — added during Plan 03 human verification
- All 42 tests (12 server + 30 client) pass with no regressions

Four human verification items remain for visual/timing confirmation of end-to-end behavior in the running app. These require the app to be started and observed interactively.

---

_Verified: 2026-03-10T09:09:30Z_
_Verifier: Claude (gsd-verifier)_
