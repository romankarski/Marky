# Phase 9: Tag Graph View - Research

**Researched:** 2026-03-29
**Domain:** Interactive tag-based graph visualization in a React + Fastify markdown workspace
**Confidence:** MEDIUM

<user_constraints>
## User Constraints

No phase-specific `CONTEXT.md` exists for Phase 9, so there are no additional locked decisions beyond the roadmap, requirements, and current codebase state.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| GRPH-01 | Graph view shows files as nodes clustered and connected by shared tags | Reuse indexed tag metadata, expose explicit graph payload, build weighted shared-tag links, include untagged files as isolated nodes |
| GRPH-02 | Clicking a node in the graph opens that file in a tab | Use `react-force-graph-2d` `onNodeClick` and the existing `openTab + updateRecentFiles + expandFolder` pattern |
| GRPH-03 | Active file is highlighted in the graph | Drive active styling from existing `activeFocusedTab?.path`, not `activeTab`, so split view stays correct |
| GRPH-04 | Graph lives in a dedicated panel or tab (not a modal) | Put graph in the existing right rail as an `Outline | Graph` tabset and keep the graph mounted while hidden |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

None - no `CLAUDE.md` is present at the repo root.

## Summary

Marky already has the two hard pieces this phase needs: a persistent right-side utility rail in [App.tsx](/Users/romankarski/Documents/Documents_v2/Projects/Marky/client/src/App.tsx) and an incremental file/tag index in [search.ts](/Users/romankarski/Documents/Documents_v2/Projects/Marky/server/src/lib/search.ts). The cleanest Phase 9 architecture is to reuse that indexed metadata, expose a dedicated graph payload route, and render the graph in the existing right rail as a sibling to the table of contents rather than as a fourth stacked widget or a modal.

The strongest fit is `react-force-graph-2d`. Its current API directly covers the needed seams: force-directed layout, node click handlers, custom node drawing, simulation stop callbacks, zoom/pan callbacks, and explicit pause/resume controls. That makes GRPH-02, GRPH-03, and GRPH-04 straightforward without adding a heavier graph model layer like Sigma/Graphology or a more imperative element system like Cytoscape.

**Primary recommendation:** Add a lazy-loaded `TagGraphPanel` in the right rail `Outline | Graph` tabset, back it with a new `GET /api/graph/tags` route powered by `SearchService`, keep the force graph mounted while hidden, and snapshot node positions plus viewport to `localStorage` as a fallback so the layout does not restart on panel switches.

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `react-force-graph-2d` | `1.29.1` | Interactive canvas-based force graph for file nodes and shared-tag links | Official React wrapper exposes `graphData`, `onNodeClick`, `nodeCanvasObject`, `onEngineStop`, `onZoomEnd`, `pauseAnimation`, and `resumeAnimation` in one package |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Existing `SearchService` | repo-local | Source of truth for file paths and tags | Reuse current indexed docs instead of adding a third filesystem crawler |
| Browser `localStorage` | built-in | Persist graph snapshot (`positions`, `viewport`, `lastTab`) | Use for layout restore fallback and right-rail subtab persistence |
| Existing Vitest setup | client `4.0.18`, server `2.1.9` | Graph route/unit/component tests | Use existing workspace test commands; no new framework needed |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `react-force-graph-2d` | `@react-sigma/core` `5.0.6` | Sigma is capable but officially requires `sigma` and `graphology` as peer dependencies, adding a heavier graph model and layout stack than this phase needs |
| `react-force-graph-2d` | `react-cytoscapejs` `2.0.0` + `cytoscape` `3.33.1` | Cytoscape is strong for deterministic element/layout control, but it is more imperative and less natural for a persistent force-simulation UX |

**Installation:**

```bash
npm install --workspace=client react-force-graph-2d
```

**Version verification:** Verified on 2026-03-29 with `npm view`.

- `react-force-graph-2d` `1.29.1` - latest publish timestamp `2026-02-04`
- `@react-sigma/core` `5.0.6` - latest publish timestamp `2025-12-01`
- `cytoscape` `3.33.1` - latest publish timestamp `2025-08-12`
- `react-cytoscapejs` `2.0.0` - latest publish timestamp `2022-09-02`

## Architecture Patterns

### Recommended Project Structure

```text
client/src/
├── components/
│   └── TagGraphPanel.tsx          # Right-rail graph UI + graph instance lifecycle
├── hooks/
│   └── useTagGraphPersistence.ts  # localStorage snapshot + viewport restore helpers
└── lib/
    └── tagGraph.ts                # Pure DTO/types + graph merge/restore utilities

server/src/
├── routes/
│   └── graph.ts                   # GET /api/graph/tags
└── lib/
    └── search.ts                  # Extend SearchService with graph snapshot serializer
```

