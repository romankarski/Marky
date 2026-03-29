// Wave 0 RED tests — client/src/lib/tagGraph.ts does not exist yet.
// These tests should fail with import errors until Wave 1 creates the module.

import { describe, expect, it } from 'vitest';
import { applyLayoutSnapshot, captureNodePositions } from '../tagGraph';

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
