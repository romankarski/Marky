import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import type { Tab, TabAction } from '../../types/tabs';

// Mock EventSource globally — not available in jsdom
const mockClose = vi.fn();
const mockListeners: Record<string, (e: MessageEvent) => void> = {};
function MockEventSourceImpl(this: { url: string; close: typeof mockClose; addEventListener: (type: string, fn: (e: MessageEvent) => void) => void }, url: string) {
  this.url = url;
  this.close = mockClose;
  this.addEventListener = (type: string, fn: (e: MessageEvent) => void) => {
    mockListeners[type] = fn;
  };
}
const MockEventSource = vi.fn().mockImplementation(MockEventSourceImpl);
vi.stubGlobal('EventSource', MockEventSource);

// Mock fetch globally to return fake file content
vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
  json: () => Promise.resolve({ content: 'updated content' }),
}));

// useFileWatcher does not exist yet — created in Plan 03.
// Signature: useFileWatcher(tabs: Tab[], dispatch: React.Dispatch<TabAction>, refetch: () => void): void
import { useFileWatcher } from '../useFileWatcher';

function makeTab(overrides: Partial<Tab> = {}): Tab {
  return {
    id: 'tab-1',
    path: 'note.md',
    label: 'note.md',
    content: '# note',
    loading: false,
    dirty: false,
    editMode: false,
    deleted: false,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  // Reset mockListeners between tests
  delete mockListeners['change'];
  delete mockListeners['add'];
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useFileWatcher', () => {
  it('LIVE-01 — dispatches SET_CONTENT when path matches open tab', async () => {
    const tab = makeTab({ path: 'note.md' });
    const dispatch = vi.fn();
    const refetch = vi.fn();

    renderHook(() => useFileWatcher([tab], dispatch, refetch));

    // Simulate SSE change message for an open tab
    const changeEvent = new MessageEvent('change', {
      data: JSON.stringify({ path: 'note.md' }),
    });

    mockListeners['change']?.(changeEvent);

    // Wait for the async fetch to resolve
    await new Promise(r => setTimeout(r, 10));

    expect(dispatch).toHaveBeenCalledWith({
      type: 'SET_CONTENT',
      path: 'note.md',
      content: 'updated content',
    });
  });

  it('LIVE-01 — skips dispatch when path is not in open tabs', async () => {
    const tab = makeTab({ path: 'note.md' });
    const dispatch = vi.fn();
    const refetch = vi.fn();

    renderHook(() => useFileWatcher([tab], dispatch, refetch));

    // Simulate SSE message for a file NOT in the open tabs
    const changeEvent = new MessageEvent('change', {
      data: JSON.stringify({ path: 'other.md' }),
    });

    mockListeners['change']?.(changeEvent);

    await new Promise(r => setTimeout(r, 10));

    expect(dispatch).not.toHaveBeenCalled();
  });

  it('LIVE-01 — skips SET_CONTENT for dirty tabs (dirty-tab guard)', async () => {
    // Tab is dirty (has unsaved edits) — must not overwrite silently
    const tab = makeTab({ path: 'note.md', dirty: true });
    const dispatch = vi.fn();
    const refetch = vi.fn();

    renderHook(() => useFileWatcher([tab], dispatch, refetch));

    // Simulate SSE change message for the dirty tab
    const changeEvent = new MessageEvent('change', {
      data: JSON.stringify({ path: 'note.md' }),
    });

    mockListeners['change']?.(changeEvent);

    await new Promise(r => setTimeout(r, 10));

    // Must NOT dispatch — dirty tab guard prevents silent overwrite of unsaved edits
    expect(dispatch).not.toHaveBeenCalled();
  });

  it('LIVE-02 — calls refetch on add event', async () => {
    const dispatch = vi.fn();
    const refetch = vi.fn();

    renderHook(() => useFileWatcher([], dispatch, refetch));

    // Simulate SSE add message for a newly created file
    const addEvent = new MessageEvent('add', {
      data: JSON.stringify({ path: 'newfile.md' }),
    });

    mockListeners['add']?.(addEvent);

    await new Promise(r => setTimeout(r, 10));

    // refetch must be called once to refresh the sidebar file tree
    expect(refetch).toHaveBeenCalledOnce();
  });

  it('LIVE-01 — closes EventSource on unmount', () => {
    const dispatch = vi.fn();
    const refetch = vi.fn();

    const { unmount } = renderHook(() => useFileWatcher([], dispatch, refetch));

    unmount();

    // EventSource cleanup must be called on unmount
    expect(mockClose).toHaveBeenCalledOnce();
  });
});
