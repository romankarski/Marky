# Phase 5: Search and Tags - Research

**Researched:** 2026-03-10
**Domain:** Full-text search indexing (in-browser + server), YAML frontmatter parsing, React filter UI
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SRCH-01 | User can search for any word or phrase across all files with instant results | MiniSearch indexes all `.md` files server-side at startup; search runs entirely in-browser against serialized index; debounced input provides "instant" feel |
| SRCH-02 | Search results show file name, path, and a snippet of matching context | MiniSearch `storeFields` retains path + name; snippet extracted server-side at index time by storing first 500 chars of each file; `match` field in SearchResult identifies which terms matched for highlighting |
| SRCH-03 | User can click a search result to open the file at the matching location | `openTab(path)` already exists in App.tsx; clicking a result fires it; "matching location" for v1 means opening the file (per-line scroll-to is v2 scope per SRCH-04) |
| TAG-01 | App reads YAML frontmatter tags from markdown files automatically | `gray-matter` parses frontmatter on server at index build time; tags extracted from `data.tags` (array or comma-string); stored in index as `storeFields` |
| TAG-02 | User can filter the file tree / list by tag to see all files with that tag | Client-side filter using the same search index (or a separate tag-to-paths map returned by `/api/search/index`); FileTree receives a `filterPaths` prop limiting visible nodes |
| TAG-03 | User can add or edit tags on a file from the UI (written back to frontmatter) | Server endpoint reads file, uses `gray-matter.stringify` to write updated frontmatter back; existing `PUT /api/files/*` pattern extended or a new `PATCH /api/files/*/tags` route added |
</phase_requirements>

---

## Summary

Phase 5 adds full-text search and tag management. The key architectural decision is where the search index lives: building it in the browser at query time (read every file) is too slow; a proper external search server (Elasticsearch, Meilisearch) is out of scope for a local-first desktop app. The right pattern for this project is a **server-built index at startup** that is serialized and sent to the client once as JSON, after which all searching runs in-browser with MiniSearch. The index is rebuilt (or incrementally updated) when files change, piggybacking on the existing `FileWatcherService`.

Tag management uses `gray-matter` on the server to parse and write YAML frontmatter. The client already uses `remark-frontmatter` to suppress frontmatter rendering — the tags data is a server concern, not a remark concern. Tags are extracted at index time and returned alongside file metadata.

The phase is strictly additive. No existing routes, reducers, hooks, or components need modification to their core behaviour. New additions: `SearchService` (server), `/api/search/index` route, `useSearch` hook (client), `SearchPanel` component, tag filtering in the sidebar, and a tag editor in the file header.

**Primary recommendation:** Build and serialize the MiniSearch index server-side at startup. Ship it to the client as one JSON blob via `GET /api/search/index`. Run all searches in-browser. Use `gray-matter` on the server for all frontmatter read/write.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| MiniSearch | 7.x | In-browser full-text search engine | Zero dependencies; ~7 KB gzipped; first-class TypeScript; prefix + fuzzy search; serializable JSON index; used by VitePress, Astro, and others |
| gray-matter | 4.x | YAML/JSON frontmatter parse + stringify | Battle-tested (Gatsby, Astro, VitePress, TinaCMS); handles `tags: [a, b]` and `tags: a, b` string variants; `matter.stringify()` round-trips back to file without destroying content |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @types/gray-matter | 4.x | TypeScript types for gray-matter | gray-matter 4.x ships without bundled `.d.ts`; install from DefinitelyTyped |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| MiniSearch | FlexSearch 0.7.x | FlexSearch has npm version confusion (STATE.md flagged this); CJS/ESM export issues in 0.7.x; MiniSearch is ESM-clean and fully typed; recommendation: use MiniSearch |
| MiniSearch | Fuse.js | Fuse.js is fuzzy-only, no prefix search; MiniSearch has both and better relevance ranking |
| MiniSearch | Lunr.js | Lunr is unmaintained (last release 2021); MiniSearch is actively maintained |
| gray-matter | remark-parse-frontmatter | Already use remark-frontmatter to suppress rendering; adding a parse plugin chains complexity; gray-matter is simpler for server-side batch parse |
| gray-matter | js-yaml direct | Would need custom parse+stringify; gray-matter handles edge cases (delimiter variants, empty frontmatter, missing block) |
| Server-built index | Client-side build | Client would need to `fetch` every file to build the index — N round-trips at startup, unacceptable for large vaults |
| Single JSON endpoint | SSE incremental updates | Incremental SSE index updates are v2 complexity; re-fetch full index on file-change event is sufficient for v1 |

