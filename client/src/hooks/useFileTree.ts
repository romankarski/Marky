import { useState, useEffect, useCallback } from 'react';
import type { FileNode } from '@marky/shared';

export function useFileTree() {
  const [tree, setTree] = useState<FileNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTree = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch('/api/files');
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();
      setTree(data.items);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTree(false); }, [fetchTree]);

  const refetch = useCallback(() => fetchTree(true), [fetchTree]);

  return { tree, loading, error, refetch };
}
