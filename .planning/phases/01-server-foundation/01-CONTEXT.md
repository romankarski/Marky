# Phase 1: Server Foundation - Context

**Gathered:** 2026-03-06
**Status:** Ready for planning

<domain>
## Phase Boundary

Node.js backend + React frontend scaffold with file CRUD API (read, write, create, rename, delete) and directory walker. The React app is served from the same origin in production. No markdown rendering — this phase delivers the foundation every subsequent phase builds on.

Requirements: FILE-01, FILE-02, FILE-03, FILE-04, FILE-05

</domain>

<decisions>
## Implementation Decisions

### Tech Stack
- Server: Fastify (not Express or Hono)
- Language: TypeScript everywhere — both server and client
- Frontend bundler: Vite
- CSS: Tailwind CSS (note: verify Tailwind v4 stability before starting — STATE.md blocker)

### Project Structure
- Top-level layout: `server/` + `client/` + `shared/` at repo root, each with their own `package.json`
- Root `package.json` wires them together with npm workspaces
- `shared/` package contains TypeScript interfaces used by both server and client (API response shapes, file metadata types)
- Structure:
  ```
  Marky/
  ├── server/
  │   ├── src/
  │   │   ├── routes/
  │   │   └── index.ts
  │   └── package.json
  ├── client/
  │   ├── src/
  │   │   └── App.tsx
  │   └── package.json
  ├── shared/
  │   └── package.json
  └── package.json (root, npm workspaces)
  ```

### Root Folder Configuration
- Root folder configured via `ROOT_DIR` environment variable in `.env`
- Example: `ROOT_DIR=/Users/romankarski/projects/portal-hub`

### File API Design
- REST API with file paths encoded in URL (wildcard segment):
  ```
  GET    /api/files          → list root dir (recursive tree)
  GET    /api/files/*path    → read file content or list subdirectory
  POST   /api/files/*path    → create file
  PUT    /api/files/*path    → write content or rename file
  DELETE /api/files/*path    → delete file
  ```
- Directory listing returns recursive tree in one call:
  ```json
  { "items": [{ "name": "knowledge", "type": "dir", "path": "knowledge", "children": [...] }] }
  ```
- Path security: server resolves requested path to absolute, then asserts it starts with ROOT_DIR — rejects anything that escapes the root

### Dev Tooling
- Single `npm run dev` at repo root using `concurrently` — starts Vite dev server and Fastify in parallel
- Fastify server uses `tsx --watch` for TypeScript execution with hot reload — no separate build step in dev
- Ports: Fastify on 3001, Vite on 5173 (its default); Vite proxies `/api/*` to `localhost:3001`
- Production: Fastify serves the Vite-built React app as static files from `client/dist/`
- Minimal README at repo root with quick-start instructions (clone, install, set ROOT_DIR, dev)

### Claude's Discretion
- Exact Fastify plugin choices (e.g., `@fastify/static`, `@fastify/cors`)
- Error response format/shape
- Whether to use `dotenv` or Node 20's built-in `--env-file` flag
- Tailwind version (v3 vs v4) — check stability, default to v3 if v4 is risky

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- None — greenfield project

### Established Patterns
- None yet — this phase establishes the patterns all subsequent phases follow

### Integration Points
- Phase 2 (Browser Shell) will import shared types and call the file API endpoints defined here
- Phase 4 (Live Reload) will add a WebSocket endpoint to this same Fastify server

</code_context>

<specifics>
## Specific Ideas

- No specific references — open to standard approaches within the stack decisions above

</specifics>

<deferred>
## Deferred Ideas

- None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-server-foundation*
*Context gathered: 2026-03-06*
