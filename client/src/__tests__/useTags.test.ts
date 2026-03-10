// Wave 0 stub — RED state intentional. Passes after Plan 04 creates useTags.
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// This import will fail in RED phase — hooks/useTags.ts does not exist yet.
import { useTags } from '../hooks/useTags';

// ---------------------------------------------------------------------------
// Fixture: minimal SearchIndexPayload
// ---------------------------------------------------------------------------

const fixturePayload = {
  index: {},
  tags: ['react', 'search'],
  tagMap: {
    react: ['src/react.md', 'notes/react-notes.md'],
    search: ['notes/hello.md'],
  },
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useTags hook', () => {
  it('TAG-02: initial state has activeTag null, filterPaths null, allTags []', () => {
    const { result } = renderHook(() => useTags(null));

    expect(result.current.activeTag).toBeNull();
    expect(result.current.filterPaths).toBeNull();
    expect(result.current.allTags).toEqual([]);
  });

  it('TAG-02: allTags matches indexPayload.tags when payload is provided', () => {
    const { result } = renderHook(() => useTags(fixturePayload));

    expect(result.current.allTags).toEqual(['react', 'search']);
  });

  it('TAG-02: after setActiveTag("react"), activeTag is "react"', () => {
    const { result } = renderHook(() => useTags(fixturePayload));

    act(() => {
      result.current.setActiveTag('react');
    });

    expect(result.current.activeTag).toBe('react');
  });

  it('TAG-02: filterPaths is a Set containing file paths AND ancestor directories when activeTag is set', () => {
    const { result } = renderHook(() => useTags(fixturePayload));

    act(() => {
      result.current.setActiveTag('react');
    });

    expect(result.current.filterPaths).not.toBeNull();
    const paths = result.current.filterPaths as Set<string>;
    expect(paths instanceof Set).toBe(true);

    // Direct file paths
    expect(paths.has('src/react.md')).toBe(true);
    expect(paths.has('notes/react-notes.md')).toBe(true);

    // Ancestor directories
    expect(paths.has('src')).toBe(true);
    expect(paths.has('notes')).toBe(true);
  });

  it('TAG-02: filterPaths is null when activeTag is set back to null', () => {
    const { result } = renderHook(() => useTags(fixturePayload));

    act(() => {
      result.current.setActiveTag('react');
    });

    expect(result.current.filterPaths).not.toBeNull();

    act(() => {
      result.current.setActiveTag(null);
    });

    expect(result.current.filterPaths).toBeNull();
  });
});
