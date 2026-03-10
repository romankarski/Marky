interface RecentFile {
  path: string;
  label: string;
}

interface WelcomeScreenProps {
  recentFiles?: RecentFile[];
  onOpen?: (path: string) => void;
}

export function WelcomeScreen({ recentFiles = [], onOpen }: WelcomeScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 select-none">
      {/* Logo mark — orange square with bold M glyph */}
      <div className="flex items-center justify-center w-20 h-20 rounded-2xl bg-orange-500 shadow-lg shadow-orange-200">
        <span className="text-white text-4xl font-bold tracking-tight">M</span>
      </div>

      <div className="text-center space-y-2">
        <h1 className="text-2xl font-semibold text-gray-800 tracking-tight">Marky</h1>
        <p className="text-gray-400 text-sm max-w-xs leading-relaxed">
          Select a file from the sidebar to start reading.<br/>
          Your knowledge base, beautifully rendered.
        </p>
      </div>

      {/* Subtle keyboard hint */}
      <div className="flex items-center gap-2 text-xs text-gray-300 mt-4">
        <span>Click any file to open it as a tab</span>
      </div>

      {/* Recent files section — only shown when there are recent files */}
      {recentFiles.length > 0 && (
        <div className="w-full max-w-sm mt-2">
          <p className="text-xs font-medium text-gray-400 mb-2 text-center tracking-wide uppercase">
            Recent Files
          </p>
          <div className="flex flex-col gap-1">
            {recentFiles.map(file => {
              const parts = file.path.split('/');
              const filename = parts[parts.length - 1] ?? file.path;
              const folder = parts.length > 1 ? parts.slice(0, -1).join('/') : '';

              return (
                <button
                  key={file.path}
                  onClick={() => onOpen?.(file.path)}
                  className="flex flex-col items-start px-4 py-2.5 rounded-lg backdrop-blur-md bg-white/60 border border-white/20 shadow-sm hover:border-orange-300 hover:bg-orange-50/60 transition-all text-left group"
                >
                  <span className="text-sm font-medium text-gray-700 group-hover:text-orange-600 transition-colors truncate w-full">
                    {filename}
                  </span>
                  {folder && (
                    <span className="text-xs text-gray-400 truncate w-full mt-0.5">
                      {folder}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
