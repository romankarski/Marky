import { describe, it, expect } from 'vitest';

// These imports will fail in RED phase — types/tabs.ts and hooks/useTabs.ts don't exist yet
import type { Tab, TabState, TabAction } from '../types/tabs';

// We test the reducer logic directly by importing the internal reducer.
// The hook wraps useReducer; we verify state transitions through the exported helpers.
// Since we can't easily call React hooks in pure Vitest, we test the reducer function.
// We re-export it from useTabs for testing, or test through the module internals.

// For TDD RED phase: import the things we need to write
import { useTabs } from '../hooks/useTabs';

// ---- Reducer helper ----
// We need to test the reducer. Since it's not exported, we'll build a tiny
// harness that calls dispatch multiple times and inspects state.
// However, useTabs uses useReducer which requires React — so we extract the
// reducer for unit testing by also testing that useTabs exports exist.

// For pure reducer testing without React, we import tabReducer directly.
// The plan exports `useTabs` only, but we need the reducer testable.
// Strategy: test pure reducer logic by importing it as a named export from useTabs.ts
// (we will add `export { tabReducer }` to the implementation for testability).

import { tabReducer } from '../hooks/useTabs';

const EMPTY: TabState = { tabs: [], activeTabId: null };

function makeTab(overrides: Partial<Tab> = {}): Tab {
  return {
    id: 'test-id',
    path: 'notes/page.md',
    label: 'page.md',
    content: null,
    loading: true,
    dirty: false,
    deleted: false,
    ...overrides,
  };
}

describe('tabReducer — OPEN', () => {
  it('creates a new tab with unique id, correct label, content null, loading true', () => {
    const action: TabAction = { type: 'OPEN', path: 'notes/page.md', label: 'page.md' };
    const next = tabReducer(EMPTY, action);
    expect(next.tabs).toHaveLength(1);
    expect(next.tabs[0].path).toBe('notes/page.md');
    expect(next.tabs[0].label).toBe('page.md');
    expect(next.tabs[0].content).toBeNull();
    expect(next.tabs[0].loading).toBe(true);
    expect(next.tabs[0].id).toBeTruthy();
    expect(next.activeTabId).toBe(next.tabs[0].id);
  });

  it('does not create a duplicate when opening an already-open path', () => {
    const existing = makeTab({ id: 'abc', path: 'notes/page.md', label: 'page.md' });
    const state: TabState = { tabs: [existing], activeTabId: null };
    const action: TabAction = { type: 'OPEN', path: 'notes/page.md', label: 'page.md' };
    const next = tabReducer(state, action);
    expect(next.tabs).toHaveLength(1);
    expect(next.activeTabId).toBe('abc');
  });

  it('focuses the existing tab when opening a duplicate path', () => {
    const t1 = makeTab({ id: 'a', path: 'notes/a.md', label: 'a.md' });
    const t2 = makeTab({ id: 'b', path: 'notes/b.md', label: 'b.md' });
    const state: TabState = { tabs: [t1, t2], activeTabId: 'a' };
    const next = tabReducer(state, { type: 'OPEN', path: 'notes/b.md', label: 'b.md' });
    expect(next.tabs).toHaveLength(2);
    expect(next.activeTabId).toBe('b');
  });
});