**Installation:**
```bash
npm install minisearch --workspace=client
npm install gray-matter --workspace=server
npm install --save-dev @types/gray-matter --workspace=server
```

---

## Architecture Patterns

### Recommended Project Structure

New files only (no modifications to existing structure):

```
server/src/
├── lib/
│   ├── watcher.ts          (existing)
│   ├── fsTree.ts           (existing)
│   ├── pathSecurity.ts     (existing)
│   └── search.ts           (NEW — SearchService: build/rebuild index)
├── routes/
│   ├── files.ts            (existing)
│   ├── watch.ts            (existing)
│   └── search.ts           (NEW — GET /api/search/index, PATCH /api/files/*/tags)

client/src/
├── hooks/
│   ├── useSearch.ts        (NEW — fetch index once, run MiniSearch queries)
│   └── useTags.ts          (NEW — tag filter state, active tag)
├── components/
│   ├── SearchPanel.tsx     (NEW — search input + results list)
│   └── TagFilter.tsx       (NEW — tag list sidebar section below file tree)
```

### Pattern 1: Server-Built Index, Client-Executed Search

**What:** Server walks rootDir at startup, reads every `.md` file, extracts text + frontmatter with gray-matter, builds a MiniSearch instance, serializes it to JSON, and stores it in memory. Client fetches this JSON once and deserializes with `MiniSearch.loadJSON()`. All subsequent searches are pure in-browser.

**When to use:** Local-first apps where files fit in memory and search latency must be <50ms.

**Example:**
```typescript
// server/src/lib/search.ts
import MiniSearch from 'minisearch';
import matter from 'gray-matter';
import fs from 'fs/promises';
import path from 'path';

export interface SearchDoc {
  id: string;       // relative path (unique)
  name: string;     // filename without extension
  path: string;     // relative path (stored for navigation)
  text: string;     // first 500 chars of body (for snippet)
  tags: string[];   // from frontmatter
}

export class SearchService {
  private index: MiniSearch<SearchDoc>;
  private docs: Map<string, SearchDoc> = new Map();

  constructor() {
    this.index = new MiniSearch<SearchDoc>({
      fields: ['name', 'text'],
      storeFields: ['name', 'path', 'text', 'tags'],
    });
  }

  async buildFromDir(rootDir: string): Promise<void> {
    const paths = await collectMdFiles(rootDir);
    const docs: SearchDoc[] = [];
    for (const absPath of paths) {
      const raw = await fs.readFile(absPath, 'utf-8');
      const { data, content } = matter(raw);
      const relPath = path.relative(rootDir, absPath);
      const tags = normaliseTags(data.tags);
      const doc: SearchDoc = {
        id: relPath,
        name: path.basename(absPath, '.md'),
        path: relPath,
        text: content.slice(0, 500),
        tags,
      };
      docs.push(doc);
      this.docs.set(relPath, doc);
    }
    this.index.addAll(docs);
  }

  serialize(): string {
    return JSON.stringify(MiniSearch.getDefault());
    // actual: return JSON.stringify(this.index);
  }

  getIndexJSON(): object {
    return JSON.parse(JSON.stringify(this.index));
  }

  getAllTags(): string[] {
    const all = new Set<string>();
    for (const doc of this.docs.values()) doc.tags.forEach(t => all.add(t));
    return [...all].sort();
  }

  getPathsForTag(tag: string): string[] {
    return [...this.docs.values()]
      .filter(d => d.tags.includes(tag))
      .map(d => d.path);
  }

  // Call on file change/add from FileWatcherService
  async updateDoc(rootDir: string, relPath: string): Promise<void> {
    const absPath = path.join(rootDir, relPath);
    const raw = await fs.readFile(absPath, 'utf-8').catch(() => null);
    if (!raw) { this.removeDoc(relPath); return; }
    const { data, content } = matter(raw);
    const doc: SearchDoc = {
      id: relPath,
      name: path.basename(relPath, '.md'),
      path: relPath,
      text: content.slice(0, 500),
      tags: normaliseTags(data.tags),
    };
    if (this.docs.has(relPath)) this.index.replace(doc);
    else this.index.add(doc);
    this.docs.set(relPath, doc);
  }

  removeDoc(relPath: string): void {
    if (this.docs.has(relPath)) {
      this.index.discard(relPath);
      this.docs.delete(relPath);
    }
  }
}

function normaliseTags(raw: unknown): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map(String);
  if (typeof raw === 'string') return raw.split(',').map(s => s.trim()).filter(Boolean);
  return [];
}

async function collectMdFiles(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const results: string[] = [];
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory() && !e.name.startsWith('.') && e.name !== 'node_modules') {
      results.push(...await collectMdFiles(full));
    } else if (e.isFile() && e.name.endsWith('.md')) {
      results.push(full);
    }
  }
  return results;
}
```

