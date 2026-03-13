import { useState, useEffect } from 'react';

interface Props {
  activeFilePath: string | null;
  onOpen: (path: string) => void;
}

export function BacklinksPanel({ activeFilePath, onOpen }: Props) {
  const [backlinks, setBacklinks] = useState<string[]>([]);

  useEffect(() => {
    if (!activeFilePath) {
      setBacklinks([]);
      return;
    }
    fetch(`/api/backlinks/${activeFilePath}`)
      .then(r => r.json())
      .then((data: { backlinks: string[] }) => setBacklinks(data.backlinks))
      .catch(() => setBacklinks([]));
  }, [activeFilePath]);

  if (activeFilePath === null) return null;

  return (
    <div className="px-4 py-3 border-b border-gray-200">
      <p className="text-sm font-semibold text-gray-700 mb-2">Backlinks ({backlinks.length})</p>
      {backlinks.length === 0 ? (
        <p className="text-xs text-gray-300 px-0 py-1">No incoming links</p>
      ) : (
        <ul className="space-y-1 max-h-40 overflow-y-auto">
          {backlinks.map(path => (
            <li key={path}>
              <button
                className="w-full text-left text-xs text-orange-600 hover:text-orange-800 truncate"
                onClick={() => onOpen(path)}
              >
                {path.split('/').pop()?.replace(/\.md$/, '') ?? path}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
