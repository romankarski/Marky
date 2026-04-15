import { useEffect, useRef, type RefObject } from 'react';
import { EditorView } from '@codemirror/view';

interface UseScrollSyncOptions {
  editorView: EditorView | null;
  previewRef: RefObject<HTMLDivElement | null>;
  content: string;
}

interface SourceLineEntry {
  line: number;
  top: number; // px from container top, scroll-invariant
}

export function useScrollSync({ editorView, previewRef, content }: UseScrollSyncOptions): void {
  const lockRef = useRef<'editor' | 'preview' | null>(null);
  const lockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cacheRef = useRef<SourceLineEntry[]>([]);
  const cacheReadyRef = useRef(false);
  const lastEditorScrollTopRef = useRef<number | null>(null);
  const lastPreviewScrollTopRef = useRef<number | null>(null);

  function acquireLock(side: 'editor' | 'preview') {
    if (lockTimerRef.current !== null) clearTimeout(lockTimerRef.current);
    lockRef.current = side;
    lockTimerRef.current = setTimeout(() => {
      lockRef.current = null;
      lockTimerRef.current = null;
    }, 100);
  }

  // Rebuild element cache when content changes
  useEffect(() => {
    const previewEl = previewRef.current;
    if (!previewEl) return;

    cacheReadyRef.current = false;

    const rafId = requestAnimationFrame(() => {
      const containerTop = previewEl.getBoundingClientRect().top;
      const nodes = previewEl.querySelectorAll('[data-source-line]');
      const entries: SourceLineEntry[] = [];
      nodes.forEach((node) => {
        const line = parseInt(node.getAttribute('data-source-line') ?? '', 10);
        if (!isNaN(line)) {
          const top = node.getBoundingClientRect().top - containerTop + previewEl.scrollTop;
          entries.push({ line, top });
        }
      });
      entries.sort((a, b) => a.line - b.line);
      cacheRef.current = entries;
      cacheReadyRef.current = true;
    });

    return () => {
      cancelAnimationFrame(rafId);
      cacheReadyRef.current = false;
    };
  }, [content, previewRef]);

  // Editor → Preview sync
  useEffect(() => {
    if (!editorView) return;
    const previewEl = previewRef.current;
    if (!previewEl) return;

    const scroller = editorView.scrollDOM;

    const handleEditorScroll = () => {
      if (lockRef.current === 'preview') return;
      // Ignore if cache is being rebuilt (content just changed — don't jump)
      if (!cacheReadyRef.current) return;

      const currentScrollTop = scroller.scrollTop;

      // Ignore zero-delta scrolls (cursor movement, focus, etc.)
      if (lastEditorScrollTopRef.current !== null &&
          Math.abs(currentScrollTop - lastEditorScrollTopRef.current) < 1) return;
      lastEditorScrollTopRef.current = currentScrollTop;

      const editorFraction = currentScrollTop / Math.max(scroller.scrollHeight - scroller.clientHeight, 1);
      const cache = cacheRef.current;

      let targetScrollTop: number;

      if (cache.length === 0) {
        targetScrollTop = editorFraction * (previewEl.scrollHeight - previewEl.clientHeight);
      } else {
        const totalLines = editorView.state.doc.lines;
        const currentLine = editorFraction * (totalLines - 1) + 1;

        let lo = 0, hi = cache.length - 1, bestIdx = 0;
        while (lo <= hi) {
          const mid = (lo + hi) >> 1;
          if (cache[mid].line <= currentLine) { bestIdx = mid; lo = mid + 1; }
          else hi = mid - 1;
        }

        const a = cache[bestIdx];
        const b = cache[bestIdx + 1];
        if (b && a.line !== b.line) {
          const t = (currentLine - a.line) / (b.line - a.line);
          targetScrollTop = a.top + t * (b.top - a.top);
        } else {
          targetScrollTop = a.top;
        }
      }

      if (Math.abs(previewEl.scrollTop - targetScrollTop) < 2) return;

      acquireLock('editor');
      previewEl.scrollTop = targetScrollTop;
    };

    scroller.addEventListener('scroll', handleEditorScroll, { passive: true });
    return () => scroller.removeEventListener('scroll', handleEditorScroll);
  }, [editorView, previewRef]);

  // Preview → Editor sync
  useEffect(() => {
    if (!editorView) return;
    const previewEl = previewRef.current;
    if (!previewEl) return;

    const handlePreviewScroll = () => {
      if (lockRef.current === 'editor') return;
      if (!cacheReadyRef.current) return;

      const scrollTop = previewEl.scrollTop;

      // Ignore zero-delta scrolls (programmatic restores that didn't actually move)
      if (lastPreviewScrollTopRef.current !== null &&
          Math.abs(scrollTop - lastPreviewScrollTopRef.current) < 1) return;
      lastPreviewScrollTopRef.current = scrollTop;
      const cache = cacheRef.current;

      let targetLine: number;

      if (cache.length === 0) {
        const fraction = scrollTop / Math.max(previewEl.scrollHeight - previewEl.clientHeight, 1);
        const totalLines = editorView.state.doc.lines;
        targetLine = Math.round(fraction * (totalLines - 1)) + 1;
      } else {
        let best = cache[0];
        for (const entry of cache) {
          if (entry.top <= scrollTop) best = entry;
          else break;
        }
        targetLine = best.line;
      }

      const lineObj = editorView.state.doc.line(
        Math.min(targetLine, editorView.state.doc.lines)
      );

      acquireLock('preview');
      editorView.dispatch({
        effects: EditorView.scrollIntoView(lineObj.from, { y: 'start' }),
      });
    };

    previewEl.addEventListener('scroll', handlePreviewScroll, { passive: true });
    return () => previewEl.removeEventListener('scroll', handlePreviewScroll);
  }, [editorView, previewRef]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (lockTimerRef.current !== null) clearTimeout(lockTimerRef.current);
    };
  }, []);
}
