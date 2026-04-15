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

const GRAPH_FILTER_KEY = 'marky:graph-filter';

export interface GraphFilterState {
  /** Tags the user has *hidden*. null = all tags visible. */
  hiddenTags: string[];
  showTagEdges: boolean;
  showFileLinks: boolean;
}

const DEFAULT_FILTER: GraphFilterState = {
  hiddenTags: [],
  showTagEdges: true,
  showFileLinks: true,
};

export function loadGraphFilter(): GraphFilterState {
  try {
    if (typeof localStorage === 'undefined') return DEFAULT_FILTER;
    const raw = localStorage.getItem(GRAPH_FILTER_KEY);
    if (!raw) return DEFAULT_FILTER;
    const parsed = JSON.parse(raw) as Partial<GraphFilterState>;
    return {
      hiddenTags: Array.isArray(parsed.hiddenTags) ? parsed.hiddenTags.map(String) : [],
      showTagEdges: parsed.showTagEdges !== false,
      showFileLinks: parsed.showFileLinks !== false,
    };
  } catch {
    return DEFAULT_FILTER;
  }
}

export function saveGraphFilter(state: GraphFilterState): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(GRAPH_FILTER_KEY, JSON.stringify(state));
  } catch {
    // Fail soft when storage is unavailable or full.
  }
}

const FULL_GRAPH_OPEN_KEY = 'marky:full-graph-open';

export function loadFullGraphOpen(): boolean {
  try {
    if (typeof localStorage === 'undefined') return false;
    return localStorage.getItem(FULL_GRAPH_OPEN_KEY) === 'true';
  } catch {
    return false;
  }
}

export function saveFullGraphOpen(open: boolean): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(FULL_GRAPH_OPEN_KEY, String(open));
  } catch {
    // Fail soft when storage is unavailable or full.
  }
}
