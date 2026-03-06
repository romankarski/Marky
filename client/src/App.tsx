import { useState } from 'react';
import { FileTree } from './components/FileTree';
import { FileContent } from './components/FileContent';
import { useFileTree } from './hooks/useFileTree';
import { useFileContent } from './hooks/useFileContent';

export default function App() {
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const { tree, loading: treeLoading, refetch } = useFileTree();
  const { content, loading: contentLoading } = useFileContent(selectedPath);

  return (
    <div className="flex h-screen bg-white">
      <aside className="w-64 border-r border-gray-200 overflow-auto">
        <div className="px-3 py-2 border-b border-gray-200">
          <span className="text-sm font-semibold text-gray-700">Marky</span>
        </div>
        {treeLoading ? (
          <p className="text-xs text-gray-400 px-3 py-2">Loading...</p>
        ) : (
          <FileTree
            nodes={tree}
            selectedPath={selectedPath}
            onSelect={setSelectedPath}
            refetch={refetch}
          />
        )}
      </aside>
      <main className="flex-1 flex overflow-hidden">
        <FileContent
          path={selectedPath}
          content={content}
          loading={contentLoading}
        />
      </main>
    </div>
  );
}
