import { useEffect, useMemo, useRef, useState } from 'react';
import ForceGraph2D, { type ForceGraphMethods } from 'react-force-graph-2d';
import {
  applyLayoutSnapshot,
  captureNodePositions,
  type TagGraphData,
  type TagGraphLink,
  type TagGraphNode,
} from '../lib/tagGraph';
import {
  loadTagGraphSnapshot,
  saveTagGraphSnapshot,
} from '../hooks/useTagGraphPersistence';

interface TagGraphPanelProps {
  activeFilePath: string | null;
  isVisible: boolean;
  refreshToken: number;
  onOpen: (path: string) => void;
}

type ForceGraphHandle = ForceGraphMethods<TagGraphNode, TagGraphLink> & {
  refresh?: () => void;
};

const EMPTY_GRAPH: TagGraphData = {
  nodes: [],
  links: [],
};

function getMeasuredSize(element: HTMLDivElement | null) {
  if (!element) {
    return { width: 0, height: 0 };
  }

  const rect = element.getBoundingClientRect();
  return {
    width: Math.max(Math.round(rect.width), 0),
    height: Math.max(Math.round(rect.height), 0),
  };
}

export function TagGraphPanel({
  activeFilePath,
  isVisible,
  refreshToken,
  onOpen,
}: TagGraphPanelProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const graphRef = useRef<ForceGraphHandle | undefined>(undefined);
  const snapshotRef = useRef(loadTagGraphSnapshot());
  const viewportRestorePendingRef = useRef(false);
  const [graphData, setGraphData] = useState<TagGraphData>(EMPTY_GRAPH);
  const [loading, setLoading] = useState(true);
  const [size, setSize] = useState(() => ({ width: 0, height: 0 }));

  useEffect(() => {
    const measure = () => {
      setSize((current) => {
        const next = getMeasuredSize(containerRef.current);
        if (current.width === next.width && current.height === next.height) {
          return current;
        }
        return next;
      });
    };

    measure();

    const element = containerRef.current;
    if (!element) return;

    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', measure);
      return () => window.removeEventListener('resize', measure);
    }

    const observer = new ResizeObserver(() => measure());
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (isVisible) {
      setSize((current) => {
        const next = getMeasuredSize(containerRef.current);
        if (current.width === next.width && current.height === next.height) {
          return current;
        }
        return next;
      });
    }

    const graph = graphRef.current;
    if (!graph) return;

    if (isVisible) {
      graph.resumeAnimation();
      graph.refresh?.();
      return;
    }

    graph.pauseAnimation();
  }, [isVisible]);

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    snapshotRef.current = loadTagGraphSnapshot();
    viewportRestorePendingRef.current = true;

    fetch('/api/graph/tags')
      .then(async (response) => {
        if (!response.ok) {
          throw new Error('Failed to load tag graph');
        }

        return response.json() as Promise<TagGraphData>;
      })
      .then((payload) => {
        if (cancelled) return;

        setGraphData({
          nodes: applyLayoutSnapshot(payload.nodes, snapshotRef.current),
          links: payload.links,
        });
      })
      .catch(() => {
        if (cancelled) return;
        setGraphData(EMPTY_GRAPH);
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [refreshToken]);

  useEffect(() => {
    if (!viewportRestorePendingRef.current) return;
    if (loading) return;
    if (size.width <= 0 || size.height <= 0) return;

    const graph = graphRef.current;
    if (!graph) return;

    const viewport = snapshotRef.current.viewport;
    viewportRestorePendingRef.current = false;

    if (!viewport) return;

    graph.zoom(viewport.k, 0);
    graph.centerAt(viewport.x, viewport.y, 0);
    graph.refresh?.();
  }, [graphData, loading, size.height, size.width]);

  const nodeCanvasObject = useMemo(
    () =>
      (node: TagGraphNode, ctx: CanvasRenderingContext2D, scale: number) => {
        const isActive = node.path === activeFilePath;
        const radius = isActive ? 7 : 4.5;

        ctx.beginPath();
        ctx.arc(node.x ?? 0, node.y ?? 0, radius, 0, 2 * Math.PI, false);
        ctx.fillStyle = isActive ? '#f97316' : '#94a3b8';
        ctx.fill();

        if (isActive) {
          ctx.lineWidth = 2 / scale;
          ctx.strokeStyle = '#fb923c';
          ctx.stroke();
        }
      },
    [activeFilePath],
  );

  const handleEngineStop = () => {
    const snapshot = {
      positions: captureNodePositions(graphData.nodes),
      viewport: snapshotRef.current.viewport,
    };

    snapshotRef.current = snapshot;
    saveTagGraphSnapshot(snapshot);
  };

  const handleZoomEnd = (viewport: { x: number; y: number; k: number }) => {
    const snapshot = {
      positions: snapshotRef.current.positions,
      viewport,
    };

    snapshotRef.current = snapshot;
    saveTagGraphSnapshot(snapshot);
  };

  return (
    <div ref={containerRef} className="h-full w-full min-h-[240px]">
      {loading ? (
        <div className="flex h-full items-center justify-center px-4 text-xs text-gray-400">
          Loading graph…
        </div>
      ) : graphData.nodes.length === 0 ? (
        <div className="flex h-full items-center justify-center px-4 text-center text-xs text-gray-400">
          No graph data yet.
        </div>
      ) : (
        <ForceGraph2D<TagGraphNode, TagGraphLink>
          ref={graphRef}
          width={size.width}
          height={size.height}
          graphData={graphData}
          backgroundColor="rgba(0,0,0,0)"
          linkColor={() => '#d1d5db'}
          linkWidth={(link) => Math.max(1, link.weight)}
          nodeRelSize={5}
          nodeCanvasObject={nodeCanvasObject}
          onNodeClick={(node) => onOpen(node.path)}
          onEngineStop={handleEngineStop}
          onZoomEnd={handleZoomEnd}
        />
      )}
    </div>
  );
}
