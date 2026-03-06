export interface Tab {
  id: string;          // crypto.randomUUID() — stable, opaque, never the file path
  path: string;        // file path relative to root (e.g. "knowledge/page.md")
  label: string;       // filename extracted from path (e.g. "page.md")
  content: string | null;  // raw markdown string; null while loading
  loading: boolean;
}

export interface TabState {
  tabs: Tab[];
  activeTabId: string | null;
}

export type TabAction =
  | { type: 'OPEN';        path: string; label: string }
  | { type: 'CLOSE';       id: string }
  | { type: 'FOCUS';       id: string }
  | { type: 'REORDER';     from: number; to: number }
  | { type: 'SET_CONTENT'; path: string; content: string };
