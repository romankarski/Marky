// Wave 0 stub — RED state intentional. Passes after Plan 04 creates useSearch.
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import MiniSearch from 'minisearch';

// This import will fail in RED phase — hooks/useSearch.ts does not exist yet.
import { useSearch } from '../hooks/useSearch';

// ---------------------------------------------------------------------------
// Fixture: minimal SearchIndexPayload with one document
// ---------------------------------------------------------------------------

function buildFixturePayload() {
  const ms = new MiniSearch<{ id: string; name: string; path: string; text: string; tags: string[] }>({
    fields: ['name', 'text', 'tags'],
    storeFields: ['name', 'path', 'text', 'tags'],
    idField: 'id',
  });
  ms.add({ id: 'notes/hello.md', name: 'hello', path: 'notes/hello.md', text: 'hello world', tags: ['search'] });

  return {
    index: JSON.parse(JSON.stringify(ms)),
    tags: ['search'],
    tagMap: { search: ['notes/hello.md'] },
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useSearch hook', () => {
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    const fixturePayload = buildFixturePayload();
    fetchSpy = vi.fn().mockResolvedValue({
      json: () => Promise.resolve(fixturePayload),
    });
    vi.stubGlobal('fetch', fetchSpy);
  });

  it('SRCH-01: indexPayload is null before fetch resolves, non-null after', async () => {
    const { result } = renderHook(() => useSearch());

    // Before fetch resolves, indexPayload should be null
    expect(result.current.indexPayload).toBeNull();

    // Wait for fetch to complete
    await act(async () => {
      await Promise.resolve();
    });

    // After fetch resolves, indexPayload should be non-null and contain tags
    expect(result.current.indexPayload).not.toBeNull();
    expect(result.current.indexPayload?.tags).toEqual(['search']);
  });

  it('SRCH-01: search("hello") returns at least one result after index loads', async () => {
    const { result } = renderHook(() => useSearch());

    await act(async () => {
      await Promise.resolve();
    });

    act(() => {
      result.current.search('hello');
    });

    expect(result.current.results.length).toBeGreaterThanOrEqual(1);
  });

  it('SRCH-02: results have name, path, text fields', async () => {
    const { result } = renderHook(() => useSearch());

    await act(async () => {
      await Promise.resolve();
    });

    act(() => {
      result.current.search('hello');
    });

    expect(result.current.results.length).toBeGreaterThanOrEqual(1);
    const first = result.current.results[0];
    expect(typeof (first as Record<string, unknown>).name).toBe('string');
    expect(typeof (first as Record<string, unknown>).path).toBe('string');
    expect(typeof (first as Record<string, unknown>).text).toBe('string');
  });

  it('SRCH-01: empty query "" returns empty results', async () => {
    const { result } = renderHook(() => useSearch());

    await act(async () => {
      await Promise.resolve();
    });

    act(() => {
      result.current.search('');
    });

    expect(result.current.results).toHaveLength(0);
  });

  it('refetchIndex: refetchIndex is a function in the hook return value', async () => {
    const { result } = renderHook(() => useSearch());

    await act(async () => {
      await Promise.resolve();
    });

    expect(typeof result.current.refetchIndex).toBe('function');
  });

  it('refetchIndex: calling refetchIndex() causes fetch to be called a second time', async () => {
    const { result } = renderHook(() => useSearch());

    // Wait for initial fetch
    await act(async () => {
      await Promise.resolve();
    });

    expect(fetchSpy.mock.calls.length).toBe(1);

    // Trigger refetch
    await act(async () => {
      result.current.refetchIndex();
      await Promise.resolve();
    });

    expect(fetchSpy.mock.calls.length).toBe(2);
  });
});
