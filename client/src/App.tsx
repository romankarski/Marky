import { useState, useEffect } from 'react';
import { Group, Panel, Separator } from 'react-resizable-panels';
import { FileTree } from './components/FileTree';
import { TabBar } from './components/TabBar';
import { MarkdownPreview } from './components/MarkdownPreview';
import { TableOfContents } from './components/TableOfContents';
import { WelcomeScreen } from './components/WelcomeScreen';
import { useFileTree } from './hooks/useFileTree';
import { useTabs } from './hooks/useTabs';

const DEFAULT_DIRS = ['knowledge', 'notes'];

export default function App() {
  // Tab state — replaces old selectedPath
  const { tabs, activeTabId, openTab, dispatch } = useTabs();
  const activeTab = tabs.find(t => t.id === activeTabId) ?? null;

  // File tree state (unchanged from Phase 1)
  const [activeFolder, setActiveFolder] = useState<string>('');
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());
  const { tree, loading: treeLoading, refetch } = useFileTree();
  const [includeDirs, setIncludeDirs] = useState<string[]>(DEFAULT_DIRS);
  const [managingFolders, setManagingFolders] = useState(false);

  const allTopDirs = tree.filter(n => n.type === 'dir').map(n => n.name);
  const filteredTree = tree.filter(node => includeDirs.includes(node.name));

  // Fetch content when a new tab opens with content: null
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

  // File tree handlers (unchanged from Phase 1)
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

  // Internal link clicked in MarkdownPreview — open the target file as a tab
  const handleInternalLink = (href: string) => {
    // href may be relative like "./other.md" or "subfolder/page.md"
    // Resolve relative to the active tab's parent folder
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
    // Root: warm cream background — frosted glass requires a non-white background behind it
    <div className="flex flex-col h-screen" style={{ backgroundColor: '#FAFAF8' }}>
      <Group id="marky-layout" orientation="horizontal" className="flex-1 overflow-hidden">

        {/* Left sidebar — file tree, no frosted glass */}
        <Panel id="sidebar" defaultSize={22} minSize={15} maxSize={40} className="flex flex-col bg-gray-50 border-r border-gray-200/60">

          {/* Sidebar header */}
          <div className="px-3 py-2 border-b border-gray-200/60 flex items-center justify-between shrink-0">
            <span className="text-sm font-semibold text-gray-700">Marky</span>
            <button
              onClick={() => setManagingFolders(v => !v)}
              className="text-xs text-gray-400 hover:text-orange-500 transition-colors"
              title="Manage visible folders"
            >
              ⚙
            </button>
          </div>

          {/* Folder visibility toggles */}
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

          {/* File tree */}
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
        </Panel>

        <Separator className="w-px bg-gray-200/60 hover:bg-orange-300 hover:w-1 transition-all cursor-col-resize" />

        {/* Main content area — tab bar + content */}
        <Panel id="main" className="flex flex-col overflow-hidden">

          {/* Tab bar — sits above the frosted glass card */}
          <TabBar tabs={tabs} activeTabId={activeTabId} dispatch={dispatch} />

          {/* Content area — frosted glass card or welcome screen */}
          <div className="flex-1 overflow-hidden p-4">
            {tabs.length === 0 ? (
              <WelcomeScreen />
            ) : (
              // Frosted glass content card
              // will-change: transform promotes to GPU layer, prevents scroll jank (pitfall 5)
              <div
                className="h-full overflow-y-auto rounded-xl backdrop-blur-md bg-white/60 border border-white/20 shadow-sm"
                style={{ willChange: 'transform' }}
              >
                {activeTab?.loading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="w-5 h-5 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : activeTab?.content ? (
                  // prose prose-orange: orange headings, links, accents; max-w-none: full-width
                  // Apply ONLY to the markdown content area, not the entire panel
                  <div className="prose prose-orange max-w-none p-8 pb-16">
                    <MarkdownPreview
                      content={activeTab.content}
                      onLinkClick={handleInternalLink}
                    />
                  </div>
                ) : (
                  <div className="p-8 text-gray-400 text-sm">No content</div>
                )}
              </div>
            )}
          </div>
        </Panel>

        <Separator className="w-px bg-gray-200/60 hover:bg-orange-300 hover:w-1 transition-all cursor-col-resize" />

        {/* Right TOC panel — collapsible, right panel (not floating overlay) */}
        <Panel id="toc" defaultSize={22} minSize={15} maxSize={35} collapsible className="bg-gray-50/60 border-l border-gray-200/60 overflow-hidden">
          {activeTab?.content ? (
            <TableOfContents content={activeTab.content} />
          ) : (
            <div className="p-4 text-xs text-gray-300">No document open</div>
          )}
        </Panel>

      </Group>
    </div>
  );
}
