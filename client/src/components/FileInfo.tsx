import { useState } from 'react';

interface FileInfoProps {
  activeFilePath: string | null;
  currentFileTags: string[];
  onTagsUpdated: () => void;
}

export function FileInfo({ activeFilePath, currentFileTags, onTagsUpdated }: FileInfoProps) {
  const [localTags, setLocalTags] = useState<string[]>(currentFileTags);
  const [showInput, setShowInput] = useState(false);
  const [inputValue, setInputValue] = useState('');

  // Sync local tags when active file changes
  const [prevPath, setPrevPath] = useState(activeFilePath);
  if (prevPath !== activeFilePath) {
    setPrevPath(activeFilePath);
    setLocalTags(currentFileTags);
    setShowInput(false);
    setInputValue('');
  }

  if (activeFilePath === null) return null;

  const fileName = activeFilePath.split('/').pop() ?? activeFilePath;

  const patchTags = async (updatedTags: string[]) => {
    if (!activeFilePath) return;
    setLocalTags(updatedTags);
    await fetch(`/api/files/${activeFilePath}/tags`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tags: updatedTags }),
    });
    onTagsUpdated();
  };

  const handleRemoveTag = (tag: string) => {
    const updated = localTags.filter((t) => t !== tag);
    void patchTags(updated);
  };

  const handleAddTag = () => {
    const trimmed = inputValue.trim();
    if (trimmed && !localTags.includes(trimmed)) {
      void patchTags([...localTags, trimmed]);
    }
    setInputValue('');
    setShowInput(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleAddTag();
    } else if (e.key === 'Escape') {
      setInputValue('');
      setShowInput(false);
    }
  };

  return (
    <div className="px-4 py-3 border-b border-gray-200 shrink-0">
      <p className="text-xs font-medium text-gray-500 truncate mb-1" title={activeFilePath}>
        {fileName}
      </p>
      <p className="text-sm font-semibold text-gray-700 mb-2">Tags</p>
      <div className="flex flex-wrap gap-1">
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
        {showInput ? (
          <input
            autoFocus
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => { setInputValue(''); setShowInput(false); }}
            className="rounded-full text-xs px-2 py-0.5 border border-orange-300 focus:outline-none w-full"
            placeholder="Enter tag name"
          />
        ) : (
          <button
            onClick={() => setShowInput(true)}
            className="rounded-full text-xs px-2 py-0.5 bg-gray-100 text-gray-500 hover:bg-gray-200"
          >
            + Add tag
          </button>
        )}
      </div>
    </div>
  );
}
