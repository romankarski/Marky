# Phase 8: Backlinks Panel — Research

**Researched:** 2026-03-13
**Domain:** Wikilink parsing, backlink index, right-panel UI, Fastify API
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| BKLN-01 | Right panel shows all files that link to the current document | Server-side backlink index + `GET /api/backlinks/:path` endpoint + `BacklinksPanel` React component |
| BKLN-02 | Clicking a backlink opens that file in a tab | `onOpen` prop calling existing `openTab` — same pattern as SearchPanel |
| BKLN-03 | Backlinks panel header shows count of incoming links (e.g., "Backlinks (3)") | Derived from the array length returned by the API; zero = "Backlinks (0)", not hidden |
</phase_requirements>

---

## Summary

Phase 8 adds a backlinks panel to the right TOC column. A "backlink" is any file in the vault that contains a link pointing to the currently-active file. The panel lives below `FileInfo` (which already sits at the top of the right column) and above `TableOfContents`.

The implementation has two halves. On the server a `BacklinkService` scans all markdown files for wikilinks (`[[Name]]`) and standard markdown links (`[label](path.md)`), builds an in-memory reverse index (target → list of sources), and exposes it via `GET /api/backlinks/:path`. On the client a `BacklinksPanel` component fetches that endpoint whenever `activeFilePath` changes, renders the list as clickable rows, and shows the count in the section header. A zero-count state must show "Backlinks (0)" rather than hiding the section entirely (BKLN-03 + success criterion 4).

**Primary recommendation:** Model the server-side `BacklinkService` directly on the existing `SearchService` (same `buildFromDir` / `updateDoc` / `removeDoc` lifecycle, same watcher integration). Model the client component on `TableOfContents` (small, stateless-ish, receives `activeFilePath` prop, lives inside the right panel column). Reuse `openTab` for click-to-open exactly as `SearchPanel` does.

---

## Standard Stack

### Core — already in project, no new installs needed

| Library | Version | Purpose | Notes |
|---------|---------|---------|-------|
| gray-matter | ^4.0.3 | Parse YAML frontmatter out of raw markdown before link scanning | Used by `SearchService._readDoc` |
| Node.js `fs/promises` | built-in | Read markdown files when building the backlink index | Same as all other server lib files |
| path (Node built-in) | built-in | Normalise relative links to rootDir-relative paths | |
| React | ^19.0.0 | `BacklinksPanel` component | Already installed |
| vitest | server: ^2, client: ^4 | Tests for `BacklinkService` (Node env) and `BacklinksPanel` (jsdom) | |

### No new npm packages required

The project already has everything it needs:
- Link detection is done with a simple regex scan over raw file content (no HTML parse needed)
- `remark-wiki-link` is already a client dep but is not needed on the server — plain regex is faster and avoids pulling remark into the server bundle

---

## Architecture Patterns

### Recommended File Structure

```
server/src/
├── lib/
│   └── backlinks.ts          # BacklinkService (new)
├── routes/
│   └── backlinks.ts          # GET /api/backlinks/:path (new)
└── app.ts                    # register BacklinkService + backlinksRoutes (edit)

client/src/
├── components/
│   └── BacklinksPanel.tsx    # UI component (new)
└── App.tsx                   # mount BacklinksPanel in right column (edit)

server/tests/
└── routes/
    └── backlinks.test.ts     # Wave 0 RED tests (new)

client/src/__tests__/
└── BacklinksPanel.test.tsx   # Wave 0 RED tests (new)
```

### Pattern 1: BacklinkService mirrors SearchService lifecycle

**What:** A server-side singleton service that holds an in-memory reverse map `Map<targetPath, sourcePath[]>`. It scans all `.md` files on `buildFromDir`, updates one file on `updateDoc`, and drops one file on `removeDoc`. It is registered as a Fastify decorator (same as `fileWatcher`, `searchService`, `rootDir`).

**Why:** The existing watcher already calls `searchService.updateDoc` and `searchService.removeDoc` on file changes. Wiring `backlinkService` into the same subscriber keeps the index live with zero extra polling.

**Key implementation notes:**
- `buildFromDir` iterates the same `collectMdFiles` logic (or imports a shared helper)
- `updateDoc` must first *remove* all outgoing links from the old record for that file, then re-parse and add the new set — otherwise renamed links accumulate stale entries
- `getBacklinks(targetPath: string): string[]` is the only public query method needed by the route

