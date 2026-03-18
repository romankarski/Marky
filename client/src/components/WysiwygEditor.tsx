import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import { Markdown } from '@tiptap/markdown';
import { Link } from '@tiptap/extension-link';
import { Image } from '@tiptap/extension-image';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { Placeholder } from '@tiptap/extension-placeholder';
import { BubbleToolbar } from './BubbleToolbar';

export interface WysiwygEditorHandle {
  getMarkdown: () => string;
  setContent: (md: string) => void;
}

interface WysiwygEditorProps {
  content: string;
  onChange: (markdown: string) => void;
  onLinkClick: (path: string) => void;
}

export const WysiwygEditor = forwardRef<WysiwygEditorHandle, WysiwygEditorProps>(
  function WysiwygEditor({ content, onChange, onLinkClick }, ref) {
    const lastContentRef = useRef(content);

    const editor = useEditor({
      extensions: [
        StarterKit.configure({ link: false }),
        Markdown.configure({ markedOptions: { gfm: true } }),
        Link.configure({ openOnClick: false }),
        Image.configure({ inline: false }),
        Table.configure({ resizable: true }),
        TableRow,
        TableCell,
        TableHeader,
        Placeholder.configure({
          placeholder: 'Click anywhere to begin, or type / for commands',
        }),
      ],
      content,
      contentType: 'markdown',
      onUpdate: ({ editor: e }) => {
        const md = e.getMarkdown();
        lastContentRef.current = md;
        onChange(md);
      },
    });

    useImperativeHandle(ref, () => ({
      getMarkdown: () => editor?.getMarkdown() ?? '',
      setContent: (md: string) => {
        if (editor) {
          lastContentRef.current = md;
          editor.commands.setContent(md, false, { contentType: 'markdown' });
        }
      },
    }), [editor]);

    // Sync content prop when a new file is loaded
    useEffect(() => {
      if (!editor) return;
      if (content !== lastContentRef.current) {
        lastContentRef.current = content;
        editor.commands.setContent(content, false, { contentType: 'markdown' });
      }
    }, [content, editor]);

    if (!editor) return null;

    return (
      <div className="h-full overflow-y-auto">
        <style>{`
          .ProseMirror > *:hover {
            border-left: 2px solid rgb(254 215 170);
            padding-left: 6px;
            transition: border-color 150ms ease, padding-left 150ms ease;
          }
          .ProseMirror > * {
            border-left: 2px solid transparent;
            padding-left: 6px;
            transition: border-color 150ms ease, padding-left 150ms ease;
          }
          .ProseMirror p.is-editor-empty:first-child::before {
            content: attr(data-placeholder);
            float: left;
            color: #adb5bd;
            pointer-events: none;
            height: 0;
          }
        `}</style>
        <BubbleToolbar editor={editor} />
        <EditorContent
          editor={editor}
          className="prose prose-orange max-w-none px-6 py-4"
        />
      </div>
    );
  },
);