### Pattern 2: Client-Side Search with Deserialized Index

**What:** Client fetches the serialized MiniSearch JSON once on mount, deserializes with `MiniSearch.loadJSON()`, stores in a ref, and runs searches on every keystroke (debounced 150ms).

**When to use:** Any phase where the index was built server-side as above.

**Example:**
```typescript
// client/src/hooks/useSearch.ts
import { useState, useEffect, useRef, useCallback } from 'react';
import MiniSearch from 'minisearch';
import type { SearchResult } from 'minisearch';

export interface SearchIndexPayload {
  index: object;
  tags: string[];
  tagMap: Record<string, string[]>; // tag -> [path, ...]
}

export function useSearch() {
  const msRef = useRef<MiniSearch | null>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [indexPayload, setIndexPayload] = useState<SearchIndexPayload | null>(null);

  // Fetch index once on mount
  useEffect(() => {
    fetch('/api/search/index')
      .then(r => r.json())
      .then((payload: SearchIndexPayload) => {
        msRef.current = MiniSearch.loadJSON(JSON.stringify(payload.index), {
          fields: ['name', 'text'],
          storeFields: ['name', 'path', 'text', 'tags'],
        });
        setIndexPayload(payload);
      });
  }, []);

  const search = useCallback((q: string) => {
    setQuery(q);
    if (!msRef.current || !q.trim()) { setResults([]); return; }
    const res = msRef.current.search(q, { prefix: true, fuzzy: 0.2 });
    setResults(res.slice(0, 20));
  }, []);

  return { query, results, search, indexPayload };
}
```

### Pattern 3: Snippet Extraction (Custom, No Library)

**What:** MiniSearch does not provide built-in snippet extraction. The pattern is to store a short text excerpt in `storeFields` at index time, then find matched terms in that excerpt client-side.

**When to use:** Every search result display.

**Example:**
```typescript
// client/src/components/SearchPanel.tsx (helper)
function extractSnippet(text: string, matchTerms: string[]): string {
  const lowerText = text.toLowerCase();
  const firstTerm = matchTerms[0]?.toLowerCase();
  if (!firstTerm) return text.slice(0, 120);
  const idx = lowerText.indexOf(firstTerm);
  if (idx === -1) return text.slice(0, 120);
  const start = Math.max(0, idx - 40);
  const end = Math.min(text.length, idx + 80);
  return (start > 0 ? '…' : '') + text.slice(start, end) + (end < text.length ? '…' : '');
}
```

### Pattern 4: Frontmatter Write-Back with gray-matter

**What:** To update tags, read the raw file, parse with `matter()`, mutate `data.tags`, then write back with `matter.stringify(content, data)`.

**When to use:** TAG-03 — any time the user edits tags in the UI.

**Example:**
```typescript
// server route handler for PATCH /api/files/*/tags
import matter from 'gray-matter';

// In route handler:
const raw = await fs.readFile(safe, 'utf-8');
const parsed = matter(raw);
parsed.data.tags = newTags; // string[] from request body
const updated = matter.stringify(parsed.content, parsed.data);
await fs.writeFile(safe, updated, 'utf-8');
```

