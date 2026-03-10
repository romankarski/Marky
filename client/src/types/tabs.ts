export interface Tab {
  id: string;          // crypto.randomUUID() — stable, opaque, never the file path
  path: string;        // file path relative to root (e.g. "knowledge/page.md")
  label: string;       // filename extracted from path (e.g. "page.md")
  content: string | null;  // raw markdown string; null while loading
  loading: boolean;
  dirty: boolean;      // true when there are unsaved changes not yet written to disk
  editMode: boolean;   // true when the CodeMirror editor pane is visible for this tab
  deleted: boolean;    // true when the file has been removed from disk externally
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
  | { type: 'SET_CONTENT'; path: string; content: string }
  | { type: 'SET_DIRTY';   id: string }
  | { type: 'CLEAR_DIRTY'; id: string }
  | { type: 'TOGGLE_EDIT'; id: string }
  | { type: 'SET_DELETED'; path: string };
