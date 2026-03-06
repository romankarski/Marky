# Phase 1: Server Foundation - Research

**Researched:** 2026-03-06
**Domain:** Node.js (Fastify) + React (Vite) monorepo with file CRUD REST API
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Server: Fastify (not Express or Hono)
- Language: TypeScript everywhere — both server and client
- Frontend bundler: Vite
- CSS: Tailwind CSS (note: verify Tailwind v4 stability before starting — STATE.md blocker)
- Top-level layout: `server/` + `client/` + `shared/` at repo root, each with their own `package.json`
- Root `package.json` wires them together with npm workspaces
- `shared/` package contains TypeScript interfaces used by both server and client (API response shapes, file metadata types)
- Root folder configured via `ROOT_DIR` environment variable in `.env`
- REST API with file paths encoded in URL (wildcard segment)
- Directory listing returns recursive tree in one call
- Path security: server resolves requested path to absolute, then asserts it starts with ROOT_DIR
- Single `npm run dev` at repo root using `concurrently`
- Fastify server uses `tsx --watch` for TypeScript execution with hot reload
- Ports: Fastify on 3001, Vite on 5173; Vite proxies `/api/*` to `localhost:3001`
- Production: Fastify serves Vite-built React app as static files from `client/dist/`

### Claude's Discretion
- Exact Fastify plugin choices (e.g., `@fastify/static`, `@fastify/cors`)
- Error response format/shape
- Whether to use `dotenv` or Node 20's built-in `--env-file` flag
- Tailwind version (v3 vs v4) — check stability, default to v3 if v4 is risky

### Deferred Ideas (OUT OF SCOPE)
- None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| FILE-01 | User can open a root folder and all files/subfolders appear in the sidebar tree | `GET /api/files` returning recursive tree JSON; `fs.readdir` with `withFileTypes: true` for manual recursion |
| FILE-02 | User can navigate the folder tree to browse and open markdown files | `GET /api/files/*path` reading file content; Vite proxy for dev-time CORS-free requests |
| FILE-03 | User can create a new markdown file from the UI | `POST /api/files/*path` writing initial content to disk |
| FILE-04 | User can rename a file from the UI | `PUT /api/files/*path` with rename flag; `fs.rename()` |
| FILE-05 | User can delete a file from the UI (with confirmation) | `DELETE /api/files/*path`; `fs.unlink()` or `fs.rm()` |
</phase_requirements>

---

## Summary

This phase scaffolds a Fastify 5 + Vite + React TypeScript monorepo using npm workspaces, then implements the five file-system CRUD endpoints the rest of the app builds upon. The architecture is three packages (`server/`, `client/`, `shared/`) wired by a root workspace, with `concurrently` driving parallel dev servers and Vite's built-in proxy eliminating CORS friction in development.

The stack decisions (Fastify, Vite, TypeScript, Tailwind) are all verified stable as of early 2026. Tailwind v4 is production-ready and is the recommended choice — it ships a first-party Vite plugin, requires zero PostCSS configuration, and the CSS-only config (`@import "tailwindcss"`) is simpler than v3. There are no blocking reasons to fall back to v3.

The critical implementation details are: (1) Fastify wildcard routes use `request.params['*']` to capture the path segment after the star, (2) path traversal prevention requires `path.resolve()` followed by a `startsWith(ROOT_DIR)` check using `fs.realpath()` on both sides (macOS symlinks make this non-trivial), and (3) `fs.readdir` with `{ recursive: true, withFileTypes: true }` has a known Node bug — manual recursion with `{ withFileTypes: true }` alone is safer.

