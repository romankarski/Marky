// Wave 0 RED tests — client/src/lib/tagGraph.ts does not exist yet.
// These tests should fail with import errors until Wave 1 creates the module.

import { describe, expect, it } from 'vitest';
import {
  applyLayoutSnapshot,
  buildCytoscapeElements,
  captureNodePositions,
  directoryChainForPath,
  tagColor,
} from '../tagGraph';

describe('applyLayoutSnapshot', () => {
  it('merges saved node coordinates by path', () => {
    const result = applyLayoutSnapshot(
      [
        {
          id: 'notes/alpha.md',
          path: 'notes/alpha.md',
          label: 'Alpha',
          tags: ['shared'],
          tagCount: 1,
        },
        {
          id: 'notes/beta.md',
          path: 'notes/beta.md',
          label: 'Beta',
          tags: [],
          tagCount: 0,
        },
      ],
      {
        positions: {
          'notes/beta.md': { x: 50, y: 75, fx: 50, fy: 75 },
        },
        viewport: null,
      },
    );

    expect(result[0]).not.toMatchObject({ x: 50, y: 75 });
    expect(result[1]).toMatchObject({
      x: 50,
      y: 75,
      fx: 50,
      fy: 75,
    });
  });

  it('ignores stale snapshot entries that do not match a current node path', () => {
    const result = applyLayoutSnapshot(
      [
        {
          id: 'notes/alpha.md',
          path: 'notes/alpha.md',
          label: 'Alpha',
          tags: ['shared'],
          tagCount: 1,
        },
      ],
      {
        positions: {
          'notes/missing.md': { x: 10, y: 20 },
        },
        viewport: { x: 1, y: 2, k: 3 },
      },
    );

    expect(result).toHaveLength(1);
    expect(result[0]).not.toHaveProperty('x');
    expect(result[0]).not.toHaveProperty('y');
  });
});

describe('captureNodePositions', () => {
  it('serializes only nodes whose coordinates are numeric', () => {
    expect(
      captureNodePositions([
        {
          id: 'notes/alpha.md',
          path: 'notes/alpha.md',
          label: 'Alpha',
          tags: ['shared'],
          tagCount: 1,
          x: 10,
          y: 20,
        },
        {
          id: 'notes/beta.md',
          path: 'notes/beta.md',
          label: 'Beta',
          tags: [],
          tagCount: 0,
          x: Number.NaN,
          y: 30,
        },
        {
          id: 'notes/gamma.md',
          path: 'notes/gamma.md',
          label: 'Gamma',
          tags: [],
          tagCount: 0,
        },
      ]),
    ).toEqual({
      'notes/alpha.md': { x: 10, y: 20 },
    });
  });
});

describe('tagColor', () => {
  it('produces stable HSL output for the same tag', () => {
    expect(tagColor('work')).toBe(tagColor('work'));
  });

  it('produces different colors for different tags', () => {
    expect(tagColor('work')).not.toBe(tagColor('home'));
  });
});

describe('directoryChainForPath', () => {
  it('returns empty array for root-level files', () => {
    expect(directoryChainForPath('root.md')).toEqual([]);
  });

  it('produces nested cumulative directory ids', () => {
    expect(directoryChainForPath('notes/projects/foo.md')).toEqual([
      'notes',
      'notes/projects',
    ]);
  });
});

describe('buildCytoscapeElements', () => {
  const nodes = [
    { id: 'notes/a.md', path: 'notes/a.md', label: 'a', tags: ['work'], tagCount: 1 },
    { id: 'notes/projects/b.md', path: 'notes/projects/b.md', label: 'b', tags: ['home'], tagCount: 1 },
    { id: 'root.md', path: 'root.md', label: 'root', tags: [], tagCount: 0 },
  ];
  const links = [
    { source: 'notes/a.md', target: 'notes/projects/b.md', sharedTags: ['shared'], weight: 1 },
  ];
  const fileLinks = [
    { source: 'root.md', target: 'notes/a.md' },
  ];

  it('emits directory parent nodes with nested parent chains', () => {
    const els = buildCytoscapeElements({ nodes, links });
    const ids = els.filter((e) => e.data.kind === 'dir').map((e) => e.data.id);
    expect(ids).toEqual(expect.arrayContaining(['notes', 'notes/projects']));
    const projectsEl = els.find((e) => e.data.id === 'notes/projects');
    expect(projectsEl?.data.parent).toBe('notes');
  });

  it('assigns parent directory to file nodes', () => {
    const els = buildCytoscapeElements({ nodes, links });
    const a = els.find((e) => e.data.id === 'notes/a.md');
    const b = els.find((e) => e.data.id === 'notes/projects/b.md');
    const root = els.find((e) => e.data.id === 'root.md');
    expect(a?.data.parent).toBe('notes');
    expect(b?.data.parent).toBe('notes/projects');
    expect(root?.data.parent).toBeUndefined();
  });

  it('colors file nodes by primary tag', () => {
    const els = buildCytoscapeElements({ nodes, links });
    const a = els.find((e) => e.data.id === 'notes/a.md');
    expect(a?.data.color).toBe(tagColor('work'));
  });

  it('emits tag edges and file-link edges with distinct kinds', () => {
    const els = buildCytoscapeElements({ nodes, links, fileLinks });
    const edges = els.filter((e) => e.data.source && e.data.target);
    expect(edges.map((e) => e.data.kind).sort()).toEqual(['link', 'tag']);
  });

  it('hides tag edges when showTagEdges=false', () => {
    const els = buildCytoscapeElements({ nodes, links, fileLinks, showTagEdges: false });
    expect(els.every((e) => e.data.kind !== 'tag')).toBe(true);
  });

  it('filters nodes by visibleTags and drops orphaned edges', () => {
    const els = buildCytoscapeElements({
      nodes,
      links,
      fileLinks,
      visibleTags: new Set(['work']),
    });
    const fileIds = els.filter((e) => e.data.kind === 'file').map((e) => e.data.id);
    // 'work' visible → notes/a.md keeps; 'home'-only nodes drop; untagged always kept
    expect(fileIds).toEqual(expect.arrayContaining(['notes/a.md', 'root.md']));
    expect(fileIds).not.toContain('notes/projects/b.md');
    // Edge a→b must drop because b was filtered
    const tagEdge = els.find((e) => e.data.kind === 'tag');
    expect(tagEdge).toBeUndefined();
  });
});
