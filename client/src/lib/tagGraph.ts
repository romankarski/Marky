export interface TagGraphNodePayload {
  id: string;
  path: string;
  label: string;
  tags: string[];
  tagCount: number;
}

export interface TagGraphNodePosition {
  x: number;
  y: number;
  fx?: number;
  fy?: number;
}

export interface TagGraphNode extends TagGraphNodePayload, Partial<TagGraphNodePosition> {}

export interface TagGraphLinkPayload {
  source: string;
  target: string;
  sharedTags: string[];
  weight: number;
}

export interface TagGraphLink extends TagGraphLinkPayload {}

export interface TagGraphData {
  nodes: TagGraphNode[];
  links: TagGraphLink[];
}

export interface TagGraphViewport {
  x: number;
  y: number;
  k: number;
}

export interface TagGraphLayoutSnapshot {
  positions: Record<string, TagGraphNodePosition>;
  viewport: TagGraphViewport | null;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

export function applyLayoutSnapshot(
  nodes: TagGraphNodePayload[],
  snapshot: TagGraphLayoutSnapshot,
): TagGraphNode[] {
  return nodes.map((node) => {
    const savedPosition = snapshot.positions[node.path];
    if (!savedPosition) {
      return { ...node };
    }

    const nextNode: TagGraphNode = { ...node };

    if (isFiniteNumber(savedPosition.x)) nextNode.x = savedPosition.x;
    if (isFiniteNumber(savedPosition.y)) nextNode.y = savedPosition.y;
    if (isFiniteNumber(savedPosition.fx)) nextNode.fx = savedPosition.fx;
    if (isFiniteNumber(savedPosition.fy)) nextNode.fy = savedPosition.fy;

    return nextNode;
  });
}

export function captureNodePositions(nodes: TagGraphNode[]): Record<string, TagGraphNodePosition> {
  return nodes.reduce<Record<string, TagGraphNodePosition>>((positions, node) => {
    if (!isFiniteNumber(node.x) || !isFiniteNumber(node.y)) {
      return positions;
    }

    const position: TagGraphNodePosition = {
      x: node.x,
      y: node.y,
    };

    if (isFiniteNumber(node.fx)) position.fx = node.fx;
    if (isFiniteNumber(node.fy)) position.fy = node.fy;

    positions[node.path] = position;
    return positions;
  }, {});
}

export interface FileLinkPayload {
  source: string;
  target: string;
}

/** Stable hash → HSL. Same tag string always produces the same color across sessions. */
export function tagColor(tag: string): string {
  let hash = 0;
  for (let i = 0; i < tag.length; i += 1) {
    hash = (hash * 31 + tag.charCodeAt(i)) | 0;
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 60%, 55%)`;
}

export interface CytoscapeElement {
  data: {
    id: string;
    label?: string;
    parent?: string;
    source?: string;
    target?: string;
    kind?: 'file' | 'dir' | 'tag' | 'link';
    tags?: string[];
    color?: string;
    weight?: number;
    sharedTags?: string[];
  };
  classes?: string;
}

export interface BuildElementsInput {
  nodes: TagGraphNodePayload[];
  links: TagGraphLinkPayload[];
  fileLinks?: FileLinkPayload[];
  /** If provided, only nodes whose primary tag (or all tags) include one of these remain visible. */
  visibleTags?: Set<string> | null;
  /** Edge-type visibility toggles. */
  showTagEdges?: boolean;
  showFileLinks?: boolean;
}

/** Synthesise directory parent ids for a file path ('notes/projects/foo.md' → ['notes', 'notes/projects']). */
export function directoryChainForPath(path: string): string[] {
  const segments = path.split('/');
  segments.pop(); // drop the filename
  const chain: string[] = [];
  let cumulative = '';
  for (const seg of segments) {
    cumulative = cumulative ? `${cumulative}/${seg}` : seg;
    chain.push(cumulative);
  }
  return chain;
}

/** Convert a server graph payload (+ optional backlinks) into Cytoscape elements with directory parents. */
export function buildCytoscapeElements(input: BuildElementsInput): CytoscapeElement[] {
  const {
    nodes,
    links,
    fileLinks = [],
    visibleTags = null,
    showTagEdges = true,
    showFileLinks = true,
  } = input;

  const elements: CytoscapeElement[] = [];
  const createdDirs = new Set<string>();

  // Apply tag-visibility filter before emitting elements (orphaned files still render as standalone nodes)
  const keepNode = (node: TagGraphNodePayload): boolean => {
    if (!visibleTags) return true;
    if (visibleTags.size === 0) return true;
    if (node.tags.length === 0) return true; // untagged files are always visible
    return node.tags.some((tag) => visibleTags.has(tag));
  };

  const visibleNodePaths = new Set<string>();
  for (const node of nodes) {
    if (keepNode(node)) visibleNodePaths.add(node.path);
  }

  // Emit directory parent nodes first (Cytoscape requires parent ids to exist)
  for (const node of nodes) {
    if (!visibleNodePaths.has(node.path)) continue;
    const chain = directoryChainForPath(node.path);
    for (let i = 0; i < chain.length; i += 1) {
      const dirId = chain[i];
      if (createdDirs.has(dirId)) continue;
      createdDirs.add(dirId);
      const dirLabel = dirId.slice(dirId.lastIndexOf('/') + 1);
      const parent = i > 0 ? chain[i - 1] : undefined;
      elements.push({
        data: { id: dirId, label: dirLabel, kind: 'dir', ...(parent ? { parent } : {}) },
        classes: 'dir',
      });
    }
  }

  // File nodes
  for (const node of nodes) {
    if (!visibleNodePaths.has(node.path)) continue;
    const chain = directoryChainForPath(node.path);
    const parent = chain.length > 0 ? chain[chain.length - 1] : undefined;
    const primaryTag = node.tags[0];
    elements.push({
      data: {
        id: node.path,
        label: node.label,
        kind: 'file',
        tags: [...node.tags],
        color: primaryTag ? tagColor(primaryTag) : '#9ca3af',
        ...(parent ? { parent } : {}),
      },
      classes: 'file',
    });
  }

  // Tag-cooccurrence edges
  if (showTagEdges) {
    for (const link of links) {
      if (!visibleNodePaths.has(link.source) || !visibleNodePaths.has(link.target)) continue;
      elements.push({
        data: {
          id: `tag::${link.source}::${link.target}`,
          source: link.source,
          target: link.target,
          kind: 'tag',
          weight: link.weight,
          sharedTags: [...link.sharedTags],
        },
        classes: 'tag-edge',
      });
    }
  }

  // File-to-file edges (wiki/markdown links)
  if (showFileLinks) {
    for (const link of fileLinks) {
      if (!visibleNodePaths.has(link.source) || !visibleNodePaths.has(link.target)) continue;
      elements.push({
        data: {
          id: `link::${link.source}::${link.target}`,
          source: link.source,
          target: link.target,
          kind: 'link',
        },
        classes: 'file-link',
      });
    }
  }

  return elements;
}
