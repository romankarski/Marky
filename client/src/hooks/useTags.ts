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
  activeTags: string[];
  toggleTag: (tag: string) => void;
  clearTags: () => void;
  filterPaths: Set<string> | null;
  allTags: string[];
  // legacy single-tag compat for TagFilter
  activeTag: string | null;
  setActiveTag: (tag: string | null) => void;
} {
  const [activeTags, setActiveTags] = useState<string[]>([]);

  const allTags = indexPayload?.tags ?? [];

  const toggleTag = (tag: string) => {
    setActiveTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const clearTags = () => setActiveTags([]);

  const filterPaths = useMemo(() => {
    if (activeTags.length === 0) return null;
    // Intersection: file must have ALL active tags
    const sets = activeTags.map(tag => new Set(indexPayload?.tagMap[tag] ?? []));
    const intersection = [...sets[0]].filter(p => sets.every(s => s.has(p)));
    return addAncestors(intersection);
  }, [activeTags, indexPayload]); // eslint-disable-line react-hooks/exhaustive-deps

  // Legacy compat (single-tag interface used in older call sites)
  const activeTag = activeTags.length === 1 ? activeTags[0] : activeTags.length > 1 ? activeTags[0] : null;
  const setActiveTag = (tag: string | null) => setActiveTags(tag ? [tag] : []);

  return { activeTags, toggleTag, clearTags, filterPaths, allTags, activeTag, setActiveTag };
}
