import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { FileTree } from './components/FileTree';
import { TabBar } from './components/TabBar';
import { SplitTabBar } from './components/SplitTabBar';
import { TableOfContents } from './components/TableOfContents';
import { WelcomeScreen } from './components/WelcomeScreen';
import { EditorPane } from './components/EditorPane';
import { SplitView } from './components/SplitView';
import SearchPanel from './components/SearchPanel';
import { TagFilter } from './components/TagFilter';
import { FileInfo } from './components/FileInfo';
import { useFileTree } from './hooks/useFileTree';
import { useTabs } from './hooks/useTabs';
import { useFileWatcher } from './hooks/useFileWatcher';
import { useSearch } from './hooks/useSearch';
import { useTags } from './hooks/useTags';
import type { TabAction } from './types/tabs';

const DEFAULT_DIRS = ['knowledge', 'notes'];
const SIDEBAR_DEFAULT = 260;
const SIDEBAR_MIN = 160;
const SIDEBAR_MAX = 500;
const TOC_DEFAULT = 220;
const TOC_MIN = 140;
const TOC_MAX = 400;

export default function App() {
  const { tabs, activeTabId, openTab, dispatch } = useTabs();
  const activeTab = tabs.find(t => t.id === activeTabId) ?? null;

  const { query, results, search, indexPayload, refetchIndex } = useSearch();
  const { activeTag, setActiveTag, filterPaths, allTags } = useTags(indexPayload);

  const currentFileTags = useMemo(() => {
    if (!activeTab || !indexPayload) return [];
    return Object.entries(indexPayload.tagMap)
      .filter(([, paths]) => paths.includes(activeTab.path))
      .map(([tag]) => tag);
  }, [activeTab?.path, indexPayload]); // eslint-disable-line react-hooks/exhaustive-deps

  const [activeFolder, setActiveFolder] = useState<string>('');
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());
  const { tree, loading: treeLoading, refetch } = useFileTree();

  useFileWatcher(tabs, dispatch, refetch);
  const [includeDirs, setIncludeDirs] = useState<string[]>(DEFAULT_DIRS);
  const [managingFolders, setManagingFolders] = useState(false);

  // Split view state
  const [splitMode, setSplitMode] = useState(false);
  // Each pane owns an ordered list of tab IDs and an active tab ID
  const [leftTabIds, setLeftTabIds] = useState<string[]>([]);
  const [rightTabIds, setRightTabIds] = useState<string[]>([]);
  const [leftActiveTabId, setLeftActiveTabId] = useState<string | null>(null);
  const [rightActiveTabId, setRightActiveTabId] = useState<string | null>(null);
  const [activePaneId, setActivePaneId] = useState<'left' | 'right'>('left');

  const leftTab = tabs.find(t => t.id === leftActiveTabId) ?? null;
  const rightTab = tabs.find(t => t.id === rightActiveTabId) ?? null;

  // Enter split mode: all current tabs go to left pane, right pane starts empty
  const enterSplit = useCallback(() => {
    setLeftTabIds(tabs.map(t => t.id));
    setLeftActiveTabId(activeTabId);
    setRightTabIds([]);
    setRightActiveTabId(null);
    setActivePaneId('left');
    setSplitMode(true);
  }, [tabs, activeTabId]);

  // Exit split mode: merge left+right back into main tab list order, focus leftActive
  const exitSplit = useCallback(() => {
    // Merge: left tabs first, then right tabs that aren't already in left
    const merged = [...leftTabIds, ...rightTabIds.filter(id => !leftTabIds.includes(id))];
    // Re-focus in the reducer order — just focus whatever was active in left pane
    if (leftActiveTabId) dispatch({ type: 'FOCUS', id: leftActiveTabId });
    setSplitMode(false);
    // Reset pane state
    setLeftTabIds([]);
    setRightTabIds([]);
    setLeftActiveTabId(null);
    setRightActiveTabId(null);
    void merged; // order is already preserved in reducer's tabs array
  }, [leftTabIds, rightTabIds, leftActiveTabId, dispatch]);

  // Keep leftTabIds in sync when tabs are closed (remove closed tab IDs from pane lists)
  useEffect(() => {
    if (!splitMode) return;
    const allIds = new Set(tabs.map(t => t.id));
    setLeftTabIds(prev => prev.filter(id => allIds.has(id)));
    setRightTabIds(prev => prev.filter(id => allIds.has(id)));
    setLeftActiveTabId(prev => (prev && allIds.has(prev) ? prev : null));
    setRightActiveTabId(prev => (prev && allIds.has(prev) ? prev : null));
  }, [tabs, splitMode]);

  // When a new tab is opened in split mode, add it to the active pane
  useEffect(() => {
    if (!splitMode) return;
    const allPaneIds = new Set([...leftTabIds, ...rightTabIds]);
    const newTab = tabs.find(t => !allPaneIds.has(t.id));
    if (!newTab) return;
    if (activePaneId === 'right') {
      setRightTabIds(prev => [...prev, newTab.id]);
      setRightActiveTabId(newTab.id);
    } else {
      setLeftTabIds(prev => [...prev, newTab.id]);
      setLeftActiveTabId(newTab.id);
    }
  }, [tabs, splitMode]); // eslint-disable-line react-hooks/exhaustive-deps

  // Left pane dispatch
  const leftDispatch = useCallback((action: TabAction) => {
    if (action.type === 'FOCUS') {
      setLeftActiveTabId(action.id);
      dispatch(action);
    } else {
      dispatch(action);
    }
  }, [dispatch]);

  // Right pane dispatch
  const rightDispatch = useCallback((action: TabAction) => {
    if (action.type === 'FOCUS') {
      setRightActiveTabId(action.id);
    } else {
      dispatch(action);
    }
  }, [dispatch]);

  // Move a tab between panes
  const handleMoveToPane = useCallback((tabId: string, targetPane: 'left' | 'right') => {
    if (targetPane === 'right') {
      setLeftTabIds(prev => prev.filter(id => id !== tabId));
      setRightTabIds(prev => prev.includes(tabId) ? prev : [...prev, tabId]);
      setRightActiveTabId(tabId);
      if (leftActiveTabId === tabId) setLeftActiveTabId(null);
    } else {
      setRightTabIds(prev => prev.filter(id => id !== tabId));
      setLeftTabIds(prev => prev.includes(tabId) ? prev : [...prev, tabId]);
      setLeftActiveTabId(tabId);
      dispatch({ type: 'FOCUS', id: tabId });
      if (rightActiveTabId === tabId) setRightActiveTabId(null);
    }
  }, [leftActiveTabId, rightActiveTabId, dispatch]);

  // Resizable sidebar and TOC widths (pixels)
  const [sidebarWidth, setSidebarWidth] = useState(SIDEBAR_DEFAULT);
  const [tocWidth, setTocWidth] = useState(TOC_DEFAULT);
  const draggingRef = useRef<'sidebar' | 'toc' | null>(null);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  const onMouseDown = useCallback((panel: 'sidebar' | 'toc') => (e: React.MouseEvent) => {
    e.preventDefault();
    draggingRef.current = panel;
    startXRef.current = e.clientX;
    startWidthRef.current = panel === 'sidebar' ? sidebarWidth : tocWidth;
  }, [sidebarWidth, tocWidth]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!draggingRef.current) return;
      const delta = e.clientX - startXRef.current;
      if (draggingRef.current === 'sidebar') {
        setSidebarWidth(Math.min(SIDEBAR_MAX, Math.max(SIDEBAR_MIN, startWidthRef.current + delta)));
      } else {
        setTocWidth(Math.min(TOC_MAX, Math.max(TOC_MIN, startWidthRef.current - delta)));
      }
    };
    const onUp = () => { draggingRef.current = null; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, []);

  const allTopDirs = tree.filter(n => n.type === 'dir').map(n => n.name);
  const filteredTree = tree.filter(node => includeDirs.includes(node.name));

  // Fetch content for the active tab in single-pane mode
  const singleActiveTab = splitMode ? null : tabs.find(t => t.id === activeTabId) ?? null;
  useEffect(() => {
    if (!singleActiveTab || singleActiveTab.content !== null || !singleActiveTab.loading) return;
    fetch(`/api/files/${singleActiveTab.path}`)
      .then(res => { if (!res.ok) throw new Error(); return res.json(); })
      .then(data => dispatch({ type: 'SET_CONTENT', path: singleActiveTab.path, content: data.content }))
      .catch(() => dispatch({ type: 'SET_CONTENT', path: singleActiveTab.path, content: '> Failed to load file.' }));
  }, [singleActiveTab?.id, singleActiveTab?.path]); // eslint-disable-line react-hooks/exhaustive-deps

  // In split mode, fetch content for whichever tab is active in each pane
  useEffect(() => {
    if (!splitMode || !leftTab || leftTab.content !== null || !leftTab.loading) return;
    fetch(`/api/files/${leftTab.path}`)
      .then(res => { if (!res.ok) throw new Error(); return res.json(); })
      .then(data => dispatch({ type: 'SET_CONTENT', path: leftTab.path, content: data.content }))
      .catch(() => dispatch({ type: 'SET_CONTENT', path: leftTab.path, content: '> Failed to load file.' }));
  }, [leftTab?.id, leftTab?.path, splitMode]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!splitMode || !rightTab || rightTab.content !== null || !rightTab.loading) return;
    fetch(`/api/files/${rightTab.path}`)
      .then(res => { if (!res.ok) throw new Error(); return res.json(); })
      .then(data => dispatch({ type: 'SET_CONTENT', path: rightTab.path, content: data.content }))
      .catch(() => dispatch({ type: 'SET_CONTENT', path: rightTab.path, content: '> Failed to load file.' }));
  }, [rightTab?.id, rightTab?.path, splitMode]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelectFile = (path: string) => {
    openTab(path);
    const folder = path.includes('/') ? path.substring(0, path.lastIndexOf('/')) : '';
    setActiveFolder(folder);
  };

  const handleFolderToggle = (folderPath: string) => {
    setActiveFolder(folderPath);
    setExpandedPaths(prev => {
      const next = new Set(prev);
      if (next.has(folderPath)) next.delete(folderPath); else next.add(folderPath);
      return next;
    });
  };

  const expandFolder = (folderPath: string) => {
    if (!folderPath) return;
    setExpandedPaths(prev => {
      const next = new Set(prev);
      const parts = folderPath.split('/');
      let acc = '';
      for (const part of parts) {
        acc = acc ? `${acc}/${part}` : part;
        next.add(acc);
      }
      return next;
    });
  };

  // Derive which tab's content the TOC should show
  const tocContent = splitMode
    ? (activePaneId === 'right' ? rightTab?.content : leftTab?.content) ?? null
    : activeTab?.content ?? null;

  // TOC heading click: scroll within the correct pane in split mode
  const handleTocHeadingClick = useCallback((id: string) => {
    if (splitMode) {
      const paneEl = document.querySelector(`[data-pane="${activePaneId}"]`);
      paneEl?.querySelector(`#${CSS.escape(id)}`)?.scrollIntoView({ behavior: 'smooth' });
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [splitMode, activePaneId]);

  // Tree auto-reveal: when query transitions from non-empty → empty, expand active file's ancestors
  const prevQueryRef = useRef('');
  useEffect(() => {
    const wasSearching = prevQueryRef.current.trim().length > 0;
    const nowEmpty = query.trim().length === 0;
    prevQueryRef.current = query;
    if (wasSearching && nowEmpty && activeTab) {
      expandFolder(activeTab.path);
    }
  }, [query]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleInternalLink = (href: string) => {
    let resolved = href;
    if (href.startsWith('./') && activeTab) {
      const dir = activeTab.path.includes('/')
        ? activeTab.path.substring(0, activeTab.path.lastIndexOf('/'))
        : '';
      resolved = dir ? `${dir}/${href.slice(2)}` : href.slice(2);
    }
    openTab(resolved);
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: '#FAFAF8' }}>

      {/* Left sidebar */}
      <div
        className="flex flex-col bg-gray-50 border-r border-gray-200 shrink-0 overflow-hidden"
        style={{ width: sidebarWidth }}
      >
        <div className="px-3 py-2 border-b border-gray-200 flex items-center justify-between shrink-0">
          <span className="text-sm font-semibold text-gray-700">Marky</span>
          <button
            onClick={() => setManagingFolders(v => !v)}
            className="text-xs text-gray-400 hover:text-orange-500 transition-colors"
            title="Manage visible folders"
          >⚙</button>
        </div>

        {managingFolders && (
          <div className="px-3 py-2 border-b border-gray-100 bg-white/60 shrink-0">
            <p className="text-xs text-gray-500 mb-2 font-medium">Visible folders</p>
            {allTopDirs.map(name => (
              <label key={name} className="flex items-center gap-2 text-xs text-gray-700 py-0.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeDirs.includes(name)}
                  onChange={e =>
                    setIncludeDirs(prev =>
                      e.target.checked ? [...prev, name] : prev.filter(d => d !== name)
                    )
                  }
                  className="accent-orange-500"
                />
                {name}
              </label>
            ))}
          </div>
        )}

        {/* Search input */}
        <div className="px-3 py-2 border-b border-gray-100 shrink-0">
          <input
            type="text"
            value={query}
            onChange={e => search(e.target.value)}
            placeholder="Search..."
            className="w-full text-sm bg-transparent focus:outline-none text-gray-700 placeholder-gray-300"
          />
        </div>

        {query.trim() ? (
          <SearchPanel results={results} onOpen={openTab} />
        ) : treeLoading ? (
          <p className="text-xs text-gray-400 px-3 py-2">Loading...</p>
        ) : (
          <>
            <div className="flex-1 overflow-auto">
              <FileTree
                nodes={filteredTree}
                selectedPath={activeTab?.path ?? null}
                activeFolder={activeFolder}
                expandedPaths={expandedPaths}
                onSelect={handleSelectFile}
                onFolderToggle={handleFolderToggle}
                onExpandFolder={expandFolder}
                refetch={refetch}
                currentFolder={activeFolder}
                filterPaths={filterPaths}
              />
            </div>
            <TagFilter
              allTags={allTags}
              activeTag={activeTag}
              onTagClick={setActiveTag}
            />
          </>
        )}
      </div>

      {/* Sidebar drag handle */}
      <div
        className="w-1 shrink-0 bg-gray-200 hover:bg-orange-400 transition-colors cursor-col-resize"
        onMouseDown={onMouseDown('sidebar')}
      />

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">

        {/* Tab bar row with split toggle */}
        {splitMode ? (
          <SplitTabBar
            allTabs={tabs}
            leftTabIds={leftTabIds}
            rightTabIds={rightTabIds}
            leftActiveTabId={leftActiveTabId}
            rightActiveTabId={rightActiveTabId}
            leftDispatch={leftDispatch}
            rightDispatch={rightDispatch}
            onLeftReorder={setLeftTabIds}
            onRightReorder={setRightTabIds}
            onMoveToPane={handleMoveToPane}
            splitToggle={
              <button
                onClick={exitSplit}
                title="Single pane"
                className="px-3 py-2.5 text-xs text-gray-400 hover:text-orange-500 transition-colors"
              >□</button>
            }
          />
        ) : (
          <div className="flex items-center border-b border-gray-200/60 bg-gray-50/60 shrink-0">
            <TabBar tabs={tabs} activeTabId={activeTabId} dispatch={dispatch} />
            <button
              onClick={enterSplit}
              title="Split view"
              className="ml-auto px-3 py-2.5 text-xs text-gray-400 hover:text-orange-500 transition-colors shrink-0"
            >⊞</button>
          </div>
        )}

        {/* Content area */}
        <div className="flex-1 overflow-hidden p-4">
          {tabs.length === 0 ? (
            <WelcomeScreen />
          ) : splitMode ? (
            <SplitView
              leftTab={leftTab}
              rightTab={rightTab}
              dispatch={leftDispatch}
              rightDispatch={rightDispatch}
              onLinkClick={handleInternalLink}
              activePaneId={activePaneId}
              onPaneFocus={setActivePaneId}
            />
          ) : (
            <div
              className="h-full overflow-hidden rounded-xl backdrop-blur-md bg-white/60 border border-white/20 shadow-sm"
              style={{ willChange: 'transform' }}
            >
              {singleActiveTab ? (
                <EditorPane tab={singleActiveTab} dispatch={dispatch} onLinkClick={handleInternalLink} />
              ) : null}
            </div>
          )}
        </div>
      </div>

      {/* TOC drag handle */}
      <div
        className="w-1 shrink-0 bg-gray-200 hover:bg-orange-400 transition-colors cursor-col-resize"
        onMouseDown={onMouseDown('toc')}
      />

      {/* Right TOC panel */}
      <div
        className="flex flex-col bg-gray-50 border-l border-gray-200 shrink-0 overflow-hidden"
        style={{ width: tocWidth }}
      >
        <FileInfo
          activeFilePath={activeTab?.path ?? null}
          currentFileTags={currentFileTags}
          onTagsUpdated={refetchIndex}
        />
        {tocContent ? (
          <TableOfContents content={tocContent} onHeadingClick={handleTocHeadingClick} />
        ) : (
          <div className="p-4 text-xs text-gray-300">No document open</div>
        )}
      </div>

    </div>
  );
}
