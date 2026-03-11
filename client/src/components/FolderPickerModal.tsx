import { useState, useEffect } from 'react';
import type { FileNode } from '@marky/shared';
import { BUILT_IN_TEMPLATES } from '../lib/builtInTemplates';
import { applyTokens } from '../lib/templateTokens';

interface Props {
  defaultFolder?: string;
  onConfirm: (filePath: string, fileName: string, content: string) => void;
  onCancel: () => void;
}

// Returns the set of ancestor paths that should be pre-expanded for a given folder path
// e.g. "knowledge/current" → {"knowledge", "knowledge/current"}
function ancestorPaths(folderPath: string): Set<string> {
  const parts = folderPath.split('/');
  const result = new Set<string>();
  let acc = '';
  for (const part of parts) {
    acc = acc ? `${acc}/${part}` : part;
    result.add(acc);
  }
  return result;
}

function FolderItem({
  node,
  selectedPath,
  expandedPaths,
  onToggle,
  onSelect,
  depth,
}: {
  node: FileNode;
  selectedPath: string;
  expandedPaths: Set<string>;
  onToggle: (path: string) => void;
  onSelect: (path: string) => void;
  depth: number;
}) {
  if (node.type !== 'dir') return null;
  const expanded = expandedPaths.has(node.path);
  const isSelected = selectedPath === node.path;
  return (
    <div>
      <div
        className={`flex items-center gap-1 py-1 cursor-pointer text-sm rounded ${
          isSelected ? 'bg-orange-100 text-orange-800' : 'hover:bg-gray-100 text-gray-700'
        }`}
        style={{ paddingLeft: `${8 + depth * 16}px` }}
        onClick={() => { onSelect(node.path); onToggle(node.path); }}
      >
        <span className="text-xs text-gray-400 w-3">{node.children?.some(c => c.type === 'dir') ? (expanded ? '▼' : '▶') : ' '}</span>
        <span>📁 {node.name}</span>
      </div>
      {expanded && node.children?.map((child) =>
        child.type === 'dir' ? (
          <FolderItem
            key={child.path}
            node={child}
            selectedPath={selectedPath}
            expandedPaths={expandedPaths}
            onToggle={onToggle}
            onSelect={onSelect}
            depth={depth + 1}
          />
        ) : null
      )}
    </div>
  );
}

