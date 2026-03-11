import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRef } from 'react';
import { useScrollSync } from '../useScrollSync';

// Minimal EditorView mock
function makeEditorViewMock(opts: { totalLines?: number; fromPos?: number } = {}) {
  const { totalLines = 100, fromPos = 0 } = opts;
  const scrollListeners: EventListener[] = [];
  const scrollDOM = {
    addEventListener: vi.fn((_: string, fn: EventListener) => scrollListeners.push(fn)),
    removeEventListener: vi.fn(),
    dispatchScroll: () => scrollListeners.forEach((fn) => fn(new Event('scroll'))),
  };

  const dispatched: unknown[] = [];

  return {
    scrollDOM,
    viewport: { from: fromPos },
    state: {
      doc: {
        lines: totalLines,
        lineAt: vi.fn((pos: number) => ({
          number: Math.min(Math.floor(pos / 10) + 1, totalLines),
          from: pos,
        })),
        line: vi.fn((n: number) => ({ from: (n - 1) * 10, number: n })),
      },
    },
    dispatch: vi.fn((tr: unknown) => dispatched.push(tr)),
    _dispatched: dispatched,
  };
}

// Minimal preview element mock with data-source-line elements
function makePreviewEl(entries: Array<{ line: number; offsetTop: number }>) {
  const containerClientTop = 0; // container's viewport top

  const children = entries.map(({ line, offsetTop }) => {
    const el = document.createElement('p');
    el.setAttribute('data-source-line', String(line));
    // getBoundingClientRect().top = containerClientTop + offsetTop (assuming scrollTop=0 at build)
    el.getBoundingClientRect = vi.fn(() => ({
      top: containerClientTop + offsetTop,
      bottom: containerClientTop + offsetTop + 20,
      left: 0, right: 100, width: 100, height: 20,
      x: 0, y: containerClientTop + offsetTop,
      toJSON: () => ({}),
    }));
    return el;
  });

  const scrollListeners: EventListener[] = [];

  const mock = {
    querySelectorAll: vi.fn((selector: string) => {
      if (selector === '[data-source-line]') return children;
      return [];
    }),
    addEventListener: vi.fn((_: string, fn: EventListener) => scrollListeners.push(fn)),
    removeEventListener: vi.fn(),
    getBoundingClientRect: vi.fn(() => ({
      top: containerClientTop,
      bottom: containerClientTop + 400,
      left: 0, right: 800, width: 800, height: 400,
      x: 0, y: containerClientTop,
      toJSON: () => ({}),
    })),
    scrollTop: 0,
    scrollHeight: 2000,
    clientHeight: 400,
    dispatchScroll: () => scrollListeners.forEach((fn) => fn(new Event('scroll'))),
  };

  return mock;
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('useScrollSync', () => {
  it('attaches scroll listener to editor scrollDOM', () => {
    const editorView = makeEditorViewMock();
    const previewEl = makePreviewEl([{ line: 1, offsetTop: 0 }]);

    renderHook(() => {
      const previewRef = useRef(previewEl as unknown as HTMLDivElement);
      useScrollSync({
        editorView: editorView as unknown as import('@codemirror/view').EditorView,
        previewRef,
        content: '# Hello',
      });
    });

    expect(editorView.scrollDOM.addEventListener).toHaveBeenCalledWith(
      'scroll',
      expect.any(Function),
      { passive: true }
    );
  });

  it('attaches scroll listener to preview element', () => {
    const editorView = makeEditorViewMock();
    const previewEl = makePreviewEl([{ line: 1, offsetTop: 0 }]);

    renderHook(() => {
      const previewRef = useRef(previewEl as unknown as HTMLDivElement);
      useScrollSync({
        editorView: editorView as unknown as import('@codemirror/view').EditorView,
        previewRef,
        content: '# Hello',
      });
    });

    expect(previewEl.addEventListener).toHaveBeenCalledWith(
      'scroll',
      expect.any(Function),
      { passive: true }
    );
  });

  it('does nothing when editorView is null', () => {
    const previewEl = makePreviewEl([{ line: 1, offsetTop: 0 }]);

    // Should not throw
    expect(() => {
      renderHook(() => {
        const previewRef = useRef(previewEl as unknown as HTMLDivElement);
        useScrollSync({ editorView: null, previewRef, content: 'test' });
      });
    }).not.toThrow();

    expect(previewEl.addEventListener).not.toHaveBeenCalled();
  });

  it('dispatches scrollIntoView when preview scrolls (preview → editor)', async () => {
    const editorView = makeEditorViewMock({ totalLines: 50 });
    const previewEl = makePreviewEl([
      { line: 1, offsetTop: 0 },
      { line: 10, offsetTop: 200 },
      { line: 20, offsetTop: 500 },
    ]);

    // Set scrollTop to land in the second entry range
    previewEl.scrollTop = 300;

    renderHook(() => {
      const previewRef = useRef(previewEl as unknown as HTMLDivElement);
      useScrollSync({
        editorView: editorView as unknown as import('@codemirror/view').EditorView,
        previewRef,
        content: '# Content',
      });
    });

    // Let the rAF for cache building run
    await act(async () => {
      await vi.runAllTimersAsync();
    });

    act(() => {
      previewEl.dispatchScroll();
    });

    expect(editorView.dispatch).toHaveBeenCalled();
  });

  it('removes listeners on unmount', () => {
    const editorView = makeEditorViewMock();
    const previewEl = makePreviewEl([{ line: 1, offsetTop: 0 }]);

    const { unmount } = renderHook(() => {
      const previewRef = useRef(previewEl as unknown as HTMLDivElement);
      useScrollSync({
        editorView: editorView as unknown as import('@codemirror/view').EditorView,
        previewRef,
        content: 'test',
      });
    });

    unmount();

    expect(editorView.scrollDOM.removeEventListener).toHaveBeenCalled();
    expect(previewEl.removeEventListener).toHaveBeenCalled();
  });
});
