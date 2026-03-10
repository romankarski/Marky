import { describe, it, expect } from 'vitest';

// These imports reference types and actions that do NOT exist yet.
// Tab will gain `dirty: boolean` and `editMode: boolean` in Plan 02.
// TabAction will gain TOGGLE_EDIT, SET_DIRTY, CLEAR_DIRTY in Plan 02.
// This is intentional RED phase — these tests will fail until Plan 02.
import type { Tab, TabState, TabAction } from '../types/tabs';
import { tabReducer } from '../hooks/useTabs';

const EMPTY: TabState = { tabs: [], activeTabId: null };

function makeTab(overrides: Partial<Tab> = {}): Tab {
  return {
    id: 'test-id',
    path: 'notes/page.md',
    label: 'page.md',
    content: null,
    loading: false,
    dirty: false,
    editMode: false,
    deleted: false,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// NOTE on CLOSE + dirty guard
// ---------------------------------------------------------------------------
// The "are you sure? unsaved changes" confirmation dialog is NOT implemented
// inside the reducer. It lives in TabBar's close button event handler, which
// calls window.confirm before dispatching CLOSE. Testing that interaction
// belongs to a TabBar component test, not a reducer unit test. Therefore
// there is no reducer-level test for dirty-close guard here.
// ---------------------------------------------------------------------------

describe('tabReducer — TOGGLE_EDIT', () => {
  it('sets editMode:true when it was false', () => {
    const t = makeTab({ id: 'a', editMode: false });
    const state: TabState = { tabs: [t], activeTabId: 'a' };
    const action: TabAction = { type: 'TOGGLE_EDIT', id: 'a' };
    const next = tabReducer(state, action);
    expect(next.tabs[0].editMode).toBe(true);
  });

  it('sets editMode:false when it was true (toggles)', () => {
    const t = makeTab({ id: 'a', editMode: true });
    const state: TabState = { tabs: [t], activeTabId: 'a' };
    const action: TabAction = { type: 'TOGGLE_EDIT', id: 'a' };
    const next = tabReducer(state, action);
    expect(next.tabs[0].editMode).toBe(false);
  });

  it('does not affect other tabs', () => {
    const t1 = makeTab({ id: 'a', path: 'a.md', label: 'a.md', editMode: false });
    const t2 = makeTab({ id: 'b', path: 'b.md', label: 'b.md', editMode: false });
    const state: TabState = { tabs: [t1, t2], activeTabId: 'a' };
    const action: TabAction = { type: 'TOGGLE_EDIT', id: 'a' };
    const next = tabReducer(state, action);
    expect(next.tabs[0].editMode).toBe(true);
    expect(next.tabs[1].editMode).toBe(false);
  });
});

describe('tabReducer — SET_DIRTY', () => {
  it('sets dirty:true on the matching tab', () => {
    const t = makeTab({ id: 'a', dirty: false });
    const state: TabState = { tabs: [t], activeTabId: 'a' };
    const action: TabAction = { type: 'SET_DIRTY', id: 'a' };
    const next = tabReducer(state, action);
    expect(next.tabs[0].dirty).toBe(true);
  });

  it('does not affect other tabs', () => {
    const t1 = makeTab({ id: 'a', path: 'a.md', label: 'a.md', dirty: false });
    const t2 = makeTab({ id: 'b', path: 'b.md', label: 'b.md', dirty: false });
    const state: TabState = { tabs: [t1, t2], activeTabId: 'a' };
    const action: TabAction = { type: 'SET_DIRTY', id: 'a' };
    const next = tabReducer(state, action);
    expect(next.tabs[0].dirty).toBe(true);
    expect(next.tabs[1].dirty).toBe(false);
  });
});

describe('tabReducer — CLEAR_DIRTY', () => {
  it('sets dirty:false on the matching tab', () => {
    const t = makeTab({ id: 'a', dirty: true });
    const state: TabState = { tabs: [t], activeTabId: 'a' };
    const action: TabAction = { type: 'CLEAR_DIRTY', id: 'a' };
    const next = tabReducer(state, action);
    expect(next.tabs[0].dirty).toBe(false);
  });

  it('keeps dirty:false when the tab is already clean', () => {
    const t = makeTab({ id: 'a', dirty: false });
    const state: TabState = { tabs: [t], activeTabId: 'a' };
    const action: TabAction = { type: 'CLEAR_DIRTY', id: 'a' };
    const next = tabReducer(state, action);
    expect(next.tabs[0].dirty).toBe(false);
  });
});
