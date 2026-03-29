# Phase 11: CLI Distribution and Homebrew Packaging - Context

**Gathered:** 2026-03-29
**Status:** Ready for planning
**Source:** PRD Express Path (`CLI-DISTRIBUTION.md`)

<domain>
## Phase Boundary

Phase 11 delivers a standalone CLI distribution path for Marky. Running `marky` from any notes directory should resolve that directory as the content root by default, start the local server, serve the built client in standalone mode, open the browser by default, honor basic CLI flags, and support installable release artifacts including Homebrew distribution.

This phase extends the existing local-first web architecture. It does not rewrite the app, change the on-disk markdown format, or introduce multi-user/cloud behavior.

</domain>

<decisions>
## Implementation Decisions

### CLI Contract
- Locked decision: Provide a real `marky` executable entrypoint for local standalone use.
- Locked decision: Support invocation forms `marky`, `marky .`, `marky /path/to/folder`, `marky --port 4310`, and `marky --no-open`.
- Locked decision: The CLI uses `ROOT_DIR` when explicitly set; otherwise it defaults to an explicit positional folder argument or `process.cwd()`.
- Locked decision: Browser auto-open is enabled by default and can be disabled.
- Locked decision: Port selection and duplicate-launch behavior must be deterministic and clearly surfaced to the user.

### Packaging and Runtime
- Locked decision: The server must serve built client assets in standalone or production mode rather than assuming the source repo layout exists on disk.
- Locked decision: The installed CLI must not depend on the repository checkout being present.
- Locked decision: Build output must include runnable server JavaScript plus client assets required by the CLI distribution path.

### Distribution
- Locked decision: Produce an installable artifact suitable for release distribution.
- Locked decision: Add Homebrew tap support backed by release artifacts.
- Locked decision: Verify the installed `marky` command works from arbitrary folders, not only from the repo root.

### the agent's Discretion
- Exact CLI argument parser choice, if any
- Exact browser-open helper/library choice
- Exact port-conflict fallback strategy, as long as behavior stays deterministic and documented
- Exact release artifact format and CI workflow details, as long as they support installable CLI and Homebrew distribution

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Definition
- `.planning/ROADMAP.md` — Phase 11 goal, requirements, success criteria, and plan slots
- `CLI-DISTRIBUTION.md` — packaging requirements, CLI contract, rollout order, and risks

### Current Packaging and Runtime Surfaces
- `package.json` — workspace root scripts and top-level packaging entry surface
- `server/package.json` — server runtime/build scripts and dependency surface
- `client/package.json` — client build command and bundle dependency surface
- `server/src/index.ts` — current startup path, `ROOT_DIR` requirement, and current production static-asset assumption
- `server/src/app.ts` — Fastify app factory and root-dir-dependent services
- `client/vite.config.ts` — current client build/proxy behavior to preserve or adapt for standalone mode

### External Specs
- No external specs or ADRs are referenced beyond the files above

</canonical_refs>

<specifics>
## Specific Ideas

- Expected user flow: `brew install marky`, `cd /path/to/notes`, `marky`
- The current repository already fixed the root-directory resolution bug on 2026-03-29
- The current app can already use `ROOT_DIR` or launch-directory semantics; Phase 11 should package that capability into a standalone CLI
- Recommended rollout order: local standalone CLI, arbitrary-folder verification, installable artifact, then Homebrew tap

</specifics>

<deferred>
## Deferred Ideas

- No rewrite of the application architecture
- No new runtime framework requirement
- No cloud sync, multi-user collaboration, or native desktop packaging in this phase
- Optional extras like advanced argument parsing or a dedicated port-finder library are discretionary, not mandatory

</deferred>

---

*Phase: 11-cli-distribution-and-homebrew-packaging*
*Context gathered: 2026-03-29 via PRD Express Path*
