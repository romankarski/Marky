import { useState } from 'react';

interface TagFilterProps {
  allTags: string[];
  activeTag: string | null;
  onTagClick: (tag: string | null) => void;
}

export function TagFilter({ allTags, activeTag, onTagClick }: TagFilterProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);

  if (allTags.length === 0) return null;

  const filtered = allTags.filter(t => t.toLowerCase().includes(query.toLowerCase()));

  const handlePick = (tag: string) => {
    onTagClick(tag === activeTag ? null : tag);
    setQuery('');
    setOpen(false);
  };

  const handleClear = () => {
    onTagClick(null);
    setQuery('');
    setOpen(false);
  };

  return (
    <div className="border-t border-gray-100 px-3 py-2 shrink-0">
      <p className="text-xs text-gray-400 uppercase tracking-wide mb-1.5">Tags</p>

      {/* Active tag badge */}
      {activeTag && (
        <div className="flex items-center gap-1 mb-1.5">
          <span className="rounded-full text-xs px-2 py-0.5 bg-orange-100 text-orange-700">
            {activeTag}
          </span>
          <button
            onClick={handleClear}
            className="text-orange-400 hover:text-orange-700 text-xs leading-none"
            title="Clear filter"
          >
            ×
          </button>
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
                  className={`w-full text-left text-xs px-2 py-1 ${
                    tag === activeTag
                      ? 'bg-orange-50 text-orange-700'
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  {tag}
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
          {activeTag ? 'Change tag…' : 'Filter by tag…'}
        </button>
      )}
    </div>
  );
}
