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
