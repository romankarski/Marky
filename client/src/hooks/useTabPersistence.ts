const TABS_KEY = 'marky:tabs';
const RECENT_KEY = 'marky:recent';
const MAX_RECENT = 5;

export interface PersistedTabEntry {
  path: string;
  label: string;
}

interface PersistedTabState {
  tabs: PersistedTabEntry[];
  activeTabPath: string | null;
}

/**
 * Returns the stored active tab path from localStorage, or null if missing/corrupt.
 */
export function loadPersistedActiveTabPath(): string | null {
  try {
    const raw = localStorage.getItem(TABS_KEY);
    if (!raw) return null;
    const parsed: PersistedTabState = JSON.parse(raw);
    return parsed.activeTabPath ?? null;
  } catch {
    return null;
  }
}

/**
 * Reads 'marky:tabs' and returns the saved tab entries.
 * Returns [] if key is missing or JSON is corrupt.
 */
export function loadPersistedTabs(): PersistedTabEntry[] {
  try {
    const raw = localStorage.getItem(TABS_KEY);
    if (!raw) return [];
    const parsed: PersistedTabState = JSON.parse(raw);
    if (!Array.isArray(parsed.tabs)) return [];
    return parsed.tabs;
  } catch {
    return [];
  }
}

/**
 * Writes { tabs: [{path, label}], activeTabPath } to 'marky:tabs'.
 * The caller is responsible for converting a UUID-based activeTabId to
 * the corresponding path before calling this function.
 */
export function saveTabState(tabs: PersistedTabEntry[], activeTabPath: string | null): void {
  const payload: PersistedTabState = {
    tabs: tabs.map(t => ({ path: t.path, label: t.label })),
    activeTabPath,
  };
  localStorage.setItem(TABS_KEY, JSON.stringify(payload));
}

/**
 * Prepends path to 'marky:recent', deduplicates, caps at 5.
 */
export function updateRecentFiles(path: string): void {
  const existing = getRecentFiles();
  const deduped = [path, ...existing.filter(p => p !== path)].slice(0, MAX_RECENT);
  localStorage.setItem(RECENT_KEY, JSON.stringify(deduped));
}

/**
 * Reads 'marky:recent' and returns the array of recent paths.
 * Returns [] if key is missing or JSON is corrupt.
 */
export function getRecentFiles(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as string[];
  } catch {
    return [];
  }
}