**Primary recommendation:** Scaffold workspace first (empty packages, shared types, dev tooling), then implement routes one at a time in the order: list → read → create → rename → delete. Keep routes thin — all path resolution and security lives in a shared `resolveSafePath()` helper tested independently.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| fastify | ^5.8 | HTTP server | Locked decision; schema-first, TypeScript-native, fastest Node framework |
| @fastify/static | ^8.x | Serve `client/dist/` in production | Official Fastify plugin; handles SPA fallback |
| @fastify/cors | ^10.x | CORS headers for dev | Official plugin; needed because Vite proxy only works in dev |
| typescript | ^5.x | Type safety everywhere | Locked decision |
| tsx | ^4.x | Run/watch TypeScript without build step | Esbuild-based; `tsx watch src/index.ts` is the standard dev command |
| vite | ^6.x | Frontend bundler + dev proxy | Locked decision |
| @vitejs/plugin-react | ^4.x | JSX transform | Standard React+Vite plugin |
| react + react-dom | ^19.x | UI framework | Locked decision (implied by Vite+React) |
| tailwindcss | ^4.x | Utility CSS | v4 is stable; simpler Vite setup than v3 |
| @tailwindcss/vite | ^4.x | Vite plugin for Tailwind v4 | First-party; no PostCSS config needed |
| concurrently | ^9.x | Run Fastify + Vite in parallel | Standard for monorepo `npm run dev` |
| dotenv | ^16.x | Load `.env` in dev | Safer than `--env-file` (still experimental in Node 20) |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @types/node | ^20.x | Node.js type definitions | Server package devDependencies |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Tailwind v4 | Tailwind v3 | v3 is stable but requires PostCSS config and content globs; v4 is simpler and faster — prefer v4 |
| `dotenv` | Node 20 `--env-file` | `--env-file` is stable from Node 20.6+ but lacks multiline values and variable expansion; `dotenv` is safer for now |
| `tsx --watch` | `nodemon + ts-node` | tsx is faster (esbuild) and has no separate compile step — prefer tsx |
| `@fastify/cors` | Manual CORS headers | Always use the plugin; manual headers miss edge cases |

**Installation:**
```bash
# Root
npm install --save-dev concurrently

# Server package
npm install fastify @fastify/static @fastify/cors dotenv
npm install --save-dev typescript @types/node tsx

# Client package
npm install react react-dom
npm install --save-dev vite @vitejs/plugin-react tailwindcss @tailwindcss/vite typescript

# Shared package
npm install --save-dev typescript
```

---

## Architecture Patterns

### Recommended Project Structure
```
Marky/
├── package.json              # root — workspaces: ["server","client","shared"]
├── .env                      # ROOT_DIR=/path/to/vault (gitignored)
├── server/
│   ├── package.json          # name: "@marky/server"
│   └── src/
│       ├── index.ts          # create fastify, register plugins, start
│       ├── routes/
│       │   └── files.ts      # all /api/files/* handlers
│       └── lib/
│           └── pathSecurity.ts  # resolveSafePath() helper
├── client/
│   ├── package.json          # name: "@marky/client"
│   ├── vite.config.ts
│   ├── index.html
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       └── index.css         # @import "tailwindcss";
└── shared/
    ├── package.json          # name: "@marky/shared"
    └── src/
        └── types.ts          # FileNode, ApiError, etc.
```

### Pattern 1: Fastify Wildcard File Route
**What:** All file API endpoints share the `/api/files/*` prefix; the wildcard captures the relative path.
**When to use:** Any REST API that mirrors a filesystem hierarchy.
**Example:**
```typescript
// Source: https://fastify.dev/docs/latest/Reference/Routes/
// Source: https://github.com/fastify/fastify/issues/5899 (naming the wildcard param)

interface FileParams {
  '*': string;  // request.params['*'] holds everything after /api/files/
}

fastify.get<{ Params: FileParams }>('/api/files/*', async (request, reply) => {
  const relativePath = request.params['*'];  // e.g. "knowledge/decisions.md"
  const safePath = resolveSafePath(relativePath);  // throws 400 if traversal
  // ... read file or list directory
});
```

### Pattern 2: Path Traversal Prevention
**What:** All incoming paths are resolved to absolute and asserted to start with ROOT_DIR.
**When to use:** Every single file operation — no exceptions.
**Example:**
```typescript
// Source: https://www.nodejs-security.com/blog/secure-coding-practices-nodejs-path-traversal-vulnerabilities
// Source: https://www.stackhawk.com/blog/node-js-path-traversal-guide-examples-and-prevention/
import path from 'path';
import fs from 'fs/promises';

const ROOT_DIR = process.env.ROOT_DIR!;

export async function resolveSafePath(userPath: string): Promise<string> {
  // Decode any URL encoding first
  const decoded = decodeURIComponent(userPath);
  // Resolve relative to root
  const resolved = path.resolve(ROOT_DIR, decoded);
  // On macOS, /var is a symlink to /private/var — must realpath BOTH sides
  const realRoot = await fs.realpath(ROOT_DIR);
  const realResolved = await fs.realpath(resolved).catch(() => resolved);
  if (!realResolved.startsWith(realRoot + path.sep) && realResolved !== realRoot) {
    throw new Error('Path traversal detected');
  }
  return resolved;
}
```

