# Phase 4: Live Reload - Research

**Researched:** 2026-03-09
**Domain:** File watching (Node.js) + Server-Sent Events (Fastify) + React client integration
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| LIVE-01 | When an external process (Claude CLI) writes to an open file, the preview auto-refreshes immediately | SSE push event triggers `SET_CONTENT` dispatch in React; `change` event from chokidar identifies path |
| LIVE-02 | File watcher monitors the entire root folder for external changes | chokidar.watch(rootDir, { recursive: true }) covers the full tree including new files; `add` + `change` events both matter |
</phase_requirements>

---

## Summary

Phase 4 is a clean integration of two well-understood primitives: a server-side file watcher and a server-to-client push channel. chokidar watches the root folder recursively on the Node.js server. When it fires a `change` event, the server pushes an SSE message to all connected browser clients. The React client listens via `EventSource`, reads the path from the event, and if that path matches an open tab it fetches fresh content and updates state via the existing `SET_CONTENT` dispatch.

The architecture is strictly additive. The existing Fastify server, `buildApp` factory, `tabReducer`, and `SET_CONTENT` action all remain unchanged. A new SSE route (`GET /api/watch`) and a new React hook (`useFileWatcher`) are the only new units. No state machine changes and no new tab actions are needed for LIVE-01/LIVE-02 (LIVE-03, the conflict prompt for dirty tabs, is v2 scope).

The server is already ESM (`"type": "module"`) running Node.js v20, which satisfies chokidar v5's only hard requirement (ESM-only, Node ≥ 20).

**Primary recommendation:** Add chokidar v5 to the server, add a raw-SSE route to `buildApp`, and add a `useFileWatcher` hook to the client. Three new files, zero rewrites.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| chokidar | 5.x | Recursive directory watcher for Node.js | Industry default (used by Vite, webpack, Jest); v5 is ESM-only, matches server's `"type":"module"`; normalises macOS FSEvents + Linux inotify; no polling |
| Browser native `EventSource` | — (Web API) | Long-lived HTTP/1.1 stream for server-to-client push | Built into every modern browser; auto-reconnects; no extra client install; simpler than WebSockets for unidirectional data |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @fastify/sse | 0.4.x | Optional plugin wrapping reply.raw SSE pattern | Only if raw `reply.raw` approach causes TypeScript friction; v0.4 targets Fastify 5 (unverified) |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| chokidar v5 | `fs.watch()` native | `fs.watch` does not give recursive watch on Linux, misses renames, no stabilisation — chokidar solves all of these |
| SSE via `EventSource` | WebSockets | WebSockets are bidirectional and require a WS server; push-only file events are one-way, SSE is simpler |
| SSE via `EventSource` | Polling (`setInterval + fetch`) | Polling wastes bandwidth and adds latency; SSE pushes on the exact event |
| chokidar v5 | chokidar v3 | v3 still uses CJS (`require`); server is ESM-only, so v3 would need a dynamic `import()` wrapper; v5 is cleaner |

**Installation (server workspace only):**
```bash
npm install chokidar --workspace=server
```

No client install needed — `EventSource` is a browser built-in.

---

## Architecture Patterns

### Recommended Project Structure

```
server/src/
├── app.ts                 # MODIFIED: register SSE route + start watcher
├── lib/
│   ├── fsTree.ts          # unchanged
│   ├── pathSecurity.ts    # unchanged
│   └── watcher.ts         # NEW: singleton FSWatcher + subscriber registry
├── routes/
│   ├── files.ts           # unchanged
│   └── watch.ts           # NEW: GET /api/watch SSE endpoint

client/src/
├── hooks/
│   ├── useFileWatcher.ts  # NEW: EventSource connection + dispatch on change
│   └── ...existing hooks
├── App.tsx                # MODIFIED: pass dispatch to useFileWatcher
```

### Pattern 1: Singleton Watcher with Subscriber Registry

**What:** One chokidar `FSWatcher` instance is created when `buildApp()` is called. A subscriber registry (a `Set<(path: string) => void>`) lets the SSE route add/remove callbacks per connected client. On `change` / `add`, each subscriber is called with the relative path.

**When to use:** Any time multiple HTTP clients need the same file events. A singleton avoids the "multiple watchers on same file" bug documented in chokidar issues.

