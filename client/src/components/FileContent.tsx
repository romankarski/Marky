interface Props {
  path: string | null;
  content: string | null;
  loading: boolean;
}

export function FileContent({ path, content, loading }: Props) {
  if (!path) return (
    <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
      Select a file to view its contents
    </div>
  );
  if (loading) return (
    <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">Loading...</div>
  );
  return (
    <div className="flex-1 overflow-auto p-6">
      <p className="text-xs text-gray-400 mb-4 font-mono">{path}</p>
      <pre className="text-sm font-mono whitespace-pre-wrap text-gray-800">{content}</pre>
    </div>
  );
}
