// Wave 0 RED tests — client/src/hooks/useTagGraphPersistence.ts does not exist yet.
// These tests should fail with import errors until Wave 1 creates the module.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  loadRightRailTab,
  loadTagGraphSnapshot,
  saveRightRailTab,
  saveTagGraphSnapshot,
} from '../useTagGraphPersistence';

function makeLocalStorageMock() {
  const store = new Map<string, string>();
  return {
    getItem: vi.fn((key: string) => store.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store.set(key, value);
    }),
    removeItem: vi.fn((key: string) => {
      store.delete(key);
    }),
    clear: vi.fn(() => {
      store.clear();
    }),
    get length() {
      return store.size;
    },
    key: vi.fn((index: number) => Array.from(store.keys())[index] ?? null),
    _store: store,
  };
}

let lsMock: ReturnType<typeof makeLocalStorageMock>;

beforeEach(() => {
  lsMock = makeLocalStorageMock();
  vi.stubGlobal('localStorage', lsMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('loadTagGraphSnapshot', () => {
  it('returns safe defaults when localStorage is unavailable', () => {
    Object.defineProperty(globalThis, 'localStorage', {
      value: undefined,
      configurable: true,
      writable: true,
    });

    expect(loadTagGraphSnapshot()).toEqual({
      positions: {},
      viewport: null,
    });
  });

  it('returns safe defaults when the saved graph layout JSON is corrupt', () => {
    lsMock._store.set('marky:tag-graph-layout', '{not-valid-json');

    expect(loadTagGraphSnapshot()).toEqual({
      positions: {},
      viewport: null,
    });
  });

  it('loads saved positions and viewport from marky:tag-graph-layout', () => {
    lsMock._store.set(
      'marky:tag-graph-layout',
      JSON.stringify({
        positions: {
          'notes/alpha.md': { x: 10, y: 20, fx: 30, fy: 40 },
        },
        viewport: { x: 5, y: -6, k: 1.5 },
      }),
    );

    expect(loadTagGraphSnapshot()).toEqual({
      positions: {
        'notes/alpha.md': { x: 10, y: 20, fx: 30, fy: 40 },
      },
      viewport: { x: 5, y: -6, k: 1.5 },
    });
  });
});

describe('saveTagGraphSnapshot', () => {
  it('writes the layout snapshot to marky:tag-graph-layout', () => {
    saveTagGraphSnapshot({
      positions: {
        'notes/alpha.md': { x: 10, y: 20 },
      },
      viewport: { x: 1, y: 2, k: 3 },
    });

    expect(lsMock.setItem).toHaveBeenCalledWith(
      'marky:tag-graph-layout',
      JSON.stringify({
        positions: {
          'notes/alpha.md': { x: 10, y: 20 },
        },
        viewport: { x: 1, y: 2, k: 3 },
      }),
    );
  });
});

describe('loadRightRailTab', () => {
  it('defaults to outline when no tab is saved', () => {
    expect(loadRightRailTab()).toBe('outline');
  });

  it('restores the saved graph tab from marky:right-rail-tab', () => {
    lsMock._store.set('marky:right-rail-tab', 'graph');

    expect(loadRightRailTab()).toBe('graph');
  });
});

describe('saveRightRailTab', () => {
  it('writes the selected right-rail tab to marky:right-rail-tab', () => {
    saveRightRailTab('graph');

    expect(lsMock.setItem).toHaveBeenCalledWith('marky:right-rail-tab', 'graph');
  });
});