### Pattern 2: Link extraction via regex (server-side only)

**What:** Two regex passes over raw file content after stripping frontmatter with gray-matter:

```typescript
// Wikilinks: [[FileName]] or [[FileName|Alias]]
const WIKI_LINK = /\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g;

// Standard markdown links to .md files: [label](path.md) or [label](./path.md)
const MD_LINK = /\[(?:[^\]]*)\]\(([^)]+\.md)\)/g;
```

Wikilink target normalisation:
1. Strip leading `./` if present
2. Append `.md` extension if the target has no extension
3. Lower-case the result (macOS is case-insensitive; normalise for consistent matching)

Standard markdown link normalisation:
1. Resolve relative to the file's directory using `path.resolve(fileDir, href)` then `path.relative(rootDir, absolute)` to get a rootDir-relative path
2. Lower-case

The STATE.md "Blockers/Concerns" entry confirms: *"Wikilink parsing edge cases — `[[Wiki Link With Spaces]]` normalization needs unit tests before panel ships; normalize to lowercase for macOS case-insensitive FS."* This is a known concern — unit tests covering space normalisation must exist in Wave 0.

### Pattern 3: GET /api/backlinks/:path route

**What:** A Fastify route that takes the relative path of the currently-active file (URL-encoded), looks it up in `BacklinkService`, and returns the list of source paths.

```typescript
// server/src/routes/backlinks.ts
fastify.get<{ Params: { '*': string } }>('/api/backlinks/*', async (req, reply) => {
  const filePath = req.params['*'];
  // Same wildcard pattern as PATCH /api/files/* in search.ts
  const backlinks = fastify.backlinkService.getBacklinks(filePath.toLowerCase());
  return { backlinks };  // string[]
});
```

Response shape: `{ backlinks: string[] }` — each element is a rootDir-relative path.

Note: Use the wildcard parameter style (`/api/backlinks/*`) already proven in `search.ts` PATCH handler, which documents that "Fastify 5 does not support wildcards in the middle of routes". This handles paths with slashes (e.g., `knowledge/decisions.md`).

### Pattern 4: BacklinksPanel React component

**What:** A component that:
1. Receives `activeFilePath: string | null` and `onOpen: (path: string) => void` as props
2. `useEffect` fetches `/api/backlinks/${activeFilePath}` whenever `activeFilePath` changes
3. Renders a header "Backlinks (N)" where N is the array length
4. Maps each path to a clickable button that calls `onOpen(path)`, styled consistently with the existing right-panel items

**Pattern reference:** `SearchPanel.tsx` — it also receives a list of paths + `onOpen` callback and renders clickable rows.

**Empty state (BKLN-03 + success criterion 4):** When the backlinks array is empty, render:
```tsx
<p className="text-xs text-gray-300 px-4 py-2">No incoming links</p>
```
The header **must still show "Backlinks (0)"** — do not `return null` when empty.

**Loading state:** While fetch is in-flight, show nothing (or a subtle "—" placeholder) — same approach as `FileInfo` which renders null when `activeFilePath` is null.

**Placement in App.tsx:** Insert `<BacklinksPanel>` in the right TOC column directly after `<FileInfo>` and before the `<TableOfContents>` conditional. The right panel already has `flex-col` layout, so the three sections stack naturally.

### Anti-Patterns to Avoid

- **Scanning links at query-time (per-request):** Do not walk the filesystem on every `GET /api/backlinks` call. Build the index at startup and update it incrementally via the watcher — same as SearchService.
- **Using remark on the server to parse links:** Overkill; plain regex is sufficient, faster to execute, and keeps the server side free of the remark plugin ecosystem.
- **Hiding the panel when there are zero backlinks:** Success criterion 4 explicitly requires "zero count, not hidden." The component must always render when a file is open.
- **Normalisation mismatch:** If the index is keyed by original-case paths but queries arrive lowercase (or vice versa), all lookups silently return []. Normalise both index keys and query params to the same case.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead |
|---------|-------------|-------------|
| Wikilink parsing | Custom parser with edge-case handling | Two simple regexes — project already uses `remark-wiki-link` on the client, confirming the format is `[[Name]]` |
| File change notifications | Polling or second watcher | Subscribe to the **existing** `FileWatcherService` in `app.ts` (same as `searchService`) |
| Path security | Ad-hoc path sanitisation | `resolveSafePath` from `server/src/lib/pathSecurity.ts` — already used by `files.ts` and `search.ts` |

