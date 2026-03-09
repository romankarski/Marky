import { useState, useEffect, useRef, useCallback } from 'react';
import { FileTree } from './components/FileTree';
import { TabBar } from './components/TabBar';
import { SplitTabBar } from './components/SplitTabBar';
import { TableOfContents } from './components/TableOfContents';
import { WelcomeScreen } from './components/WelcomeScreen';
import { EditorPane } from './components/EditorPane';
import { SplitView } from './components/SplitView';
import { useFileTree } from './hooks/useFileTree';
import { useTabs } from './hooks/useTabs';
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

  const [activeFolder, setActiveFolder] = useState<string>('');
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());
  const { tree, loading: treeLoading, refetch } = useFileTree();
  const [includeDirs, setIncludeDirs] = useState<string[]>(DEFAULT_DIRS);
  const [managingFolders, setManagingFolders] = useState(false);

  // Split view state
  const [splitMode, setSplitMode] = useState(false);
  const [rightActiveTabId, setRightActiveTabId] = useState<string | null>(null);
  const [activePaneId, setActivePaneId] = useState<'left' | 'right'>('left');
  const [pendingRightPath, setPendingRightPath] = useState<string | null>(null);
  const rightTab = tabs.find(t => t.id === rightActiveTabId) ?? null;

  // When a file was opened targeting the right pane, once activeTabId updates, assign it
  useEffect(() => {
    if (!pendingRightPath) return;
    const tab = tabs.find(t => t.path === pendingRightPath);
    if (tab) {
      setRightActiveTabId(tab.id);
      setPendingRightPath(null);
    }
  }, [pendingRightPath, tabs]);

  // Left pane dispatch: intercepts FOCUS to update left active tab
  const leftDispatch = useCallback((action: TabAction) => {
    if (action.type === 'FOCUS') {
      dispatch(action); // keeps main activeTabId in sync
    } else {
      dispatch(action);
    }
  }, [dispatch]);

  // Right pane dispatch: intercepts FOCUS to update local state, routes everything else to shared reducer
  const rightDispatch = useCallback((action: TabAction) => {
    if (action.type === 'FOCUS') {
      setRightActiveTabId(action.id);
    } else {
      dispatch(action);
    }
  }, [dispatch]);

  // Move a tab to a pane by focusing it there
  const handleMoveToPane = useCallback((tabId: string, targetPane: 'left' | 'right') => {
    if (targetPane === 'right') {
      setRightActiveTabId(tabId);
    } else {
      dispatch({ type: 'FOCUS', id: tabId });
    }
  }, [dispatch]);

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

  useEffect(() => {
    if (!activeTab || activeTab.content !== null || !activeTab.loading) return;
    fetch(`/api/files/${activeTab.path}`)
      .then(res => {
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        return res.json();
      })
      .then(data => dispatch({ type: 'SET_CONTENT', path: activeTab.path, content: data.content }))
      .catch(() => dispatch({ type: 'SET_CONTENT', path: activeTab.path, content: '> Failed to load file.' }));
  }, [activeTab?.id, activeTab?.path]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch content for right pane tab when it loads
  useEffect(() => {
    if (!rightTab || rightTab.content !== null || !rightTab.loading) return;
    fetch(`/api/files/${rightTab.path}`)
      .then(res => {
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        return res.json();
      })
      .then(data => dispatch({ type: 'SET_CONTENT', path: rightTab.path, content: data.content }))
      .catch(() => dispatch({ type: 'SET_CONTENT', path: rightTab.path, content: '> Failed to load file.' }));
  }, [rightTab?.id, rightTab?.path]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelectFile = (path: string) => {
    openTab(path);
    const folder = path.includes('/') ? path.substring(0, path.lastIndexOf('/')) : '';
    setActiveFolder(folder);
    // In split mode, direct the newly opened/focused tab to the active pane
    if (splitMode && activePaneId === 'right') {
      // After openTab dispatch, the tab's id is path-based — find it next render via useEffect
      setPendingRightPath(path);
    }
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

        {treeLoading ? (
          <p className="text-xs text-gray-400 px-3 py-2">Loading...</p>
        ) : (
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
            />
          </div>
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
            tabs={tabs}
            leftActiveTabId={activeTabId}
            rightActiveTabId={rightActiveTabId}
            leftDispatch={leftDispatch}
            rightDispatch={rightDispatch}
            onReorder={(from, to) => dispatch({ type: 'REORDER', from, to })}
            onMoveToPane={handleMoveToPane}
            splitToggle={
              <button
                onClick={() => setSplitMode(false)}
                title="Single pane"
                className="px-3 py-2.5 text-xs text-gray-400 hover:text-orange-500 transition-colors"
              >□</button>
            }
          />
        ) : (
          <div className="flex items-center border-b border-gray-200/60 bg-gray-50/60 shrink-0">
            <TabBar tabs={tabs} activeTabId={activeTabId} dispatch={dispatch} />
            <button
              onClick={() => setSplitMode(true)}
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
              leftTab={activeTab}
              rightTab={rightTab}
              dispatch={dispatch}
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
              {activeTab ? (
                <EditorPane tab={activeTab} dispatch={dispatch} onLinkClick={handleInternalLink} />
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
        {activeTab?.content ? (
          <TableOfContents content={activeTab.content} />
        ) : (
          <div className="p-4 text-xs text-gray-300">No document open</div>
        )}
      </div>

    </div>
  );
}