**Example:**
```typescript
// server/src/lib/watcher.ts
import { watch, FSWatcher } from 'chokidar';

type Subscriber = (relativePath: string) => void;

export class FileWatcherService {
  private watcher: FSWatcher;
  private subscribers = new Set<Subscriber>();

  constructor(rootDir: string) {
    this.watcher = watch(rootDir, {
      ignoreInitial: true,           // don't fire for files present at startup
      awaitWriteFinish: {
        stabilityThreshold: 50,      // wait 50ms after last write before emitting
        pollInterval: 10,
      },
    });

    this.watcher.on('change', (absPath) => {
      const rel = absPath.replace(rootDir + '/', '');
      this.subscribers.forEach(cb => cb(rel));
    });

    this.watcher.on('add', (absPath) => {
      // New files created by Claude CLI also need to appear in the sidebar
      const rel = absPath.replace(rootDir + '/', '');
      this.subscribers.forEach(cb => cb(rel));
    });
  }

  subscribe(cb: Subscriber): () => void {
    this.subscribers.add(cb);
    return () => this.subscribers.delete(cb);   // returns unsubscribe fn
  }

  async close() {
    await this.watcher.close();
  }
}
```

### Pattern 2: Raw SSE Route in Fastify

**What:** A Fastify GET route uses `reply.raw` to keep the HTTP connection open and write SSE frames. When the client disconnects (`req.raw.on('close')`), the subscriber is removed.

**When to use:** Whenever a plugin dependency is undesirable; `reply.raw` is documented by the Fastify team as the correct SSE primitive.

**Example:**
```typescript
// server/src/routes/watch.ts
import type { FastifyPluginAsync } from 'fastify';

const watchRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/api/watch', async (req, reply) => {
    const res = reply.raw;
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();   // send headers immediately, don't buffer

    const unsubscribe = fastify.fileWatcher.subscribe((path) => {
      res.write(`data: ${JSON.stringify({ path })}\n\n`);
    });

    req.raw.on('close', unsubscribe);
    // Return a never-resolving promise so Fastify does not auto-close
    await new Promise<void>((resolve) => {
      req.raw.on('close', resolve);
    });
  });
};

export default watchRoutes;
```

### Pattern 3: useFileWatcher Hook on the Client

**What:** A React hook creates one `EventSource` per app mount, parses the path from each message, and dispatches `SET_CONTENT` if the path matches an open tab.

**When to use:** Always — a single hook in `App.tsx` centralises the watcher subscription.

**Example:**
```typescript
// client/src/hooks/useFileWatcher.ts
import { useEffect, useRef } from 'react';
import type { TabAction } from '../types/tabs';
import type { Tab } from '../types/tabs';

export function useFileWatcher(
  tabs: Tab[],
  dispatch: React.Dispatch<TabAction>
) {
  const tabsRef = useRef(tabs);
  tabsRef.current = tabs;   // always current without re-creating EventSource

  useEffect(() => {
    const es = new EventSource('/api/watch');

    es.onmessage = (event) => {
      const { path } = JSON.parse(event.data) as { path: string };
      // Only reload if the file is currently open in a tab
      const match = tabsRef.current.find(t => t.path === path);
      if (!match) return;
      fetch(`/api/files/${path}`)
        .then(res => res.json())
        .then(data => dispatch({ type: 'SET_CONTENT', path, content: data.content }))
        .catch(() => {}); // silent — preview stays stale rather than crashing
    };

    return () => es.close();
  }, []); // mount/unmount only — tabsRef keeps the reference fresh
}
```

### Pattern 4: Decorating buildApp with the Watcher

**What:** `buildApp()` creates a `FileWatcherService` instance and decorates it onto the Fastify instance using `fastify.decorate()` — the same pattern already used for `rootDir`. This keeps the watcher accessible in all routes without a global variable.

```typescript
// server/src/app.ts — additions only
import { FileWatcherService } from './lib/watcher.js';

declare module 'fastify' {
  interface FastifyInstance {
    rootDir: string;
    fileWatcher: FileWatcherService;   // new
  }
}

export async function buildApp(opts: AppOptions): Promise<FastifyInstance> {
  // ... existing code ...
  const watcher = new FileWatcherService(opts.rootDir);
  fastify.decorate('fileWatcher', watcher);
  fastify.addHook('onClose', async () => { await watcher.close(); });
  await fastify.register(watchRoutes);
  return fastify;
}
```

