import { useState, useEffect, useRef } from 'react';
import type { FileNode } from '@marky/shared';
import { FolderPickerModal } from './FolderPickerModal';

interface FileTreeProps {
  nodes: FileNode[];
  selectedPath: string | null;
  activeFolder: string;
  expandedPaths: Set<string>;
  onSelect: (path: string) => void;
  onFolderToggle: (folderPath: string) => void;
  onExpandFolder: (folderPath: string) => void;
  refetch: () => void;
  currentFolder: string;
  filterPaths?: Set<string> | null;
}

interface FileNodeProps {
  node: FileNode;
  selectedPath: string | null;
  expandedPaths: Set<string>;
  onToggle: (path: string) => void;
  onSelect: (path: string) => void;
  onRefetch: () => void;
  filterPaths?: Set<string> | null;
  onSelectedRef?: (el: HTMLDivElement | null) => void;
}

function FileNodeItem({ node, selectedPath, expandedPaths, onToggle, onSelect, onRefetch, filterPaths, onSelectedRef }: FileNodeProps) {
  const handleRename = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const newName = window.prompt('New name:', node.name);
    if (!newName || newName === node.name) return;
    const parentDir = node.path.includes('/') ? node.path.substring(0, node.path.lastIndexOf('/') + 1) : '';
    const newPath = parentDir + newName;
    const res = await fetch(`/api/files/${node.path}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newPath }),
    });
    if (!res.ok) { window.alert('Rename failed'); return; }
    onRefetch();
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`Delete "${node.name}"?`)) return;
    const res = await fetch(`/api/files/${node.path}`, { method: 'DELETE' });
    if (!res.ok) { window.alert('Delete failed'); return; }
    onRefetch();
  };

  // Apply filter: hide nodes not in filterPaths set
  if (filterPaths != null && !filterPaths.has(node.path)) return null;

  if (node.type === 'dir') {
    const expanded = expandedPaths.has(node.path);
    return (
      <div>
        <div
          className="flex items-center hover:bg-gray-100 cursor-pointer px-3 py-1 text-sm text-gray-600"
          onClick={() => onToggle(node.path)}
        >
          <span className="mr-1 text-xs">{expanded ? '▼' : '▶'}</span>
          <span className="min-w-0 break-words">{node.name}</span>
        </div>
        {expanded && node.children && (
          <div className="pl-4">
            {node.children.map((child) => (
              <FileNodeItem
                key={child.path}
                node={child}
                selectedPath={selectedPath}
                expandedPaths={expandedPaths}
                onToggle={onToggle}
                onSelect={onSelect}
                onRefetch={onRefetch}
                filterPaths={filterPaths}
                onSelectedRef={onSelectedRef}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  const isSelected = node.path === selectedPath;
  return (
    <div
      ref={isSelected ? onSelectedRef : undefined}
      className={`group flex items-center justify-between px-3 py-1 text-sm cursor-pointer ${
        isSelected ? 'bg-orange-50 text-orange-700' : 'hover:bg-gray-100 text-gray-700'
      }`}
      onClick={() => onSelect(node.path)}
    >
      <span className="min-w-0 break-words">{node.name}</span>
      <span className="hidden group-hover:flex items-center gap-1 shrink-0">
        <button className="px-1 text-xs text-gray-400 hover:text-gray-700" onClick={handleRename} title="Rename">✏</button>
        <button className="px-1 text-xs text-gray-400 hover:text-red-600" onClick={handleDelete} title="Delete">✕</button>
      </span>
    </div>
  );
}

export function FileTree({ nodes, selectedPath, expandedPaths, onSelect, onFolderToggle, onExpandFolder, refetch, currentFolder, filterPaths }: FileTreeProps) {
  const [showCreate, setShowCreate] = useState(false);
  const selectedElRef = useRef<HTMLDivElement | null>(null);

  // Scroll selected file into view whenever it changes
  useEffect(() => {
    selectedElRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [selectedPath]);

  const handleCreate = async (filePath: string, content: string = '') => {
    const res = await fetch(`/api/files/${filePath}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });
    setShowCreate(false);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      window.alert(`Create failed: ${err.error ?? res.status}`);
      return;
    }
    // expand the folder the new file was created in
    const folder = filePath.includes('/') ? filePath.substring(0, filePath.lastIndexOf('/')) : '';
    if (folder) onExpandFolder(folder);
    refetch();
    onSelect(filePath);
  };

  return (
    <>
      {showCreate && (
        <FolderPickerModal
          defaultFolder={currentFolder}
          onConfirm={(filePath, _fileName, content) => handleCreate(filePath, content)}
          onCancel={() => setShowCreate(false)}
        />
      )}
      <div className="flex flex-col h-full">
        <div className="px-3 py-2 border-b border-gray-100 flex items-center justify-between">
          <span className="text-xs text-gray-500 uppercase tracking-wide">Files</span>
          <button
            className="text-xs text-gray-400 hover:text-gray-700 font-mono"
            onClick={() => setShowCreate(true)}
            title="New file"
          >
            + New
          </button>
        </div>
        <div className="overflow-auto flex-1">
          {nodes.map((node) => (
            <FileNodeItem
              key={node.path}
              node={node}
              selectedPath={selectedPath}
              expandedPaths={expandedPaths}
              onToggle={onFolderToggle}
              onSelect={onSelect}
              onRefetch={refetch}
              filterPaths={filterPaths}
              onSelectedRef={el => { selectedElRef.current = el; }}
            />
          ))}
        </div>
      </div>
    </>
  );
}