export function FolderPickerModal({ defaultFolder = '', onConfirm, onCancel }: Props) {
  const [step, setStep] = useState<'template' | 'location'>('template');
  const [selectedContent, setSelectedContent] = useState('');
  const [customTemplates, setCustomTemplates] = useState<Array<{ name: string; content: string }>>([]);
  const [tree, setTree] = useState<FileNode[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string>(defaultFolder);
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(ancestorPaths(defaultFolder));
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(true);
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    fetch('/api/files')
      .then((r) => r.json())
      .then((d) => { setTree(d.items); setLoading(false); });
  }, []);

  useEffect(() => {
    fetch('/api/templates')
      .then((r) => r.json())
      .then((d) => setCustomTemplates(d.templates ?? []));
  }, []);

  const handleTemplateSelect = (content: string) => {
    setSelectedContent(content);
    setStep('location');
  };

  const handleToggle = (path: string) => {
    setExpandedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path); else next.add(path);
      return next;
    });
  };

  const handleConfirm = () => {
    const name = fileName.trim();
    if (!name) return;
    const safeName = name.endsWith('.md') ? name : `${name}.md`;
    const fullPath = selectedFolder ? `${selectedFolder}/${safeName}` : safeName;
    const title = safeName.replace(/\.md$/, '');
    const date = new Date().toISOString().slice(0, 10);
    const content = applyTokens(selectedContent, { title, date });
    onConfirm(fullPath, safeName, content);
  };

  if (step === 'template') {
    return (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl w-96 flex flex-col max-h-[80vh]">
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <span className="font-semibold text-gray-800 text-sm">New File</span>
            <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 text-lg leading-none">✕</button>
          </div>

          <div className="px-4 py-3">
            <p className="text-xs text-gray-500 mb-2">Choose a template</p>
            <div className="flex flex-col">
              <button
                className="w-full text-left py-2 px-3 text-sm hover:bg-orange-50 border-b border-gray-100 rounded-sm"
                onClick={() => handleTemplateSelect('')}
              >
                <span className="font-medium">Blank</span>
                <span className="ml-2 text-xs text-gray-400">Start with an empty file</span>
              </button>
              {BUILT_IN_TEMPLATES.map((entry) => (
                <button
                  key={entry.id}
                  className="w-full text-left py-2 px-3 text-sm hover:bg-orange-50 border-b border-gray-100 rounded-sm"
                  onClick={() => handleTemplateSelect(entry.content)}
                >
                  <span className="font-medium">{entry.label}</span>
                </button>
              ))}
              {customTemplates.length > 0 && (
                <>
                  <p className="text-xs text-gray-400 uppercase tracking-wide px-3 py-1">Your Templates</p>
                  {customTemplates.map((entry) => (
                    <button
                      key={entry.name}
                      className="w-full text-left py-2 px-3 text-sm hover:bg-orange-50 border-b border-gray-100 rounded-sm"
                      onClick={() => handleTemplateSelect(entry.content)}
                    >
                      <span className="font-medium">{entry.name}</span>
                    </button>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-96 flex flex-col max-h-[80vh]">
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <span className="font-semibold text-gray-800 text-sm">New File</span>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 text-lg leading-none">✕</button>
        </div>

        <div className="px-4 py-3 border-b border-gray-100">
          <label className="text-xs text-gray-500 mb-1 block">File name</label>
          <input
            autoFocus
            type="text"
            placeholder="my-note"
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
            className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
          />
          <p className="text-xs text-gray-400 mt-1">.md will be added automatically</p>
        </div>

        <div className="px-4 py-2 border-b border-gray-100">
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs text-gray-500">Save to</label>
            <button
              className="text-xs text-orange-600 hover:text-orange-800"
              onClick={() => setShowPicker((v) => !v)}
            >
              {showPicker ? 'Hide' : 'Change'}
            </button>
          </div>
          <div className="text-xs font-mono text-orange-700 bg-orange-50 px-2 py-1 rounded">
            {selectedFolder ? `/${selectedFolder}/` : '/ (vault root)'}
          </div>
        </div>

        {showPicker && (
          <div className="overflow-auto flex-1 p-2 border-b border-gray-100">
            {loading ? (
              <p className="text-xs text-gray-400 px-2">Loading...</p>
            ) : (
              <>
                <div
                  className={`flex items-center gap-1 px-2 py-1 cursor-pointer text-sm rounded ${
                    selectedFolder === '' ? 'bg-orange-100 text-orange-800' : 'hover:bg-gray-100 text-gray-700'
                  }`}
                  onClick={() => setSelectedFolder('')}
                >
                  <span className="text-xs text-gray-400 w-3"> </span>
                  <span>📂 / (vault root)</span>
                </div>
                {tree.filter((n) => n.type === 'dir').map((node) => (
                  <FolderItem
                    key={node.path}
                    node={node}
                    selectedPath={selectedFolder}
                    expandedPaths={expandedPaths}
                    onToggle={handleToggle}
                    onSelect={setSelectedFolder}
                    depth={0}
                  />
                ))}
              </>
            )}
          </div>
        )}

        <div className="px-4 py-3 border-t border-gray-200 flex justify-between gap-2">
          <button
            onClick={() => setStep('template')}
            className="px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100 rounded"
          >
            ← Back
          </button>
          <div className="flex gap-2">
            <button onClick={onCancel} className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded">
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={!fileName.trim()}
              className="px-3 py-1.5 text-sm bg-orange-500 text-white rounded hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Create
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
