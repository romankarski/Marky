import { useEffect, useRef } from 'react';
import type { Tab, TabAction } from '../types/tabs';

export function useFileWatcher(
  tabs: Tab[],
  dispatch: React.Dispatch<TabAction>,
  refetch: () => void
): void {
  const tabsRef = useRef(tabs);
  tabsRef.current = tabs;

  const refetchRef = useRef(refetch);
  refetchRef.current = refetch;

  useEffect(() => {
    const es = new EventSource('/api/watch');

    es.addEventListener('change', (event: MessageEvent) => {
      const { path } = JSON.parse(event.data) as { path: string };
      const match = tabsRef.current.find(t => t.path === path);
      if (!match) return;
      if (match.dirty) return; // guard: don't overwrite unsaved edits
      fetch(`/api/files/${path}`)
        .then(res => res.json())
        .then(data => dispatch({ type: 'SET_CONTENT', path, content: data.content }))
        .catch(() => {}); // silent — preview stays stale rather than crashing
    });

    es.addEventListener('add', (_event: MessageEvent) => {
      refetchRef.current(); // refresh sidebar tree for new files
    });

    return () => es.close();
  }, []); // mount/unmount only — refs keep references fresh
}
