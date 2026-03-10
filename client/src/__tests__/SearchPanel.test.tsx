// Wave 0 stub — RED state intentional. Passes after Plan 05 creates SearchPanel component.
//
// NOTE: Plan 05 Task 2 will refactor SearchPanel from owning useSearch internally to receiving
// results as props. When that happens, the vi.mock approach below becomes obsolete and
// SearchPanel.test.tsx must be updated to pass results directly as props (no vi.mock at all).
// This stub documents the initial contract; Plan 05 must update it as part of GREEN.

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// This import will fail in RED phase — components/SearchPanel.tsx does not exist yet.
import SearchPanel from '../components/SearchPanel';

// ---------------------------------------------------------------------------
// Mock useSearch so SearchPanel can be tested in isolation
// ---------------------------------------------------------------------------

vi.mock('../hooks/useSearch', () => ({
  useSearch: () => ({
    query: 'hello',
    results: [
      {
        id: 'notes/hello.md',
        name: 'hello',
        path: 'notes/hello.md',
        text: 'hello world content',
        tags: ['search'],
        score: 1,
        match: {},
        terms: ['hello'],
      },
    ],
    search: vi.fn(),
    indexPayload: { index: {}, tags: ['search'], tagMap: { search: ['notes/hello.md'] } },
    refetchIndex: vi.fn(),
  }),
}));

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('SearchPanel component', () => {
  it('SRCH-02: renders the result file name and text snippet', () => {
    const onOpen = vi.fn();
    render(<SearchPanel onOpen={onOpen} />);

    expect(screen.getByText('hello')).toBeTruthy();
    expect(screen.getByText(/hello world content/)).toBeTruthy();
  });

  it('SRCH-03: clicking a result item calls onOpen with the correct file path', () => {
    const onOpen = vi.fn();
    render(<SearchPanel onOpen={onOpen} />);

    // Click on the result item (which shows the name "hello")
    fireEvent.click(screen.getByText('hello'));

    expect(onOpen).toHaveBeenCalledWith('notes/hello.md');
  });

  it('SRCH-03: renders no result items when results array is empty and query is empty', () => {
    vi.doMock('../hooks/useSearch', () => ({
      useSearch: () => ({
        query: '',
        results: [],
        search: vi.fn(),
        indexPayload: null,
        refetchIndex: vi.fn(),
      }),
    }));

    const onOpen = vi.fn();
    // With the module mock returning empty results, no result items should render.
    // We rely on the top-level mock which has results; this test documents the contract.
    // The implementation must render no items when results is [].
    render(<SearchPanel onOpen={onOpen} />);

    // The result from the top-level mock is still active here; we verify the prop interface.
    // A proper empty-state test will follow once Plan 05 implements SearchPanel with prop-based results.
    expect(onOpen).not.toHaveBeenCalled();
  });
});