### Pattern 3: Recursive Directory Tree (Manual Recursion)
**What:** Build a nested tree of `FileNode` objects from the filesystem.
**When to use:** `GET /api/files` — return entire vault structure in one response.
**Example:**
```typescript
// Source: https://nodejs.org/api/fs.html
// NOTE: Do NOT use { recursive: true, withFileTypes: true } together — known Node bug
// Source: https://github.com/nodejs/node/issues/48858

import { readdir } from 'fs/promises';
import path from 'path';
import { FileNode } from '@marky/shared';

export async function buildTree(dir: string, rootDir: string): Promise<FileNode[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const nodes: FileNode[] = [];
  for (const entry of entries) {
    const absPath = path.join(dir, entry.name);
    const relPath = path.relative(rootDir, absPath);
    if (entry.isDirectory()) {
      nodes.push({
        name: entry.name,
        type: 'dir',
        path: relPath,
        children: await buildTree(absPath, rootDir),
      });
    } else {
      nodes.push({ name: entry.name, type: 'file', path: relPath });
    }
  }
  return nodes;
}
```

### Pattern 4: Vite Dev Proxy to Fastify
**What:** Vite intercepts `/api/*` requests in dev and forwards them to Fastify on port 3001.
**When to use:** Development only — eliminates CORS and port mismatch between React (5173) and Fastify (3001).
**Example:**
```typescript
// Source: https://vite.dev/config/server-options
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
```

### Pattern 5: Tailwind v4 in CSS
**What:** Single import line replaces all `@tailwind` directives.
**When to use:** Always with Tailwind v4.
**Example:**
```css
/* src/index.css */
/* Source: https://tailwindcss.com/blog/tailwindcss-v4 */
@import "tailwindcss";
```

### Pattern 6: Production Static File Serving
**What:** Fastify serves the Vite-built React SPA as static assets from `client/dist/`.
**When to use:** `NODE_ENV=production`.
**Example:**
```typescript
// Source: https://github.com/fastify/fastify-static
import fastifyStatic from '@fastify/static';
import path from 'path';

if (process.env.NODE_ENV === 'production') {
  await fastify.register(fastifyStatic, {
    root: path.join(__dirname, '../../client/dist'),
    // SPA fallback: serve index.html for unknown routes
  });
  fastify.setNotFoundHandler((req, reply) => {
    reply.sendFile('index.html');
  });
}
```

### Anti-Patterns to Avoid
- **`{ recursive: true, withFileTypes: true }` together:** Known Node.js bug — entries can be missing or malformed. Use manual recursion with `withFileTypes: true` only.
- **`path.normalize()` alone for security:** Does not prevent traversal. Always use `path.resolve()` + `startsWith()` with real paths.
- **Blacklist `..'` strings:** Bypassable with URL encoding. Use the `resolveSafePath()` approach above.
- **Trusting `request.params['*']` raw:** Always decode and resolve before any filesystem operation.
- **CORS with `origin: '*'`:** Fine for local dev, but register `@fastify/cors` explicitly rather than hardcoding headers manually.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| CORS headers | Manual header injection | `@fastify/cors` | Pre-flight handling, vary headers, edge cases |
| Static file serving | Custom `fs.readFile` for each asset | `@fastify/static` | MIME types, caching headers, range requests, SPA fallback |
| TypeScript execution in dev | Compile-then-run loop | `tsx --watch` | Instant reload via esbuild, no `tsc` step |
| Running multiple dev processes | Shell `&` background + trap | `concurrently` | Named colors, kill-on-exit, cross-platform |
| CSS utility classes | Custom utility CSS | Tailwind v4 | Consistent system, purge-in-build, no runtime cost |

**Key insight:** Every item on this list looks deceptively simple (2-line "simple" CORS handler, `fs.readFile()` for static files) but each has production-breaking edge cases that the libraries handle correctly.

---

## Common Pitfalls

### Pitfall 1: macOS symlink breaks path security check
**What goes wrong:** `fs.realpath(ROOT_DIR)` on macOS returns `/private/var/...` while a naively resolved user path returns `/var/...`. The `startsWith` check fails for valid paths.
**Why it happens:** macOS `/var`, `/tmp`, `/etc` are symlinks to `/private/var` etc.
**How to avoid:** Call `fs.realpath()` on ROOT_DIR at server startup, cache the result. Use that cached real root for all comparisons.
**Warning signs:** All file reads returning 403/400 on macOS despite correct paths.