### Pattern 1: Reuse the Existing Search Index as the Graph Source

**What:** Extend `SearchService` with a serializer such as `getGraphSnapshot()` or `listDocs()` and add a dedicated graph route. Do not create a standalone `TagGraphService` that crawls the vault separately.

**When to use:** Always. The app already updates `SearchService` on watcher events in [app.ts](/Users/romankarski/Documents/Documents_v2/Projects/Marky/server/src/app.ts), so a graph payload can stay current without new indexing infrastructure.

**Example:**

```typescript
type TagGraphNode = {
  id: string;
  path: string;
  label: string;
  tags: string[];
  tagCount: number;
};

type TagGraphLink = {
  source: string;
  target: string;
  sharedTags: string[];
  weight: number;
};

// Build nodes from every indexed markdown doc, even when tags.length === 0.
// Build links by walking each tag bucket and incrementing pair weights.
```

### Pattern 2: Right-Rail `Outline | Graph` Tabset, Not a Fourth Stacked Section

**What:** Replace the current TOC-only body of the right rail with a two-tab panel: `Outline` and `Graph`. Keep `FileInfo` and `BacklinksPanel` above it unchanged.

**When to use:** Default placement. This preserves the current interaction model and avoids a cramped four-section rail.

**Example:**

```typescript
type RightRailTab = 'outline' | 'graph';

<div className="flex border-b border-gray-200 px-3">
  <button onClick={() => setRightRailTab('outline')}>Outline</button>
  <button onClick={() => setRightRailTab('graph')}>Graph</button>
</div>
```

### Pattern 3: Keep the Graph Mounted and Pause It When Hidden

**What:** Render `TagGraphPanel` once, keep it mounted, and hide/show it via tab state. Use the graph ref to `pauseAnimation()` when hidden and `resumeAnimation()` plus `refresh()` when shown.

**When to use:** Required for GRPH-04. Conditional rendering will restart the simulation from scratch.

**Example:**

```tsx
import ForceGraph2D from 'react-force-graph-2d';

<ForceGraph2D
  ref={graphRef}
  graphData={graphData}
  onNodeClick={(node) => onOpen(node.path)}
  onZoomEnd={({ x, y, k }) => saveViewport({ x, y, k })}
  onEngineStop={() => saveNodePositions(graphData.nodes)}
/>;
```

Source: https://github.com/vasturiano/react-force-graph

### Pattern 4: Persist Positions by Path, Not by Array Index

**What:** Save a snapshot keyed by file path:

- `positions[path] = { x, y, fx?, fy? }`
- `viewport = { x, y, k }`
- `rightRailTab = 'outline' | 'graph'`

**When to use:** Always. Node array order will change as files/tags change; path keys are stable.

**Example:**

```typescript
type TagGraphLayoutSnapshot = {
  positions: Record<string, { x: number; y: number; fx?: number; fy?: number }>;
  viewport: { x: number; y: number; k: number } | null;
  lastTab: 'outline' | 'graph';
};
```

### Anti-Patterns to Avoid

- **Adding Graph as a fourth stacked right-rail section:** The current right rail already contains `FileInfo`, `BacklinksPanel`, and TOC. A fourth scrollable block will create height-budget conflicts that are already noted in [STATE.md](/Users/romankarski/Documents/Documents_v2/Projects/Marky/.planning/STATE.md).
- **Deriving graph nodes from `tagMap` alone:** That drops untagged files, which would violate "all files as nodes."
- **Creating a separate filesystem crawler for graph data:** Search and backlinks already subscribe to watcher updates; a third crawler increases drift and startup cost.
- **Remounting the graph on tab switch:** This fails GRPH-04 by restarting simulation state.
- **Testing the canvas directly in jsdom:** Mock the graph component and test the props/contracts around it instead.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Force-directed layout and canvas rendering | Custom physics loop or custom canvas renderer | `react-force-graph-2d` | The library already handles rendering, zoom/pan, hit testing, dragging, and simulation lifecycle |
| Canvas node click hit testing | Manual pointer-area math | Built-in `onNodeClick` / pointer interaction support | Hidden interaction canvases are already handled by the library |
| Graph snapshot global store | Reducer/global state for x/y/zoom bookkeeping | Small `localStorage` snapshot hook | Existing Marky persistence uses small keyed browser storage helpers, not app-wide state libraries |
| Graph data re-indexing | New graph-specific scan service | Existing `SearchService` docs map + serializer | Search already tracks file path and tags incrementally |

**Key insight:** The difficult part of this phase is lifecycle control, not graph math. Reuse the existing index and an existing graph renderer; only hand-roll the pure transformation from indexed docs to weighted links and the small persistence helper.

## Common Pitfalls

### Pitfall 1: Untagged Files Disappear

