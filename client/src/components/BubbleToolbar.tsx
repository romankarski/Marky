import { BubbleMenu } from '@tiptap/react/menus';
import type { Editor } from '@tiptap/react';

interface BubbleToolbarProps {
  editor: Editor;
}

export function BubbleToolbar({ editor }: BubbleToolbarProps) {
  return (
    <BubbleMenu editor={editor}>
      <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-white/80 backdrop-blur-md shadow-lg border border-white/20">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 transition-colors font-bold ${
            editor.isActive('bold') ? 'text-orange-600' : 'text-gray-600'
          }`}
          title="Bold (Cmd+B)"
        >
          <strong>B</strong>
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 transition-colors ${
            editor.isActive('italic') ? 'text-orange-600' : 'text-gray-600'
          }`}
          title="Italic (Cmd+I)"
        >
          <em>I</em>
        </button>
        <button
          onClick={() => {
            const url = window.prompt('Paste or type a URL');
            if (url) {
              editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
            } else {
              editor.chain().focus().unsetLink().run();
            }
          }}
          className={`w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 transition-colors ${
            editor.isActive('link') ? 'text-orange-600' : 'text-gray-600'
          }`}
          title="Insert link (Cmd+K)"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6.5 9.5a3 3 0 0 0 4.2.4l2-2a3 3 0 0 0-4.2-4.2l-1.2 1.1" />
            <path d="M9.5 6.5a3 3 0 0 0-4.2-.4l-2 2a3 3 0 0 0 4.2 4.2l1.1-1.1" />
          </svg>
        </button>
        <button
          onClick={() => editor.chain().focus().toggleCode().run()}
          className={`w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 transition-colors font-mono text-sm ${
            editor.isActive('code') ? 'text-orange-600' : 'text-gray-600'
          }`}
          title="Inline code (Cmd+E)"
        >
          {'</>'}
        </button>
      </div>
    </BubbleMenu>
  );
}
