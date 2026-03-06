import { useState } from 'react';
import type { FileNode } from '@marky/shared';

interface FileTreeProps {
  nodes: FileNode[];
  selectedPath: string | null;
  onSelect: (path: string) => void;
  refetch: () => void;
}

interface FileNodeProps {
  node: FileNode;
  selectedPath: string | null;
  onSelect: (path: string) => void;
  refetch: () => void;
}

function FileNodeItem({ node, selectedPath, onSelect, refetch }: FileNodeProps) {
  const [expanded, setExpanded] = useState(true);

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
    if (!res.ok) {
      window.alert('Rename failed');
      return;
    }
    refetch();
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`Delete "${node.name}"?`)) return;
    const res = await fetch(`/api/files/${node.path}`, { method: 'DELETE' });
    if (!res.ok) {
      window.alert('Delete failed');
      return;
    }
    refetch();
  };

  if (node.type === 'dir') {
    return (
      <div>
        <div
          className="flex items-center hover:bg-gray-100 cursor-pointer px-3 py-1 text-sm text-gray-600"
          onClick={() => setExpanded((prev) => !prev)}
        >
          <span className="mr-1 text-xs">{expanded ? '▼' : '▶'}</span>
          <span>{node.name}</span>
        </div>
        {expanded && node.children && (
          <div className="pl-4">
            {node.children.map((child) => (
              <FileNodeItem
                key={child.path}
                node={child}
                selectedPath={selectedPath}
                onSelect={onSelect}
                refetch={refetch}
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
      className={`group flex items-center justify-between px-3 py-1 text-sm cursor-pointer ${
        isSelected ? 'bg-orange-50 text-orange-700' : 'hover:bg-gray-100 text-gray-700'
      }`}
      onClick={() => onSelect(node.path)}
    >
      <span className="truncate">{node.name}</span>
      <span className="hidden group-hover:flex items-center gap-1 shrink-0">
        <button
          className="px-1 text-xs text-gray-400 hover:text-gray-700"
          onClick={handleRename}
          title="Rename"
        >
          ✏
        </button>
        <button
          className="px-1 text-xs text-gray-400 hover:text-red-600"
          onClick={handleDelete}
          title="Delete"
        >
          ✕
        </button>
      </span>
    </div>
  );
}

export function FileTree({ nodes, selectedPath, onSelect, refetch }: FileTreeProps) {
  const handleCreate = async () => {
    const name = window.prompt('New file name (e.g. notes.md):');
    if (!name) return;
    const res = await fetch(`/api/files/${name}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: '' }),
    });
    if (!res.ok) {
      window.alert('Create failed');
      return;
    }
    refetch();
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-2 border-b border-gray-100 flex items-center justify-between">
        <span className="text-xs text-gray-500 uppercase tracking-wide">Files</span>
        <button
          className="text-xs text-gray-400 hover:text-gray-700 font-mono"
          onClick={handleCreate}
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
            onSelect={onSelect}
            refetch={refetch}
          />
        ))}
      </div>
    </div>
  );
}
