// Wave 0 RED tests — useScrollPersist does not exist yet.
// These tests will fail with module-not-found errors until Wave 1 creates the source file.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// Source file does not exist yet — RED state
import { saveScrollPosition, getScrollPosition } from '../useScrollPersist';

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
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('saveScrollPosition', () => {
  it('saves scroll position to localStorage after 200ms debounce', async () => {
    saveScrollPosition('docs/long.md', 450);

    // Before debounce fires — nothing written yet
    expect(lsMock.setItem).not.toHaveBeenCalled();

    // Advance past 200ms
    await vi.advanceTimersByTimeAsync(200);

    expect(lsMock.setItem).toHaveBeenCalledWith(
      'marky:scroll',
      expect.stringContaining('docs/long.md')
    );

    const written = lsMock.setItem.mock.calls[0][1] as string;
    const parsed = JSON.parse(written);
    expect(parsed['docs/long.md']).toBe(450);
  });

  it('does NOT save scroll position before 200ms debounce fires', async () => {
    saveScrollPosition('docs/long.md', 300);

    // Only advance 100ms — debounce not yet fired
    await vi.advanceTimersByTimeAsync(100);

    expect(lsMock.setItem).not.toHaveBeenCalled();
  });

  it('debounces multiple rapid calls — only saves once with the latest value', async () => {
    saveScrollPosition('docs/long.md', 100);
    await vi.advanceTimersByTimeAsync(50);
    saveScrollPosition('docs/long.md', 200);
    await vi.advanceTimersByTimeAsync(50);
    saveScrollPosition('docs/long.md', 350);

    // Should not have saved yet
    expect(lsMock.setItem).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(200);

    // Should save exactly once with the latest value
    expect(lsMock.setItem).toHaveBeenCalledTimes(1);
    const written = lsMock.setItem.mock.calls[0][1] as string;
    const parsed = JSON.parse(written);
    expect(parsed['docs/long.md']).toBe(350);
  });
});

describe('getScrollPosition', () => {
  it('returns undefined when marky:scroll key is absent', () => {
    const result = getScrollPosition('docs/long.md');
    expect(result).toBeUndefined();
  });

  it('returns saved scroll position number when key is present', () => {
    lsMock._store.set(
      'marky:scroll',
      JSON.stringify({ 'docs/long.md': 750 })
    );

    const result = getScrollPosition('docs/long.md');
    expect(result).toBe(750);
  });

  it('returns undefined for a path not in the scroll map', () => {
    lsMock._store.set(
      'marky:scroll',
      JSON.stringify({ 'other/file.md': 100 })
    );

    const result = getScrollPosition('docs/long.md');
    expect(result).toBeUndefined();
  });
});
