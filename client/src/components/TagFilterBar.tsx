import { tagColor } from '../lib/tagGraph';

interface TagFilterBarProps {
  /** All tags known to the graph. */
  allTags: string[];
  /** Tags currently hidden (not visible on the graph). */
  hiddenTags: Set<string>;
  onToggleTag: (tag: string) => void;
  showTagEdges: boolean;
  showFileLinks: boolean;
  onToggleTagEdges: () => void;
  onToggleFileLinks: () => void;
}

export function TagFilterBar({
  allTags,
  hiddenTags,
  onToggleTag,
  showTagEdges,
  showFileLinks,
  onToggleTagEdges,
  onToggleFileLinks,
}: TagFilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-gray-200/60 bg-white/70 px-4 py-2 backdrop-blur">
      <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">Tags</span>
      {allTags.length === 0 ? (
        <span className="text-xs italic text-gray-400">No tags in workspace</span>
      ) : (
        allTags.map((tag) => {
          const hidden = hiddenTags.has(tag);
          return (
            <button
              key={tag}
              type="button"
              aria-pressed={!hidden}
              onClick={() => onToggleTag(tag)}
              className={`flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs transition-colors ${
                hidden
                  ? 'border-gray-200 bg-gray-100 text-gray-400 line-through'
                  : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
              }`}
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: hidden ? '#d1d5db' : tagColor(tag) }}
              />
              {tag}
            </button>
          );
        })
      )}
      <div className="ml-auto flex items-center gap-3 text-xs text-gray-600">
        <label className="flex items-center gap-1.5">
          <input
            type="checkbox"
            checked={showTagEdges}
            onChange={onToggleTagEdges}
            className="h-3.5 w-3.5"
          />
          Tag edges
        </label>
        <label className="flex items-center gap-1.5">
          <input
            type="checkbox"
            checked={showFileLinks}
            onChange={onToggleFileLinks}
            className="h-3.5 w-3.5"
          />
          Document links
        </label>
      </div>
    </div>
  );
}
