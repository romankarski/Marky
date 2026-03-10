import { useState, useMemo } from 'react';
import { type SearchIndexPayload } from './useSearch';

function addAncestors(paths: string[]): Set<string> {
  const result = new Set<string>();
  for (const p of paths) {
    result.add(p);
    const parts = p.split('/');
    for (let i = 1; i < parts.length; i++) {
      result.add(parts.slice(0, i).join('/'));
    }
  }
  return result;
}

export function useTags(indexPayload: SearchIndexPayload | null): {
  activeTag: string | null;
  setActiveTag: (tag: string | null) => void;
  filterPaths: Set<string> | null;
  allTags: string[];
} {
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const allTags = indexPayload?.tags ?? [];

  const filterPaths = useMemo(() => {
    if (activeTag === null) return null;
    const matchingPaths = indexPayload?.tagMap[activeTag] ?? [];
    return addAncestors(matchingPaths);
  }, [activeTag, indexPayload]);

  return { activeTag, setActiveTag, filterPaths, allTags };
}
