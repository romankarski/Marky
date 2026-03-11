import { useRef, useLayoutEffect, type RefObject } from 'react';

const SCROLL_KEY = 'marky:scroll';
const DEBOUNCE_MS = 200;

/**
 * Saves scrollTop for a given filePath to 'marky:scroll' synchronously.
 * Callers are responsible for debouncing (e.g. via their own per-instance timerRef).
 */
export function saveScrollPosition(filePath: string, scrollTop: number): void {
  try {
    const raw = localStorage.getItem(SCROLL_KEY);
    const map: Record<string, number> = raw ? JSON.parse(raw) : {};
    map[filePath] = scrollTop;
    localStorage.setItem(SCROLL_KEY, JSON.stringify(map));
  } catch {
    // localStorage unavailable or corrupt — silently ignore
  }
}

/**
 * Returns the saved scroll position for a given filePath, or undefined if not found.
 */
export function getScrollPosition(filePath: string): number | undefined {
  try {
    const raw = localStorage.getItem(SCROLL_KEY);
    if (!raw) return undefined;
    const map: Record<string, number> = JSON.parse(raw);
    const value = map[filePath];
    return typeof value === 'number' ? value : undefined;
  } catch {
    return undefined;
  }
}

/**
 * React hook that attaches a debounced scroll listener to the returned ref's element.
 * Restores scrollTop via useLayoutEffect when content transitions null → string.
 *
 * Usage:
 *   const scrollRef = useScrollPersist(tab.path, tab.content);
 *   <div ref={scrollRef} className="overflow-y-auto"> ... </div>
 */
export function useScrollPersist(
  filePath: string,
  content: string | null,
): RefObject<HTMLDivElement | null> {
  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previousContentRef = useRef<string | null>(null);

  // Attach/detach scroll listener whenever filePath changes
  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleScroll = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        if (containerRef.current) {
          saveScrollPosition(filePath, containerRef.current.scrollTop);
        }
      }, DEBOUNCE_MS);
    };

    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      el.removeEventListener('scroll', handleScroll);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [filePath]);

  // Restore scroll position when content transitions null → string
  useLayoutEffect(() => {
    const wasNull = previousContentRef.current === null;
    const isNowLoaded = content !== null;

    if (wasNull && isNowLoaded) {
      const el = containerRef.current;
      const savedPos = getScrollPosition(filePath);

      if (el && savedPos !== undefined && savedPos > 0) {
        el.scrollTop = savedPos;
        // Pitfall 1: if container isn't scrollable yet, retry in next frame
        if (el.scrollTop === 0 && savedPos > 0) {
          if (process.env.NODE_ENV === 'development') {
            console.warn('[useScrollPersist] scrollTop assignment read back as 0 — retrying via rAF', filePath);
          }
          requestAnimationFrame(() => {
            if (containerRef.current) {
              containerRef.current.scrollTop = savedPos;
            }
          });
        }
      }
    }

    previousContentRef.current = content;
  }, [filePath, content]);

  return containerRef;
}
