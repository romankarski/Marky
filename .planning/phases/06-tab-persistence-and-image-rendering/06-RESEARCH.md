# Phase 6: Tab Persistence and Image Rendering - Research

**Researched:** 2026-03-10
**Domain:** React localStorage persistence, useLayoutEffect scroll restore, Fastify image proxy, react-markdown image component override
**Confidence:** HIGH

## Summary

Phase 6 delivers two independent capabilities. First, tab persistence: the app serializes open tab paths and active tab ID to `localStorage` via a `useEffect` watching the `useTabs` state, then re-hydrates on startup by dispatching `OPEN` actions for each saved path. Scroll positions are tracked per-file-path in a separate `localStorage` key, saved on scroll with 200ms debounce, and restored via `useLayoutEffect` (fires synchronously before paint, preventing visible jump). A `recentFiles` list is maintained separately and surfaced on the `WelcomeScreen`. Second, image rendering: a new Fastify route `GET /api/image?path=<encoded>` reads local image files and streams them with the correct MIME type; the existing `img` override in `MarkdownPreview` is replaced with logic that constructs a proxy URL, with relative paths resolved client-side using the open file's directory (passed as a new `filePath` prop).

The patterns for both capabilities follow established project conventions exactly: `localStorage` is already used in `App.tsx` for sidebar/TOC collapse state; the `resolveSafePath` path security guard is already shared server infrastructure; the `img` component override slot already exists in `MarkdownPreview` (currently renders a placeholder). No new npm packages are required on either side.

**Primary recommendation:** Implement as four focused units — (1) `useTabPersistence` hook layered on top of `useTabs`, (2) `useScrollPersist` hook owned by the preview scroll container, (3) `WelcomeScreen` enhanced with `recentFiles` props, (4) `server/src/routes/images.ts` new Fastify route registered in `app.ts`.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Persistence storage**
- Use `localStorage` — no server changes needed, instant reads/writes, fits the single-user local app model
- Save on every `useTabs` state change via `useEffect` watching `tabs` and `activeTabId`
- Serialize as JSON: `{ tabs: [{ path, label }], activeTabId, order: [id...] }` — content is NOT saved (always re-fetched fresh from disk on restore)
- State saved: file paths, tab order, and which tab was active — dirty/editMode state is not persisted (edits in progress are lost on reload, which is acceptable)
- If a persisted file no longer exists on disk: open the tab but show the existing `deleted` indicator — consistent with how externally-deleted files already behave; no silent failures

**Recent files on welcome screen**
- Show 5 most recently opened files
- Each entry shows: filename prominently + folder path below it (e.g., "decisions.md" / "knowledge/current") — enough context to distinguish files with the same name in different folders
- Stored in `localStorage` alongside tab state — updated whenever a file is opened
- Welcome screen only appears when no tabs are open — if tabs restore successfully on reload, go straight to the last active tab (welcome screen is the empty state, not a persistent home)
- Clicking a recent file opens it as a tab (same as clicking in the file tree)

**Scroll position restore**
- Save exact `scrollTop` pixel position per file path, debounced 200ms on scroll events
- Stored in `localStorage` keyed by file path (separate from tab state, persists across sessions)
- Restore on content load using `useLayoutEffect` — fires synchronously before paint to avoid visible scroll jump; only triggers when content transitions from null → loaded string
- Per-tab scroll memory also active when switching between tabs: save position on tab leave, restore on tab focus — same tracking code, both on reload and on tab switch

**Image serving**
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

