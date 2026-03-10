import { useState, useEffect, useRef, useCallback } from 'react';
import MiniSearch, { type SearchResult } from 'minisearch';

export interface SearchIndexPayload {
  index: object;
  tags: string[];
  tagMap: Record<string, string[]>;
}

const MINISEARCH_OPTIONS = {
  fields: ['name', 'text'],
  storeFields: ['name', 'path', 'text', 'tags'],
};

export function useSearch(): {
  query: string;
  results: SearchResult[];
  search: (q: string) => void;
  indexPayload: SearchIndexPayload | null;
  refetchIndex: () => void;
} {
  const msRef = useRef<MiniSearch | null>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [indexPayload, setIndexPayload] = useState<SearchIndexPayload | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    fetch('/api/search/index')
      .then((r) => r.json())
      .then((p: SearchIndexPayload) => {
        msRef.current = MiniSearch.loadJSON(JSON.stringify(p.index), MINISEARCH_OPTIONS);
        setIndexPayload(p);
      });
  }, [version]);

  const refetchIndex = useCallback(() => setVersion((v) => v + 1), []);

  const search = useCallback((q: string) => {
    setQuery(q);
    if (!msRef.current || !q.trim()) {
      setResults([]);
      return;
    }
    setResults(msRef.current.search(q, { prefix: true, fuzzy: 0.2 }).slice(0, 20));
  }, []);

  return { query, results, search, indexPayload, refetchIndex };
}