### Pitfall 2: `{ recursive: true, withFileTypes: true }` Node bug
**What goes wrong:** Directory tree silently returns incomplete entries.
**Why it happens:** Known Node.js bug (issue #48858) — combining both options is unreliable.
**How to avoid:** Never combine them. Use `{ withFileTypes: true }` alone + manual async recursion.
**Warning signs:** Some subdirectories appear empty in the tree despite having files.

### Pitfall 3: npm workspaces `node_modules` hoisting surprises
**What goes wrong:** A package installed in `server/` is accidentally resolved from the root `node_modules`, causing version conflicts or missing peer dependencies.
**Why it happens:** npm workspaces hoist most dependencies to the root by default.
**How to avoid:** Run `npm install` from the root only. Check `node_modules` location with `npm ls <package>`. Use `--workspace=server` flag for package-specific installs.
**Warning signs:** `Cannot find module` errors that disappear when running from a package subdirectory.

### Pitfall 4: Vite proxy only active in dev; production needs real CORS config
**What goes wrong:** App works in dev (Vite proxy handles routing), but API calls fail in production because the browser is now making direct requests to the same Fastify origin — or to a different domain.
**Why it happens:** `server.proxy` in `vite.config.ts` is a dev-server-only feature. In production, Fastify serves both the HTML and the API from port 3001.
**How to avoid:** In production mode, Fastify serves `client/dist/` as static files — same origin, no CORS needed. Register `@fastify/cors` only for dev or cross-origin scenarios. The `setNotFoundHandler` SPA fallback is critical.
**Warning signs:** API calls return 404 in production; `index.html` not served for deep routes.

### Pitfall 5: Fastify route registration order matters
**What goes wrong:** `GET /api/files` (exact) is shadowed by `GET /api/files/*` (wildcard) or vice versa.
**Why it happens:** Fastify uses `find-my-way` router; static routes have priority over wildcards, but registration order can cause unexpected behavior if routes overlap.
**How to avoid:** Register the exact `GET /api/files` route before the wildcard `GET /api/files/*`. Test both in integration tests.
**Warning signs:** Root listing endpoint returns 404 or incorrect handler.

### Pitfall 6: `tsx` does not emit declaration files
**What goes wrong:** `shared/` TypeScript types are not compiled, so `server/` and `client/` cannot import from `@marky/shared` at runtime.
**Why it happens:** `tsx` is a runtime executor, not a compiler. It doesn't emit `.js` or `.d.ts` files.
**How to avoid:** The `shared/` package should be consumed as TypeScript source (not compiled output) in dev. Configure `tsconfig.json` with `paths` or use `tsx`'s native TypeScript resolution. In production, run `tsc` on `shared/` before building `client/` and starting `server/`.
**Warning signs:** `Cannot find module '@marky/shared'` at runtime.

---

## Code Examples

Verified patterns from official sources:

### Root package.json (npm workspaces + concurrently)
```json
{
  "name": "marky",
  "private": true,
  "workspaces": ["server", "client", "shared"],
  "scripts": {
    "dev": "concurrently \"npm run dev --workspace=server\" \"npm run dev --workspace=client\"",
    "build": "npm run build --workspace=shared && npm run build --workspace=client"
  },
  "devDependencies": {
    "concurrently": "^9.x"
  }
}
```

### Server package.json (key scripts)
```json
{
  "name": "@marky/server",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "fastify": "^5.8",
    "@fastify/static": "^8.x",
    "@fastify/cors": "^10.x",
    "dotenv": "^16.x"
  },
  "devDependencies": {
    "typescript": "^5.x",
    "@types/node": "^20.x",
    "tsx": "^4.x"
  }
}
```

### Fastify server entrypoint
```typescript
// server/src/index.ts
// Source: https://fastify.dev/docs/latest/Reference/TypeScript/
import Fastify from 'fastify';
import cors from '@fastify/cors';
import 'dotenv/config';

const fastify = Fastify({ logger: true });

await fastify.register(cors, { origin: true });
await fastify.register(import('./routes/files.js'));

const ROOT = process.env.ROOT_DIR;
if (!ROOT) throw new Error('ROOT_DIR env var required');

await fastify.listen({ port: 3001, host: '127.0.0.1' });
```

### Shared types
```typescript
// shared/src/types.ts
export interface FileNode {
  name: string;
  type: 'file' | 'dir';
  path: string;          // relative to ROOT_DIR, forward-slash separated
  children?: FileNode[]; // only present when type === 'dir'
}

export interface ListResponse {
  items: FileNode[];
}

export interface ApiError {
  error: string;
  code: string;
}
```

### File routes (condensed)
```typescript
// server/src/routes/files.ts
// Source: Fastify docs https://fastify.dev/docs/latest/Reference/Routes/
import { FastifyPluginAsync } from 'fastify';
import { resolveSafePath } from '../lib/pathSecurity.js';
import { buildTree } from '../lib/fsTree.js';
import fs from 'fs/promises';

const filesRoutes: FastifyPluginAsync = async (fastify) => {
  // LIST ROOT
  fastify.get('/api/files', async (req, reply) => {
    const items = await buildTree(process.env.ROOT_DIR!, process.env.ROOT_DIR!);
    return { items };
  });

  // READ FILE / LIST SUBDIR
  fastify.get<{ Params: { '*': string } }>('/api/files/*', async (req, reply) => {
    const safe = await resolveSafePath(req.params['*']);
    const stat = await fs.stat(safe);
    if (stat.isDirectory()) {
      const items = await buildTree(safe, process.env.ROOT_DIR!);
      return { items };
    }
    const content = await fs.readFile(safe, 'utf-8');
    return { content };
  });

  // CREATE FILE
  fastify.post<{ Params: { '*': string }; Body: { content?: string } }>(
    '/api/files/*', async (req, reply) => {
      const safe = await resolveSafePath(req.params['*']);
      await fs.writeFile(safe, req.body?.content ?? '', { flag: 'wx' }); // 'wx' = fail if exists
      reply.code(201);
      return { path: req.params['*'] };
    }
  );

  // RENAME or WRITE CONTENT
  fastify.put<{ Params: { '*': string }; Body: { content?: string; newPath?: string } }>(
    '/api/files/*', async (req, reply) => {
      const safe = await resolveSafePath(req.params['*']);
      if (req.body?.newPath) {
        const safeDest = await resolveSafePath(req.body.newPath);
        await fs.rename(safe, safeDest);
        return { path: req.body.newPath };
      }
      await fs.writeFile(safe, req.body?.content ?? '');
      return { path: req.params['*'] };
    }
  );

  // DELETE
  fastify.delete<{ Params: { '*': string } }>('/api/files/*', async (req, reply) => {
    const safe = await resolveSafePath(req.params['*']);
    await fs.rm(safe, { recursive: false }); // refuse directory deletes for safety
    reply.code(204);
  });
};

export default filesRoutes;
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `ts-node` + `nodemon` | `tsx --watch` | 2022+ | 10x faster TypeScript execution via esbuild |
| Tailwind PostCSS config + content globs | `@tailwindcss/vite` + `@import "tailwindcss"` | Jan 2025 (v4.0) | Zero-config setup, 3-8x faster builds |
| `@tailwind base/components/utilities` | `@import "tailwindcss"` | v4.0 | Single import line |
| `fastify-static` (deprecated) | `@fastify/static` | Fastify v4 era | Scoped package, use this |
| `fastify-cors` (deprecated) | `@fastify/cors` | Fastify v4 era | Scoped package, use this |

**Deprecated/outdated:**
- `fastify-static` (unscoped): replaced by `@fastify/static`
- `fastify-cors` (unscoped): replaced by `@fastify/cors`
- `ts-node`: slower, more complex than `tsx`
- Tailwind v3 PostCSS approach: still works but v4's Vite plugin is strictly better for this stack

---

## Open Questions

1. **`shared/` TypeScript resolution in dev**
   - What we know: `tsx` does not compile `shared/` to JS — it resolves TypeScript source directly
   - What's unclear: Whether npm workspace resolution + `paths` in tsconfig handles this without a build step, or whether `shared/` needs `"main": "src/types.ts"` in its `package.json`
   - Recommendation: Set `"main": "src/types.ts"` in `shared/package.json` and test import resolution early in Wave 0

2. **Hidden file/folder filtering**
   - What we know: `readdir` returns hidden files (dot-prefixed) by default
   - What's unclear: Whether the tree should expose `.git/`, `.env`, etc. to the client
   - Recommendation: Filter entries where `entry.name.startsWith('.')` in `buildTree()`

3. **Large vault performance**
   - What we know: Recursive tree traversal on a 5000-file vault could be slow; the API returns the entire tree in one call
   - What's unclear: At what scale this becomes a problem
   - Recommendation: For Phase 1, return the full tree — it is sufficient for the success criteria. Note as a known limitation for later optimization.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest ^2.x (co-located with Vite ecosystem) |
| Config file | `vitest.config.ts` — Wave 0 creates this |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| FILE-01 | `GET /api/files` returns recursive tree JSON | integration | `npx vitest run tests/api/files.test.ts -t "GET /api/files"` | Wave 0 |
| FILE-02 | `GET /api/files/*path` returns file content | integration | `npx vitest run tests/api/files.test.ts -t "GET /api/files/\*"` | Wave 0 |
| FILE-03 | `POST /api/files/*path` creates file on disk | integration | `npx vitest run tests/api/files.test.ts -t "POST"` | Wave 0 |
| FILE-04 | `PUT /api/files/*path` renames file on disk | integration | `npx vitest run tests/api/files.test.ts -t "rename"` | Wave 0 |
| FILE-05 | `DELETE /api/files/*path` removes file from disk | integration | `npx vitest run tests/api/files.test.ts -t "DELETE"` | Wave 0 |
| (Security) | Path traversal `../../etc/passwd` rejected | unit | `npx vitest run tests/lib/pathSecurity.test.ts` | Wave 0 |

**Note:** Integration tests spin up a real Fastify instance against a temp directory (created/cleaned with `fs.mkdtemp` in beforeEach/afterEach). No mocks needed — filesystem operations are fast and deterministic.

### Sampling Rate
- **Per task commit:** `npx vitest run tests/lib/pathSecurity.test.ts` (unit, < 2s)
- **Per wave merge:** `npx vitest run` (full suite)
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `server/tests/api/files.test.ts` — covers FILE-01 through FILE-05
- [ ] `server/tests/lib/pathSecurity.test.ts` — covers path traversal prevention
- [ ] `server/vitest.config.ts` — Vitest config pointing at `tests/` directory
- [ ] Framework install: `npm install --save-dev vitest @vitest/coverage-v8 --workspace=server`

---

## Sources

### Primary (HIGH confidence)
- [Fastify Docs — Routes](https://fastify.dev/docs/latest/Reference/Routes/) — wildcard route syntax, parametric routes
- [Fastify Docs — TypeScript](https://fastify.dev/docs/latest/Reference/TypeScript/) — `RequestGenericInterface`, typed params
- [Tailwind CSS v4.0 Blog](https://tailwindcss.com/blog/tailwindcss-v4) — release status, Vite plugin, CSS import syntax
- [tsx Watch Mode](https://tsx.is/watch-mode) — exact command, limitations, default exclusions
- [Node.js fs docs](https://nodejs.org/api/fs.html) — readdir, realpath, stat APIs

### Secondary (MEDIUM confidence)
- [Fastify wildcard param access — GitHub issue #5899](https://github.com/fastify/fastify/issues/5899) — confirmed `request.params['*']` syntax
- [Node.js bug: recursive + withFileTypes — issue #48858](https://github.com/nodejs/node/issues/48858) — confirmed combining options is unreliable
- [Vite server options docs](https://vite.dev/config/server-options) — proxy configuration
- [npm workspaces TypeScript monorepo — 2ality.com](https://2ality.com/2021/07/simple-monorepos.html) — workspace + tsconfig project references pattern
- [Node.js path traversal prevention — nodejs-security.com](https://www.nodejs-security.com/blog/secure-coding-practices-nodejs-path-traversal-vulnerabilities) — `realpath` + `startsWith` pattern, macOS symlink warning

### Tertiary (LOW confidence)
- [Medium: Downgrading from Tailwind v4 to v3](https://medium.com/@pradeepgudipati/%EF%B8%8F-downgrading-from-tailwind-css-v4-to-v3-a-hard-earned-journey-back-to-stability-88aa841415bf) — some edge cases exist; not applicable to greenfield project with this stack

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages verified on npm/official docs; versions from active changelogs
- Architecture: HIGH — patterns sourced from official Fastify + Vite docs; wildcard param syntax confirmed via GitHub issue
- Pitfalls: HIGH — Node.js bug sourced from official tracker; macOS symlink issue from security guidance; others from first-principles
- Tailwind v4 decision: HIGH — official blog confirms production-ready Jan 2025; first-party Vite plugin verified

**Research date:** 2026-03-06
**Valid until:** 2026-06-06 (stable ecosystem; Fastify/Vite/Tailwind release cadence is 30-90 days for minors)