---

## Common Pitfalls

### Pitfall 1: Stale outgoing-link entries after file edit
**What goes wrong:** `updateDoc` adds new links for a file but never removes its old links. If a file previously linked to `A` and now links to `B`, `A` retains a stale backlink entry.
**Root cause:** Naive append-only index update.
**How to avoid:** In `updateDoc`, call an internal `_removeFileLinks(relPath)` helper first, then re-parse and add fresh links. Maintain a forward map `Map<source, Set<target>>` alongside the reverse map, so `_removeFileLinks` knows which targets to clean up.
**Warning signs:** Integration test that edits a file and checks the backlinks index still shows old entries.

### Pitfall 2: Case-sensitivity mismatch on macOS
**What goes wrong:** `[[My File]]` and `[[my file]]` resolve to the same file on macOS (case-insensitive FS) but produce different index keys, leading to missed backlinks.
**Root cause:** Not normalising both the index keys and the wikilink targets to the same case.
**How to avoid:** Lowercase all paths when inserting into the reverse map and when querying it.
**Warning signs:** Unit test with mixed-case wikilink that should match but returns empty array.

### Pitfall 3: Wikilinks with spaces
**What goes wrong:** `[[Wiki Link With Spaces]]` — the raw text includes spaces; the resolved path must be `wiki-link-with-spaces.md` or `Wiki Link With Spaces.md` depending on how files are actually named.
**Root cause:** No canonical slug transform defined.
**How to avoid:** Do not apply slug-style transforms (spaces → dashes) in the server-side index. Instead treat the wikilink target as a *filename stem* and look for a file whose basename (lowercased, without extension) matches the target (lowercased). A linear scan over known file paths is acceptable given typical vault sizes.
**Warning signs:** STATE.md calls this out directly as a concern; unit tests must cover this case before the panel ships.

### Pitfall 4: Fastify wildcard route for paths with slashes
**What goes wrong:** `/api/backlinks/knowledge/decisions.md` — the path segment after the prefix contains slashes, so a named `:param` route would only capture `knowledge`.
**Root cause:** Standard Fastify named params stop at `/`.
**How to avoid:** Use the wildcard route pattern `/api/backlinks/*` with `req.params['*']`, exactly as done in the PATCH `/api/files/*` handler in `search.ts`.

### Pitfall 5: BacklinkService not yet ready when first request arrives
**What goes wrong:** `buildFromDir` is async and the server starts immediately; a request arriving before the scan completes returns an empty array.
**Root cause:** `buildFromDir` runs in the background (same as `SearchService`).
**How to avoid:** Return an empty array gracefully — this is acceptable behaviour. The watcher will keep the index current after startup. Same handling as `SearchService` (no blocking of server startup).

---

## Code Examples

### BacklinkService skeleton (server)

```typescript
// server/src/lib/backlinks.ts
import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';

const WIKI_LINK = /\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g;
const MD_LINK   = /\[(?:[^\]]*)\]\(([^)]+\.md)\)/g;

export class BacklinkService {
  // reverse: target (normalised) → set of source paths (normalised)
  private reverse = new Map<string, Set<string>>();
  // forward: source → set of targets (to enable clean removal)
  private forward = new Map<string, Set<string>>();

  async buildFromDir(rootDir: string): Promise<void> { /* ... */ }

  async updateDoc(rootDir: string, relPath: string): Promise<void> {
    this._removeFileLinks(relPath);
    const targets = await this._extractTargets(rootDir, relPath);
    this.forward.set(relPath.toLowerCase(), new Set(targets));
    for (const t of targets) {
      if (!this.reverse.has(t)) this.reverse.set(t, new Set());
      this.reverse.get(t)!.add(relPath.toLowerCase());
    }
  }

  removeDoc(relPath: string): void {
    this._removeFileLinks(relPath);
    this.forward.delete(relPath.toLowerCase());
    this.reverse.delete(relPath.toLowerCase());
  }

  getBacklinks(targetPath: string): string[] {
    return Array.from(this.reverse.get(targetPath.toLowerCase()) ?? []);
  }

  private _removeFileLinks(relPath: string): void {
    const norm = relPath.toLowerCase();
    const oldTargets = this.forward.get(norm) ?? new Set();
    for (const t of oldTargets) {
      this.reverse.get(t)?.delete(norm);
    }
    this.forward.delete(norm);
  }

  private async _extractTargets(rootDir: string, relPath: string): Promise<string[]> {
    // Read file, strip frontmatter, apply both regexes, normalise targets
    // Return rootDir-relative lowercase paths
    const raw = await fs.readFile(path.join(rootDir, relPath), 'utf-8');
    const content = matter(raw).content;
    const fileDir = path.dirname(relPath);
    const targets: string[] = [];

    for (const m of content.matchAll(WIKI_LINK)) {
      const stem = m[1].trim().toLowerCase();
      // Try to match against a known file — for index building, append .md as fallback
      targets.push(stem.endsWith('.md') ? stem : `${stem}.md`);
    }
    for (const m of content.matchAll(MD_LINK)) {
      const href = m[1];
      const resolved = path.relative(rootDir, path.resolve(path.join(rootDir, fileDir), href));
      targets.push(resolved.toLowerCase());
    }
    return targets;
  }
}
```