**Critical:** `matter.stringify(content, data)` — first arg is the body content (without frontmatter), second is the data object. Do NOT pass the original `raw` string as the first argument.

### Pattern 5: Tag Filtering in File Tree

**What:** FileTree already accepts a `nodes` prop that is a filtered subset of the tree. For tag filtering, maintain a `filterTag: string | null` state in App.tsx. When active, derive a `Set<string>` of matching paths from `indexPayload.tagMap[filterTag]` and pass it to FileTree as a `filterPaths` prop. FileTree shows only nodes whose path is in the set.

**Anti-Patterns to Avoid**

- **Hand-rolling frontmatter serialization:** Writing raw `---\ntags: [a,b]\n---` manually breaks for files with existing frontmatter fields. Always use `matter.stringify()`.
- **Building index in the browser at startup:** Fetching every file in the browser requires N API calls and blocks the UI. Index is built server-side.
- **Storing the full file content in the index:** Storing full text bloats the JSON payload. Store only first ~500 chars as a snippet. Full content stays on disk, fetched only when a tab opens.
- **Rebuilding the full index on every file change:** Use `index.replace()` / `index.discard()` for incremental updates. Only rebuild fully on server restart.
- **Re-fetching the whole index from client on every keystroke:** Fetch once on mount, store in a ref, query synchronously.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Full-text search ranking | Custom term frequency / BM25 | MiniSearch | Prefix, fuzzy, multi-field boosting, scoring — non-trivial to get right |
| YAML frontmatter parse | Regex to extract `tags:` line | gray-matter | Edge cases: quoted strings, multiline arrays, missing closing `---`, CRLF line endings, empty frontmatter |
| YAML frontmatter write-back | String manipulation / regex replacement | `matter.stringify()` | Preserves all other frontmatter fields; handles re-serialization correctly |
| Snippet extraction | Nothing complex needed | Simple index-based substring slice (Pattern 3 above) | Store 500-char excerpt at index time; slice around first match — sufficient for v1 |

**Key insight:** MiniSearch + gray-matter together handle the genuinely hard problems (ranking, YAML round-trip). The application-specific logic (snippet display, tag filter UI, index invalidation) is straightforward once the core libraries are in place.

---

## Common Pitfalls

### Pitfall 1: MiniSearch `loadJSON` config must match `addAll` config

**What goes wrong:** `MiniSearch.loadJSON(jsonString, options)` requires the same `fields` and `storeFields` as were used when building the index. If they differ, searches return no results or throw.

**Why it happens:** The serialized index doesn't embed the full config; the caller must re-supply it.

**How to avoid:** Export a `MINISEARCH_OPTIONS` const from a shared location (or from the search index API response) and use it in both `new MiniSearch(opts)` (server) and `MiniSearch.loadJSON(json, opts)` (client).

**Warning signs:** Zero search results even for terms that definitely exist in files.

### Pitfall 2: gray-matter stringify first argument is body content, not raw string

**What goes wrong:** Calling `matter.stringify(rawFileContent, data)` wraps the entire raw file (including old frontmatter) inside a new frontmatter block, producing double frontmatter.

**Why it happens:** `matter(raw).content` is the body without frontmatter. `matter.stringify` expects that body.

**How to avoid:** Always `const { content, data } = matter(raw)` then `matter.stringify(content, newData)`.

**Warning signs:** File grows on every save; frontmatter appears twice.

### Pitfall 3: Index is stale after file changes

**What goes wrong:** User edits a file, saves, searches — old content appears in snippet.

**Why it happens:** `SearchService` is built once at startup; `FileWatcherService` events are not wired to `SearchService.updateDoc()`.

**How to avoid:** In `buildApp()`, subscribe `searchService.updateDoc()` to `fileWatcher.subscribe()`. Mirror the existing watcher pattern.

**Warning signs:** Snippet shows outdated text; tag filter misses newly tagged files.

### Pitfall 4: Tag filter breaks the file tree for directory nodes

**What goes wrong:** Filtering by path set removes parent directory nodes from the tree, making child files unreachable.