**What goes wrong:** The graph only includes files found in `tagMap`, so notes with no frontmatter tags never render.

**Why it happens:** `tagMap` is tag-centric, not file-centric. The current API does not expose a first-class docs list to the client.

**How to avoid:** Build graph nodes from indexed docs, not from tag buckets alone.

**Warning signs:** Node count equals "number of tagged files" rather than "number of markdown files."

### Pitfall 2: Layout Resets Every Time the User Leaves the Graph

**What goes wrong:** Switching back to TOC or another view restarts the force simulation.

**Why it happens:** The graph component is conditionally rendered and remounted.

**How to avoid:** Keep `TagGraphPanel` mounted behind a tab switch, pause animation when hidden, and keep a snapshot fallback.

**Warning signs:** Nodes jump back to a fresh random layout after every tab change.

### Pitfall 3: Active Highlight Tracks the Wrong File in Split View

**What goes wrong:** The graph highlights the reducer's `activeTab` rather than the currently focused pane's document.

**Why it happens:** Marky already established `activeFocusedTab` in [App.tsx](/Users/romankarski/Documents/Documents_v2/Projects/Marky/client/src/App.tsx); bypassing it breaks split-view semantics.

**How to avoid:** Pass `activeFocusedTab?.path ?? null` to the graph panel and use that for highlight logic.

**Warning signs:** Clicking into the right split pane does not move the highlight.

### Pitfall 4: Edge Generation Becomes Expensive on Every Render

**What goes wrong:** The client recomputes all pairwise links from tags on each render and the graph gets sluggish.

**Why it happens:** Pairwise shared-tag edges can expand quickly for broad tags.

**How to avoid:** Build the graph payload once on the server, sort it deterministically, and only rebuild when the search index changes.

**Warning signs:** Typing in unrelated parts of the app causes graph frame drops.

### Pitfall 5: jsdom Tests Become Brittle Around Canvas

**What goes wrong:** Tests try to inspect rendered canvas pixels or real force simulation state.

**Why it happens:** Canvas behavior is not a good unit-test target in the current Vitest + jsdom setup.

**How to avoid:** Mock `react-force-graph-2d` with a lightweight test double that exposes node buttons and captures callbacks. Test pure graph builders and persistence hooks separately.

**Warning signs:** Tests depend on timers, RAF internals, or canvas APIs not present in jsdom.

## Code Examples

Verified patterns from official sources:

### `react-force-graph-2d` click + lifecycle hooks

```tsx
import ForceGraph2D from 'react-force-graph-2d';

<ForceGraph2D
  ref={graphRef}
  graphData={graphData}
  onNodeClick={(node) => onOpen(node.path)}
  onZoomEnd={({ x, y, k }) => persistViewport({ x, y, k })}
  onEngineStop={() => persistPositions(graphData.nodes)}
/>;
```

Source: https://github.com/vasturiano/react-force-graph

### Custom active-node drawing

```tsx
<ForceGraph2D
  graphData={graphData}
  nodeCanvasObject={(node, ctx, scale) => {
    const isActive = node.path === activeFilePath;
    const radius = isActive ? 7 : 5;

    ctx.beginPath();
    ctx.arc(node.x ?? 0, node.y ?? 0, radius, 0, 2 * Math.PI, false);
    ctx.fillStyle = isActive ? '#f97316' : node.color;
    ctx.fill();

    if (isActive) {
      ctx.lineWidth = 2 / scale;
      ctx.strokeStyle = '#fb923c';
      ctx.stroke();
    }
  }}
/>;
```

Source: https://github.com/vasturiano/react-force-graph

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| SVG/DOM-heavy graph renderers for interactive note graphs | Canvas/WebGL graph renderers | Current ecosystem norm | Better fit for medium-size interactive graphs and custom node painting |
| Recompute layout on every open | Freeze simulation and restore positions/viewport | Current UX expectation for persistent workspaces | Directly supports GRPH-04 |
| Separate indexing pipelines per feature | Shared metadata service with multiple serializers | Current Marky codebase pattern | Less drift, less startup work, fewer watcher subscriptions |

**Deprecated/outdated:**

- Reading MiniSearch internal JSON structure on the client to discover graph nodes: brittle and not an explicit contract. Use a dedicated route.
- Modal-only graph UI: explicitly out of scope for this phase because GRPH-04 requires a dedicated panel or tab.

## Open Questions

1. **Should the right rail remember `Outline` vs `Graph` across page reloads?**
   - What we know: Existing Marky UX already persists tabs, scroll, recent files, and panel collapse state.
   - What's unclear: The roadmap only requires restore across navigation, not full reload.
   - Recommendation: Persist the right-rail subtab in the same snapshot key; it is low-cost and consistent with current UX.

