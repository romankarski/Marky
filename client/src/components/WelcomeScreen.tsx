export function WelcomeScreen() {
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
    </div>
  );
}
