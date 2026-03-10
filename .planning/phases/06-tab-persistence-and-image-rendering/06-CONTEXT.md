# Phase 6: Tab Persistence and Image Rendering - Context

**Gathered:** 2026-03-10
**Status:** Ready for planning

<domain>
## Phase Boundary

Two independent capabilities: (1) Tabs survive page reloads — open tabs restore with correct order, active tab, and scroll position; recently opened files appear on the welcome screen. (2) Local images render in the markdown preview — relative paths resolve against the file's directory, absolute paths validate against ROOT_DIR.

Requirements: PRST-01, PRST-02, PRST-03, IMG-01, IMG-02

</domain>

<decisions>
## Implementation Decisions

### Persistence storage
- Use `localStorage` — no server changes needed, instant reads/writes, fits the single-user local app model
- Save on every `useTabs` state change via `useEffect` watching `tabs` and `activeTabId`
- Serialize as JSON: `{ tabs: [{ path, label }], activeTabId, order: [id...] }` — content is NOT saved (always re-fetched fresh from disk on restore)
- State saved: file paths, tab order, and which tab was active — dirty/editMode state is not persisted (edits in progress are lost on reload, which is acceptable)
- If a persisted file no longer exists on disk: open the tab but show the existing `deleted` indicator — consistent with how externally-deleted files already behave; no silent failures

### Recent files on welcome screen
- Show 5 most recently opened files
- Each entry shows: filename prominently + folder path below it (e.g., "decisions.md" / "knowledge/current") — enough context to distinguish files with the same name in different folders
- Stored in `localStorage` alongside tab state — updated whenever a file is opened
- Welcome screen only appears when no tabs are open — if tabs restore successfully on reload, go straight to the last active tab (welcome screen is the empty state, not a persistent home)
- Clicking a recent file opens it as a tab (same as clicking in the file tree)

### Scroll position restore
- Save exact `scrollTop` pixel position per file path, debounced 200ms on scroll events
- Stored in `localStorage` keyed by file path (separate from tab state, persists across sessions)
- Restore on content load using `useLayoutEffect` — fires synchronously before paint to avoid visible scroll jump; only triggers when content transitions from null → loaded string
- Per-tab scroll memory also active when switching between tabs: save position on tab leave, restore on tab focus — same tracking code, both on reload and on tab switch

### Image serving
- Add a Fastify proxy endpoint: `GET /api/image?path=<encoded-path>`
- Server reads the file, detects MIME type (image/png, image/jpeg, image/gif, image/webp, image/svg+xml), streams response
- Path validation: resolve path to absolute, assert it falls within ROOT_DIR — reject with 403 if outside
- Relative paths (./img.png, ../assets/photo.jpg): resolved client-side relative to the open file's directory before being passed to the proxy. MarkdownPreview receives the current file's path as a prop to compute this
- Absolute paths (/Users/romankarski/... or full filesystem paths): passed directly to proxy, server validates ROOT_DIR containment
- Root-relative paths (/notes/img.png): interpreted as relative to ROOT_DIR by the server
- Missing/out-of-scope images: server returns 404, browser shows default broken image icon — simple, standard behavior

### Claude's Discretion
- Exact localStorage key naming (e.g., `marky:tabs`, `marky:scroll`, `marky:recent`)
- MIME type detection approach (file extension map vs mime npm package)
- Path normalization details for cross-platform edge cases

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `useTabs` hook + `tabReducer`: useReducer-based tab state — persistence can be added as a useEffect layer on top without modifying the reducer
- `Tab` type: has `path`, `label`, `deleted`, `loading`, `dirty`, `editMode` — `path` and `label` are what's persisted; `content` is always re-fetched
- `WelcomeScreen` component: currently static (logo + tagline + hint text) — needs recent files section added
- `MarkdownPreview` component: already has an `img` component override with a deferred placeholder — replace with proxy URL logic; needs a new `filePath` prop to resolve relative paths
- `@fastify/static`: already registered on the server (used for client/dist in production) — proxy endpoint is a separate route, not a static mount

### Established Patterns
- Hook pattern: custom hook owns fetch + state, component receives via props — `useScrollPersist` or inline in preview container follows this
- Tailwind v4 CSS-first config — no config file, use utility classes directly
- Fastify route pattern: `app.get('/api/files/*path', handler)` in `server/src/routes/files.ts` — image route follows same structure in a new `server/src/routes/images.ts`
- Path security pattern already established in `files.ts` (resolve + assert startsWith ROOT_DIR) — reuse same guard in image route

### Integration Points
- `App.tsx`: `useTabs()` call — wrap with localStorage persistence (read on init, write on change)
- `MarkdownPreview`: receives `content` and `onLinkClick` today — add `filePath: string` prop for relative path resolution
- `WelcomeScreen`: receives no props today — add `recentFiles: RecentFile[]` and `onOpen: (path: string) => void` props
- Fastify server: new `/api/image` route in `server/src/routes/images.ts`, registered in `app.ts`

</code_context>

<specifics>
## Specific Ideas

- Scroll persistence should be per-tab as well as per-reload — natural "each tab remembers where you were" behavior users expect when switching between tabs
- The `deleted` tab indicator is already built — reuse it for files that were in localStorage but no longer exist on disk; no new UI needed

</specifics>

<deferred>
## Deferred Ideas

- None — discussion stayed within phase scope

</deferred>

---

*Phase: 06-tab-persistence-and-image-rendering*
*Context gathered: 2026-03-10*
