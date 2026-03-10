import { useReducer, useCallback } from 'react';
import { arrayMove } from '@dnd-kit/sortable';
import type { Tab, TabState, TabAction } from '../types/tabs';

const initialState: TabState = { tabs: [], activeTabId: null };

export function tabReducer(state: TabState, action: TabAction): TabState {
  switch (action.type) {
    case 'OPEN': {
      const existing = state.tabs.find(t => t.path === action.path);
      if (existing) return { ...state, activeTabId: existing.id };
      const id = crypto.randomUUID();
      const newTab: Tab = { id, path: action.path, label: action.label, content: null, loading: true, dirty: false, editMode: false, deleted: false };
      return { tabs: [...state.tabs, newTab], activeTabId: id };
    }
    case 'CLOSE': {
      const idx = state.tabs.findIndex(t => t.id === action.id);
      if (idx === -1) return state;
      const next = state.tabs.filter(t => t.id !== action.id);
      const nextActive = state.activeTabId === action.id
        ? (next[idx] ?? next[idx - 1] ?? null)?.id ?? null
        : state.activeTabId;
      return { tabs: next, activeTabId: nextActive };
    }
    case 'FOCUS':
      return { ...state, activeTabId: action.id };
    case 'REORDER':
      return { ...state, tabs: arrayMove(state.tabs, action.from, action.to) };
    case 'SET_CONTENT':
      return {
        ...state,
        tabs: state.tabs.map(t =>
          t.path === action.path ? { ...t, content: action.content, loading: false } : t
        ),
      };
    case 'TOGGLE_EDIT':
      return {
        ...state,
        tabs: state.tabs.map(t =>
          t.id === action.id ? { ...t, editMode: !t.editMode } : t
        ),
      };
    case 'SET_DIRTY':
      return {
        ...state,
        tabs: state.tabs.map(t =>
          t.id === action.id ? { ...t, dirty: true } : t
        ),
      };
    case 'CLEAR_DIRTY':
      return {
        ...state,
        tabs: state.tabs.map(t =>
          t.id === action.id ? { ...t, dirty: false } : t
        ),
      };
    case 'SET_DELETED':
      return {
        ...state,
        tabs: state.tabs.map(t =>
          t.path === action.path ? { ...t, deleted: true, editMode: false } : t
        ),
      };
    default:
      return state;
  }
}

export function useTabs() {
  const [state, dispatch] = useReducer(tabReducer, initialState);

  const openTab = useCallback((path: string) => {
    const label = path.split('/').pop() ?? path;
    dispatch({ type: 'OPEN', path, label });
  }, []);

  const closeTab = useCallback((id: string) => {
    dispatch({ type: 'CLOSE', id });
  }, []);

  const focusTab = useCallback((id: string) => {
    dispatch({ type: 'FOCUS', id });
  }, []);

  const reorderTabs = useCallback((from: number, to: number) => {
    dispatch({ type: 'REORDER', from, to });
  }, []);

  const setTabContent = useCallback((path: string, content: string) => {
    dispatch({ type: 'SET_CONTENT', path, content });
  }, []);

  return { ...state, openTab, closeTab, focusTab, reorderTabs, setTabContent, dispatch };
}
