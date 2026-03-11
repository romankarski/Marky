import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, act } from '@testing-library/react';
import React from 'react';

import { saveScrollPosition, getScrollPosition, useScrollPersist } from '../useScrollPersist';

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
  it('saves scroll position to localStorage synchronously', () => {
    saveScrollPosition('docs/long.md', 450);

    // Synchronous — written immediately, no timer needed
    expect(lsMock.setItem).toHaveBeenCalledWith(
      'marky:scroll',
      expect.stringContaining('docs/long.md')
    );

    const written = lsMock.setItem.mock.calls[0][1] as string;
    const parsed = JSON.parse(written);
    expect(parsed['docs/long.md']).toBe(450);
  });

  it('overwrites previous value on successive calls', () => {
    saveScrollPosition('docs/long.md', 100);
    saveScrollPosition('docs/long.md', 350);

    expect(lsMock.setItem).toHaveBeenCalledTimes(2);
    const written = lsMock.setItem.mock.calls[1][1] as string;
    const parsed = JSON.parse(written);
    expect(parsed['docs/long.md']).toBe(350);
  });

  it('preserves other paths when saving a new value', () => {
    // Pre-populate with another path
    lsMock._store.set('marky:scroll', JSON.stringify({ 'other/file.md': 999 }));

    saveScrollPosition('docs/long.md', 200);

    const written = lsMock.setItem.mock.calls[0][1] as string;
    const parsed = JSON.parse(written);
    expect(parsed['docs/long.md']).toBe(200);
    expect(parsed['other/file.md']).toBe(999);
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

describe('useScrollPersist — scroll listener debounce', () => {
  it('debounces scroll events: calls saveScrollPosition after 200ms idle', async () => {
    // Render a real component that uses the hook so the ref attaches to a real DOM node
    function TestComponent() {
      const scrollRef = useScrollPersist('docs/long.md', 'content');
      return React.createElement('div', {
        ref: scrollRef,
        style: { overflow: 'auto', height: '100px' },
        'data-testid': 'scroll-container',
      });
    }

    const { getByTestId } = render(React.createElement(TestComponent));
    const el = getByTestId('scroll-container');

    // Fire scroll events rapidly
    act(() => {
      el.dispatchEvent(new Event('scroll'));
      el.dispatchEvent(new Event('scroll'));
    });

    // Should not have saved yet (debounced)
    expect(lsMock.setItem).not.toHaveBeenCalled();

    // Advance past the 200ms debounce
    await act(async () => {
      await vi.advanceTimersByTimeAsync(200);
    });

    // Now it should have saved
    expect(lsMock.setItem).toHaveBeenCalled();
  });
});