### Deferred Ideas (OUT OF SCOPE)
- None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| PRST-01 | Tabs reopen automatically on page reload with their previous files | localStorage serialization of `{ tabs: [{path, label}], activeTabId }` in `useTabPersistence` hook; dispatch OPEN per persisted path on mount |
| PRST-02 | Recently opened files shown on welcome screen for quick access | `marky:recent` localStorage key updated on every `openTab` call; `WelcomeScreen` accepts `recentFiles` + `onOpen` props; shows 5 entries with filename + folder path |
| PRST-03 | Reloaded tabs restore their last scroll position in preview | `useScrollPersist(filePath, content)` hook attaches scroll listener (debounced 200ms) and `useLayoutEffect` restore; triggered when content transitions null → string |
| IMG-01 | Images with relative paths render in markdown preview using the file's directory as base | `MarkdownPreview` receives `filePath` prop; `img` override resolves `./` and `../` paths against file directory; passes absolute path to `/api/image?path=` |
| IMG-02 | Images with absolute paths render correctly in markdown preview | Absolute paths (starting with `/`) passed directly to `/api/image?path=`; server validates ROOT_DIR containment; root-relative paths resolved against ROOT_DIR |
</phase_requirements>

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `localStorage` (browser API) | native | Persist tab state, scroll positions, recent files | Already used in project for sidebar/TOC collapse; zero dependencies, synchronous, ideal for single-user local app |
| React `useEffect` | React 19 (already installed) | Watch state changes and write to localStorage | Standard React pattern; already used throughout codebase |
| React `useLayoutEffect` | React 19 (already installed) | Restore scroll position synchronously before paint | Prevents visible scroll jump; fires before browser paint unlike useEffect |
| Fastify route handler | Fastify ^5.8.0 (already installed) | Image proxy endpoint | Matches existing route pattern; `@fastify/static` already registered |
| `fs/promises` | Node built-in | Read image bytes for proxy response | Already used in all server routes |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `path` (Node built-in) | built-in | Resolve image paths, compute MIME from extension | Extension-based MIME map avoids adding `mime` package |
| `resolveSafePath` (internal) | project lib | Path traversal guard for image route | Already shared, already handles macOS symlink edge case |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Extension-based MIME map | `mime` npm package | `mime` adds a dependency; extension map covers the 5 needed types (png, jpeg, gif, webp, svg+xml) with zero overhead |
| `useLayoutEffect` scroll restore | `useEffect` + `setTimeout` | `useEffect` fires after paint causing visible jump; `useLayoutEffect` is the correct synchronous hook for DOM measurements |
| Hook-layer pattern (`useTabPersistence`) | Modify `tabReducer` directly | Reducer modification would complicate pure reducer tests; hook layer is additive and follows established project pattern |

**Installation:** No new packages needed — all requirements met by existing dependencies.

---

## Architecture Patterns

### Recommended Project Structure
```
client/src/hooks/
├── useTabs.ts              # existing — unchanged
├── useTabPersistence.ts    # NEW: reads/writes localStorage for tab state + recent files
└── useScrollPersist.ts     # NEW: scroll save (debounced) + restore (useLayoutEffect)

client/src/components/
├── WelcomeScreen.tsx       # MODIFIED: add recentFiles section
└── MarkdownPreview.tsx     # MODIFIED: add filePath prop, replace img placeholder with proxy URL

server/src/routes/
├── images.ts               # NEW: GET /api/image?path= route
└── files.ts                # existing — unchanged

server/src/app.ts           # MODIFIED: register imagesRoutes
```

### Pattern 1: Hook Layer for Persistence (useTabPersistence)
**What:** A hook that wraps `useTabs`, adds localStorage read on init, writes on every state change, and tracks recent files.
**When to use:** When persistence must not contaminate the pure reducer, and when the write-on-change pattern is idiomatic React.
**Example:**
```typescript
// Pattern: lazy initializer reads from localStorage once; useEffect writes on each change
const TABS_KEY = 'marky:tabs';
const RECENT_KEY = 'marky:recent';
const MAX_RECENT = 5;

function loadPersistedTabs(): Array<{ path: string; label: string }> {
  try {
    const raw = localStorage.getItem(TABS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed?.tabs) ? parsed.tabs : [];
  } catch {
    return [];
  }
}

// In App.tsx — on mount, dispatch OPEN for each persisted path
// tabs/activeTabId written on every change via useEffect in useTabPersistence
```

### Pattern 2: useLayoutEffect Scroll Restore
**What:** A hook that attaches a debounced scroll listener to a ref element, saves scrollTop to localStorage, and uses `useLayoutEffect` to restore synchronously when content loads.
**When to use:** Any time scroll position must be restored without a visible jump; `useLayoutEffect` is the correct hook because it runs synchronously after DOM mutations but before paint.
**Example:**
```typescript
// Source: React docs — useLayoutEffect for DOM reads before paint
const prevContentRef = useRef<string | null>(null);

useLayoutEffect(() => {
  // Only restore when content transitions from null/loading → actual string
  if (content === null || prevContentRef.current !== null) return;
  prevContentRef.current = content;
  const saved = scrollPositions[filePath];
  if (saved !== undefined && containerRef.current) {
    containerRef.current.scrollTop = saved;
  }
}, [content, filePath]);
```

