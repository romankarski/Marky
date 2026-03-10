import { useState } from 'react';

interface TagFilterProps {
  allTags: string[];
  activeTags: string[];
  onToggleTag: (tag: string) => void;
  onClearTags: () => void;
}

export function TagFilter({ allTags, activeTags, onToggleTag, onClearTags }: TagFilterProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);

  if (allTags.length === 0) return null;

  const filtered = allTags.filter(t => t.toLowerCase().includes(query.toLowerCase()));

  const handlePick = (tag: string) => {
    onToggleTag(tag);
    setQuery('');
    // keep open so user can pick more tags
  };

  return (
    <div className="border-t border-gray-100 px-3 py-2 shrink-0">
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-xs text-gray-400 uppercase tracking-wide">Tags</p>
        {activeTags.length > 0 && (
          <button
            onClick={onClearTags}
            className="text-xs text-gray-400 hover:text-orange-500 transition-colors"
            title="Clear all tag filters"
          >
            Clear
          </button>
        )}
      </div>

      {/* Active tag badges */}
      {activeTags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-1.5">
          {activeTags.map(tag => (
            <span
              key={tag}
              className="inline-flex items-center gap-0.5 rounded-full text-xs px-2 py-0.5 bg-orange-100 text-orange-700"
            >
              {tag}
              <button
                onClick={() => onToggleTag(tag)}
                className="ml-0.5 text-orange-400 hover:text-orange-700"
                title={`Remove ${tag}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Search input toggle */}
      {open ? (
        <div>
          <input
            autoFocus
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onBlur={() => { if (!query) setOpen(false); }}
            onKeyDown={e => { if (e.key === 'Escape') { setQuery(''); setOpen(false); } }}
            placeholder="Filter tags…"
            className="w-full text-xs rounded border border-orange-300 px-2 py-1 focus:outline-none mb-1"
          />
          {filtered.length > 0 && (
            <div className="border border-gray-200 rounded bg-white shadow-sm max-h-40 overflow-y-auto">
              {filtered.map(tag => (
                <button
                  key={tag}
                  onMouseDown={e => { e.preventDefault(); handlePick(tag); }}
                  className={`w-full text-left text-xs px-2 py-1 flex items-center justify-between ${
                    activeTags.includes(tag)
                      ? 'bg-orange-50 text-orange-700'
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  {tag}
                  {activeTags.includes(tag) && <span className="text-orange-400">✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="text-xs text-gray-400 hover:text-orange-500 transition-colors"
        >
          {activeTags.length > 0 ? 'Add more…' : 'Filter by tag…'}
        </button>
      )}
    </div>
  );
}
