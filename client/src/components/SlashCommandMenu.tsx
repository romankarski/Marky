import type { SlashItem } from '../extensions/slash-commands';

interface SlashCommandMenuProps {
  items: SlashItem[];
  query: string;
  command: (item: SlashItem) => void;
  selectedIndex: number;
}

export function SlashCommandMenu({
  items,
  query,
  command,
  selectedIndex,
}: SlashCommandMenuProps) {
  const filtered = items.filter((item) =>
    item.title.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className="bg-white/90 backdrop-blur-md rounded-lg shadow-lg border border-gray-200 overflow-y-auto max-h-[280px] py-1">
      {filtered.length === 0 ? (
        <div className="px-3 py-2 text-sm text-gray-400">No results</div>
      ) : (
        filtered.map((item, index) => (
          <button
            key={item.title}
            className={`w-full flex items-center gap-3 px-3 py-2 text-left text-sm hover:bg-orange-50 transition-colors${
              index === selectedIndex ? ' bg-orange-100' : ''
            }`}
            onClick={() => command(item)}
          >
            <div className="w-6 h-6 flex items-center justify-center text-gray-400 text-xs font-mono">
              {item.icon}
            </div>
            <div className="flex flex-col">
              <span className="text-gray-900 text-sm font-medium">
                {item.title}
              </span>
              <span className="text-gray-500 text-xs">
                {item.description}
              </span>
            </div>
          </button>
        ))
      )}
    </div>
  );
}
