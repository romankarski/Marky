import {
  TagGraphLayoutSnapshot,
  TagGraphNodePosition,
  TagGraphViewport,
} from '../lib/tagGraph';

const TAG_GRAPH_LAYOUT_KEY = 'marky:tag-graph-layout';
const RIGHT_RAIL_TAB_KEY = 'marky:right-rail-tab';

export type RightRailTab = 'outline' | 'graph';

const EMPTY_SNAPSHOT: TagGraphLayoutSnapshot = {
  positions: {},
  viewport: null,
};

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function parseNodePosition(value: unknown): TagGraphNodePosition | null {
  if (!value || typeof value !== 'object') return null;

  const candidate = value as Record<string, unknown>;
  if (!isFiniteNumber(candidate.x) || !isFiniteNumber(candidate.y)) {
    return null;
  }

  const position: TagGraphNodePosition = {
    x: candidate.x,
    y: candidate.y,
  };

  if (isFiniteNumber(candidate.fx)) position.fx = candidate.fx;
  if (isFiniteNumber(candidate.fy)) position.fy = candidate.fy;

  return position;
}

function parseViewport(value: unknown): TagGraphViewport | null {
  if (!value || typeof value !== 'object') return null;

  const candidate = value as Record<string, unknown>;
  if (!isFiniteNumber(candidate.x) || !isFiniteNumber(candidate.y) || !isFiniteNumber(candidate.k)) {
    return null;
  }

  return {
    x: candidate.x,
    y: candidate.y,
    k: candidate.k,
  };
}

export function loadTagGraphSnapshot(): TagGraphLayoutSnapshot {
  try {
    if (typeof localStorage === 'undefined') return EMPTY_SNAPSHOT;

    const raw = localStorage.getItem(TAG_GRAPH_LAYOUT_KEY);
    if (!raw) return EMPTY_SNAPSHOT;

    const parsed = JSON.parse(raw) as {
      positions?: Record<string, unknown>;
      viewport?: unknown;
    };

    const positions = Object.entries(parsed.positions ?? {}).reduce<Record<string, TagGraphNodePosition>>(
      (nextPositions, [path, value]) => {
        const position = parseNodePosition(value);
        if (position) {
          nextPositions[path] = position;
        }
        return nextPositions;
      },
      {},
    );

    return {
      positions,
      viewport: parseViewport(parsed.viewport),
    };
  } catch {
    return EMPTY_SNAPSHOT;
  }
}

export function saveTagGraphSnapshot(snapshot: TagGraphLayoutSnapshot): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(TAG_GRAPH_LAYOUT_KEY, JSON.stringify(snapshot));
  } catch {
    // Fail soft when storage is unavailable or full.
  }
}

export function loadRightRailTab(): RightRailTab {
  try {
    if (typeof localStorage === 'undefined') return 'outline';
    return localStorage.getItem(RIGHT_RAIL_TAB_KEY) === 'graph' ? 'graph' : 'outline';
  } catch {
    return 'outline';
  }
}

export function saveRightRailTab(tab: RightRailTab): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(RIGHT_RAIL_TAB_KEY, tab);
  } catch {
    // Fail soft when storage is unavailable or full.
  }
}