### Anti-Patterns to Avoid

- **Multiple watcher instances per request:** Creating a new `chokidar.watch()` inside the route handler creates one FSWatcher per connected client. Known to cause "only first change detected" bugs. Use the singleton decorated on the Fastify instance.
- **Not setting `ignoreInitial: true`:** Without this, chokidar fires `add` for every file in the tree at startup, flooding all clients with redundant reloads.
- **Not calling `res.flushHeaders()`:** Without flushing, Nginx/proxy layers buffer the response and clients never see events until the connection closes.
- **Returning early from the route handler:** Fastify automatically sends a response when the async handler resolves. The route MUST block until the client disconnects (the `await new Promise` pattern).
- **Using `reply.hijack()`:** Hijack bypasses Fastify's hooks and is harder to test. `reply.raw` + `req.raw.on('close')` is cleaner.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Cross-platform recursive file watching | Custom `fs.watch` wrapper | chokidar | `fs.watch` misses events on Linux rename, has no recursive support pre-Node 22, no stabilisation for partial writes |
| SSE client reconnection | Custom retry/reconnect loop | Native `EventSource` | Browser auto-reconnects with exponential back-off; sends `Last-Event-ID` header; works across proxy reconnects |
| Debouncing rapid writes | Custom timer logic | chokidar `awaitWriteFinish` | Claude CLI may write a file in chunks; without stabilisation the client gets multiple reloads mid-write |

**Key insight:** The entire watch + push infrastructure is ~100 lines. The complexity is in the edge cases (partial writes, reconnection, multiple clients). chokidar and `EventSource` solve all of these.

---

## Common Pitfalls

### Pitfall 1: Dirty Tab Overwrite (LIVE-03 scope — not in this phase)

**What goes wrong:** Claude CLI rewrites a file the user is currently editing. The live reload silently overwrites unsaved changes.
**Why it happens:** `SET_CONTENT` unconditionally replaces `tab.content`, and `useAutoSave` will then save the old content on the next keystroke — creating a write/write conflict.
**How to avoid:** For Phase 4, guard the reload: skip `SET_CONTENT` dispatch if `tab.dirty === true`. This prevents silent data loss. The full conflict prompt (LIVE-03) is v2 scope but the guard is required here.
**Warning signs:** User edits disappear after Claude CLI writes to the same file.

### Pitfall 2: chokidar Fires for App's Own Writes

**What goes wrong:** When the user saves via the editor (`PUT /api/files/*`), the server writes to disk. chokidar detects this, broadcasts the change, and `useFileWatcher` triggers a reload — causing a visible flash.
**Why it happens:** chokidar cannot distinguish app writes from external writes.
**How to avoid:** Track in-flight app writes with a `Set<string>` (the "write lock" pattern). In `PUT /api/files/*`, add the path before `fs.writeFile` and remove it after. In the watcher subscriber, skip paths in the lock set.
**Warning signs:** Preview flashes on every auto-save keystroke (if debounce is very short).

### Pitfall 3: SSE Route Not Flushing Headers Through Vite Proxy

**What goes wrong:** In development, Vite proxies `/api/*` to `localhost:3001`. Some Node.js HTTP proxy implementations buffer the response until the connection closes — EventSource never receives data.
**Why it happens:** `res.flushHeaders()` is not called before writing events.
**How to avoid:** Always call `res.flushHeaders()` immediately after `setHeader` calls. In the Vite proxy config, add `{ target: ..., changeOrigin: true }` — this is already present in `vite.config.ts`.
**Warning signs:** Events work when hitting the server directly (port 3001) but not through Vite (port 5173).

### Pitfall 4: EventSource URL in Production

**What goes wrong:** In production the React client is served by Fastify's `@fastify/static`. `new EventSource('/api/watch')` resolves against `window.location.origin` — correct for same-origin serving.
**Why it happens:** In development, Vite's proxy transparently forwards `/api/watch` to port 3001. In production, both client and server are on port 3001. Both work with a relative URL `/api/watch`.
**How to avoid:** Use the relative URL `/api/watch` (already the pattern in the proxy config and `fetch('/api/files/...')` calls throughout the codebase).
**Warning signs:** SSE connects in dev but fails in production build.