describe('tabReducer — CLOSE', () => {
  it('removes the tab and sets activeTabId to null when it was the only tab', () => {
    const t = makeTab({ id: 'a' });
    const state: TabState = { tabs: [t], activeTabId: 'a' };
    const next = tabReducer(state, { type: 'CLOSE', id: 'a' });
    expect(next.tabs).toHaveLength(0);
    expect(next.activeTabId).toBeNull();
  });

  it('activates the tab at the same index (next sibling) when closing an active tab with a sibling after', () => {
    const t1 = makeTab({ id: 'a', path: 'a.md', label: 'a.md' });
    const t2 = makeTab({ id: 'b', path: 'b.md', label: 'b.md' });
    const state: TabState = { tabs: [t1, t2], activeTabId: 'a' };
    const next = tabReducer(state, { type: 'CLOSE', id: 'a' });
    expect(next.tabs).toHaveLength(1);
    expect(next.activeTabId).toBe('b');
  });

  it('activates the previous tab when closing the last active tab (no next sibling)', () => {
    const t1 = makeTab({ id: 'a', path: 'a.md', label: 'a.md' });
    const t2 = makeTab({ id: 'b', path: 'b.md', label: 'b.md' });
    const state: TabState = { tabs: [t1, t2], activeTabId: 'b' };
    const next = tabReducer(state, { type: 'CLOSE', id: 'b' });
    expect(next.tabs).toHaveLength(1);
    expect(next.activeTabId).toBe('a');
  });

  it('keeps activeTabId unchanged when closing a non-active tab', () => {
    const t1 = makeTab({ id: 'a', path: 'a.md', label: 'a.md' });
    const t2 = makeTab({ id: 'b', path: 'b.md', label: 'b.md' });
    const state: TabState = { tabs: [t1, t2], activeTabId: 'a' };
    const next = tabReducer(state, { type: 'CLOSE', id: 'b' });
    expect(next.tabs).toHaveLength(1);
    expect(next.activeTabId).toBe('a');
  });

  it('returns unchanged state for an unknown id', () => {
    const t = makeTab({ id: 'a' });
    const state: TabState = { tabs: [t], activeTabId: 'a' };
    const next = tabReducer(state, { type: 'CLOSE', id: 'unknown' });
    expect(next).toBe(state);
  });
});

describe('tabReducer — FOCUS', () => {
  it('sets activeTabId to given id', () => {
    const t1 = makeTab({ id: 'a' });
    const t2 = makeTab({ id: 'b', path: 'b.md', label: 'b.md' });
    const state: TabState = { tabs: [t1, t2], activeTabId: 'a' };
    const next = tabReducer(state, { type: 'FOCUS', id: 'b' });
    expect(next.activeTabId).toBe('b');
    expect(next.tabs).toEqual(state.tabs);
  });
});

describe('tabReducer — REORDER', () => {
  it('moves tab from index to target index', () => {
    const t1 = makeTab({ id: 'a', path: 'a.md', label: 'a.md' });
    const t2 = makeTab({ id: 'b', path: 'b.md', label: 'b.md' });
    const t3 = makeTab({ id: 'c', path: 'c.md', label: 'c.md' });
    const state: TabState = { tabs: [t1, t2, t3], activeTabId: 'a' };
    const next = tabReducer(state, { type: 'REORDER', from: 0, to: 2 });
    expect(next.tabs.map(t => t.id)).toEqual(['b', 'c', 'a']);
    expect(next.activeTabId).toBe('a');
  });
});

describe('tabReducer — SET_CONTENT', () => {
  it('sets content and loading:false on the matching tab', () => {
    const t = makeTab({ id: 'a', path: 'notes/page.md', label: 'page.md', content: null, loading: true });
    const state: TabState = { tabs: [t], activeTabId: 'a' };
    const next = tabReducer(state, { type: 'SET_CONTENT', path: 'notes/page.md', content: '# Hello' });
    expect(next.tabs[0].content).toBe('# Hello');
    expect(next.tabs[0].loading).toBe(false);
  });

  it('does not affect other tabs', () => {
    const t1 = makeTab({ id: 'a', path: 'a.md', label: 'a.md', content: null, loading: true });
    const t2 = makeTab({ id: 'b', path: 'b.md', label: 'b.md', content: null, loading: true });
    const state: TabState = { tabs: [t1, t2], activeTabId: 'a' };
    const next = tabReducer(state, { type: 'SET_CONTENT', path: 'a.md', content: 'body' });
    expect(next.tabs[0].content).toBe('body');
    expect(next.tabs[0].loading).toBe(false);
    expect(next.tabs[1].content).toBeNull();
    expect(next.tabs[1].loading).toBe(true);
  });
});

describe('useTabs exports', () => {
  it('exports useTabs as a function', () => {
    expect(typeof useTabs).toBe('function');
  });
});