2. **Should the graph auto-center on active-file changes?**
   - What we know: Active-file highlighting is required; forced recentering is not.
   - What's unclear: Constant recentering could feel disruptive when users are exploring.
   - Recommendation: Highlight always, but only auto-focus on the active node the first time the graph opens or when the active file is off-screen and the user explicitly clicks a "Focus active" control.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|-------------|-----------|---------|----------|
| Node.js | Client/server tests and build | ✓ | `v25.8.2` | — |
| npm | Install graph dependency and run workspace tests | ✓ | `11.11.1` | — |
| Vitest | Validation architecture | ✓ | client `4.0.18`, server `2.1.9` | Use workspace `npm test` wrappers |

**Missing dependencies with no fallback:**

- None.

**Missing dependencies with fallback:**

- None.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest - client `4.0.18`, server `2.1.9` |
| Config file | `client/vite.config.ts`; `server/vitest.config.ts` |
| Quick run command | `npm test --workspace=client -- src/__tests__/TagGraphPanel.test.tsx` and `npm test --workspace=server -- tests/routes/graph.test.ts` |
| Full suite command | `npm test --workspace=client` and `npm test --workspace=server` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| GRPH-01 | Route returns all files as nodes and weighted shared-tag links, including untagged isolated files | server route + pure utility | `npm test --workspace=server -- tests/routes/graph.test.ts` | ❌ Wave 0 |
| GRPH-02 | Clicking a graph node opens the file path passed to `onOpen` | client component with mocked graph lib | `npm test --workspace=client -- src/__tests__/TagGraphPanel.test.tsx` | ❌ Wave 0 |
| GRPH-03 | Active file path changes active node styling | client unit/component | `npm test --workspace=client -- src/__tests__/TagGraphPanel.test.tsx` | ❌ Wave 0 |
| GRPH-04 | Graph lives in persistent right-rail tab and restores layout/viewport when revisited | client integration + persistence hook | `npm test --workspace=client -- src/hooks/__tests__/useTagGraphPersistence.test.ts` | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** Run the targeted client or server graph tests for the touched seam.
- **Per wave merge:** Run `npm test --workspace=client` plus impacted server graph tests.
- **Phase gate:** Client full suite green, graph-specific server tests green, and manual visual verification of layout persistence and click-through behavior.

### Wave 0 Gaps

- [ ] `client/src/__tests__/TagGraphPanel.test.tsx` - canvas adapter mocked, covers GRPH-02 and GRPH-03
- [ ] `client/src/hooks/__tests__/useTagGraphPersistence.test.ts` - snapshot serialization/restore, covers GRPH-04
- [ ] `client/src/lib/__tests__/tagGraph.test.ts` - pure graph DTO merge and restore logic
- [ ] `server/tests/routes/graph.test.ts` - payload shape and link weighting, covers GRPH-01
- [ ] Existing unrelated suite issue: `npm test --workspace=server` currently has a pre-existing failure in `tests/routes/watch.test.ts` as of 2026-03-29; Phase 9 should not treat that failure as introduced by graph work

## Sources

### Primary (HIGH confidence)

- https://github.com/vasturiano/react-force-graph - verified API for `graphData`, `nodeCanvasObject`, `pauseAnimation`, `resumeAnimation`, `onEngineStop`, `onNodeClick`, `onZoomEnd`, `d3Force`
- https://www.npmjs.com/package/react-force-graph-2d - package metadata; latest version cross-checked with `npm view react-force-graph-2d version time --json`
- Local code: [App.tsx](/Users/romankarski/Documents/Documents_v2/Projects/Marky/client/src/App.tsx), [useTags.ts](/Users/romankarski/Documents/Documents_v2/Projects/Marky/client/src/hooks/useTags.ts), [search.ts](/Users/romankarski/Documents/Documents_v2/Projects/Marky/server/src/lib/search.ts), [app.ts](/Users/romankarski/Documents/Documents_v2/Projects/Marky/server/src/app.ts)

### Secondary (MEDIUM confidence)

- https://sim51.github.io/react-sigma/docs/start-installation/ - verified that React Sigma requires `sigma` and `graphology` peer dependencies
- https://js.cytoscape.org/ - verified alternative model emphasizing explicit positions/layout APIs and imperative graph element control

### Tertiary (LOW confidence)

- None.

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH - official API/docs align directly with the required behavior, and versions were registry-verified on 2026-03-29
- Architecture: MEDIUM - recommendation is well-supported by local code seams, but hidden-panel lifecycle and large-vault performance are not yet empirically validated in this repo
- Pitfalls: MEDIUM - based on a mix of official graph-library behavior and repo-specific layout/state constraints

**Research date:** 2026-03-29
**Valid until:** 2026-04-28
