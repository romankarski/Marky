// Wave 0 RED tests — useTabPersistence does not exist yet.
// These tests will fail with module-not-found errors until Wave 1 creates the source file.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Source file does not exist yet — RED state: test runner will report failures
import {
  loadPersistedTabs,
  saveTabState,
  updateRecentFiles,
  getRecentFiles,
} from '../useTabPersistence';

// Map-backed localStorage mock
function makeLocalStorageMock() {
  const store = new Map<string, string>();
  return {
    getItem: vi.fn((key: string) => store.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => { store.set(key, value); }),
    removeItem: vi.fn((key: string) => { store.delete(key); }),
    clear: vi.fn(() => { store.clear(); }),
    get length() { return store.size; },
    key: vi.fn((i: number) => Array.from(store.keys())[i] ?? null),
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

describe('loadPersistedTabs', () => {
  it('returns empty array when localStorage has no tabs key', () => {
    const result = loadPersistedTabs();
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(0);
  });

  it('returns parsed tabs array when localStorage has valid JSON', () => {
    const saved = JSON.stringify({
      tabs: [{ path: 'notes/a.md', label: 'a.md' }],
      activeTabPath: 'notes/a.md',
    });
    lsMock._store.set('marky:tabs', saved);

    const result = loadPersistedTabs();
    expect(result).toHaveLength(1);
    expect(result[0].path).toBe('notes/a.md');
    expect(result[0].label).toBe('a.md');
  });

  it('returns empty array when localStorage has corrupt JSON', () => {
    lsMock._store.set('marky:tabs', '{not valid json}}}');
    const result = loadPersistedTabs();
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(0);
  });
});

describe('saveTabState', () => {
  it('writes serialized { tabs, activeTabPath } to localStorage key marky:tabs', () => {
    const tabs = [
      { path: 'docs/readme.md', label: 'readme.md' },
      { path: 'notes/ideas.md', label: 'ideas.md' },
    ];
    saveTabState(tabs, 'docs/readme.md');

    expect(lsMock.setItem).toHaveBeenCalledWith(
      'marky:tabs',
      expect.stringContaining('docs/readme.md')
    );

    const written = lsMock.setItem.mock.calls[0][1] as string;
    const parsed = JSON.parse(written);
    expect(parsed.tabs).toHaveLength(2);
    expect(parsed.activeTabPath).toBe('docs/readme.md');
  });
});

describe('updateRecentFiles', () => {
  it('prepends a new path to the recent files list', () => {
    updateRecentFiles('notes/new.md');
    const written = lsMock.setItem.mock.calls[0][1] as string;
    const parsed = JSON.parse(written);
    expect(parsed[0]).toBe('notes/new.md');
  });

  it('deduplicates paths — same path appears only once at the top', () => {
    lsMock._store.set('marky:recent', JSON.stringify(['notes/old.md', 'docs/readme.md']));
    updateRecentFiles('docs/readme.md');
    const written = lsMock.setItem.mock.calls[0][1] as string;
    const parsed = JSON.parse(written);
    // readme.md should be first, not duplicated
    expect(parsed[0]).toBe('docs/readme.md');
    expect(parsed.filter((p: string) => p === 'docs/readme.md')).toHaveLength(1);
  });

  it('caps recent files at 5 entries', () => {
    const existing = ['a.md', 'b.md', 'c.md', 'd.md', 'e.md'];
    lsMock._store.set('marky:recent', JSON.stringify(existing));
    updateRecentFiles('new.md');
    const written = lsMock.setItem.mock.calls[0][1] as string;
    const parsed = JSON.parse(written);
    expect(parsed).toHaveLength(5);
    expect(parsed[0]).toBe('new.md');
  });
});

describe('getRecentFiles', () => {
  it('returns empty array when marky:recent key is absent', () => {
    const result = getRecentFiles();
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(0);
  });

  it('returns parsed array when key is present', () => {
    lsMock._store.set('marky:recent', JSON.stringify(['a.md', 'b.md']));
    const result = getRecentFiles();
    expect(result).toHaveLength(2);
    expect(result[0]).toBe('a.md');
  });
});
