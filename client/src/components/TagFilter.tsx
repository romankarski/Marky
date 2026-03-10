import { useState } from 'react';

interface TagFilterProps {
  allTags: string[];
  activeTag: string | null;
  onTagClick: (tag: string | null) => void;
  activeFilePath: string | null;
  currentFileTags: string[];
  onTagsUpdated: () => void;
}

export function TagFilter({
  allTags,
  activeTag,
  onTagClick,
  activeFilePath,
  currentFileTags,
  onTagsUpdated,
}: TagFilterProps) {
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

  if (allTags.length === 0 && activeFilePath === null) return null;

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
    <div className="border-t border-gray-100 shrink-0">
      {/* Tag filter pills */}
      {allTags.length > 0 && (
        <div className="px-3 py-2">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1.5">Tags</p>
          <div className="flex flex-wrap gap-1">
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => onTagClick(tag === activeTag ? null : tag)}
                className={`rounded-full text-xs px-2 py-0.5 transition-colors ${
                  tag === activeTag
                    ? 'bg-orange-100 text-orange-700'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tag editor for active file */}
      {activeFilePath !== null && (
        <div className="px-3 py-2 border-t border-gray-100">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1.5">File Tags</p>
          <div className="flex flex-wrap gap-1">
            {localTags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-0.5 rounded-full text-xs px-2 py-0.5 bg-orange-50 text-orange-700"
              >
                {tag}
                <button
                  onClick={() => handleRemoveTag(tag)}
                  className="ml-0.5 text-orange-400 hover:text-orange-700"
                  title={`Remove ${tag}`}
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
                className="rounded-full text-xs px-2 py-0.5 border border-orange-300 focus:outline-none w-24"
                placeholder="tag name"
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
      )}
    </div>
  );
}
