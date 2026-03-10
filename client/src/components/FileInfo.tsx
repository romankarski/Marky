import { useState, useRef, useEffect } from 'react';

interface FileInfoProps {
  activeFilePath: string | null;
  currentFileTags: string[];
  allTags: string[];
  onTagsUpdated: () => void;
}

export function FileInfo({ activeFilePath, currentFileTags, allTags, onTagsUpdated }: FileInfoProps) {
  const [localTags, setLocalTags] = useState<string[]>(currentFileTags);
  const [showPicker, setShowPicker] = useState(false);
  const [filterText, setFilterText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);
  // Track in-flight writes so index refresh doesn't clobber optimistic state
  const pendingWriteRef = useRef(false);

  // Sync local tags from index whenever path or index-derived tags change
  useEffect(() => {
    if (pendingWriteRef.current) return;
    setLocalTags(currentFileTags);
  }, [activeFilePath, currentFileTags]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset picker state on file switch
  const [prevPath, setPrevPath] = useState(activeFilePath);
  if (prevPath !== activeFilePath) {
    setPrevPath(activeFilePath);
    setShowPicker(false);
    setFilterText('');
  }

  // Close picker on outside click
  useEffect(() => {
    if (!showPicker) return;
    const handler = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowPicker(false);
        setFilterText('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showPicker]);

  // Focus input when picker opens
  useEffect(() => {
    if (showPicker) inputRef.current?.focus();
  }, [showPicker]);

  if (activeFilePath === null) return null;

  const fileName = activeFilePath.split('/').pop() ?? activeFilePath;

  const patchTags = async (updatedTags: string[]) => {
    if (!activeFilePath) return;
    pendingWriteRef.current = true;
    setLocalTags(updatedTags);
    await fetch(`/api/files/${activeFilePath}/tags`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tags: updatedTags }),
    });
    pendingWriteRef.current = false;
    onTagsUpdated();
  };

  const handleRemoveTag = (tag: string) => {
    void patchTags(localTags.filter((t) => t !== tag));
  };

  const handlePickTag = (tag: string) => {
    if (!localTags.includes(tag)) {
      void patchTags([...localTags, tag]);
    }
    setFilterText('');
    inputRef.current?.focus();
  };

  const handleAddNew = () => {
    const trimmed = filterText.trim();
    if (trimmed && !localTags.includes(trimmed)) {
      void patchTags([...localTags, trimmed]);
    }
    setFilterText('');
    inputRef.current?.focus();
  };

  // Tags available to pick: all known tags minus already applied, filtered by search
  const suggestions = allTags
    .filter(t => !localTags.includes(t))
    .filter(t => t.toLowerCase().includes(filterText.toLowerCase()));

  // Show "create new" option when filterText is non-empty and not an exact existing tag
  const canCreateNew =
    filterText.trim().length > 0 &&
    !localTags.includes(filterText.trim()) &&
    !allTags.some(t => t.toLowerCase() === filterText.trim().toLowerCase());

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const exact = suggestions.find(t => t.toLowerCase() === filterText.trim().toLowerCase());
      if (exact) handlePickTag(exact);
      else handleAddNew();
    } else if (e.key === 'Escape') {
      setShowPicker(false);
      setFilterText('');
    }
  };

  return (
    <div className="px-4 py-3 border-b border-gray-200">
      <p className="text-xs font-medium text-gray-500 truncate mb-1" title={activeFilePath}>
        {fileName}
      </p>
      <p className="text-sm font-semibold text-gray-700 mb-2">Tags</p>

      {/* Applied tags */}
      <div className="flex flex-wrap gap-1 mb-2">
        {localTags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-0.5 rounded-full text-xs px-2 py-0.5 bg-orange-50 text-orange-700"
          >
            {tag}
            <button
              onClick={() => handleRemoveTag(tag)}
              title={`Remove ${tag}`}
              className="ml-0.5 text-orange-400 hover:text-orange-700"
            >
              ×
            </button>
          </span>
        ))}
        <button
          onClick={() => setShowPicker(v => !v)}
          className="rounded-full text-xs px-2 py-0.5 bg-gray-100 text-gray-500 hover:bg-gray-200"
        >
          + Add tag
        </button>
      </div>

      {/* Searchable picker */}
      {showPicker && (
        <div ref={pickerRef}>
          <input
            ref={inputRef}
            type="text"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search or create tag…"
            className="w-full text-xs rounded border border-orange-300 px-2 py-1 focus:outline-none mb-1"
          />
          {(suggestions.length > 0 || canCreateNew) && (
            <div className="border border-gray-200 rounded bg-white shadow-sm max-h-40 overflow-y-auto">
              {suggestions.map(tag => (
                <button
                  key={tag}
                  onMouseDown={(e) => { e.preventDefault(); handlePickTag(tag); }}
                  className="w-full text-left text-xs px-2 py-1 hover:bg-orange-50 hover:text-orange-700 text-gray-700"
                >
                  {tag}
                </button>
              ))}
              {canCreateNew && (
                <button
                  onMouseDown={(e) => { e.preventDefault(); handleAddNew(); }}
                  className="w-full text-left text-xs px-2 py-1 hover:bg-gray-100 text-gray-400 border-t border-gray-100"
                >
                  Create "{filterText.trim()}"
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
