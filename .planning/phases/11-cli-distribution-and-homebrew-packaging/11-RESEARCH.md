# Phase 11: CLI Distribution and Homebrew Packaging - Research

**Researched:** 2026-03-29
**Domain:** Node CLI packaging, Fastify standalone serving, release artifacts, Homebrew distribution
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CLI-01 | Running `marky` inside a notes directory starts Marky against that directory without repo-local commands | Add a real CLI entrypoint that resolves the content root, boots Fastify, serves built assets, and prints the local URL |
| CLI-02 | `marky .`, `marky /path/to/folder`, and explicit `ROOT_DIR` all resolve the intended content root | Implement a small argument parser with fixed precedence: `ROOT_DIR` > positional path > `process.cwd()` |
| CLI-03 | Standalone mode serves built client assets from the installed package, not from the source repo layout | Resolve `client/dist` relative to the built CLI file/package root rather than `process.cwd()` |
| CLI-04 | Port selection and duplicate launches are predictable and clearly surfaced | Probe a deterministic default port range and fail fast on explicit-port collisions |
| CLI-05 | Browser auto-open is enabled by default and disabled with `--no-open` | Add an `openBrowser(url)` helper behind a CLI flag gate |
| DIST-01 | An installable artifact and Homebrew tap formula exist and install a working `marky` command | Use `npm pack` as the canonical artifact, then consume that tarball from a Homebrew formula and release workflow |
</phase_requirements>

---

## Summary

Phase 11 should be implemented as a **publishable root CLI package** named `marky` that ships:

- built server JavaScript under `server/dist`
- built client assets under `client/dist`
- a root-level `bin` entry pointing to `server/dist/cli.js`

The cleanest architecture is to separate the current `server/src/index.ts` responsibilities into:

1. a reusable server bootstrap that accepts `rootDir`, `port`, `staticDir`, and `logger`
2. a CLI entrypoint that parses args, resolves the content root, chooses a port, optionally opens the browser, and starts the server

The current codebase is close enough to support this without a rewrite, but there are four concrete blockers that planning must account for:

1. Root `build` is already broken because `shared/package.json` has no `build` script.
2. `server/package.json` has no `build` script, so there is no official compiled server artifact.
3. `server/src/index.ts` hard-requires `ROOT_DIR` and hardcodes `../../client/dist` relative to `process.cwd()`, which only works from the repo layout.
4. There is no release automation, no README/install docs, and no Homebrew formula scaffold.

**Primary recommendation:** Keep the package topology simple. Publish the existing root package `marky`, add a real `bin`, make `npm pack` the release artifact, and make Homebrew install that tarball with a `node` dependency. Do not introduce a second CLI package unless packaging the root becomes impossible.

---

## Current Repo Reality

### Packaging and Build State

- Root [package.json](/Users/romankarski/Documents/Documents_v2/Projects/Marky/package.json) is already named `marky`, which is good for distribution.
- Root `build` currently runs `npm run build --workspace=shared && npm run build --workspace=client`.
- That command fails today because [shared/package.json](/Users/romankarski/Documents/Documents_v2/Projects/Marky/shared/package.json) does not define a `build` script.
- [server/package.json](/Users/romankarski/Documents/Documents_v2/Projects/Marky/server/package.json) has `dev`, `start`, and `test`, but no `build`.
- The repo currently has no `README.md`, `LICENSE`, `.github/workflows/*`, release scripts, or Homebrew artifacts.

### Runtime State

- [server/src/index.ts](/Users/romankarski/Documents/Documents_v2/Projects/Marky/server/src/index.ts) is both the entrypoint and the production bootstrap.
- It throws if `ROOT_DIR` is missing, so the CLI contract does not exist yet.
- It registers static assets only in production and resolves them via `path.resolve(process.cwd(), '../../client/dist')`, which assumes the current process is running from inside `server/dist` in the source repo.
- [server/src/app.ts](/Users/romankarski/Documents/Documents_v2/Projects/Marky/server/src/app.ts) is already a good reusable seam: `buildApp({ rootDir, logger })`.

### Test Infrastructure State

