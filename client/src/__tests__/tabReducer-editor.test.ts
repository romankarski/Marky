import { describe, it, expect } from 'vitest';

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

describe('tabReducer -- SET_DIRTY', () => {
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

describe('tabReducer -- CLEAR_DIRTY', () => {
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