### Pitfall 5: chokidar v5 ESM Import

**What goes wrong:** Using `const chokidar = require('chokidar')` or `import chokidar from 'chokidar'` (default import) fails because chokidar v5 exports named exports only.
**Why it happens:** chokidar v5 is ESM-only with named exports (`watch`, `FSWatcher`).
**How to avoid:** Use `import { watch } from 'chokidar';` — named imports only.
**Warning signs:** `TypeError: chokidar is not a function` or `ReferenceError: watch is not defined`.

---

## Code Examples

### Starting the Watcher (chokidar v5)
```typescript
// Source: chokidar GitHub README + jsdocs.io/package/chokidar
import { watch } from 'chokidar';

const watcher = watch('/path/to/root', {
  ignoreInitial: true,
  awaitWriteFinish: { stabilityThreshold: 50, pollInterval: 10 },
});

watcher.on('change', (path) => console.log(`changed: ${path}`));
watcher.on('add',    (path) => console.log(`added:   ${path}`));
// Close cleanly on process exit
await watcher.close();
```

### Raw SSE in Fastify (no plugin)
```typescript
// Source: Liran Tal blog post — https://lirantal.com/blog/avoid-fastify-reply-raw-and-reply-hijack-despite-being-a-powerful-http-streams-tool
fastify.get('/api/watch', async (req, reply) => {
  const res = reply.raw;
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  res.write(`data: ${JSON.stringify({ hello: true })}\n\n`);

  req.raw.on('close', () => { /* cleanup */ });
  await new Promise<void>((resolve) => req.raw.on('close', resolve));
});
```

### EventSource in React
```typescript
// Source: MDN Web API / standard Web platform API
useEffect(() => {
  const es = new EventSource('/api/watch');
  es.onmessage = (e) => {
    const payload = JSON.parse(e.data);
    // handle payload
  };
  es.onerror = () => {
    // EventSource auto-reconnects — no manual retry needed
  };
  return () => es.close();
}, []);
```