**Why it happens:** FileTree renders both files and dirs; filtering only for matching file paths removes dir parents.

**How to avoid:** When computing `filterPaths`, also include all ancestor directory paths of every matching file. Alternatively, let FileTree collapse dirs that have no matching descendants.

**Warning signs:** Tag filter shows an empty tree even when matching files exist.

### Pitfall 5: `index.replace()` throws if document ID not in index

**What goes wrong:** Calling `index.replace(doc)` on a doc that was never `add()`ed throws `"MiniSearch: cannot remove document with id..."`.

**Why it happens:** `replace` is implemented as discard + add; discard throws on missing IDs.

**How to avoid:** Always check `this.docs.has(relPath)` before deciding between `index.replace()` and `index.add()` (shown in Pattern 1 above).

---

## Code Examples

### GET /api/search/index route
```typescript
// server/src/routes/search.ts
import { FastifyPluginAsync } from 'fastify';

declare module 'fastify' {
  interface FastifyInstance {
    searchService: SearchService;
  }
}

const searchRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/api/search/index', async (_req, reply) => {
    return {
      index: fastify.searchService.getIndexJSON(),
      tags: fastify.searchService.getAllTags(),
      tagMap: fastify.searchService.getTagMap(),
    };
  });

  fastify.patch<{ Params: { '*': string }; Body: { tags: string[] } }>(
    '/api/files/*/tags',
    async (req, reply) => {
      const safe = await resolveSafePath(req.params['*'], fastify.rootDir).catch(() => {
        reply.code(400); return null;
      });
      if (!safe) return;
      const raw = await fs.readFile(safe, 'utf-8');
      const parsed = matter(raw);
      parsed.data.tags = req.body.tags;
      const updated = matter.stringify(parsed.content, parsed.data);
      fastify.fileWatcher.lock(req.params['*']); // prevent SSE bounce
      await fs.writeFile(safe, updated, 'utf-8');
      await fastify.searchService.updateDoc(fastify.rootDir, req.params['*']);
      return { tags: req.body.tags };
    }
  );
};
```