### Pattern 3: Fastify Image Proxy Route
**What:** A GET route that reads query param `path`, validates it with `resolveSafePath`, reads the file, sets Content-Type header from extension map, and streams bytes.
**When to use:** Whenever browser needs to serve local filesystem files through the dev server origin (file:// is blocked in browser contexts).
**Example:**
```typescript
// Follows existing pattern in server/src/routes/files.ts
const MIME_MAP: Record<string, string> = {
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif':  'image/gif',
  '.webp': 'image/webp',
  '.svg':  'image/svg+xml',
};

fastify.get<{ Querystring: { path: string } }>('/api/image', async (req, reply) => {
  const rawPath = req.query.path;
  const safe = await resolveSafePath(rawPath, fastify.rootDir).catch(() => null);
  if (!safe) { reply.code(403); return; }
  const ext = path.extname(safe).toLowerCase();
  const mime = MIME_MAP[ext];
  if (!mime) { reply.code(415); return; }
  const bytes = await fs.readFile(safe).catch(() => null);
  if (!bytes) { reply.code(404); return; }
  reply.header('Content-Type', mime);
  return reply.send(bytes);
});
```

### Pattern 4: MarkdownPreview img Override with Relative Path Resolution
**What:** The `img` component override receives `filePath` (the open file's path, relative to ROOT) and constructs a `/api/image?path=` URL. Relative paths are resolved client-side using `path.posix` or string operations.
**When to use:** Replaces the existing placeholder span in `MarkdownPreview`.
**Example:**
```typescript
// MarkdownPreview receives filePath: string prop
// img override (inside ReactMarkdown components):
img: ({ src, alt }) => {
  if (!src) return null;
  const isRemote = src.startsWith('http://') || src.startsWith('https://');
  if (isRemote) return <img src={src} alt={alt} className="max-w-full rounded-lg" />;

  let resolvedPath: string;
  if (src.startsWith('/')) {
    // Absolute or root-relative — pass as-is; server resolves root-relative paths
    resolvedPath = src;
  } else {
    // Relative path — resolve against the open file's directory
    const dir = filePath.includes('/') ? filePath.substring(0, filePath.lastIndexOf('/')) : '';
    resolvedPath = dir ? `${dir}/${src.replace(/^\.\//, '')}` : src.replace(/^\.\//, '');
    // Handle ../ by normalizing (simple approach: use URL with dummy base)
    try {
      const url = new URL(resolvedPath, 'file:///dummy/');
      resolvedPath = url.pathname.slice(1); // strip leading /
    } catch { /* use as-is */ }
  }
  return (
    <img
      src={`/api/image?path=${encodeURIComponent(resolvedPath)}`}
      alt={alt}
      className="max-w-full rounded-lg"
    />
  );
},
```

### Anti-Patterns to Avoid
- **Saving `content` in localStorage:** Tab content is always re-fetched fresh from disk on restore. Content in localStorage would be stale and bloat storage (markdown files can be large).
- **Restoring scroll in `useEffect` instead of `useLayoutEffect`:** `useEffect` fires after paint, causing a visible scroll jump. `useLayoutEffect` is the correct hook for DOM measurements and mutations that must happen before paint.
- **Triggering scroll restore on every render:** Only trigger when content transitions `null → string` (the initial load event). Use a `useRef` to track the previous content state.
- **Resolving relative image paths server-side from the raw `./` string:** The server does not know which file the image appeared in. Relative paths MUST be resolved client-side before being passed to the proxy endpoint.
- **Registering image route before files routes in app.ts:** Maintain registration order consistency with existing routes; wildcard routes could shadow query-param routes if ordered incorrectly (though Fastify uses exact-match priority, still keep the pattern clean).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Path traversal prevention | Custom regex/contains check | `resolveSafePath` (already exists in `server/src/lib/pathSecurity.ts`) | Already handles macOS symlink edge case (`/var` → `/private/var`), URL decoding, and non-existent path reconstruction |
| MIME type detection | Parsing magic bytes | Extension map (`MIME_MAP` constant, 5 entries) | All image types in scope are identified by extension; magic bytes adds complexity with zero benefit for this use case |
| Debounce for scroll save | Manual `setTimeout` + `clearTimeout` | Inline debounce pattern with `useRef` storing the timeout ID (same pattern as `useAutoSave`) | The project already has this pattern; no new `lodash.debounce` needed |

**Key insight:** The path security story is already solved. The only new server code is reading bytes and setting a Content-Type header — the hard part (path validation) is reused.

---

## Common Pitfalls

### Pitfall 1: useLayoutEffect Fires Too Early (content not yet in DOM)
**What goes wrong:** `useLayoutEffect` fires synchronously after every render that changes `content`. If the scroll container's content isn't actually rendered yet (e.g., `ReactMarkdown` hasn't committed nodes), `scrollTop` assignment has no effect or sets to a stale position.
**Why it happens:** `useLayoutEffect` fires after React commits to the DOM but the markdown render is async within the same commit cycle. The STATE.md explicitly flags this: "scroll restore timing — useLayoutEffect plus async content load interaction; timing edge case must be verified against real long documents."
**How to avoid:** Gate the restore on content transitioning from `null` to a non-null string (the first real load). Track previous content in a `useRef`. For very large documents, a `requestAnimationFrame` wrapper inside the layout effect can give the DOM one more frame to paint the markdown before setting `scrollTop`.
**Warning signs:** In testing, `scrollTop` reads as `0` immediately after setting it (container not scrollable yet because content isn't rendered to its full height).

### Pitfall 2: localStorage JSON Parse Failure on Corrupt Data
**What goes wrong:** If the app crashed mid-write or the user manually edited localStorage, `JSON.parse` throws and the app fails to load any tabs.
**Why it happens:** `localStorage` writes are not atomic; a crash between `setItem` calls (for tabs vs. scroll positions) leaves partial data.
**How to avoid:** Always wrap `JSON.parse` in try/catch and return an empty/default state on failure. Treat corrupt storage as "no saved state."
**Warning signs:** App shows blank screen on reload instead of WelcomeScreen.

### Pitfall 3: Stale Tab IDs After Restore
**What goes wrong:** Persisted tab state stores `id` values (UUIDs). On restore, new UUIDs are generated by `tabReducer` OPEN. If any code tries to match `activeTabId` from storage against the new IDs, it will fail.
**Why it happens:** The CONTEXT.md decision is to save `{ path, label }` only, not `id`. The `activeTabId` in persisted state must be matched by path, not by stored UUID.
**How to avoid:** After dispatching all `OPEN` actions, read the freshly-generated tab IDs from state and focus the one whose `path` matches the stored `activeTabId`'s path. Never persist UUIDs as the focus target — persist the `path` of the active tab instead.
**Warning signs:** On reload, first tab opens but active focus is wrong (shows loading state on a non-first tab).

### Pitfall 4: Recent Files List Grows Without Bound
**What goes wrong:** If `recentFiles` is appended to without a cap and without deduplication, the list grows to include many stale entries.
**Why it happens:** Opening the same file twice adds a duplicate. Files deleted from disk still appear in the list.
**How to avoid:** On each `openTab` call: prepend new path, deduplicate by path (remove older occurrence), slice to 5 entries. For deleted files, show them in the recent list anyway (clicking will open with `deleted` indicator) — or silently skip if the file doesn't exist (the CONTEXT.md says only the tab restore uses the deleted indicator; for recent files, the simpler behavior is fine either way — leave as Claude's discretion).

### Pitfall 5: Image Route Returns 403 for ROOT_DIR Absolute Paths
**What goes wrong:** Absolute paths like `/Users/romankarski/notes/img.png` passed to the proxy are checked against ROOT_DIR. If ROOT_DIR is `/Users/romankarski/notes`, the image is inside ROOT_DIR and passes. But if ROOT_DIR is a subdirectory and the image is in a sibling directory, it correctly returns 403.
**Why it happens:** The security design intentionally constrains to ROOT_DIR. The CONTEXT.md accepts this behavior.
**How to avoid:** Document clearly that the app only serves images within ROOT_DIR. The `MarkdownPreview` img override should construct the proxy URL and let the 403 result in a broken image — this is the accepted behavior per CONTEXT.md ("server returns 404, browser shows default broken image icon").

---

## Code Examples

Verified patterns from existing codebase:

### Existing localStorage Pattern (from App.tsx lines 152-163)
```typescript
// Pattern already in use: lazy initializer + imperative write on change
const [sidebarCollapsed, setSidebarCollapsed] = useState(
  () => localStorage.getItem('marky-sidebar-collapsed') === 'true'
);
const toggleSidebar = () => setSidebarCollapsed(v => {
  const next = !v;
  localStorage.setItem('marky-sidebar-collapsed', String(next));
  return next;
});
```
For tabs, the write is in a `useEffect` watching state (because state comes from `useReducer`, not `useState`):
```typescript
// useTabPersistence pattern — additive layer, no reducer changes
useEffect(() => {
  const serialized = {
    tabs: tabs.map(t => ({ path: t.path, label: t.label })),
    activeTabPath: tabs.find(t => t.id === activeTabId)?.path ?? null,
  };
  localStorage.setItem('marky:tabs', JSON.stringify(serialized));
}, [tabs, activeTabId]);
```

### Existing resolveSafePath Usage Pattern (from server/src/routes/files.ts lines 25-29)
```typescript
// Reuse exactly this pattern in images.ts
const safe = await resolveSafePath(req.query.path, fastify.rootDir).catch(() => {
  reply.code(403);
  return null;
});
if (!safe) return;
```

### Existing img Override Placeholder (from MarkdownPreview.tsx lines 74-82)
```typescript
// Current placeholder — replace this in Phase 6:
img: ({ src, alt }) => {
  const isRemote = src && (src.startsWith('http://') || src.startsWith('https://'));
  if (isRemote) return <img src={src} alt={alt} className="max-w-full rounded-lg" />;
  return (
    <span className="inline-flex items-center gap-1 text-sm text-gray-400 italic">
      [{alt ?? 'image'}]
    </span>
  );
},
```

### useAutoSave Debounce Pattern (project pattern — same approach for scroll save)
The existing `useAutoSave` hook (tested in `client/src/hooks/__tests__/useAutoSave.test.ts`) uses a `useRef` to hold the timeout ID and `clearTimeout` in the effect cleanup. The scroll debounce uses the same shape:
```typescript
const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
const handleScroll = useCallback(() => {
  if (debounceRef.current) clearTimeout(debounceRef.current);
  debounceRef.current = setTimeout(() => {
    if (containerRef.current) {
      saveScrollPosition(filePath, containerRef.current.scrollTop);
    }
  }, 200);
}, [filePath]);
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| File:// URLs for local images | Proxy endpoint through app server | Phase 6 (this phase) | Browser security model blocks file:// from localhost; proxy is the standard solution |
| React `useEffect` for DOM mutations | `useLayoutEffect` for DOM reads/mutations that must precede paint | React 16+ best practice | Eliminates visible scroll jump on content restore |

**Deprecated/outdated:**
- The `img` placeholder span (lines 74-82 of `MarkdownPreview.tsx`) has a comment "Defer proxy to Phase 4" — this was deferred and is now the focus of Phase 6.

---

## Open Questions

1. **Scroll restore on very large documents (PRST-03 blocker noted in STATE.md)**
   - What we know: `useLayoutEffect` fires before paint. For long documents, `ReactMarkdown` still renders synchronously in the same commit, so the full DOM height should be available by the time `useLayoutEffect` runs.
   - What's unclear: Whether very large markdown files (e.g., 500+ lines) cause the container to not yet have its full scroll height at `useLayoutEffect` time, making `scrollTop` assignment silently ignored.
   - Recommendation: Implement with `useLayoutEffect` first. During verification (Wave 2 or phase gate), test with a real long document. If `scrollTop` assignment is ignored, wrap in a single `requestAnimationFrame` call as the fallback.

2. **Root-relative image path interpretation**
   - What we know: CONTEXT.md says "root-relative paths (/notes/img.png): interpreted as relative to ROOT_DIR by the server."
   - What's unclear: The server's `resolveSafePath` already resolves paths relative to `rootDir` for API routes. But the image route receives the raw path string from the client. A path like `/notes/img.png` starts with `/` so `path.resolve(rootDir, '/notes/img.png')` on Node resolves to `/notes/img.png` (ignores rootDir). The server must strip the leading `/` before resolving against ROOT_DIR, or treat all paths starting with `/` that don't begin with rootDir as root-relative.
   - Recommendation: In the image route, if the path starts with `/` and is not an absolute filesystem path (heuristic: does not start with a known OS root like `/Users/`, `/home/`, etc.), strip the leading `/` and resolve relative to ROOT_DIR. Alternatively, the client always resolves root-relative paths against ROOT_DIR before encoding in the URL — this is simpler.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest ^4.0.18 (client), Vitest ^2.0.0 (server) |
| Config file | `client/vite.config.ts` (test.environment: jsdom), `server/vitest.config.ts` |
| Quick run command | `npm run test --workspace=client` |
| Full suite command | `npm run test --workspace=client && npm run test --workspace=server` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PRST-01 | Tab paths and active tab restored from localStorage on mount | unit | `npm run test --workspace=client -- --reporter=verbose` | ❌ Wave 0: `client/src/hooks/__tests__/useTabPersistence.test.ts` |
| PRST-02 | Recent files list maintained (5 entries, deduplicated, prepend-on-open) | unit | `npm run test --workspace=client -- --reporter=verbose` | ❌ Wave 0: covered in same test file |
| PRST-03 | Scroll position saved (debounced) and restored (useLayoutEffect) | unit | `npm run test --workspace=client -- --reporter=verbose` | ❌ Wave 0: `client/src/hooks/__tests__/useScrollPersist.test.ts` |
| IMG-01 | Relative image paths resolved against file directory and passed to proxy | unit | `npm run test --workspace=client -- --reporter=verbose` | ❌ Wave 0: `client/src/__tests__/MarkdownPreview.test.tsx` (extend existing or new) |
| IMG-02 | `/api/image?path=` route returns image bytes with correct MIME, rejects out-of-scope paths | integration | `npm run test --workspace=server` | ❌ Wave 0: `server/tests/routes/images.test.ts` |

### Sampling Rate
- **Per task commit:** `npm run test --workspace=client`
- **Per wave merge:** `npm run test --workspace=client && npm run test --workspace=server`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `client/src/hooks/__tests__/useTabPersistence.test.ts` — covers PRST-01, PRST-02 (uses `renderHook` from `@testing-library/react`, already installed; mock `localStorage` with `vi.stubGlobal`)
- [ ] `client/src/hooks/__tests__/useScrollPersist.test.ts` — covers PRST-03 (mock `localStorage`, mock `containerRef.current.scrollTop`)
- [ ] `server/tests/routes/images.test.ts` — covers IMG-01 path resolution (server-side), IMG-02 integration (follows pattern of `server/tests/api/files.test.ts`)
- [ ] `client/src/__tests__/MarkdownPreview.test.tsx` — covers client-side relative path resolution for IMG-01 (render component with `filePath` prop, check generated `src` attribute on `img`)

*(No framework install needed — all test infrastructure exists. `@testing-library/react` is already in `client/package.json` devDependencies at ^16.3.2.)*

---

## Sources

### Primary (HIGH confidence)
- Direct codebase inspection — `client/src/hooks/useTabs.ts`, `client/src/App.tsx`, `client/src/components/MarkdownPreview.tsx`, `client/src/components/WelcomeScreen.tsx`, `client/src/components/EditorPane.tsx`, `server/src/routes/files.ts`, `server/src/app.ts`, `server/src/lib/pathSecurity.ts`
- `client/package.json`, `server/package.json` — verified exact dependency versions
- `client/vite.config.ts`, `server/vitest.config.ts` — verified test infrastructure
- `client/src/__tests__/useTabs.test.ts`, `client/src/hooks/__tests__/useAutoSave.test.ts` — verified existing test patterns
- React documentation — `useLayoutEffect` fires synchronously after DOM mutations before paint (stable React behavior since React 16)

### Secondary (MEDIUM confidence)
- `client/src/types/tabs.ts` — Tab interface, confirmed `path` and `label` are the fields to persist (content/dirty/editMode/loading/deleted are all transient)
- `.planning/STATE.md` Blockers/Concerns section — "PRST-03: Scroll restore timing — useLayoutEffect plus async content load interaction; timing edge case must be verified against real long documents"

### Tertiary (LOW confidence)
- None — all findings verified from codebase or stable React API documentation

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all confirmed from package.json and existing source code
- Architecture: HIGH — patterns derived directly from existing codebase conventions
- Pitfalls: HIGH (localStorage/JSON) to MEDIUM (scroll timing) — scroll timing flagged as needing empirical verification per STATE.md

**Research date:** 2026-03-10
**Valid until:** 2026-04-10 (stable APIs; `useLayoutEffect` behavior is stable React)
