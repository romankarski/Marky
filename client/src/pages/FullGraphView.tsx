import { useCallback, useEffect, useMemo, useState } from 'react';
import { GraphCanvas } from '../components/GraphCanvas';
import { TagFilterBar } from '../components/TagFilterBar';
import {
  buildCytoscapeElements,
  type FileLinkPayload,
  type TagGraphLinkPayload,
  type TagGraphNodePayload,
} from '../lib/tagGraph';
import {
  loadGraphFilter,
  saveGraphFilter,
  type GraphFilterState,
} from '../hooks/useTagGraphPersistence';

interface GraphPayload {
  nodes: TagGraphNodePayload[];
  links: TagGraphLinkPayload[];
  fileLinks?: FileLinkPayload[];
}

interface FullGraphViewProps {
  onClose: () => void;
  /** Called when a user clicks a file node. */
  onOpenFile: (path: string) => void;
}

export function FullGraphView({ onClose, onOpenFile }: FullGraphViewProps) {
  const [payload, setPayload] = useState<GraphPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<GraphFilterState>(() => loadGraphFilter());

  useEffect(() => {
    let cancelled = false;
    setError(null);
    fetch('/api/graph/tags?includeLinks=true')
      .then(async (response) => {
        if (!response.ok) throw new Error('Failed to load graph');
        return response.json() as Promise<GraphPayload>;
      })
      .then((data) => {
        if (!cancelled) setPayload(data);
      })
      .catch(() => {
        if (!cancelled) setError('Could not load graph data.');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const persist = useCallback((next: GraphFilterState) => {
    setFilter(next);
    saveGraphFilter(next);
  }, []);

  const toggleTag = useCallback(
    (tag: string) => {
      const hiddenSet = new Set(filter.hiddenTags);
      if (hiddenSet.has(tag)) hiddenSet.delete(tag);
      else hiddenSet.add(tag);
      persist({ ...filter, hiddenTags: Array.from(hiddenSet) });
    },
    [filter, persist],
  );

  const toggleTagEdges = useCallback(
    () => persist({ ...filter, showTagEdges: !filter.showTagEdges }),
    [filter, persist],
  );
  const toggleFileLinks = useCallback(
    () => persist({ ...filter, showFileLinks: !filter.showFileLinks }),
    [filter, persist],
  );

  const allTags = useMemo(() => {
    if (!payload) return [];
    const set = new Set<string>();
    for (const node of payload.nodes) node.tags.forEach((t) => set.add(t));
    return Array.from(set).sort();
  }, [payload]);

  const hiddenTagsSet = useMemo(() => new Set(filter.hiddenTags), [filter.hiddenTags]);

  const visibleTags = useMemo(() => {
    if (allTags.length === 0) return null;
    return new Set(allTags.filter((t) => !hiddenTagsSet.has(t)));
  }, [allTags, hiddenTagsSet]);

  const elements = useMemo(() => {
    if (!payload) return [];
    return buildCytoscapeElements({
      nodes: payload.nodes,
      links: payload.links,
      fileLinks: payload.fileLinks,
      visibleTags,
      showTagEdges: filter.showTagEdges,
      showFileLinks: filter.showFileLinks,
    });
  }, [payload, visibleTags, filter.showTagEdges, filter.showFileLinks]);

  return (
    <div className="flex h-full w-full flex-col bg-white">
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-2">
        <h1 className="text-sm font-semibold text-gray-700">Graph view</h1>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md border border-gray-300 px-2.5 py-1 text-xs text-gray-600 hover:bg-gray-50"
        >
          Close
        </button>
      </div>
      <TagFilterBar
        allTags={allTags}
        hiddenTags={hiddenTagsSet}
        onToggleTag={toggleTag}
        showTagEdges={filter.showTagEdges}
        showFileLinks={filter.showFileLinks}
        onToggleTagEdges={toggleTagEdges}
        onToggleFileLinks={toggleFileLinks}
      />
      <div className="relative flex-1 min-h-0">
        {error ? (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-red-600">
            {error}
          </div>
        ) : !payload ? (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-400">
            Loading graph…
          </div>
        ) : payload.nodes.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-400">
            No markdown files to graph yet.
          </div>
        ) : (
          <GraphCanvas elements={elements} onNodeSelect={onOpenFile} />
        )}
      </div>
    </div>
  );
}
