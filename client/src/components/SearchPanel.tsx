import type { SearchResult } from 'minisearch';

function extractSnippet(text: string, matchTerms: string[]): string {
  const lowerText = text.toLowerCase();
  const firstTerm = matchTerms[0]?.toLowerCase();
  if (!firstTerm) return text.slice(0, 120);
  const idx = lowerText.indexOf(firstTerm);
  if (idx === -1) return text.slice(0, 120);
  const start = Math.max(0, idx - 40);
  const end = Math.min(text.length, idx + 80);
  return (start > 0 ? '...' : '') + text.slice(start, end) + (end < text.length ? '...' : '');
}

interface SearchPanelProps {
  results: SearchResult[];
  onOpen: (path: string) => void;
}

export default function SearchPanel({ results, onOpen }: SearchPanelProps) {
  if (results.length === 0) return null;

  return (
    <div className="overflow-auto flex-1">
      {results.map((result) => {
        const name = result.name as string;
        const path = result.path as string;
        const text = result.text as string;
        const terms = result.terms as string[];
        const snippet = extractSnippet(text ?? '', terms ?? []);

        return (
          <button
            key={result.id as string}
            onClick={() => onOpen(path)}
            className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b border-gray-100"
          >
            <div className="text-sm font-medium text-gray-700">{name}</div>
            <div className="text-xs text-gray-400">{path}</div>
            <div className="text-xs text-gray-500 mt-0.5">{snippet}</div>
          </button>
        );
      })}
    </div>
  );
}

export { SearchPanel };
