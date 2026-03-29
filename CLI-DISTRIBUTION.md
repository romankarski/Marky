# Marky CLI / Homebrew Packaging

## Goal

Allow this flow:

```bash
brew install marky
cd /path/to/notes
marky
```

Expected behavior:
- Marky uses the current working directory as the content root
- Starts a local server
- Opens the app in the browser automatically
- Browses and edits markdown files from the directory where `marky` was run

## Current Status

- Root directory resolution bug fixed on 2026-03-29
- Current app can already use `ROOT_DIR` or launch directory semantics
- No standalone CLI entrypoint exists yet
- No packaged release or Homebrew formula exists yet

## Scope

This is a medium-sized packaging/distribution feature, not a rewrite.

Main work:
1. Add a real `marky` CLI entrypoint
2. Make the server serve the built client in standalone mode
3. Use `process.cwd()` as the default content root when launched via CLI
4. Auto-open the browser on startup
5. Handle port selection and duplicate launches cleanly
6. Publish installable artifacts
7. Add a Homebrew tap formula

## Proposed Implementation

### Phase 1: Standalone CLI

- Add a Node CLI binary, likely under `server/src/cli.ts`
- Expose it from root `package.json` with a `bin` entry:
  - `"marky": "dist/server/cli.js"` or similar
- Default root/content directory:
  - `ROOT_DIR` if explicitly set
  - otherwise `process.cwd()`
- Start Fastify on a configurable port
- Open browser automatically to the local URL

### Phase 2: Production Build

- Build client assets with Vite
- Build server TypeScript to runnable JS
- Serve the built client from Fastify in production/CLI mode
- Ensure assets resolve correctly when installed outside the repo

### Phase 3: Installation Paths

Option A: npm global install
- `npm install -g marky`

Option B: GitHub release tarball/binary
- publish release artifacts from CI

Option C: Homebrew tap
- create a tap repo with a formula pointing at GitHub release artifacts
- user flow:
  - `brew tap <owner>/marky`
  - `brew install marky`

## Likely Dependencies

- No extra runtime framework is required
- Useful additions:
  - `open` or platform-specific browser-open logic
  - optional port-finder utility
  - optional argument parser if CLI flags are added

## CLI Flags To Support

Recommended initial flags:
- `marky`
- `marky .`
- `marky /path/to/folder`
- `marky --port 4310`
- `marky --no-open`

## Risks

- Production asset paths need to work after installation
- Browser auto-open should stay optional
- Port conflicts need a predictable behavior
- Installed CLI should not assume the repo layout exists on disk

## Suggested Order

1. Ship local standalone CLI from this repo
2. Verify `marky` works when run from arbitrary folders
3. Package installable artifact
4. Add Homebrew distribution

## Notes

- For the current repository version, no extra install is needed to use the root-dir fix.
- For Homebrew distribution later, the user would need Homebrew installed on macOS.