### Route handler (server)

```typescript
// server/src/routes/backlinks.ts
import { FastifyPluginAsync } from 'fastify';

const backlinksRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get<{ Params: { '*': string } }>('/api/backlinks/*', async (req, _reply) => {
    const filePath = req.params['*'];
    const backlinks = fastify.backlinkService.getBacklinks(filePath);
    return { backlinks };
  });
};

export default backlinksRoutes;
```

### BacklinksPanel component (client)

```tsx
// client/src/components/BacklinksPanel.tsx
import { useState, useEffect } from 'react';

interface Props {
  activeFilePath: string | null;
  onOpen: (path: string) => void;
}

export function BacklinksPanel({ activeFilePath, onOpen }: Props) {
  const [backlinks, setBacklinks] = useState<string[]>([]);

  useEffect(() => {
    if (!activeFilePath) { setBacklinks([]); return; }
    fetch(`/api/backlinks/${activeFilePath}`)
      .then(r => r.json())
      .then((data: { backlinks: string[] }) => setBacklinks(data.backlinks))
      .catch(() => setBacklinks([]));
  }, [activeFilePath]);

  if (activeFilePath === null) return null;

  return (
    <div className="px-4 py-3 border-b border-gray-200">
      <p className="text-sm font-semibold text-gray-700 mb-2">
        Backlinks ({backlinks.length})
      </p>
      {backlinks.length === 0 ? (
        <p className="text-xs text-gray-300">No incoming links</p>
      ) : (
        <ul className="space-y-1">
          {backlinks.map(path => (
            <li key={path}>
              <button
                onClick={() => onOpen(path)}
                className="w-full text-left text-xs text-orange-600 hover:text-orange-800 truncate"
                title={path}
              >
                {path.split('/').pop()?.replace(/\.md$/, '') ?? path}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

### App.tsx mount point (right column, after FileInfo, before TOC)

```tsx
// In App.tsx right TOC panel, after <FileInfo ... />
<BacklinksPanel
  activeFilePath={activeFocusedTab?.path ?? null}
  onOpen={(path) => { openTab(path); updateRecentFiles(path); expandFolder(path); }}
/>
```

### app.ts wiring additions

```typescript
// In buildApp, after BacklinkService import:
import { BacklinkService } from './lib/backlinks.js';
import backlinksRoutes from './routes/backlinks.js';

// After decorating backlinkService:
const backlinkService = new BacklinkService();
fastify.decorate('backlinkService', backlinkService);
backlinkService.buildFromDir(opts.rootDir).catch(() => {});

// Wire into watcher subscriber (alongside searchService calls):
watcher.subscribe((event) => {
  if (event.type === 'unlink') {
    searchService.removeDoc(event.path);
    backlinkService.removeDoc(event.path);      // add
  } else {
    searchService.updateDoc(opts.rootDir, event.path).catch(() => {});
    backlinkService.updateDoc(opts.rootDir, event.path).catch(() => {}); // add
  }
});