### Write-Lock to Suppress Self-Triggered Reloads
```typescript
// Pattern used in VSCode, vite-plugin-watch, etc.
const inFlightWrites = new Set<string>();

// In PUT /api/files/* route, before fs.writeFile:
inFlightWrites.add(relativePath);
await fs.writeFile(safePath, content);
// Give chokidar time to fire, then clear the lock
setTimeout(() => inFlightWrites.delete(relativePath), 200);

// In watcher subscriber:
if (inFlightWrites.has(relativePath)) return; // skip own write
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| chokidar v3 (CJS, 13 deps) | chokidar v5 (ESM-only, 1 dep) | Sep 2024 (v4), Nov 2025 (v5) | Use named import `{ watch }`, no `require()` |
| Polling-based file watching | FSEvents (macOS) / inotify (Linux) via chokidar | v1.0 era | No CPU spin, immediate event delivery |
| WebSocket for server push | `EventSource` for unidirectional streams | Web standard (widely adopted ~2015) | Simpler, auto-reconnect, HTTP/1.1 compatible |

**Deprecated/outdated:**
- `chokidar v3 require()` pattern: server is ESM; use `import { watch } from 'chokidar'`
- `@fastify/sse` plugin: v0.4's Fastify 5 compatibility is unverified; raw `reply.raw` is simpler and confirmed working with Fastify 5

---

## Open Questions

1. **`@fastify/sse` v0.4 + Fastify 5 peer dependency**
   - What we know: Latest version is 0.4.0; Fastify 5 was released late 2024
   - What's unclear: Whether peerDependencies in package.json allow Fastify 5
   - Recommendation: Use raw `reply.raw` approach — it is confirmed working with Fastify 5 (already used by the project pattern) and avoids a plugin dependency

2. **`awaitWriteFinish` latency vs. responsiveness tradeoff**
   - What we know: `stabilityThreshold: 50ms` means a 50ms delay before the event fires
   - What's unclear: Whether Claude CLI writes large files in chunks that would need a longer threshold
   - Recommendation: Start with 50ms. If testing reveals incomplete content on reload, increase to 200ms.

3. **Sidebar tree refresh for newly created files (LIVE-02)**
   - What we know: The `add` chokidar event fires when a new file appears. The file tree is fetched via `useFileTree` which has a `refetch` function.
   - What's unclear: Whether the SSE message for an `add` event should also trigger `refetch` on the client side (separate event type) or whether the existing tab-content logic handles it.
   - Recommendation: Send a typed SSE event `event: change` vs `event: add` in the SSE frame. Client `useFileWatcher` handles `add` by calling `refetch()` (passed as parameter), and `change` by reloading tab content. This satisfies LIVE-02 cleanly.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest (server: 2.x, client: 4.x) |
| Config file | `server/vitest.config.ts`, `client/vite.config.ts` (test block) |
| Quick run command | `npm test --workspace=server` |
| Full suite command | `npm test --workspace=server && npm test --workspace=client` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| LIVE-01 | External file write triggers SET_CONTENT for open tab | integration | `npm test --workspace=server` | Wave 0 |
| LIVE-02 | Watcher detects files created anywhere in root tree | integration | `npm test --workspace=server` | Wave 0 |
| LIVE-01 | Self-write (app PUT) does NOT trigger reload | integration | `npm test --workspace=server` | Wave 0 |
| LIVE-01 | Client-side: useFileWatcher dispatches SET_CONTENT on message | unit | `npm test --workspace=client` | Wave 0 |
| LIVE-01 | Client-side: useFileWatcher skips dispatch for unopened paths | unit | `npm test --workspace=client` | Wave 0 |
| LIVE-01 | Client-side: useFileWatcher skips dispatch for dirty tabs | unit | `npm test --workspace=client` | Wave 0 |

### Sampling Rate

- **Per task commit:** `npm test --workspace=server`
- **Per wave merge:** `npm test --workspace=server && npm test --workspace=client`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `server/tests/routes/watch.test.ts` — covers LIVE-01, LIVE-02; tests the SSE endpoint using Fastify's `inject` in event stream mode and a tmp dir with real file writes
- [ ] `client/src/hooks/__tests__/useFileWatcher.test.ts` — covers client LIVE-01 unit cases; mocks `EventSource` and `fetch`, asserts dispatch calls

**Note on testing SSE with Fastify inject:** Fastify's `inject()` supports streaming. Use `inject({ method: 'GET', url: '/api/watch', payloadAsStream: true })` and write to the tmp dir after connecting. The `data` events in the response stream can be asserted.

---

## Sources

### Primary (HIGH confidence)

- chokidar GitHub README (paulmillr/chokidar) — version history, v4/v5 API changes, `ignoreInitial`, `awaitWriteFinish` options, named ESM exports
- jsdocs.io/package/chokidar v5.0.0 — TypeScript types: `ChokidarOptions`, `FSWatcher`, `AWF`
- MDN EventSource Web API — browser native SSE, auto-reconnect, `onmessage`, `close()`
- Fastify docs / Liran Tal blog — `reply.raw`, `req.raw.on('close')`, `res.flushHeaders()` SSE pattern

### Secondary (MEDIUM confidence)

- WebSearch: chokidar v5 "ESM-only, Node ≥ 20" release notes (November 2025)
- WebSearch: `@fastify/sse` v0.4 feature set and route config API (requires version verification)
- WebSearch: Fastify SSE raw pattern — `Content-Type: text/event-stream`, `Cache-Control: no-cache`

### Tertiary (LOW confidence)

- WebSearch: `@fastify/sse` v0.4 Fastify 5 peer dependency compatibility — unverified; using raw approach as primary

---

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH — chokidar v5 is confirmed ESM-only with Node v20 compatibility; EventSource is a W3C standard
- Architecture: HIGH — singleton watcher + SSE is a textbook pattern; write-lock for self-write suppression is well-established
- Pitfalls: HIGH — each pitfall is derived from codebase-specific facts (existing `SET_CONTENT` action, `dirty` flag, Vite proxy config) or documented chokidar/SSE behaviours
- Validation: HIGH — existing test patterns in server/tests/ are directly replicable for the new SSE route

**Research date:** 2026-03-09
**Valid until:** 2026-06-09 (chokidar and browser EventSource are stable; Fastify 5 compatibility of @fastify/sse may change sooner)
