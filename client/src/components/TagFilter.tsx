interface TagFilterProps {
  allTags: string[];
  activeTag: string | null;
  onTagClick: (tag: string | null) => void;
}

export function TagFilter({ allTags, activeTag, onTagClick }: TagFilterProps) {
  if (allTags.length === 0) return null;

  return (
    <div className="border-t border-gray-100 shrink-0">
      {/* Tag filter pills */}
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
    </div>
  );
}