// Register route:
await fastify.register(backlinksRoutes);
```

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework (server) | vitest ^2.0.0 (Node env) |
| Framework (client) | vitest ^4.0.0 (jsdom env) |
| Config file (server) | `server/vitest.config.ts` — `include: ['tests/**/*.test.ts']` |
| Config file (client) | `client/vite.config.ts` — `test.environment: 'jsdom'`, `setupFiles: ['./src/test-setup.ts']` |
| Quick run (server) | `npm run test --workspace=server` |
| Quick run (client) | `npm run test --workspace=client` |
| Full suite | `npm run test --workspace=server && npm run test --workspace=client` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| BKLN-01 | GET /api/backlinks/\* returns files linking to target | integration | `npm run test --workspace=server` | ❌ Wave 0 |
| BKLN-01 | BacklinksPanel renders list when backlinks returned | unit | `npm run test --workspace=client` | ❌ Wave 0 |
| BKLN-02 | Clicking backlink row calls onOpen with correct path | unit | `npm run test --workspace=client` | ❌ Wave 0 |
| BKLN-03 | Header shows "Backlinks (N)" including zero count | unit | `npm run test --workspace=client` | ❌ Wave 0 |
| BKLN-03 | Zero-backlink state renders empty state message, not null | unit | `npm run test --workspace=client` | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `npm run test --workspace=server` or `npm run test --workspace=client` (whichever workspace was changed)
- **Per wave merge:** `npm run test --workspace=server && npm run test --workspace=client`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `server/tests/routes/backlinks.test.ts` — covers BKLN-01 (server side)
- [ ] `client/src/__tests__/BacklinksPanel.test.tsx` — covers BKLN-01 (render), BKLN-02 (click), BKLN-03 (count header + empty state)
- [ ] `server/tests/lib/backlinks.test.ts` — unit tests for `BacklinkService._extractTargets` covering wikilink spaces, case normalisation, standard markdown links, and stale-entry removal (the STATE.md concern)

---

## Open Questions

1. **Wikilink-to-filename resolution when multiple files share the same stem**
   - What we know: `[[Decisions]]` could match `knowledge/decisions.md` and `knowledge/archive/decisions.md`
   - What's unclear: Which match should be reported? Obsidian uses "shortest path wins."
   - Recommendation: For Phase 8, report all matches (conservative). This is safe and avoids silent misses. Document the behaviour in a code comment.

2. **Right panel height with three stacked sections (FileInfo + BacklinksPanel + TOC)**
   - What we know: STATE.md flags this as a concern for Phase 9 but it becomes visible in Phase 8
   - What's unclear: Whether long backlinks lists will push the TOC off-screen
   - Recommendation: Cap `BacklinksPanel` list at `max-h-40 overflow-y-auto` (same cap used by the tag picker dropdown in `FileInfo`). Revisit in Phase 9 visual review.

---

## Sources

### Primary (HIGH confidence)

- Direct code inspection: `server/src/lib/search.ts` — BacklinkService modelled on SearchService lifecycle
- Direct code inspection: `server/src/routes/search.ts` — wildcard route pattern for paths with slashes
- Direct code inspection: `server/src/app.ts` — Fastify decorator + watcher subscriber registration pattern
- Direct code inspection: `client/src/components/TableOfContents.tsx` — right-panel component structure
- Direct code inspection: `client/src/components/FileInfo.tsx` — right-panel placement, null-when-no-file pattern
- Direct code inspection: `client/src/App.tsx` — right panel layout, `activeFocusedTab`, `openTab` usage
- Direct code inspection: `client/src/components/MarkdownPreview.tsx` — confirms wikilink format is `[[Name]]`, `hrefTemplate` appends `.md`
- `.planning/STATE.md` — "Blockers/Concerns" section documents the wikilink normalisation concern explicitly

### Secondary (MEDIUM confidence)

- `client/package.json` — `remark-wiki-link ^2.0.1` confirms wikilink syntax used in this project
- `.planning/REQUIREMENTS.md` — BKLN-01/02/03 definition and success criteria

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new packages; all libraries already in project
- Architecture: HIGH — directly modelled on existing `SearchService` and `TableOfContents` patterns; zero speculation
- Pitfalls: HIGH — Pitfalls 1 and 2 are verified from code inspection; Pitfall 3 explicitly called out in STATE.md
- Test patterns: HIGH — copied from working templates.test.ts and FileInfo.test.tsx patterns

**Research date:** 2026-03-13
**Valid until:** 2026-06-13 (stable stack; all libraries are already installed)