- Server tests use Vitest and `buildApp` injection patterns already.
- There are no CLI-specific tests yet.
- In this local environment, `npm run test --workspace=server` currently fails because dependencies are not installed, not because the test harness is invalid. Planning should assume `npm install` or `npm ci` happens before execution verification.

---

## Standard Stack

### Keep

| Tool | Role | Why Keep It |
|------|------|-------------|
| Fastify | Local API + static file server | Already in place; can serve built client and API from one port |
| TypeScript + `tsc` | Build server/shared artifacts | Enough for this package; no bundler required yet |
| Vite | Client production build | Already standard in the repo |
| Vitest | Unit/integration tests | Existing server test pattern covers CLI helpers well |

### Add

| Tool | Role | Recommendation |
|------|------|----------------|
| `open` npm package or equivalent thin abstraction | Cross-platform browser launch | Recommended for predictable `--no-open` / default-open behavior |
| Node `net` probing or tiny port helper | Port selection | Prefer built-in `net` over adding another dependency unless implementation becomes noisy |

### Avoid

| Avoid | Why |
|------|-----|
| Introducing Electron/Tauri/native shell | Phase is packaging/distribution for the existing web app, not a desktop rewrite |
| Shipping source-only CLI that expects `tsx` in production | Installed `marky` must run from built JS |
| Resolving assets from `process.cwd()` | Installed package execution and arbitrary working directories will break |

---

## Architecture Patterns

### Pattern 1: Split reusable server bootstrap from CLI entrypoint

**What:** Extract the current startup logic into a reusable function, then keep the CLI thin.

**Recommended shape:**

```ts
// server/src/start-server.ts
export interface StartMarkyServerOptions {
  rootDir: string;
  port: number;
  host?: string;
  staticDir?: string | null;
  logger?: boolean;
}

export async function startMarkyServer(opts: StartMarkyServerOptions) {
  const app = await buildApp({ rootDir: opts.rootDir, logger: opts.logger });
  if (opts.staticDir) {
    await registerStaticUi(app, opts.staticDir);
  }
  await app.listen({ host: opts.host ?? '127.0.0.1', port: opts.port });
  return app;
}
```

**Why:** It lets tests exercise startup without shelling out, keeps `server/src/index.ts` usable for repo-local dev if needed, and makes `server/src/cli.ts` mostly orchestration.

### Pattern 2: Deterministic root-dir precedence

Use this exact precedence:

1. `ROOT_DIR` env var if set and non-empty
2. positional directory argument if provided
3. `process.cwd()`

Normalize to an absolute path with `path.resolve()`.

**Why:** This matches the PRD and preserves the existing env-var override semantics.

### Pattern 3: Deterministic port behavior

Use a fixed default starting port of `4310`.

- If `--port <n>` is provided and `<n>` is busy: exit non-zero with a clear error.
- If no `--port` is provided: probe `4310..4320` and choose the first free port.
- Always print the final URL to stdout before optional browser-open.

**Why:** `4310` avoids the current dev-server `3001` mental model and gives a stable CLI contract without hiding collisions.

### Pattern 4: Static assets resolved relative to the built package, not cwd

Do not keep this pattern:

```ts
path.resolve(process.cwd(), '../../client/dist')
```

Use a helper anchored to the built module:

```ts
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const staticDir = path.resolve(here, '../../client/dist');
```

**Why:** This works when the package is installed globally, unpacked from `npm pack`, or launched from any notes folder.

### Pattern 5: `npm pack` as the canonical artifact

Use the root package tarball as the single installable release artifact.

Recommended root `package.json` additions:

- `"private": false`
- `"bin": { "marky": "server/dist/cli.js" }`
- `"files": ["server/dist", "client/dist", "shared/dist", "package.json", "README.md"]`
- `"prepack": "npm run build"`

**Why:** One artifact serves both npm-style installs and Homebrew downloads. Homebrew can install the tarball into `libexec` and wrap the `marky` binary with `node`.

### Pattern 6: Homebrew formula should consume release tarball, not repo source

Recommended approach:

- GitHub release uploads `marky-<version>.tgz` produced by `npm pack`
- Formula declares `depends_on "node"`
- Formula installs tarball contents into `libexec/"package"`
- Formula writes a wrapper script that executes `node #{libexec}/package/server/dist/cli.js`