### Wire SearchService in buildApp
```typescript
// server/src/app.ts (additions)
import { SearchService } from './lib/search.js';

// After existing decorations:
const searchService = new SearchService();
await searchService.buildFromDir(opts.rootDir);
fastify.decorate('searchService', searchService);

// Wire incremental updates from watcher:
watcher.subscribe(async (event) => {
  if (event.type === 'unlink') searchService.removeDoc(event.path);
  else await searchService.updateDoc(opts.rootDir, event.path);
});
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| FlexSearch 0.7.x | MiniSearch 7.x | 2023-2024 | FlexSearch 0.7.x has ESM/CJS export issues; MiniSearch is the current community choice for in-browser FTS |
| Handwritten YAML parser | gray-matter 4.x | Widely adopted pre-2020 | gray-matter handles all edge cases and round-trips |
| Server-side search (Lunr pre-built static index) | MiniSearch with serializable index | 2022+ | MiniSearch serialize/loadJSON pattern makes index portable across server↔client boundary |

**Deprecated/outdated:**
- FlexSearch 0.7.x: npm package has version confusion + CJS/ESM issues flagged in STATE.md. Do not use.
- Lunr.js: Last release 2021, unmaintained.

---

## Open Questions

1. **Index re-fetch after file changes**
   - What we know: `FileWatcherService` fires `change`/`add`/`unlink` events; `SearchService` can update incrementally.
   - What's unclear: Should the client automatically re-fetch the full index JSON after a SSE change event, or trust that the server's in-memory index is up-to-date and only re-search? Re-fetching is simpler but chatty if many files change at once.
   - Recommendation: Re-fetch full index on `add`/`unlink` events (structural changes); skip re-fetch on `change` events (client already has fresh content). This keeps the design simple for v1.

2. **Search UI entry point**
   - What we know: The sidebar has a fixed-width panel with file tree + folder manager toggle.
   - What's unclear: Should search be a toggled panel replacing the file tree, or a persistent input above the tree?
   - Recommendation: A search input at the top of the sidebar that, when non-empty, replaces the file tree with a results list. Clearing the input restores the tree. This is zero extra layout complexity.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.x (client) / Vitest 2.x (server) |
| Config file | `client/vite.config.ts` (test.environment: jsdom) / `server/vitest.config.ts` (includes: tests/**/*.test.ts) |
| Quick run command | `npm run test --workspace=client` or `npm run test --workspace=server` |
| Full suite command | `npm run test --workspace=client && npm run test --workspace=server` |

### Phase Requirements to Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SRCH-01 | SearchService.buildFromDir indexes files; useSearch returns results for known term | unit | `npm run test --workspace=client` (useSearch.test.ts) + `npm run test --workspace=server` (search.test.ts) | Wave 0 |
| SRCH-02 | SearchResult includes name, path, text snippet | unit | `npm run test --workspace=server` (search.test.ts) | Wave 0 |
| SRCH-03 | Clicking result calls openTab with correct path | unit | `npm run test --workspace=client` (SearchPanel.test.ts) | Wave 0 |
| TAG-01 | gray-matter extracts tags array from frontmatter | unit | `npm run test --workspace=server` (search.test.ts) | Wave 0 |
| TAG-02 | filterPaths derived from tagMap hides non-matching files | unit | `npm run test --workspace=client` (useTags.test.ts) | Wave 0 |
| TAG-03 | PATCH /api/files/*/tags writes new tags to frontmatter without corrupting body | unit/integration | `npm run test --workspace=server` (search.routes.test.ts) | Wave 0 |

### Sampling Rate

- **Per task commit:** `npm run test --workspace=client` or `npm run test --workspace=server` (whichever workspace was changed)
- **Per wave merge:** `npm run test --workspace=client && npm run test --workspace=server`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `server/tests/lib/search.test.ts` — covers SRCH-01, SRCH-02, TAG-01 (SearchService unit tests with tmp dir fixture)
- [ ] `server/tests/routes/search.test.ts` — covers TAG-03 (PATCH tags round-trip via Fastify inject)
- [ ] `client/src/__tests__/useSearch.test.ts` — covers SRCH-01 (MiniSearch.loadJSON + search result shape)
- [ ] `client/src/__tests__/useTags.test.ts` — covers TAG-02 (filterPaths derivation from tagMap)
- [ ] `client/src/__tests__/SearchPanel.test.ts` — covers SRCH-03 (click result fires openTab)

---

## Sources

### Primary (HIGH confidence)

- MiniSearch official docs — https://lucaong.github.io/minisearch/ — version 7.2.0, API (addAll, search, loadJSON, replace, discard), SearchResult type
- MiniSearch GitHub — https://github.com/lucaong/minisearch — CHANGELOG, TypeScript source
- gray-matter GitHub — https://github.com/jonschlinkert/gray-matter — version 4.0.3, stringify API, normaliseTags patterns
- Codebase inspection — `server/src/lib/watcher.ts`, `server/src/app.ts`, `server/src/routes/files.ts`, `client/src/App.tsx`, `client/src/hooks/useFileTree.ts` — all verified from source

### Secondary (MEDIUM confidence)

- WebSearch: gray-matter v4 TypeScript support — @types/gray-matter exists on DefinitelyTyped; confirmed from multiple tutorial sources
- WebSearch: FlexSearch 0.7.x ESM issues — corroborated by STATE.md project note and community reports

### Tertiary (LOW confidence)

- MiniSearch snippet/highlight pattern — described in GitHub issue #37; no official API; Pattern 3 above is community convention

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — MiniSearch and gray-matter are directly verified via official docs; FlexSearch exclusion confirmed by STATE.md + WebSearch
- Architecture: HIGH — patterns follow existing codebase conventions (buildApp decorator, watcher.subscribe, useXxx hooks); verified from source
- Pitfalls: HIGH (gray-matter stringify), MEDIUM (index re-fetch strategy) — core gotchas verified from official source; re-fetch timing is judgment call
- Validation: HIGH — existing Vitest setup directly observed from config files

**Research date:** 2026-03-10
**Valid until:** 2026-04-10 (stable libraries; MiniSearch and gray-matter have not had breaking releases recently)