**Why:** This avoids Homebrew having to run the full monorepo build from source and keeps the install path aligned with the tested artifact.

---

## Recommended Project Structure

```text
package.json                         # root package becomes publishable CLI package
shared/package.json                  # add build script for emitted declarations
server/package.json                  # add build script and CLI runtime deps
server/src/
├── app.ts                           # existing Fastify app factory
├── cli.ts                           # NEW CLI entrypoint
├── index.ts                         # repo/dev bootstrap or re-exported start helper
├── start-server.ts                  # NEW reusable startup helper
├── lib/
│   └── cli/
│       ├── args.ts                  # parse args, root precedence
│       ├── port.ts                  # port probing / explicit-port failure
│       └── browser.ts               # open/no-open abstraction
server/tests/cli/
├── marky-cli.test.ts                # arg parsing + root resolution
├── port-and-open.test.ts            # deterministic port + browser-open behavior
├── standalone-assets.test.ts        # serves built client from resolved staticDir
└── package-artifact.test.ts         # npm pack dry-run contract
packaging/homebrew/marky.rb          # formula template
scripts/verify-cli-package.mjs       # smoke test for packed artifact
.github/workflows/release-cli.yml    # build + npm pack + release upload
```

---

## Common Pitfalls

### Pitfall 1: Root package is named correctly but not actually publishable

**What goes wrong:** `name: "marky"` exists, but `private: true`, missing `bin`, and missing `files` make the package unusable as an install artifact.

**How to avoid:** Treat root packaging as a first-class deliverable in Plan 03, not a docs afterthought.

### Pitfall 2: Shared workspace breaks the build chain

**What goes wrong:** Root build already fails because `shared` has no `build` script.

**How to avoid:** Add an explicit shared build step or remove it from the root build if the package remains types-only. Do not assume the current root build works.

### Pitfall 3: Static assets resolve from the repo checkout only

**What goes wrong:** `process.cwd()` changes with the notes directory, so `../../client/dist` points at nonsense in installed mode.

**How to avoid:** Resolve paths relative to `import.meta.url` of the built CLI/runtime file.

### Pitfall 4: Explicit-port and auto-port behavior become inconsistent

**What goes wrong:** `marky --port 4310` silently picks another port or default `marky` randomly fails.

**How to avoid:** Make the rule simple and document it in code/tests: explicit port fails if busy; default port auto-probes a fixed range.

### Pitfall 5: Browser-open side effects make tests flaky

**What goes wrong:** CLI tests launch real browser windows or become platform-specific.

**How to avoid:** Isolate browser launching behind a helper and mock it in Vitest.

### Pitfall 6: Homebrew formula is written before the artifact shape is stable

**What goes wrong:** The formula points at files that change during packaging work, forcing churn.

**How to avoid:** Land and verify the `npm pack` artifact contract first, then write the formula against that stable layout.

---

## Validation Architecture

Phase 11 should be validated with a mix of:

1. **Vitest unit tests** for arg parsing, root resolution, port selection, and browser-open gating
2. **Vitest integration tests** for static asset serving and package artifact contents
3. **Smoke scripts** for packed-artifact execution from an arbitrary temp notes directory
4. **Manual verification** for actual browser-open UX and Homebrew install flow

Wave 0 should create four RED tests:

- `server/tests/cli/marky-cli.test.ts`
- `server/tests/cli/port-and-open.test.ts`
- `server/tests/cli/standalone-assets.test.ts`
- `server/tests/cli/package-artifact.test.ts`

The packed-artifact smoke step should verify this exact path contract:

- `server/dist/cli.js`
- `client/dist/index.html`
- root `package.json` with `bin.marky`

Homebrew verification should remain a blocking human checkpoint because it depends on an external tap/release asset.

---

## Planning Implications

The strongest four-plan breakdown is:

1. **Wave 0 tests** for CLI contract, static asset contract, and package artifact contract
2. **CLI runtime implementation** for args/root/port/browser behavior
3. **Build + packaging implementation** for dist output, bin/files, and packable artifact
4. **Release/Homebrew + smoke verification** for user-facing distribution

That order matches the PRD rollout exactly and keeps artifact/release work from being attempted before the runtime contract exists.
